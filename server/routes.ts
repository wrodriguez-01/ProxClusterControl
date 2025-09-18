import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ProxmoxClient, ProxmoxApiError } from "./proxmox-client";
import { 
  insertProxmoxServerSchema, 
  proxmoxServerSchema,
  insertScriptExecutionSchema,
  updateScriptExecutionSchema,
  type ProxmoxServer,
  type ProxmoxNode,
  type ProxmoxVM,
  type ProxmoxContainer,
  type ProxmoxStorage,
  type ProxmoxClusterStatus,
  type ScriptExecution,
} from "@shared/schema";

// Cache for ProxmoxClient instances
const clientCache = new Map<string, ProxmoxClient>();

// Get or create ProxmoxClient for a server
function getProxmoxClient(server: ProxmoxServer): ProxmoxClient {
  const key = `${server.hostname}:${server.port}:${server.username}:${server.realm}:${server.useSSL}:${server.ignoreCert}`;
  
  if (!clientCache.has(key)) {
    clientCache.set(key, new ProxmoxClient(server));
  }
  
  return clientCache.get(key)!;
}

// Clear cached client for a server (when server config changes)
function clearClientCache(serverId?: string) {
  if (serverId) {
    // Clear specific server's cached clients by removing entries that match
    for (const [key, client] of clientCache.entries()) {
      // For now, clear all since we don't have server id in key
      // In production, you might want to track server id -> key mapping
      clientCache.delete(key);
    }
  } else {
    // Clear all cached clients
    clientCache.clear();
  }
}

// Standard error response handler
function handleProxmoxError(error: unknown, res: any, defaultMessage: string) {
  console.error('Proxmox API error:', error);
  
  if (error instanceof ProxmoxApiError) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      proxmoxErrors: error.proxmoxErrors,
    });
  }
  
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : defaultMessage,
  });
}

