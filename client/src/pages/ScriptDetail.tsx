import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, Download, ExternalLink, Tag, User, Calendar, Star, Terminal, Monitor, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Import the same script data and utilities from ProxmoxScripts
const getScriptIcon = (script: any) => {
  const iconSize = "h-8 w-8";
  switch (script.category?.toLowerCase()) {
    case 'system':
      return <div className={`${iconSize} bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-lg`}>SY</div>;
    case 'security':
      return <div className={`${iconSize} bg-red-500 text-white rounded-lg flex items-center justify-center font-bold text-lg`}>SE</div>;
    case 'networking':
      return <div className={`${iconSize} bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-lg`}>NW</div>;
    case 'media':
      return <div className={`${iconSize} bg-purple-500 text-white rounded-lg flex items-center justify-center font-bold text-lg`}>MD</div>;
    case 'development':
      return <div className={`${iconSize} bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-lg`}>DV</div>;
    case 'database':
      return <div className={`${iconSize} bg-cyan-500 text-white rounded-lg flex items-center justify-center font-bold text-lg`}>DB</div>;
    default:
      return <div className={`${iconSize} bg-gray-500 text-white rounded-lg flex items-center justify-center font-bold text-lg`}>AP</div>;
  }
};

const getTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'lxc':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'vm':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'script':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'tool':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'running':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

// Mock scripts data (will be replaced with real script data later)
const mockScripts = [
  {
    id: "1",
    name: "Docker",
    slug: "docker",
    description: "Install Docker and Docker Compose for containerized applications",
    fullDescription: "Docker is a platform that enables developers to build, ship, and run applications in containers. This script installs the latest version of Docker Engine and Docker Compose, configures the Docker daemon for optimal performance, and adds your user to the docker group for seamless container management.\n\nFeatures included:\n• Latest Docker Engine installation\n• Docker Compose with latest version\n• Automatic service startup configuration\n• User permission setup\n• Basic security hardening\n• System optimization for container workloads\n\nThis installation is perfect for development environments, CI/CD pipelines, and production container deployments.",
    category: "Development",
    type: "LXC",
    author: "Proxmox Community",
    version: "v2.1.0",
    lastUpdated: "2024-12-15",
    downloads: 15234,
    rating: 4.8,
    tags: ["containers", "development", "deployment", "microservices"],
    requirements: [
      "Ubuntu 20.04+ or Debian 11+",
      "Minimum 2GB RAM",
      "10GB free disk space",
      "Internet connection for package downloads"
    ],
    installTime: "5-10 minutes",
    size: "450 MB",
    installCommand: "bash <(curl -s https://raw.githubusercontent.com/tteck/Proxmox/main/ct/docker.sh)"
  },
  {
    id: "2", 
    name: "Nginx Proxy Manager",
    slug: "nginx-proxy-manager",
    description: "Web-based nginx proxy management with SSL automation",
    fullDescription: "Nginx Proxy Manager is a powerful web-based interface for managing nginx proxy configurations with automatic SSL certificate generation via Let's Encrypt. This script sets up a complete reverse proxy solution that's perfect for homelab environments and production deployments.\n\nKey Features:\n• Beautiful web interface for proxy management\n• Automatic SSL certificate generation and renewal\n• Access lists for security control\n• Stream support for TCP/UDP proxying\n• Multi-user support with role-based access\n• Real-time statistics and monitoring\n• Import/export configurations\n\nPerfect for managing multiple web services, securing internal applications, and providing clean URLs for your services.",
    category: "Networking",
    type: "LXC",
    author: "jc21",
    version: "v2.10.4",
    lastUpdated: "2024-12-10",
    downloads: 28567,
    rating: 4.9,
    tags: ["proxy", "ssl", "web", "security", "management"],
    requirements: [
      "Ubuntu 22.04+ or Debian 12+",
      "Minimum 1GB RAM",
      "5GB free disk space",
      "Ports 80, 443, 81 available"
    ],
    installTime: "3-5 minutes",
    size: "200 MB",
    installCommand: "bash <(curl -s https://raw.githubusercontent.com/tteck/Proxmox/main/ct/nginxproxymanager.sh)"
  },
  {
    id: "3",
    name: "Home Assistant",
    slug: "home-assistant", 
    description: "Open-source home automation platform",
    fullDescription: "Home Assistant is a powerful, open-source home automation platform that puts local control and privacy first. This script installs Home Assistant Core in a Python virtual environment with all necessary dependencies and system services configured for automatic startup.\n\nWhat you get:\n• Complete Home Assistant Core installation\n• Python virtual environment with all dependencies\n• Systemd service for automatic startup\n• Pre-configured logging and backup directories\n• MQTT broker integration ready\n• Z-Wave and Zigbee support preparation\n• Web interface accessible on port 8123\n\nIntegrate with thousands of devices and services to create the perfect smart home experience tailored to your needs.",
    category: "System",
    type: "LXC", 
    author: "Home Assistant Team",
    version: "2024.1.6",
    lastUpdated: "2024-12-12",
    downloads: 45123,
    rating: 4.7,
    tags: ["automation", "iot", "smart-home", "monitoring"],
    requirements: [
      "Ubuntu 22.04+ or Debian 12+",
      "Minimum 2GB RAM",
      "20GB free disk space",
      "Python 3.11+ support"
    ],
    installTime: "10-15 minutes",
    size: "800 MB",
    installCommand: "bash <(curl -s https://raw.githubusercontent.com/tteck/Proxmox/main/ct/homeassistant.sh)"
  }
];

