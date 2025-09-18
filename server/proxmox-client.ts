import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios";
import https from "https";
import { 
  type ProxmoxServer, 
  type ProxmoxAuthResponse, 
  type ProxmoxVersionResponse,
  type ProxmoxNode,
  type ProxmoxVM,
  type ProxmoxContainer,
  type ProxmoxStorage,
  type ProxmoxClusterStatus
} from "@shared/schema";

export interface ProxmoxApiResponse<T = any> {
  data: T;
  success?: boolean;
  errors?: string[];
}

export class ProxmoxApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public proxmoxErrors?: string[]
  ) {
    super(message);
    this.name = 'ProxmoxApiError';
  }
}

export class ProxmoxClient {
  private client: AxiosInstance;
  private server: ProxmoxServer;
  private authData: ProxmoxAuthResponse | null = null;
  private authExpiry: Date | null = null;
  private isRetrying: boolean = false;
  private mockMode: boolean = false;

  constructor(server: ProxmoxServer) {
    this.server = server;
    // Enable mock mode in development or if no real server configured
    // Default to mock mode unless explicitly in production with a real server
    this.mockMode = process.env.NODE_ENV !== 'production' || 
                   server.hostname === 'localhost' || 
                   server.hostname === '127.0.0.1' ||
                   server.hostname === 'demo' ||
                   server.hostname === 'mock' ||
                   !server.hostname ||
                   server.hostname.includes('example') ||
                   server.hostname.includes('test');
    
    console.log(`ProxmoxClient: Mock mode ${this.mockMode ? 'ENABLED' : 'DISABLED'} for server ${server.hostname || 'undefined'}`);
    this.client = this.createAxiosClient();
  }

  private createAxiosClient(): AxiosInstance {
    const baseURL = `${this.server.useSSL ? 'https' : 'http'}://${this.server.hostname}:${this.server.port}/api2/json`;
    
    const config: AxiosRequestConfig = {
      baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProxmoxControlPanel/1.0',
      },
    };