// Get server by ID or default server
async function getServerForRequest(serverId?: string): Promise<ProxmoxServer | null> {
  if (serverId) {
    return await storage.getProxmoxServer(serverId);
  }
  return await storage.getDefaultProxmoxServer();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test Proxmox server connection
  app.post('/api/proxmox/test-connection', async (req, res) => {
    try {
      const serverData = insertProxmoxServerSchema.parse(req.body);
      const client = new ProxmoxClient(serverData);
      
      // Test connection using the ProxmoxClient
      const result = await client.testConnection();
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            connected: true,
            version: result.version?.version,
            release: result.version?.release,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      handleProxmoxError(error, res, 'Connection test failed');
    }
  });

  // Get Proxmox server version
  app.get('/api/proxmox/version/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const version = await client.getVersion();
      
      res.json({
        success: true,
        data: {
          serverId: server.id,
          serverName: server.name,
          version,
        },
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get version info');
    }
  });

  // Get all nodes
  app.get('/api/proxmox/nodes/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const nodes = await client.getNodes();
      
      res.json({
        success: true,
        data: nodes,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get nodes');
    }
  });

  // Get cluster status
  app.get('/api/proxmox/cluster/status/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const clusterStatus = await client.getClusterStatus();
      
      res.json({
        success: true,
        data: clusterStatus,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get cluster status');
    }
  });

  // Get all VMs
  app.get('/api/proxmox/vms/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const vms = await client.getAllVMs();
      
      res.json({
        success: true,
        data: vms,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get VMs');
    }
  });

  // Get all containers
  app.get('/api/proxmox/containers/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const containers = await client.getAllContainers();
      
      res.json({
        success: true,
        data: containers,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get containers');
    }
  });

  // Get VMs for a specific node
  app.get('/api/proxmox/nodes/:node/vms/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const vms = await client.getNodeVMs(req.params.node);
      
      res.json({
        success: true,
        data: vms,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get node VMs');
    }
  });

  // Get containers for a specific node
  app.get('/api/proxmox/nodes/:node/containers/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const containers = await client.getNodeContainers(req.params.node);
      
      res.json({
        success: true,
        data: containers,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get node containers');
    }
  });

  // Get storage information
  app.get('/api/proxmox/storage/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const storage = await client.getStorage();
      
      res.json({
        success: true,
        data: storage,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get storage info');
    }
  });

  // VM Control Operations
  
  // Start VM
  app.post('/api/proxmox/vms/:node/:vmid/start/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const result = await client.startVM(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: { task: result },
        message: 'VM start command sent successfully',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to start VM');
    }
  });

  // Stop VM
  app.post('/api/proxmox/vms/:node/:vmid/stop/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const result = await client.stopVM(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: { task: result },
        message: 'VM stop command sent successfully',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to stop VM');
    }
  });

  // Restart VM
  app.post('/api/proxmox/vms/:node/:vmid/restart/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const result = await client.restartVM(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: { task: result },
        message: 'VM restart command sent successfully',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to restart VM');
    }
  });

  // Shutdown VM (graceful)
  app.post('/api/proxmox/vms/:node/:vmid/shutdown/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const result = await client.shutdownVM(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: { task: result },
        message: 'VM shutdown command sent successfully',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to shutdown VM');
    }
  });

  // Container Control Operations
  
  // Start Container
  app.post('/api/proxmox/containers/:node/:vmid/start/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const result = await client.startContainer(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: { task: result },
        message: 'Container start command sent successfully',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to start container');
    }
  });

  // Stop Container
  app.post('/api/proxmox/containers/:node/:vmid/stop/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const result = await client.stopContainer(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: { task: result },
        message: 'Container stop command sent successfully',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to stop container');
    }
  });

  // Restart Container
  app.post('/api/proxmox/containers/:node/:vmid/restart/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const result = await client.restartContainer(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: { task: result },
        message: 'Container restart command sent successfully',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to restart container');
    }
  });

  // Get VM configuration
  app.get('/api/proxmox/vms/:node/:vmid/config/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const config = await client.getVMConfig(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get VM configuration');
    }
  });

  // Get container configuration
  app.get('/api/proxmox/containers/:node/:vmid/config/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const config = await client.getContainerConfig(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get container configuration');
    }
  });

  // Get VM status
  app.get('/api/proxmox/vms/:node/:vmid/status/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const status = await client.getVMStatus(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get VM status');
    }
  });

  // Get container status
  app.get('/api/proxmox/containers/:node/:vmid/status/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const status = await client.getContainerStatus(req.params.node, parseInt(req.params.vmid));
      
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get container status');
    }
  });

  // Server management endpoints
  
  // Get all Proxmox servers
  app.get('/api/proxmox/servers', async (req, res) => {
    try {
      const servers = await storage.getProxmoxServers();
      
      // Remove passwords from response
      const safeServers = servers.map(server => ({
        ...server,
        password: '***hidden***',
      }));
      
      res.json({
        success: true,
        data: safeServers,
      });
    } catch (error) {
      console.error('Failed to get servers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve servers',
      });
    }
  });

  // Create new Proxmox server
  app.post('/api/proxmox/servers', async (req, res) => {
    try {
      const serverData = insertProxmoxServerSchema.parse(req.body);
      const newServer = await storage.createProxmoxServer(serverData);
      
      // Clear client cache since we have a new server
      clearClientCache(newServer.id);
      
      // Remove password from response
      const safeServer = {
        ...newServer,
        password: '***hidden***',
      };
      
      res.status(201).json({
        success: true,
        data: safeServer,
      });
    } catch (error) {
      console.error('Failed to create server:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create server',
      });
    }
  });

  // Update Proxmox server
  app.put('/api/proxmox/servers/:id', async (req, res) => {
    try {
      const serverId = req.params.id;
      const updates = req.body;
      
      const updatedServer = await storage.updateProxmoxServer(serverId, updates);
      
      if (!updatedServer) {
        return res.status(404).json({
          success: false,
          error: 'Server not found',
        });
      }
      
      // Clear client cache since server config changed
      clearClientCache(serverId);
      
      // Remove password from response
      const safeServer = {
        ...updatedServer,
        password: '***hidden***',
      };
      
      res.json({
        success: true,
        data: safeServer,
      });
    } catch (error) {
      console.error('Failed to update server:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update server',
      });
    }
  });

  // Delete Proxmox server
  app.delete('/api/proxmox/servers/:id', async (req, res) => {
    try {
      const serverId = req.params.id;
      const deleted = await storage.deleteProxmoxServer(serverId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Server not found',
        });
      }
      
      // Clear client cache since server was deleted
      clearClientCache(serverId);
      
      res.json({
        success: true,
        message: 'Server deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete server',
      });
    }
  });

  // Get single Proxmox server
  app.get('/api/proxmox/servers/:id', async (req, res) => {
    try {
      const serverId = req.params.id;
      const server = await storage.getProxmoxServer(serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Server not found',
        });
      }
      
      // Remove password from response
      const safeServer = {
        ...server,
        password: '***hidden***',
      };
      
      res.json({
        success: true,
        data: safeServer,
      });
    } catch (error) {
      console.error('Failed to get server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve server',
      });
    }
  });

  // Enhanced Cluster Resource Metrics Endpoints

  // Get aggregated cluster resource metrics
  app.get('/api/proxmox/cluster/resources/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const clusterMetrics = await client.getClusterResourceMetrics();
      
      res.json({
        success: true,
        data: clusterMetrics,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get cluster resource metrics');
    }
  });

  // Get detailed resource metrics for a specific node
  app.get('/api/proxmox/nodes/:node/resources/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const nodeMetrics = await client.getNodeResourceMetrics(req.params.node);
      
      res.json({
        success: true,
        data: nodeMetrics,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get node resource metrics');
    }
  });

  // Get cluster health and status information
  app.get('/api/proxmox/cluster/health/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }
      
      const client = getProxmoxClient(server);
      const clusterHealth = await client.getClusterHealth();
      
      res.json({
        success: true,
        data: clusterHealth,
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to get cluster health');
    }
  });

  // Script Execution Endpoints
  
  // Predefined safe scripts that can be executed
  const ALLOWED_SCRIPTS = {
    'docker': {
      name: 'Docker Installation',
      command: 'curl -fsSL https://get.docker.com | sh && systemctl enable docker && systemctl start docker',
      privileged: true
    },
    'nginx': {
      name: 'Nginx Installation', 
      command: 'apt update && apt install -y nginx && systemctl enable nginx && systemctl start nginx',
      privileged: true
    },
    'nodejs': {
      name: 'Node.js Installation',
      command: 'curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && apt install -y nodejs',
      privileged: true
    },
    'system_update': {
      name: 'System Update',
      command: 'apt update && apt upgrade -y && apt autoremove -y',
      privileged: true
    },
    'disk_usage': {
      name: 'Check Disk Usage',
      command: 'df -h && du -sh /home/* /var/* 2>/dev/null | head -10',
      privileged: false
    },
    'memory_info': {
      name: 'Memory Information',
      command: 'free -h && ps aux --sort=-%mem | head -10',
      privileged: false
    }
  };

  // Execute script on a Proxmox node
  app.post('/api/proxmox/scripts/execute/:serverId?', async (req, res) => {
    try {
      const server = await getServerForRequest(req.params.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }

      const { scriptId, nodeName, timeout, createdBy } = req.body;
      
      if (!scriptId || !nodeName) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: scriptId, nodeName',
        });
      }

      // Validate script ID against whitelist - SECURITY: Only allow predefined scripts
      const allowedScript = ALLOWED_SCRIPTS[scriptId as keyof typeof ALLOWED_SCRIPTS];
      if (!allowedScript) {
        return res.status(400).json({
          success: false,
          error: `Script '${scriptId}' is not in the allowed scripts whitelist. Available scripts: ${Object.keys(ALLOWED_SCRIPTS).join(', ')}`,
        });
      }

      const scriptName = allowedScript.name;
      const command = allowedScript.command;

      // Create execution record
      const execution = await storage.createScriptExecution({
        scriptId,
        scriptName,
        command,
        serverId: server.id,
        nodeName,
        status: 'pending',
        createdBy: createdBy || 'system',
        metadata: JSON.stringify({ timeout: timeout || 300 }),
      });

      // Start script execution in the background
      const client = getProxmoxClient(server);
      
      // Execute script asynchronously
      (async () => {
        try {
          // Update status to running
          await storage.updateScriptExecution(execution.id, { 
            status: 'running',
            startTime: new Date(),
          });

          const result = await client.executeScriptWithOutput(nodeName, command, {
            timeout: timeout || 300,
            username: 'root',
          });

          // Update with completion results
          await storage.updateScriptExecution(execution.id, {
            status: result.success ? 'completed' : 'failed',
            endTime: new Date(),
            output: result.output.join('\n'),
            exitCode: parseInt(result.exitCode) || 0,
            duration: result.duration,
          });
        } catch (error) {
          console.error('Script execution error:', error);
          await storage.updateScriptExecution(execution.id, {
            status: 'failed',
            endTime: new Date(),
            errorOutput: error instanceof Error ? error.message : 'Unknown error',
            duration: Math.round((Date.now() - new Date(execution.startTime).getTime()) / 1000),
          });
        }
      })();

      res.json({
        success: true,
        data: {
          executionId: execution.id,
          status: execution.status,
          scriptName: execution.scriptName,
          nodeName: execution.nodeName,
        },
        message: 'Script execution started',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to start script execution');
    }
  });

  // Get script execution status and output
  app.get('/api/proxmox/scripts/executions/:executionId', async (req, res) => {
    try {
      const execution = await storage.getScriptExecution(req.params.executionId);
      
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found',
        });
      }

      res.json({
        success: true,
        data: execution,
      });
    } catch (error) {
      console.error('Failed to get script execution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get script execution',
      });
    }
  });

  // Get script execution history with filtering
  app.get('/api/proxmox/scripts/executions', async (req, res) => {
    try {
      const { serverId, nodeName, status, scriptId, limit = 50, offset = 0 } = req.query;
      
      const executions = await storage.getScriptExecutions({
        serverId: serverId as string,
        nodeName: nodeName as string,
        status: status as string,
        scriptId: scriptId as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        success: true,
        data: executions,
      });
    } catch (error) {
      console.error('Failed to get script executions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get script executions',
      });
    }
  });

  // Cancel script execution
  app.post('/api/proxmox/scripts/executions/:executionId/cancel/:serverId?', async (req, res) => {
    try {
      const execution = await storage.getScriptExecution(req.params.executionId);
      
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found',
        });
      }

      if (execution.status !== 'running' && execution.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel execution that is not running or pending',
        });
      }

      const server = await getServerForRequest(req.params.serverId || execution.serverId);
      
      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'Proxmox server not found',
        });
      }

      // Try to cancel on Proxmox if we have a task ID
      // Note: This would require storing the Proxmox task ID in metadata
      // For now, we'll just update the status
      
      await storage.updateScriptExecution(execution.id, {
        status: 'cancelled',
        endTime: new Date(),
        duration: execution.startTime ? 
          Math.round((Date.now() - new Date(execution.startTime).getTime()) / 1000) : 0,
      });

      res.json({
        success: true,
        message: 'Script execution cancelled',
      });
    } catch (error) {
      handleProxmoxError(error, res, 'Failed to cancel script execution');
    }
  });

  // Get active executions for monitoring
  app.get('/api/proxmox/scripts/active/:serverId?', async (req, res) => {
    try {
      const { nodeName } = req.query;
      const serverId = req.params.serverId;
      
      const activeExecutions = await storage.getActiveExecutions(
        serverId as string,
        nodeName as string
      );

      res.json({
        success: true,
        data: activeExecutions,
      });
    } catch (error) {
      console.error('Failed to get active executions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active executions',
      });
    }
  });

  // Delete script execution from history
  app.delete('/api/proxmox/scripts/executions/:executionId', async (req, res) => {
    try {
      const deleted = await storage.deleteScriptExecution(req.params.executionId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found',
        });
      }

      res.json({
        success: true,
        message: 'Execution deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete script execution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete script execution',
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}