interface ProxmoxNode {
  node: string;
  type: string;
  status: string;
  cpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  level?: string;
  id?: string;
  uptime?: number;
}

interface ScriptExecution {
  id: string;
  scriptId: string;
  scriptName: string;
  command: string;
  serverId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  output?: string;
  errorOutput?: string;
  exitCode?: number;
  duration?: number;
  createdBy: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ScriptDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [currentExecution, setCurrentExecution] = useState<ScriptExecution | null>(null);
  const [showExecutionOutput, setShowExecutionOutput] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const script = mockScripts.find(s => s.slug === params.slug);
  
  // Fetch available Proxmox nodes
  const { data: nodesData, isLoading: nodesLoading } = useQuery({
    queryKey: ['/api/proxmox/nodes'],
    enabled: !!script,
  });

  // Fetch current execution status if there's an active execution
  const { data: executionData, refetch: refetchExecution } = useQuery({
    queryKey: ['/api/proxmox/scripts/executions', currentExecution?.id],
    enabled: !!currentExecution?.id,
    refetchInterval: currentExecution?.status === 'running' || currentExecution?.status === 'pending' ? 2000 : false,
  });

  // Update current execution when data changes
  useEffect(() => {
    if (executionData?.data) {
      setCurrentExecution(executionData.data);
      
      // Auto-show output when execution starts
      if (executionData.data.status === 'running' && !showExecutionOutput) {
        setShowExecutionOutput(true);
      }
      
      // Show completion toast
      if (currentExecution?.status !== executionData.data.status) {
        if (executionData.data.status === 'completed') {
          toast({
            title: "Script Completed",
            description: `${script?.name} finished successfully on ${executionData.data.nodeName}`,
          });
        } else if (executionData.data.status === 'failed') {
          toast({
            title: "Script Failed",
            description: `${script?.name} failed on ${executionData.data.nodeName}`,
            variant: "destructive",
          });
        }
      }
    }
  }, [executionData, currentExecution, showExecutionOutput, script, toast]);