    // Handle SSL certificate validation
    if (this.server.useSSL && this.server.ignoreCert) {
      config.httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        requestCert: true,
      });
    }

    const client = axios.create(config);

    // Add request interceptor to include auth headers
    client.interceptors.request.use(
      (config) => {
        const auth = this.authData as ProxmoxAuthResponse | null;
        if (auth && this.isAuthValid()) {
          config.headers = config.headers || {};
          (config.headers as any).Cookie = `PVEAuthCookie=${auth.ticket}`;
          (config.headers as any).CSRFPreventionToken = auth.CSRFPreventionToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling with 401 retry logic
    client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ProxmoxApiResponse<any>>) => {
        const originalRequest = error.config;
        
        // Handle 401 errors with automatic retry
        if (error.response?.status === 401 && !this.isRetrying && originalRequest) {
          this.isRetrying = true;
          
          try {
            // Clear expired auth data and re-authenticate
            this.authData = null;
            this.authExpiry = null;
            
            // Skip retry if this is the authentication request itself
            if (originalRequest.url?.includes('/access/ticket')) {
              this.isRetrying = false;
              throw new ProxmoxApiError('Authentication failed: Invalid username or password', 401);
            }
            
            // Re-authenticate
            await this.authenticate();
            
            // Update headers for retry
            const auth = this.authData as ProxmoxAuthResponse | null;
            if (auth) {
              originalRequest.headers = originalRequest.headers || {};
              (originalRequest.headers as any).Cookie = `PVEAuthCookie=${auth.ticket}`;
              (originalRequest.headers as any).CSRFPreventionToken = auth.CSRFPreventionToken;
            }
            
            this.isRetrying = false;
            
            // Retry the original request
            return client(originalRequest);
          } catch (retryError) {
            this.isRetrying = false;
            throw new ProxmoxApiError('Authentication retry failed', 401);
          }
        }
        
        if (error.code === 'ECONNREFUSED') {
          throw new ProxmoxApiError('Connection refused: Unable to connect to Proxmox server', 503);
        }
        
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          throw new ProxmoxApiError('SSL certificate error: Enable "Ignore SSL Certificate" option', 502);
        }
        
        if (error.code === 'ENOTFOUND') {
          throw new ProxmoxApiError('DNS resolution failed: Check hostname/IP address', 502);
        }
        
        if (error.code === 'ETIMEDOUT') {
          throw new ProxmoxApiError('Connection timeout: Server did not respond in time', 504);
        }
        
        // Handle Proxmox API errors
        const data = (error.response?.data ?? {}) as Partial<ProxmoxApiResponse>;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          throw new ProxmoxApiError(
            data.errors.join(', '),
            error.response?.status,
            data.errors
          );
        }
        
        throw new ProxmoxApiError(
          error.message || 'Unknown error occurred',
          error.response?.status
        );
      }
    );

    return client;
  }

  private isAuthValid(): boolean {
    return this.authData !== null && 
           this.authExpiry !== null && 
           new Date() < this.authExpiry;
  }

  /**
   * Authenticate with the Proxmox server
   */
  async authenticate(): Promise<ProxmoxAuthResponse> {
    if (this.mockMode) {
      // Return mock auth data
      const mockAuth: ProxmoxAuthResponse = {
        ticket: 'mock-ticket-' + Date.now(),
        CSRFPreventionToken: 'mock-csrf-token',
        username: this.server.username,
      };
      this.authData = mockAuth;
      this.authExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      return mockAuth;
    }

    if (this.isAuthValid()) {
      return this.authData!;
    }

    try {
      const authData = {
        username: `${this.server.username}@${this.server.realm}`,
        password: this.server.password,
      };

      const response = await this.client.post<ProxmoxApiResponse<ProxmoxAuthResponse>>('/access/ticket', authData);
      
      if (!response.data?.data) {
        throw new ProxmoxApiError('Invalid authentication response format');
      }

      this.authData = response.data.data;
      // Proxmox tickets typically expire after 2 hours, we'll refresh after 1 hour
      this.authExpiry = new Date(Date.now() + (60 * 60 * 1000));

      return this.authData;
    } catch (error) {
      if (error instanceof ProxmoxApiError) {
        throw error;
      }
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new ProxmoxApiError('Authentication failed: Invalid username or password', 401);
      }
      
      throw new ProxmoxApiError(
        error instanceof Error ? error.message : 'Authentication failed',
        error instanceof Error && 'status' in error ? (error as any).status : undefined
      );
    }
  }

  /**
   * Test connection to the Proxmox server
   */
  async testConnection(): Promise<{ success: boolean; version?: ProxmoxVersionResponse; error?: string }> {
    try {
      await this.authenticate();
      const version = await this.getVersion();
      return { success: true, version };
    } catch (error) {
      const message = error instanceof ProxmoxApiError ? error.message : 'Connection test failed';
      return { success: false, error: message };
    }
  }

  /**
   * Get Proxmox server version and release information
   */
  async getVersion(): Promise<ProxmoxVersionResponse> {
    if (this.mockMode) {
      return {
        release: '8.0',
        version: '8.0.4',
        repoid: 'e4fd3260'
      };
    }

    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<ProxmoxVersionResponse>>('/version');
    
    if (!response.data?.data) {
      throw new ProxmoxApiError('Invalid version response format');
    }
    
    return response.data.data;
  }

  /**
   * Get all nodes in the cluster
   */
  async getNodes(): Promise<ProxmoxNode[]> {
    if (this.mockMode) {
      return [
        {
          node: 'pve-node1',
          status: 'online',
          uptime: 2592000, // 30 days
          cpu: 0.255,
          maxcpu: 4,
          mem: 17179869184, // 16GB used
          maxmem: 34359738368, // 32GB total
          disk: 214748364800, // 200GB used
          maxdisk: 1073741824000, // 1TB total
          level: '',
          type: 'node'
        },
        {
          node: 'pve-node2', 
          status: 'online',
          uptime: 1814400, // 21 days
          cpu: 0.158,
          maxcpu: 4,
          mem: 15032385536, // 14GB used
          maxmem: 34359738368, // 32GB total
          disk: 268435456000, // 250GB used
          maxdisk: 1073741824000, // 1TB total
          level: '',
          type: 'node'
        }
      ];
    }

    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<ProxmoxNode[]>>('/nodes');
    
    if (!response.data?.data) {
      throw new ProxmoxApiError('Invalid nodes response format');
    }
    
    return response.data.data;
  }

  /**
   * Get cluster status
   */
  async getClusterStatus(): Promise<ProxmoxClusterStatus[]> {
    await this.authenticate();
    
    try {
      const response = await this.client.get<ProxmoxApiResponse<ProxmoxClusterStatus[]>>('/cluster/status');
      return response.data?.data || [];
    } catch (error) {
      // If cluster endpoint fails, fallback to nodes (single node setup)
      if (error instanceof ProxmoxApiError && error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get all VMs across all nodes
   */
  async getAllVMs(): Promise<ProxmoxVM[]> {
    if (this.mockMode) {
      return [
        {
          vmid: 100,
          name: 'web-server',
          status: 'running',
          node: 'pve-node1',
          type: 'qemu',
          cpu: 0.25,
          maxcpu: 2,
          mem: 2147483648, // 2GB
          maxmem: 4294967296, // 4GB
          uptime: 86400, // 1 day
          template: false,
        },
        {
          vmid: 101,
          name: 'database-server',
          status: 'stopped',
          node: 'pve-node1',
          type: 'qemu',
          maxcpu: 4,
          maxmem: 8589934592, // 8GB
          template: false,
        }
      ];
    }

    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<ProxmoxVM[]>>('/cluster/resources', {
      params: { type: 'vm' }
    });
    
    if (!response.data?.data) {
      throw new ProxmoxApiError('Invalid VMs response format');
    }
    
    return response.data.data.filter(vm => vm.type === 'qemu');
  }

  /**
   * Get all containers across all nodes
   */
  async getAllContainers(): Promise<ProxmoxContainer[]> {
    if (this.mockMode) {
      return [
        {
          vmid: 200,
          name: 'app-container',
          status: 'running',
          node: 'pve-node1',
          type: 'lxc',
          cpu: 0.15,
          maxcpu: 2,
          mem: 1073741824, // 1GB
          maxmem: 2147483648, // 2GB
          uptime: 43200, // 12 hours
          template: false,
        },
        {
          vmid: 201,
          name: 'nginx-proxy',
          status: 'running',
          node: 'pve-node1',
          type: 'lxc',
          cpu: 0.05,
          maxcpu: 1,
          mem: 536870912, // 512MB
          maxmem: 1073741824, // 1GB
          uptime: 86400, // 1 day
          template: false,
        }
      ];
    }

    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<ProxmoxContainer[]>>('/cluster/resources', {
      params: { type: 'vm' }
    });
    
    if (!response.data?.data) {
      throw new ProxmoxApiError('Invalid containers response format');
    }
    
    return response.data.data.filter(vm => vm.type === 'lxc');
  }

  /**
   * Get VMs for a specific node
   */
  async getNodeVMs(nodeName: string): Promise<ProxmoxVM[]> {
    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<ProxmoxVM[]>>(`/nodes/${nodeName}/qemu`);
    
    if (!response.data?.data) {
      throw new ProxmoxApiError('Invalid node VMs response format');
    }
    
    return response.data.data;
  }

  /**
   * Get containers for a specific node
   */
  async getNodeContainers(nodeName: string): Promise<ProxmoxContainer[]> {
    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<ProxmoxContainer[]>>(`/nodes/${nodeName}/lxc`);
    
    if (!response.data?.data) {
      throw new ProxmoxApiError('Invalid node containers response format');
    }
    
    return response.data.data;
  }

  /**
   * Get storage information
   */
  async getStorage(): Promise<ProxmoxStorage[]> {
    if (this.mockMode) {
      return [
        {
          storage: 'local',
          type: 'dir',
          node: 'pve-node1',
          content: 'backup,iso,vztmpl',
          shared: false,
          enabled: true,
          used: 214748364800, // 200GB
          avail: 858993459200, // 800GB
          total: 1073741824000, // 1TB
          used_fraction: 0.2
        },
        {
          storage: 'local-lvm',
          type: 'lvm',
          node: 'pve-node1',
          content: 'images,rootdir',
          shared: false,
          enabled: true,
          used: 268435456000, // 250GB
          avail: 805306368000, // 750GB
          total: 1073741824000, // 1TB
          used_fraction: 0.25
        }
      ];
    }

    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<ProxmoxStorage[]>>('/cluster/resources', {
      params: { type: 'storage' }
    });
    
    if (!response.data?.data) {
      throw new ProxmoxApiError('Invalid storage response format');
    }
    
    return response.data.data;
  }

  /**
   * Start a VM
   */
  async startVM(nodeName: string, vmid: number): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(`/nodes/${nodeName}/qemu/${vmid}/status/start`);
    
    return response.data?.data || '';
  }

  /**
   * Stop a VM (force stop)
   */
  async stopVM(nodeName: string, vmid: number): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(`/nodes/${nodeName}/qemu/${vmid}/status/stop`);
    
    return response.data?.data || '';
  }

  /**
   * Shutdown a VM (graceful shutdown)
   */
  async shutdownVM(nodeName: string, vmid: number): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(`/nodes/${nodeName}/qemu/${vmid}/status/shutdown`);
    
    return response.data?.data || '';
  }

  /**
   * Restart a VM
   */
  async restartVM(nodeName: string, vmid: number): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(`/nodes/${nodeName}/qemu/${vmid}/status/reboot`);
    
    return response.data?.data || '';
  }

  /**
   * Start a container
   */
  async startContainer(nodeName: string, vmid: number): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(`/nodes/${nodeName}/lxc/${vmid}/status/start`);
    
    return response.data?.data || '';
  }

  /**
   * Stop a container
   */
  async stopContainer(nodeName: string, vmid: number): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(`/nodes/${nodeName}/lxc/${vmid}/status/stop`);
    
    return response.data?.data || '';
  }

  /**
   * Restart a container
   */
  async restartContainer(nodeName: string, vmid: number): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(`/nodes/${nodeName}/lxc/${vmid}/status/reboot`);
    
    return response.data?.data || '';
  }

  /**
   * Get VM configuration
   */
  async getVMConfig(nodeName: string, vmid: number): Promise<any> {
    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<any>>(`/nodes/${nodeName}/qemu/${vmid}/config`);
    
    return response.data?.data || {};
  }

  /**
   * Get container configuration
   */
  async getContainerConfig(nodeName: string, vmid: number): Promise<any> {
    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<any>>(`/nodes/${nodeName}/lxc/${vmid}/config`);
    
    return response.data?.data || {};
  }

  /**
   * Get VM status
   */
  async getVMStatus(nodeName: string, vmid: number): Promise<any> {
    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<any>>(`/nodes/${nodeName}/qemu/${vmid}/status/current`);
    
    return response.data?.data || {};
  }

  /**
   * Get container status
   */
  async getContainerStatus(nodeName: string, vmid: number): Promise<any> {
    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<any>>(`/nodes/${nodeName}/lxc/${vmid}/status/current`);
    
    return response.data?.data || {};
  }

  /**
   * Get aggregated cluster resource metrics
   */
  async getClusterResourceMetrics(): Promise<{
    cpu: { used: number; total: number; percentage: number };
    memory: { used: number; total: number; percentage: number };
    storage: { used: number; total: number; percentage: number };
    network: { inbound: number; outbound: number };
    nodes: { total: number; online: number; offline: number };
  }> {
    if (this.mockMode) {
      return {
        cpu: { used: 2.5, total: 8, percentage: 31.25 },
        memory: { used: 12.5, total: 32, percentage: 39.06 },
        storage: { used: 450, total: 1000, percentage: 45.0 },
        network: { inbound: 1.2, outbound: 0.8 },
        nodes: { total: 2, online: 2, offline: 0 }
      };
    }

    await this.authenticate();
    
    // Get all nodes data
    const nodes = await this.getNodes();
    const storage = await this.getStorage();
    
    // Aggregate CPU metrics
    const totalCpu = nodes.reduce((sum, node) => sum + (node.maxcpu || 0), 0);
    const usedCpu = nodes.reduce((sum, node) => sum + (node.cpu || 0) * (node.maxcpu || 0), 0);
    
    // Aggregate memory metrics (convert from bytes to GB)
    const totalMemory = nodes.reduce((sum, node) => sum + (node.maxmem || 0), 0);
    const usedMemory = nodes.reduce((sum, node) => sum + (node.mem || 0), 0);
    
    // Aggregate storage metrics
    const totalStorage = storage.reduce((sum, stor) => sum + (stor.total || 0), 0);
    const usedStorage = storage.reduce((sum, stor) => sum + (stor.used || 0), 0);
    
    // Get network statistics from VMs and containers
    const [vms, containers] = await Promise.all([
      this.getAllVMs(),
      this.getAllContainers()
    ]);
    
    const networkInbound = [...vms, ...containers].reduce((sum, resource) => 
      sum + (resource.netin || 0), 0
    );
    const networkOutbound = [...vms, ...containers].reduce((sum, resource) => 
      sum + (resource.netout || 0), 0
    );
    
    // Node status counts
    const onlineNodes = nodes.filter(node => node.status === 'online').length;
    const offlineNodes = nodes.length - onlineNodes;
    
    return {
      cpu: {
        used: Math.round(usedCpu * 100) / 100,
        total: totalCpu,
        percentage: totalCpu > 0 ? Math.round((usedCpu / totalCpu) * 10000) / 100 : 0
      },
      memory: {
        used: Math.round(usedMemory / (1024 * 1024 * 1024) * 100) / 100, // Convert to GB
        total: Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100, // Convert to GB
        percentage: totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 10000) / 100 : 0
      },
      storage: {
        used: Math.round(usedStorage / (1024 * 1024 * 1024) * 100) / 100, // Convert to GB
        total: Math.round(totalStorage / (1024 * 1024 * 1024) * 100) / 100, // Convert to GB
        percentage: totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 10000) / 100 : 0
      },
      network: {
        inbound: Math.round(networkInbound / (1024 * 1024) * 100) / 100, // Convert to MB/s
        outbound: Math.round(networkOutbound / (1024 * 1024) * 100) / 100 // Convert to MB/s
      },
      nodes: {
        total: nodes.length,
        online: onlineNodes,
        offline: offlineNodes
      }
    };
  }

  /**
   * Get detailed resource metrics for a specific node
   */
  async getNodeResourceMetrics(nodeName: string): Promise<{
    cpu: { used: number; total: number; percentage: number };
    memory: { used: number; total: number; percentage: number };
    storage: { used: number; total: number; percentage: number };
    network: { inbound: number; outbound: number };
    uptime: number;
    status: string;
  }> {
    await this.authenticate();
    
    // Get node information
    const nodes = await this.getNodes();
    const node = nodes.find(n => n.node === nodeName);
    
    if (!node) {
      throw new ProxmoxApiError(`Node ${nodeName} not found`);
    }
    
    // Get storage for this node
    const storage = await this.getStorage();
    const nodeStorage = storage.filter(s => s.node === nodeName);
    
    // Get VMs and containers for this node
    const [nodeVMs, nodeContainers] = await Promise.all([
      this.getNodeVMs(nodeName),
      this.getNodeContainers(nodeName)
    ]);
    
    const totalNodeStorage = nodeStorage.reduce((sum, stor) => sum + (stor.total || 0), 0);
    const usedNodeStorage = nodeStorage.reduce((sum, stor) => sum + (stor.used || 0), 0);
    
    const networkInbound = [...nodeVMs, ...nodeContainers].reduce((sum, resource) => 
      sum + (resource.netin || 0), 0
    );
    const networkOutbound = [...nodeVMs, ...nodeContainers].reduce((sum, resource) => 
      sum + (resource.netout || 0), 0
    );
    
    return {
      cpu: {
        used: Math.round((node.cpu || 0) * (node.maxcpu || 0) * 100) / 100,
        total: node.maxcpu || 0,
        percentage: Math.round((node.cpu || 0) * 10000) / 100
      },
      memory: {
        used: Math.round((node.mem || 0) / (1024 * 1024 * 1024) * 100) / 100,
        total: Math.round((node.maxmem || 0) / (1024 * 1024 * 1024) * 100) / 100,
        percentage: (node.maxmem || 0) > 0 ? Math.round(((node.mem || 0) / (node.maxmem || 0)) * 10000) / 100 : 0
      },
      storage: {
        used: Math.round(usedNodeStorage / (1024 * 1024 * 1024) * 100) / 100,
        total: Math.round(totalNodeStorage / (1024 * 1024 * 1024) * 100) / 100,
        percentage: totalNodeStorage > 0 ? Math.round((usedNodeStorage / totalNodeStorage) * 10000) / 100 : 0
      },
      network: {
        inbound: Math.round(networkInbound / (1024 * 1024) * 100) / 100,
        outbound: Math.round(networkOutbound / (1024 * 1024) * 100) / 100
      },
      uptime: node.uptime || 0,
      status: node.status
    };
  }

  /**
   * Get cluster health and status information
   */
  async getClusterHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    quorum: boolean;
    nodes: Array<{
      name: string;
      status: string;
      online: boolean;
      cpuUsage: number;
      memoryUsage: number;
      uptime: number;
    }>;
    summary: {
      totalNodes: number;
      onlineNodes: number;
      offlineNodes: number;
      avgCpuUsage: number;
      avgMemoryUsage: number;
    };
  }> {
    if (this.mockMode) {
      return {
        status: 'healthy',
        quorum: true,
        nodes: [
          {
            name: 'pve-node1',
            status: 'online',
            online: true,
            cpuUsage: 25.5,
            memoryUsage: 47.5,
            uptime: 2592000 // 30 days
          },
          {
            name: 'pve-node2',
            status: 'online', 
            online: true,
            cpuUsage: 15.8,
            memoryUsage: 43.8,
            uptime: 1814400 // 21 days
          }
        ],
        summary: {
          totalNodes: 2,
          onlineNodes: 2,
          offlineNodes: 0,
          avgCpuUsage: 20.65,
          avgMemoryUsage: 45.65
        }
      };
    }

    await this.authenticate();
    
    const [nodes, clusterStatus] = await Promise.all([
      this.getNodes(),
      this.getClusterStatus()
    ]);
    
    const quorumInfo = clusterStatus.find(item => item.type === 'cluster');
    const isQuorate = quorumInfo?.quorate ?? true; // Default to true for single node
    
    const nodeDetails = nodes.map(node => ({
      name: node.node,
      status: node.status,
      online: node.status === 'online',
      cpuUsage: Math.round((node.cpu || 0) * 10000) / 100,
      memoryUsage: (node.maxmem || 0) > 0 ? Math.round(((node.mem || 0) / (node.maxmem || 0)) * 10000) / 100 : 0,
      uptime: node.uptime || 0
    }));
    
    const onlineCount = nodeDetails.filter(n => n.online).length;
    const avgCpu = nodeDetails.length > 0 ? 
      Math.round(nodeDetails.reduce((sum, n) => sum + n.cpuUsage, 0) / nodeDetails.length * 100) / 100 : 0;
    const avgMemory = nodeDetails.length > 0 ?
      Math.round(nodeDetails.reduce((sum, n) => sum + n.memoryUsage, 0) / nodeDetails.length * 100) / 100 : 0;
    
    // Determine cluster health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (!isQuorate || onlineCount === 0) {
      status = 'critical';
    } else if (onlineCount < nodes.length || avgCpu > 80 || avgMemory > 90) {
      status = 'warning';
    }
    
    return {
      status,
      quorum: isQuorate,
      nodes: nodeDetails,
      summary: {
        totalNodes: nodes.length,
        onlineNodes: onlineCount,
        offlineNodes: nodes.length - onlineCount,
        avgCpuUsage: avgCpu,
        avgMemoryUsage: avgMemory
      }
    };
  }

  /**
   * Execute a script/command on a Proxmox node
   */
  async executeScript(nodeName: string, command: string, options?: {
    timeout?: number;
    username?: string;
  }): Promise<string> {
    await this.authenticate();
    
    const requestData = {
      commands: command,
      'cmd-timeout': options?.timeout || 300, // 5 minute default timeout
      username: options?.username || 'root'
    };
    
    const response = await this.client.post<ProxmoxApiResponse<string>>(
      `/nodes/${nodeName}/execute`, 
      requestData
    );
    
    return response.data?.data || '';
  }

  /**
   * Get status of a running task (including script execution)
   */
  async getTaskStatus(nodeName: string, taskId: string): Promise<{
    status: 'running' | 'stopped';
    exitstatus?: string;
    type: string;
    upid: string;
    user: string;
    starttime: number;
    endtime?: number;
    pstart?: number;
  }> {
    await this.authenticate();
    
    const response = await this.client.get<ProxmoxApiResponse<any>>(
      `/nodes/${nodeName}/tasks/${taskId}/status`
    );
    
    return response.data?.data || {};
  }

  /**
   * Get log output from a task (including script execution output)
   */
  async getTaskLog(nodeName: string, taskId: string, options?: {
    start?: number;
    limit?: number;
  }): Promise<string[]> {
    await this.authenticate();
    
    const params: any = {};
    if (options?.start !== undefined) params.start = options.start;
    if (options?.limit !== undefined) params.limit = options.limit;
    
    const response = await this.client.get<ProxmoxApiResponse<Array<{ n: number; t: string }>>>(
      `/nodes/${nodeName}/tasks/${taskId}/log`,
      { params }
    );
    
    const logEntries = response.data?.data || [];
    return logEntries.map(entry => entry.t);
  }

  /**
   * Stop/cancel a running task
   */
  async stopTask(nodeName: string, taskId: string): Promise<string> {
    await this.authenticate();
    
    const response = await this.client.delete<ProxmoxApiResponse<string>>(
      `/nodes/${nodeName}/tasks/${taskId}`
    );
    
    return response.data?.data || '';
  }

  /**
   * Get list of all tasks for a node
   */
  async getNodeTasks(nodeName: string, options?: {
    running?: boolean;
    start?: number;
    limit?: number;
    type?: string;
    user?: string;
  }): Promise<Array<{
    upid: string;
    type: string;
    id?: string;
    user: string;
    status: 'running' | 'stopped';
    starttime: number;
    endtime?: number;
    pstart?: number;
    exitstatus?: string;
  }>> {
    await this.authenticate();
    
    const params: any = {};
    if (options?.running !== undefined) params.running = options.running ? 1 : 0;
    if (options?.start !== undefined) params.start = options.start;
    if (options?.limit !== undefined) params.limit = options.limit;
    if (options?.type) params.type = options.type;
    if (options?.user) params.user = options.user;
    
    const response = await this.client.get<ProxmoxApiResponse<any[]>>(
      `/nodes/${nodeName}/tasks`,
      { params }
    );
    
    return response.data?.data || [];
  }

  /**
   * Execute a script and wait for completion with output
   */
  async executeScriptWithOutput(nodeName: string, command: string, options?: {
    timeout?: number;
    username?: string;
    pollInterval?: number;
  }): Promise<{
    exitCode: string;
    output: string[];
    duration: number;
    success: boolean;
  }> {
    if (this.mockMode) {
      // Simulate script execution with mock output
      const startTime = Date.now();
      
      // Simulate execution time between 1-5 seconds
      const executionTime = Math.floor(Math.random() * 4000) + 1000;
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      const success = Math.random() > 0.1; // 90% success rate
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      return {
        exitCode: success ? '0' : '1',
        output: success ? [
          'Starting script execution...',
          `Executing command: ${command}`,
          `Running on node: ${nodeName}`,
          'Processing...',
          'Installation completed successfully',
          'Service started',
          'Script execution completed'
        ] : [
          'Starting script execution...',
          `Executing command: ${command}`,
          'Error: Failed to download package',
          'Execution failed'
        ],
        duration,
        success
      };
    }

    const startTime = Date.now();
    const timeout = options?.timeout || 300; // 5 minutes default
    const pollInterval = options?.pollInterval || 1000; // 1 second default
    
    // Start execution
    const taskId = await this.executeScript(nodeName, command, {
      timeout: timeout,
      username: options?.username
    });
    
    // Poll for completion
    let status;
    let output: string[] = [];
    let lastLogPosition = 0;
    
    while (true) {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > timeout) {
        await this.stopTask(nodeName, taskId);
        throw new ProxmoxApiError(`Script execution timeout after ${timeout} seconds`);
      }
      
      try {
        // Get current status
        status = await this.getTaskStatus(nodeName, taskId);
        
        // Get new log entries
        const newLogs = await this.getTaskLog(nodeName, taskId, {
          start: lastLogPosition
        });
        
        if (newLogs.length > 0) {
          output.push(...newLogs);
          lastLogPosition += newLogs.length;
        }
        
        // Check if completed
        if (status.status === 'stopped') {
          break;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        // If we can't get status, assume task completed or failed
        break;
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const exitCode = status?.exitstatus || 'unknown';
    const success = exitCode === 'OK' || exitCode === '0';
    
    return {
      exitCode,
      output,
      duration,
      success
    };
  }

  /**
   * Clear authentication data (for testing or logout)
   */
  clearAuth(): void {
    this.authData = null;
    this.authExpiry = null;
  }
}