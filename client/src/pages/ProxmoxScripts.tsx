import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Terminal, 
  Play, 
  Code, 
  Search,
  Filter,
  Download,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  Box,
  Globe,
  Shield,
  Database,
  Monitor,
  Wifi,
  Home,
  Settings,
  Activity,
  HardDrive,
  Users,
  Zap,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Network,
  Layout,
  Eye
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ScriptSourceModal, { ScriptSource } from "@/components/ScriptSourceModal";
import ScriptEditModal, { ProxmoxScript } from "@/components/ScriptEditModal";

// Script execution interface
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

export default function ProxmoxScriptsPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScript, setSelectedScript] = useState<ProxmoxScript | null>(null);
  const [activeTab, setActiveTab] = useState("scripts");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [runningScript, setRunningScript] = useState<string | null>(null);
  const [scriptResults, setScriptResults] = useState<{ [key: string]: { status: 'running' | 'success' | 'error'; output?: string; } }>({});
  const [scriptSources, setScriptSources] = useState<ScriptSource[]>([]);
  const [scripts, setScripts] = useState<ProxmoxScript[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingScript, setEditingScript] = useState<ProxmoxScript | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customScripts, setCustomScripts] = useState<ProxmoxScript[]>([]);

  // Fetch execution history
  const { data: executionsData, isLoading: executionsLoading, refetch: refetchExecutions } = useQuery({
    queryKey: ['/api/proxmox/scripts/executions'],
    enabled: activeTab === 'history',
    refetchInterval: 5000, // Refresh every 5 seconds when on history tab
  });

  const executions = executionsData?.data || [];

  // Delete execution mutation
  const deleteExecutionMutation = useMutation({
    mutationFn: async (executionId: string) => {
      return apiRequest(`/api/proxmox/scripts/executions/${executionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Execution Deleted",
        description: "Execution record has been deleted successfully",
      });
      refetchExecutions();
    },
    onError: (error) => {
      console.error('Failed to delete execution:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete execution record",
        variant: "destructive",
      });
    },
  });

  // Mock/fallback scripts when no sources are available
  const fallbackScripts: ProxmoxScript[] = [
    {
      id: "olivetin",
      name: "OliveTin",
      slug: "olivetin",
      description: "OliveTin provides a secure and straightforward way to execute pre-determined shell commands through a web-based interface.",
      category: "Dashboards & Frontends",
      type: "ADDON",
      port: 1337,
      updateable: false,
      privileged: true,
      website: "https://github.com/OliveTin/OliveTin",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/tools/addon/olivetin.sh)"',
      dateAdded: "2024-05-01",
      notes: [
        "Configuration Path: /etc/OliveTin/config.yaml",
        "This script enhances an existing setup"
      ]
    },
    {
      id: "cockpit",
      name: "Cockpit",
      slug: "cockpit", 
      description: "Cockpit is a web-based interface for servers. It allows system administrators to manage their Linux systems remotely through a browser.",
      category: "Dashboards & Frontends",
      type: "LXC",
      port: 9090,
      updateable: true,
      privileged: false,
      website: "https://cockpit-project.org/",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/cockpit.sh)"',
      dateAdded: "2024-01-15"
    },
    {
      id: "dashy",
      name: "Dashy",
      slug: "dashy",
      description: "A self-hosted startpage for your homelab. With 50+ widgets, custom theming, and built-in authentication.",
      category: "Dashboards & Frontends",
      type: "LXC",
      port: 4000,
      updateable: true,
      privileged: false,
      website: "https://dashy.to/",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/dashy.sh)"',
      dateAdded: "2024-02-10"
    },
    {
      id: "homepage",
      name: "Homepage",
      slug: "homepage",
      description: "A modern, fully static, fast, secure, fully proxied, highly customizable application dashboard with integrations for over 100 services.",
      category: "Dashboards & Frontends",
      type: "LXC",
      port: 3000,
      updateable: true,
      privileged: false,
      website: "https://gethomepage.dev/",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/homepage.sh)"',
      dateAdded: "2024-03-05"
    },
    {
      id: "heimdall-dashboard",
      name: "Heimdall Dashboard",
      slug: "heimdall-dashboard",
      description: "Heimdall is a way to organize all those links to your most used web sites and web applications in a simple way.",
      category: "Dashboards & Frontends",
      type: "LXC",
      port: 80,
      updateable: true,
      privileged: false,
      website: "https://heimdall.site/",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/heimdall-dashboard.sh)"',
      dateAdded: "2024-01-20"
    },
    {
      id: "docker",
      name: "Docker",
      slug: "docker",
      description: "Docker is an open-source project for automating the deployment of applications as portable, self-sufficient containers.",
      category: "Containers & Docker",
      type: "LXC",
      updateable: true,
      privileged: true,
      website: "https://www.docker.com/",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/docker.sh)"',
      dateAdded: "2024-01-01"
    },
    {
      id: "homeassistant",
      name: "Home Assistant Container",
      slug: "homeassistant",
      description: "A standalone container-based installation of Home Assistant Core with Docker integration.",
      category: "IoT & Smart Home",
      type: "LXC",
      port: 8123,
      updateable: true,
      privileged: true,
      website: "https://www.home-assistant.io/",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/homeassistant.sh)"',
      dateAdded: "2024-01-10"
    },
    {
      id: "post-pve-install",
      name: "Proxmox VE Post Install",
      slug: "post-pve-install",
      description: "This script provides options for managing Proxmox VE repositories, including disabling the Enterprise Repo, adding PVE sources, enabling No-Subscription Repo, and more.",
      category: "Proxmox & Virtualization",
      type: "HOST",
      updateable: false,
      privileged: true,
      website: "https://github.com/community-scripts/ProxmoxVE",
      command: 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/misc/post-pve-install.sh)"',
      dateAdded: "2024-01-01"
    }
  ];

  const categories = [
    "all",
    ...Array.from(new Set(scripts.map(script => script.category))).sort()
  ];

  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      const matchesCategory = selectedCategory === "all" || script.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, scripts]);

  const handleRunScript = async (script: ProxmoxScript) => {
    setRunningScript(script.id);
    setScriptResults(prev => ({ ...prev, [script.id]: { status: 'running' } }));

    try {
      //todo: In production, this would execute the script on the Proxmox host
      console.log(`Executing script: ${script.command}`);
      
      // Simulate script execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      setScriptResults(prev => ({ 
        ...prev, 
        [script.id]: { 
          status: success ? 'success' : 'error',
          output: success ? `${script.name} installed successfully!` : `Error installing ${script.name}. Check logs for details.`
        } 
      }));
    } catch (error) {
      setScriptResults(prev => ({ 
        ...prev, 
        [script.id]: { 
          status: 'error',
          output: `Failed to execute script: ${error}`
        } 
      }));
    } finally {
      setRunningScript(null);
    }
  };

  const getScriptIcon = (script: ProxmoxScript) => {
    // First try to get specific icon based on script name/slug
    const specificIcons: { [key: string]: typeof Terminal } = {
      "olivetin": Terminal,
      "cockpit": Monitor,
      "dashy": Layout,
      "homepage": Home,
      "heimdall": Globe,
      "heimdall-dashboard": Globe,
      "docker": Box,
      "homeassistant": Home,
      "home-assistant": Home,
      "post-pve-install": Server,
      "nginx": Globe,
      "postgresql": Database,
      "mysql": Database,
      "mariadb": Database,
      "redis": Database,
      "mongodb": Database,
      "grafana": Activity,
      "prometheus": Activity,
      "jellyfin": Play,
      "plex": Play,
      "nextcloud": HardDrive,
      "portainer": Box,
      "traefik": Network,
      "pihole": Shield,
      "wireguard": Wifi,
      "openvpn": Shield,
      "nginx-proxy-manager": Network,
      "uptime-kuma": Activity,
      "code-server": Code,
      "vscode": Code,
      "gitea": Code,
      "gitlab": Code,
      "jenkins": Zap,
      "node-red": Zap
    };

    // Try to match by slug/name first
    const SpecificIcon = specificIcons[script.slug.toLowerCase()] || specificIcons[script.name.toLowerCase().replace(/\s+/g, '-')];
    if (SpecificIcon) {
      return <SpecificIcon className="h-6 w-6 text-primary" />;
    }

    // Fallback to category icons
    const categoryIcons: { [key: string]: typeof Terminal } = {
      "Dashboards & Frontends": Monitor,
      "Containers & Docker": Box,
      "IoT & Smart Home": Home,
      "Proxmox & Virtualization": Server,
      "Network & Firewall": Network,
      "Authentication & Security": Shield,
      "Databases": Database,
      "Monitoring & Analytics": Activity,
      "Files & Downloads": HardDrive,
      "Media & Streaming": Play,
      "Automation & Scheduling": Zap,
      "Development Tools": Code,
      "Backup & Storage": HardDrive,
      "Communication": Users,
      "Miscellaneous": Settings
    };

    const CategoryIcon = categoryIcons[script.category] || Terminal;
    return <CategoryIcon className="h-6 w-6 text-muted-foreground" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "LXC": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "VM": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "ADDON": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "HOST": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Sync functionality
  const syncScripts = async (sourceId?: string) => {
    setIsSyncing(true);
    
    try {
      const sourcesToSync = sourceId ? scriptSources.filter(s => s.id === sourceId) : scriptSources.filter(s => s.enabled);
      let allScripts: ProxmoxScript[] = [];
      
      // Update source status to syncing
      setScriptSources(prev => prev.map(s => 
        sourcesToSync.some(sync => sync.id === s.id) 
          ? { ...s, status: 'syncing' } 
          : s
      ));

      for (const source of sourcesToSync) {
        try {
          const response = await fetch(source.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          let sourceScripts: ProxmoxScript[] = [];
          
          // Handle different API formats
          if (Array.isArray(data)) {
            sourceScripts = data.map((script: any) => ({
              id: script.slug || script.id || script.name?.toLowerCase().replace(/\s+/g, '-'),
              name: script.name,
              slug: script.slug || script.name?.toLowerCase().replace(/\s+/g, '-'),
              description: script.description || '',
              category: script.category || script.categories?.[0] || 'Miscellaneous',
              type: script.type || 'LXC',
              port: script.interface_port || script.port,
              updateable: script.updateable !== false,
              privileged: script.privileged === true,
              website: script.website,
              command: script.install_methods?.[0] || `bash -c "$(curl -fsSL ${script.url})"`,
              dateAdded: script.date_created || script.dateAdded || new Date().toISOString().split('T')[0],
              notes: script.notes || []
            }));
          }
          
          allScripts = [...allScripts, ...sourceScripts];
          
          // Update source status to success
          setScriptSources(prev => prev.map(s => 
            s.id === source.id 
              ? { 
                  ...s, 
                  status: 'success', 
                  lastSync: new Date().toISOString(), 
                  scriptCount: sourceScripts.length,
                  errorMessage: undefined
                } 
              : s
          ));
          
        } catch (error) {
          console.error(`Failed to sync ${source.name}:`, error);
          
          // Update source status to error
          setScriptSources(prev => prev.map(s => 
            s.id === source.id 
              ? { 
                  ...s, 
                  status: 'error', 
                  errorMessage: error instanceof Error ? error.message : 'Unknown error',
                  lastSync: new Date().toISOString()
                } 
              : s
          ));
        }
      }
      
      // Deduplicate scripts by ID (last source wins)
      const uniqueScripts = allScripts.reduce((acc: ProxmoxScript[], script) => {
        const existingIndex = acc.findIndex(s => s.id === script.id);
        if (existingIndex >= 0) {
          acc[existingIndex] = script;
        } else {
          acc.push(script);
        }
        return acc;
      }, []);
      
      // Merge with custom scripts (custom scripts override synced ones)
      const mergedScripts = [...uniqueScripts];
      customScripts.forEach(customScript => {
        const existingIndex = mergedScripts.findIndex(s => s.id === customScript.id);
        if (existingIndex >= 0) {
          mergedScripts[existingIndex] = customScript;
        } else {
          mergedScripts.push(customScript);
        }
      });
      
      setScripts(mergedScripts.length > 0 ? mergedScripts : fallbackScripts);
      setLastSyncTime(new Date().toISOString());
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load scripts on initial load
  useEffect(() => {
    if (scriptSources.length > 0 && scripts.length === 0) {
      syncScripts();
    } else if (scripts.length === 0 && customScripts.length === 0) {
      setScripts(fallbackScripts);
    }
  }, [scriptSources, customScripts]);

  // Auto-sync every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (scriptSources.some(s => s.enabled)) {
        syncScripts();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [scriptSources]);

  // Script CRUD operations
  const handleAddScript = () => {
    setEditingScript(null);
    setShowEditModal(true);
  };

  const handleEditScript = (script: ProxmoxScript) => {
    setEditingScript(script);
    setShowEditModal(true);
  };

  const handleSaveScript = async (script: ProxmoxScript) => {
    const updatedCustomScripts = [...customScripts];
    const existingIndex = updatedCustomScripts.findIndex(s => s.id === script.id);
    
    if (existingIndex >= 0) {
      updatedCustomScripts[existingIndex] = script;
    } else {
      updatedCustomScripts.push(script);
    }
    
    setCustomScripts(updatedCustomScripts);
    
    // Update the main scripts list
    const updatedScripts = [...scripts];
    const scriptIndex = updatedScripts.findIndex(s => s.id === script.id);
    
    if (scriptIndex >= 0) {
      updatedScripts[scriptIndex] = script;
    } else {
      updatedScripts.push(script);
    }
    
    setScripts(updatedScripts);
    setShowEditModal(false);
    setEditingScript(null);
  };

  const handleRemoveScript = async (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;
    
    // For custom scripts, remove completely
    if (script.isCustom) {
      if (confirm(`Are you sure you want to remove "${script.name}"? This action cannot be undone.`)) {
        setCustomScripts(prev => prev.filter(s => s.id !== scriptId));
        setScripts(prev => prev.filter(s => s.id !== scriptId));
        
        // Remove from results if exists
        setScriptResults(prev => {
          const updated = { ...prev };
          delete updated[scriptId];
          return updated;
        });
      }
    } else {
      // For synced scripts, just hide them from the current view
      if (confirm(`Are you sure you want to hide "${script.name}" from your scripts list?`)) {
        setScripts(prev => prev.filter(s => s.id !== scriptId));
        
        // Remove from results if exists
        setScriptResults(prev => {
          const updated = { ...prev };
          delete updated[scriptId];
          return updated;
        });
      }
    }
  };

  const getStatusIcon = (status: 'running' | 'success' | 'error') => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Proxmox Scripts</h1>
          <p className="text-muted-foreground">
            Community-maintained scripts for automated Proxmox VM and LXC deployment
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddScript} data-testid="button-add-script">
            <Plus className="h-4 w-4 mr-2" />
            Add Script
          </Button>
          <ScriptSourceModal
            sources={scriptSources}
            onSourcesChange={setScriptSources}
            onSync={syncScripts}
          >
            <Button variant="outline" data-testid="button-manage-sources">
              <Settings className="h-4 w-4 mr-2" />
              Manage Sources
            </Button>
          </ScriptSourceModal>
          <Button 
            variant="outline"
            onClick={() => syncScripts()}
            disabled={isSyncing}
            data-testid="button-sync-scripts"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Sources
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open('https://community-scripts.github.io/ProxmoxVE/', '_blank')}
            data-testid="button-browse-scripts"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Browse All
          </Button>
        </div>
      </div>

      {/* Tabs for Scripts and Execution History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scripts" data-testid="tab-scripts">
            <Terminal className="h-4 w-4 mr-2" />
            Available Scripts
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <Activity className="h-4 w-4 mr-2" />
            Execution History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-6 mt-6">
          {/* Script Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{scripts.length}</div>
            <div className="text-sm text-muted-foreground">Available Scripts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {scripts.filter((s: ProxmoxScript) => s.type === 'LXC').length}
            </div>
            <div className="text-sm text-muted-foreground">LXC Containers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {scripts.filter((s: ProxmoxScript) => s.type === 'ADDON').length}
            </div>
            <div className="text-sm text-muted-foreground">Add-ons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {customScripts.length}
            </div>
            <div className="text-sm text-muted-foreground">Custom Scripts</div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      {(lastSyncTime || isSyncing) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm">Syncing scripts from {scriptSources.filter(s => s.enabled).length} source(s)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Last sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'} 
                      • {scriptSources.filter(s => s.enabled).length} active source(s)
                      • Auto-sync every 30 minutes
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search scripts by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-scripts"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            data-testid="select-category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Script Results Summary */}
      {Object.keys(scriptResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Script Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(scriptResults).map(([scriptId, result]) => {
                const script = scripts.find((s: ProxmoxScript) => s.id === scriptId);
                return (
                  <div key={scriptId} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{script?.name}</span>
                      <Badge variant="outline" className={getTypeColor(script?.type || '')}>
                        {script?.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.output || 'Executing...'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scripts Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Available Scripts ({filteredScripts.length})
        </h2>
        
        {filteredScripts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No scripts found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredScripts.map((script) => {
              const result = scriptResults[script.id];
              const isRunning = runningScript === script.id;
              
              return (
                <Card key={script.id} className="hover-elevate transition-all group" data-testid={`script-card-${script.slug}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Script Icon */}
                        <div className="flex-shrink-0 p-3 rounded-lg bg-muted/30 border">
                          {getScriptIcon(script)}
                        </div>
                        
                        {/* Script Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg" data-testid={`script-name-${script.slug}`}>
                              {script.name}
                            </h3>
                            {script.isCustom && (
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                Custom
                              </Badge>
                            )}
                            {result && (
                              <div className="flex items-center gap-1">
                                {getStatusIcon(result.status)}
                              </div>
                            )}
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {script.description || "No description available"}
                          </p>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className={getTypeColor(script.type)}>
                              {script.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {script.category}
                            </Badge>
                            {script.port && (
                              <Badge variant="outline" className="text-xs">
                                Port {script.port}
                              </Badge>
                            )}
                            {script.updateable && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                Updateable
                              </Badge>
                            )}
                            {script.privileged && (
                              <Badge variant="outline" className="text-xs text-orange-600">
                                Privileged
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons - Always visible, aligned at same level */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocation(`/scripts/${script.slug}`)}
                          data-testid={`script-details-${script.slug}`}
                          className="h-8 w-8"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        {script.website && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(script.website, '_blank')}
                            data-testid={`script-website-${script.slug}`}
                            className="h-8 w-8"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditScript(script)}
                          data-testid={`script-edit-${script.slug}`}
                          className="h-8 w-8"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveScript(script.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          data-testid={`script-remove-${script.slug}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Additional Details */}
                      {(script.author || script.dateAdded) && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {script.author && <div>Author: {script.author}</div>}
                          <div>Added: {script.dateAdded}</div>
                        </div>
                      )}

                      {/* Notes */}
                      {script.notes && script.notes.length > 0 && (
                        <div className="text-xs bg-muted/30 p-3 rounded-md">
                          <div className="font-medium mb-1">Notes:</div>
                          {script.notes.map((note, index) => (
                            <div key={index} className="text-muted-foreground">• {note}</div>
                          ))}
                        </div>
                      )}

                      {/* Default Credentials */}
                      {script.defaultCredentials && (script.defaultCredentials.username || script.defaultCredentials.password) && (
                        <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                          <div className="font-medium mb-1 text-blue-800 dark:text-blue-400">Default Credentials:</div>
                          {script.defaultCredentials.username && (
                            <div className="text-blue-700 dark:text-blue-300">Username: {script.defaultCredentials.username}</div>
                          )}
                          {script.defaultCredentials.password && (
                            <div className="text-blue-700 dark:text-blue-300">Password: {script.defaultCredentials.password}</div>
                          )}
                        </div>
                      )}

                      {/* Execution Result */}
                      {result?.output && (
                        <div className={cn(
                          "text-xs p-3 rounded-md font-mono",
                          result.status === 'success' && "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                          result.status === 'error' && "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400",
                          result.status === 'running' && "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        )}>
                          {result.output}
                        </div>
                      )}

                      {/* Install Button */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          size="lg"
                          onClick={() => handleRunScript(script)}
                          disabled={isRunning}
                          data-testid={`button-run-${script.slug}`}
                        >
                          {isRunning ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Installing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Install {script.type}
                            </>
                          )}
                        </Button>
                        
                        {script.website && (
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => window.open(script.website, '_blank')}
                            data-testid={`button-docs-${script.slug}`}
                            className="w-12"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          {/* Execution History */}
          {executionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
              <span className="ml-2">Loading execution history...</span>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Execution History</h3>
              <p className="text-muted-foreground">Start executing scripts to see the history here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Execution History ({executions.length})
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchExecutions()}
                  data-testid="button-refresh-history"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="grid gap-4">
                {executions.map((execution: ScriptExecution) => (
                  <Card key={execution.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Terminal className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{execution.scriptName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Node: {execution.nodeName} | 
                              Started: {new Date(execution.startTime).toLocaleString()}
                              {execution.duration && ` | Duration: ${execution.duration}s`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExecutionMutation.mutate(execution.id)}
                            disabled={deleteExecutionMutation.isPending}
                            data-testid={`button-delete-execution-${execution.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {(execution.output || execution.errorOutput) && (
                      <CardContent>
                        <ScrollArea className="h-32 w-full rounded border bg-black text-green-400 font-mono text-sm p-3">
                          <div className="whitespace-pre-wrap">
                            {execution.output && (
                              <div className="text-green-400">{execution.output}</div>
                            )}
                            {execution.errorOutput && (
                              <div className="text-red-400">{execution.errorOutput}</div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Script Edit Modal */}
      <ScriptEditModal
        script={editingScript || undefined}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingScript(null);
        }}
        onSave={handleSaveScript}
      />
    </div>
  );
}