  // Execute script mutation
  const executeScriptMutation = useMutation({
    mutationFn: async (data: { scriptId: string; scriptName: string; command: string; nodeName: string }) => {
      return apiRequest('/api/proxmox/scripts/execute', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          timeout: 600, // 10 minutes
          createdBy: 'user',
        }),
      });
    },
    onSuccess: (data) => {
      setCurrentExecution({
        id: data.data.executionId,
        status: data.data.status,
        scriptId: script!.id,
        scriptName: script!.name,
        command: script!.installCommand,
        serverId: '', // Will be populated by the actual execution data
        nodeName: data.data.nodeName,
        startTime: new Date().toISOString(),
        createdBy: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setShowExecutionOutput(true);
      
      toast({
        title: "Script Execution Started",
        description: `${script?.name} is now running on ${data.data.nodeName}`,
      });

      // Invalidate executions to refresh any history views
      queryClient.invalidateQueries({ queryKey: ['/api/proxmox/scripts/executions'] });
    },
    onError: (error) => {
      console.error('Script execution failed:', error);
      toast({
        title: "Execution Failed",
        description: "Failed to start script execution. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel execution mutation
  const cancelExecutionMutation = useMutation({
    mutationFn: async (executionId: string) => {
      return apiRequest(`/api/proxmox/scripts/executions/${executionId}/cancel`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Execution Cancelled",
        description: "Script execution has been cancelled",
      });
      refetchExecution();
    },
    onError: (error) => {
      console.error('Failed to cancel execution:', error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel script execution",
        variant: "destructive",
      });
    },
  });

  if (!script) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/scripts')}
            data-testid="button-back-to-scripts"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scripts
          </Button>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">Script Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested script could not be found.</p>
        </div>
      </div>
    );
  }

  const handleExecute = async () => {
    if (!selectedNode) {
      toast({
        title: "Node Required",
        description: "Please select a Proxmox node to execute the script on",
        variant: "destructive",
      });
      return;
    }

    if (!script.installCommand) {
      toast({
        title: "Invalid Script",
        description: "This script doesn't have a valid install command",
        variant: "destructive",
      });
      return;
    }

    executeScriptMutation.mutate({
      scriptId: script.id,
      scriptName: script.name,
      command: script.installCommand,
      nodeName: selectedNode,
    });
  };

  const handleCancelExecution = () => {
    if (currentExecution?.id) {
      cancelExecutionMutation.mutate(currentExecution.id);
    }
  };

  const canExecute = selectedNode && !executeScriptMutation.isPending && 
    (!currentExecution || (currentExecution.status !== 'running' && currentExecution.status !== 'pending'));

  const isExecuting = currentExecution?.status === 'running' || currentExecution?.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setLocation('/scripts')}
          data-testid="button-back-to-scripts"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scripts
        </Button>
      </div>

      {/* Script Header */}
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {getScriptIcon(script)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold" data-testid="script-title">
              {script.name}
            </h1>
            <Badge variant="outline" className={getTypeColor(script.type)}>
              {script.type}
            </Badge>
            {currentExecution && (
              <Badge className={getStatusColor(currentExecution.status)}>
                {currentExecution.status}
              </Badge>
            )}
          </div>
          
          <p className="text-lg text-muted-foreground mb-4" data-testid="script-description">
            {script.description}
          </p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{script.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{script.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>{script.downloads.toLocaleString()} downloads</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{script.rating}/5</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 space-y-3">
          {/* Node Selection */}
          <div className="min-w-[200px]">
            <Select value={selectedNode} onValueChange={setSelectedNode} disabled={isExecuting}>
              <SelectTrigger data-testid="select-node">
                <SelectValue placeholder={nodesLoading ? "Loading nodes..." : "Select Proxmox node"} />
              </SelectTrigger>
              <SelectContent>
                {nodesData?.data?.map((node: ProxmoxNode) => (
                  <SelectItem key={node.node} value={node.node}>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>{node.node}</span>
                      <Badge variant="outline" className={node.status === 'online' ? 'text-green-600' : 'text-red-600'}>
                        {node.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Execute/Cancel Button */}
          <Button 
            size="lg"
            className="w-full"
            onClick={isExecuting ? handleCancelExecution : handleExecute}
            disabled={(!canExecute && !isExecuting) || executeScriptMutation.isPending || cancelExecutionMutation.isPending}
            data-testid="button-execute-script"
            variant={isExecuting ? "destructive" : "default"}
          >
            {executeScriptMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white mr-2"></div>
                Starting...
              </>
            ) : isExecuting ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel Execution
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Script
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Execution Output */}
      {showExecutionOutput && currentExecution && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Execution Output
                {(currentExecution.status === 'running' || currentExecution.status === 'pending') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchExecution()}
                    disabled={executeScriptMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(currentExecution.status)}>
                  {currentExecution.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExecutionOutput(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Node: {currentExecution.nodeName} | Started: {new Date(currentExecution.startTime).toLocaleString()}
              {currentExecution.duration && ` | Duration: ${currentExecution.duration}s`}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full rounded border bg-black text-green-400 font-mono text-sm p-4">
              <div className="whitespace-pre-wrap">
                {currentExecution.output || currentExecution.errorOutput || (
                  currentExecution.status === 'pending' ? 'Waiting for execution to start...' :
                  currentExecution.status === 'running' ? 'Script is running...' : 
                  'No output available'
                )}
                {(currentExecution.status === 'running' || currentExecution.status === 'pending') && (
                  <span className="animate-pulse">█</span>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Full Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this Script</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {script.fullDescription.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {script.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Installation Info */}
          <Card>
            <CardHeader>
              <CardTitle>Installation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Version</div>
                <div className="text-sm text-muted-foreground">{script.version}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Installation Time</div>
                <div className="text-sm text-muted-foreground">{script.installTime}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Download Size</div>
                <div className="text-sm text-muted-foreground">{script.size}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Category</div>
                <div className="text-sm text-muted-foreground">{script.category}</div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {script.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Current execution status */}
            {currentExecution && (
              <Card className="p-4">
                <div className="text-sm font-medium mb-2">Current Execution</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Node: {currentExecution.nodeName}</div>
                    <Badge className={getStatusColor(currentExecution.status)}>
                      {currentExecution.status}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExecutionOutput(!showExecutionOutput)}
                    data-testid="button-toggle-output"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    {showExecutionOutput ? 'Hide' : 'Show'} Output
                  </Button>
                </div>
              </Card>
            )}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(`https://github.com/tteck/Proxmox/discussions`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Source
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}