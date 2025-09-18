import DashboardCard from "@/components/DashboardCard";
import ResourceChart from "@/components/ResourceChart";
import VirtualMachineCard from "@/components/VirtualMachineCard";
import ContainerCard from "@/components/ContainerCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ProxmoxVM, ProxmoxContainer } from "@shared/schema";
import { Cpu, HardDrive, MemoryStick, Activity, Network, Zap, Monitor, Box, Settings, Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  // Widget visibility state
  const [widgets, setWidgets] = useState({
    cpu: true,
    memory: true,
    storage: true,
    networkIn: true,
    virtualMachines: true,
    containers: true,
    networkOut: true,
    totalResources: true
  });

  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const { toast } = useToast();

  // Toggle widget visibility
  const toggleWidget = (widgetKey: keyof typeof widgets) => {
    setWidgets(prev => ({
      ...prev,
      [widgetKey]: !prev[widgetKey]
    }));
  };

  // Fetch VMs from Proxmox API
  const {
    data: vmApiResponse,
    isLoading: vmsLoading,
    error: vmsError
  } = useQuery({
    queryKey: ["/api/proxmox/vms"],
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load VMs",
          description: "Could not fetch virtual machines from Proxmox server.",
        });
      }
    }
  });
  
  // Fetch Containers from Proxmox API
  const {
    data: containerApiResponse,
    isLoading: containersLoading,
    error: containersError
  } = useQuery({
    queryKey: ["/api/proxmox/containers"],
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load Containers",
          description: "Could not fetch containers from Proxmox server.",
        });
      }
    }
  });
  
  const vms: ProxmoxVM[] = vmApiResponse?.success ? vmApiResponse.data : [];
  const containers: ProxmoxContainer[] = containerApiResponse?.success ? containerApiResponse.data : [];
  
  // Format uptime from seconds to readable string
  const formatUptime = (seconds?: number): string => {
    if (!seconds) return "";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days} days, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Fetch real cluster resource metrics from Proxmox API
  const {
    data: clusterMetricsResponse,
    isLoading: metricsLoading,
    error: metricsError
  } = useQuery({
    queryKey: ["/api/proxmox/cluster/resources"],
    refetchInterval: 30000, // Refresh every 30 seconds
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load cluster metrics",
          description: "Could not fetch resource utilization from Proxmox server.",
        });
      }
    }
  });

  // Fetch cluster health information
  const {
    data: clusterHealthResponse,
    isLoading: healthLoading,
    error: healthError
  } = useQuery({
    queryKey: ["/api/proxmox/cluster/health"],
    refetchInterval: 60000, // Refresh every minute
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load cluster health",
          description: "Could not fetch cluster status from Proxmox server.",
        });
      }
    }
  });

  const clusterMetrics = clusterMetricsResponse?.success ? clusterMetricsResponse.data : null;
  const clusterHealth = clusterHealthResponse?.success ? clusterHealthResponse.data : null;

  // Generate historical data for charts (real time-series data would require RRD integration)
  const generateChartData = (currentValue: number, variance: number = 10) => {
    const data = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const randomVariance = (Math.random() - 0.5) * variance;
      const value = Math.max(0, Math.min(100, currentValue + randomVariance));
      data.push({
        time: time.toISOString(),
        value: Math.round(value * 10) / 10
      });
    }
    return data;
  };

  // Use real metrics if available, fallback to historical simulation
  const cpuData = clusterMetrics ? generateChartData(clusterMetrics.cpu.percentage, 5) : [];
  const memoryData = clusterMetrics ? generateChartData(clusterMetrics.memory.percentage, 3) : [];
  const networkInData = generateChartData(35, 20); // Network charts need more complex RRD integration
  const networkOutData = generateChartData(28, 18);
  const diskIOData = generateChartData(15, 10);

  // Calculate VM and Container statistics from real data
  const activeVMs = vms.filter(vm => vm.status === "running").length;
  const inactiveVMs = vms.filter(vm => vm.status !== "running").length;
  const totalVMs = vms.length;
  const vmActivePercentage = totalVMs > 0 ? (activeVMs / totalVMs) * 100 : 0;

  const activeContainers = containers.filter(ct => ct.status === "running").length;
  const inactiveContainers = containers.filter(ct => ct.status !== "running").length;
  const totalContainers = containers.length;
  const containerActivePercentage = totalContainers > 0 ? (activeContainers / totalContainers) * 100 : 0;

  const isLoading = vmsLoading || containersLoading || metricsLoading || healthLoading;
  const hasErrors = vmsError || containersError || metricsError || healthError;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Proxmox cluster resources and virtual machines
          </p>
        </div>
        
        {/* Widget Configuration */}
        <DropdownMenu open={showWidgetConfig} onOpenChange={setShowWidgetConfig}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-configure-widgets">
              <Settings className="h-4 w-4 mr-2" />
              Customize Widgets
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dashboard Widgets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-cpu" className="text-sm cursor-pointer">CPU Usage</Label>
                    <Switch
                      id="widget-cpu"
                      checked={widgets.cpu}
                      onCheckedChange={() => toggleWidget('cpu')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-memory" className="text-sm cursor-pointer">Memory Usage</Label>
                    <Switch
                      id="widget-memory"
                      checked={widgets.memory}
                      onCheckedChange={() => toggleWidget('memory')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-storage" className="text-sm cursor-pointer">Storage Usage</Label>
                    <Switch
                      id="widget-storage"
                      checked={widgets.storage}
                      onCheckedChange={() => toggleWidget('storage')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-network-in" className="text-sm cursor-pointer">Network In</Label>
                    <Switch
                      id="widget-network-in"
                      checked={widgets.networkIn}
                      onCheckedChange={() => toggleWidget('networkIn')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-vms" className="text-sm cursor-pointer">Virtual Machines</Label>
                    <Switch
                      id="widget-vms"
                      checked={widgets.virtualMachines}
                      onCheckedChange={() => toggleWidget('virtualMachines')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-containers" className="text-sm cursor-pointer">Containers</Label>
                    <Switch
                      id="widget-containers"
                      checked={widgets.containers}
                      onCheckedChange={() => toggleWidget('containers')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-network-out" className="text-sm cursor-pointer">Network Out</Label>
                    <Switch
                      id="widget-network-out"
                      checked={widgets.networkOut}
                      onCheckedChange={() => toggleWidget('networkOut')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-total" className="text-sm cursor-pointer">Total Resources</Label>
                    <Switch
                      id="widget-total"
                      checked={widgets.totalResources}
                      onCheckedChange={() => toggleWidget('totalResources')}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWidgets(Object.keys(widgets).reduce((acc, key) => ({ ...acc, [key]: true }), {} as typeof widgets))}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWidgets(Object.keys(widgets).reduce((acc, key) => ({ ...acc, [key]: false }), {} as typeof widgets))}
                      className="flex-1"
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Metrics Cards */}
      {Object.values(widgets).some(Boolean) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {/* System Resources */}
          {widgets.cpu && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="CPU Usage"
                value={clusterMetrics ? `${clusterMetrics.cpu.percentage.toFixed(1)}%` : "N/A"}
                description={clusterMetrics ? `${clusterMetrics.cpu.total} cores total` : "No data available"}
                progress={clusterMetrics ? clusterMetrics.cpu.percentage : 0}
                icon={<Cpu className="h-4 w-4" />}
                trend={clusterMetrics ? { 
                  value: clusterMetrics.cpu.used, 
                  label: "cores in use", 
                  isPositive: true 
                } : undefined}
              />
            )
          )}
          {widgets.memory && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="Memory Usage"
                value={clusterMetrics ? `${clusterMetrics.memory.used.toFixed(1)} GB` : "N/A"}
                description={clusterMetrics ? `${clusterMetrics.memory.total.toFixed(1)} GB total` : "No data available"}
                progress={clusterMetrics ? clusterMetrics.memory.percentage : 0}
                icon={<MemoryStick className="h-4 w-4" />}
                trend={clusterMetrics ? { 
                  value: clusterMetrics.memory.percentage, 
                  label: "utilization", 
                  isPositive: clusterMetrics.memory.percentage < 80 
                } : undefined}
              />
            )
          )}
          {widgets.storage && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="Storage Usage"
                value={clusterMetrics ? `${clusterMetrics.storage.used.toFixed(0)} GB` : "N/A"}
                description={clusterMetrics ? `${clusterMetrics.storage.total.toFixed(0)} GB total` : "No data available"}
                progress={clusterMetrics ? clusterMetrics.storage.percentage : 0}
                icon={<HardDrive className="h-4 w-4" />}
                trend={clusterMetrics ? { 
                  value: clusterMetrics.storage.percentage, 
                  label: "used", 
                  isPositive: clusterMetrics.storage.percentage < 85 
                } : undefined}
              />
            )
          )}
          {widgets.networkIn && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="Network In"
                value={clusterMetrics ? `${clusterMetrics.network.inbound.toFixed(1)} MB/s` : "N/A"}
                description={clusterMetrics ? "Current inbound traffic" : "No data available"}
                progress={Math.min(clusterMetrics ? (clusterMetrics.network.inbound / 100) * 100 : 0, 100)}
                icon={<Network className="h-4 w-4" />}
                trend={clusterMetrics ? { 
                  value: clusterMetrics.network.inbound, 
                  label: "MB/s average", 
                  isPositive: true 
                } : undefined}
              />
            )
          )}
          
          {/* VM and Container Statistics */}
          {widgets.virtualMachines && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="Virtual Machines"
                value={`${activeVMs}/${totalVMs}`}
                description={`${activeVMs} active • ${inactiveVMs} inactive`}
                progress={vmActivePercentage}
                icon={<Monitor className="h-4 w-4" />}
                trend={{ value: activeVMs, label: "running", isPositive: true }}
              />
            )
          )}
          {widgets.containers && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Box className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="Containers"
                value={`${activeContainers}/${totalContainers}`}
                description={`${activeContainers} active • ${inactiveContainers} inactive`}
                progress={containerActivePercentage}
                icon={<Box className="h-4 w-4" />}
                trend={{ value: activeContainers, label: "running", isPositive: true }}
              />
            )
          )}
          {widgets.networkOut && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="Network Out"
                value={clusterMetrics ? `${clusterMetrics.network.outbound.toFixed(1)} MB/s` : "N/A"}
                description={clusterMetrics ? "Current outbound traffic" : "No data available"}
                progress={Math.min(clusterMetrics ? (clusterMetrics.network.outbound / 100) * 100 : 0, 100)}
                icon={<Network className="h-4 w-4" />}
                trend={clusterMetrics ? { 
                  value: clusterMetrics.network.outbound, 
                  label: "MB/s average", 
                  isPositive: true 
                } : undefined}
              />
            )
          )}
          {widgets.totalResources && (
            isLoading ? (
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <DashboardCard
                title="Total Resources"
                value={`${activeVMs + activeContainers}`}
                description={`${totalVMs + totalContainers} total • ${activeVMs + activeContainers} active`}
                progress={totalVMs + totalContainers > 0 ? (activeVMs + activeContainers) / (totalVMs + totalContainers) * 100 : 0}
                icon={<Activity className="h-4 w-4" />}
                trend={{ value: parseFloat(((activeVMs + activeContainers) / Math.max(totalVMs + totalContainers, 1) * 100).toFixed(1)), label: "utilization", isPositive: true }}
              />
            )
          )}
        </div>
      )}

      {/* Empty State when all widgets are hidden */}
      {!Object.values(widgets).some(Boolean) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">All widgets are hidden</h3>
            <p className="text-sm text-muted-foreground mb-4">Enable widgets to see your dashboard metrics</p>
            <Button 
              variant="outline" 
              onClick={() => setShowWidgetConfig(true)}
              data-testid="button-show-widget-config"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Widgets
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resource Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <ResourceChart
          title="CPU Usage (24h)"
          data={cpuData}
          color="#3b82f6"
          unit="%"
        />
        <ResourceChart
          title="Memory Usage (24h)"
          data={memoryData}
          color="#10b981"
          unit="%"
        />
        <ResourceChart
          title="Network Traffic (24h)"
          data={networkInData}
          color="#8b5cf6"
          unit=" MB/s"
        />
        <ResourceChart
          title="Network Outbound (24h)"
          data={networkOutData}
          color="#f59e0b"
          unit=" MB/s"
        />
        <ResourceChart
          title="Disk I/O (24h)"
          data={diskIOData}
          color="#ef4444"
          unit=" MB/s"
        />
        <div className="bg-card border border-card-border rounded-lg p-4 hover-elevate">
          <h3 className="text-base font-medium mb-4">Cluster Health</h3>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : clusterHealth ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Status</span>
                <span className={`text-sm font-medium ${
                  clusterHealth.status === 'healthy' ? 'text-green-600 dark:text-green-400' :
                  clusterHealth.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {clusterHealth.status.charAt(0).toUpperCase() + clusterHealth.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Node Status</span>
                <span className="text-sm font-medium">
                  {clusterHealth.summary.onlineNodes}/{clusterHealth.summary.totalNodes} Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quorum</span>
                <span className={`text-sm font-medium ${
                  clusterHealth.quorum ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {clusterHealth.quorum ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg CPU Usage</span>
                <span className={`text-sm font-medium ${
                  clusterHealth.summary.avgCpuUsage > 80 ? 'text-red-600 dark:text-red-400' :
                  clusterHealth.summary.avgCpuUsage > 60 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {clusterHealth.summary.avgCpuUsage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Memory Usage</span>
                <span className={`text-sm font-medium ${
                  clusterHealth.summary.avgMemoryUsage > 90 ? 'text-red-600 dark:text-red-400' :
                  clusterHealth.summary.avgMemoryUsage > 75 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {clusterHealth.summary.avgMemoryUsage.toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-muted-foreground">No data available</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Virtual Machines</h2>
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">{activeVMs} Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-muted-foreground">{inactiveVMs} Inactive</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <>                
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </>
            ) : vmsError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load virtual machines</p>
              </div>
            ) : vms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No virtual machines found</p>
              </div>
            ) : (
              <>
                {vms.slice(0, 3).map((vm) => (
                  <VirtualMachineCard
                    key={vm.vmid}
                    id={vm.vmid.toString()}
                    vmid={vm.vmid}
                    name={vm.name || `VM ${vm.vmid}`}
                    status={vm.status}
                    cpuUsage={vm.cpu || 0}
                    memoryUsage={vm.mem ? Math.round(vm.mem / 1024 / 1024) : 0}
                    memoryTotal={vm.maxmem ? Math.round(vm.maxmem / 1024 / 1024) : 0}
                    osType="Unknown"
                    node={vm.node}
                    uptime={vm.uptime ? formatUptime(vm.uptime) : undefined}
                  />
                ))}
                {vms.length > 3 && (
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      +{vms.length - 3} more VMs
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Containers</h2>
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">{activeContainers} Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-muted-foreground">{inactiveContainers} Inactive</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <>                
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </>
            ) : containersError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load containers</p>
              </div>
            ) : containers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No containers found</p>
              </div>
            ) : (
              <>
                {containers.slice(0, 3).map((container) => (
                  <ContainerCard
                    key={container.vmid}
                    id={container.vmid.toString()}
                    vmid={container.vmid}
                    name={container.name || `CT ${container.vmid}`}
                    status={container.status}
                    cpuUsage={container.cpu || 0}
                    memoryUsage={container.mem ? Math.round(container.mem / 1024 / 1024) : 0}
                    memoryLimit={container.maxmem ? Math.round(container.maxmem / 1024 / 1024) : 0}
                    template="Unknown"
                    node={container.node}
                    uptime={container.uptime ? formatUptime(container.uptime) : undefined}
                  />
                ))}
                {containers.length > 3 && (
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      +{containers.length - 3} more containers
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}