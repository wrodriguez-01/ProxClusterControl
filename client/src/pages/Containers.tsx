import ContainerCard from "@/components/ContainerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ProxmoxContainer } from "@shared/schema";

export default function Containers() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Fetch Containers from Proxmox API
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/proxmox/containers"],
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load Containers",
          description: "Could not fetch containers from Proxmox server. Please check your connection.",
        });
      }
    }
  });
  
  const containers: ProxmoxContainer[] = apiResponse?.success ? apiResponse.data : [];

  const filteredContainers = containers.filter(container =>
    (container.name || `CT ${container.vmid}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
    container.node.toLowerCase().includes(searchQuery.toLowerCase()) ||
    container.vmid.toString().includes(searchQuery)
  );

  const handleCreateContainer = () => {
    toast({
      title: "Create Container",
      description: "Container creation functionality will be implemented in a future update.",
    });
  };
  
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Containers</h1>
          <p className="text-muted-foreground">
            Manage and monitor your LXC containers
          </p>
        </div>
        <Button onClick={handleCreateContainer} data-testid="button-create-container">
          <Plus className="h-4 w-4 mr-2" />
          Create Container
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search containers by name, template, or node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-containers"
          />
        </div>
      </div>

      {/* Container Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              containers.filter(ct => ct.status === "running").length
            )}
          </div>
          <div className="text-sm text-muted-foreground">Running</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              containers.filter(ct => ct.status === "stopped").length
            )}
          </div>
          <div className="text-sm text-muted-foreground">Stopped</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              containers.length
            )}
          </div>
          <div className="text-sm text-muted-foreground">Total Containers</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              containers.length > 0
                ? Math.round(containers.filter(ct => ct.status === "running").reduce((acc, ct) => acc + (ct.cpu || 0), 0) / Math.max(containers.filter(ct => ct.status === "running").length, 1) * 10) / 10
                : 0
            )}%
          </div>
          <div className="text-sm text-muted-foreground">Avg CPU</div>
        </div>
      </div>

      {/* Container List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">
              Failed to load containers. Please check your Proxmox server connection.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : filteredContainers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {containers.length === 0 
                ? "No containers found on this Proxmox server."
                : "No containers found matching your search."
              }
            </p>
          </div>
        ) : (
          filteredContainers.map((container) => (
            <ContainerCard 
              key={container.vmid} 
              id={container.vmid.toString()}
              name={container.name || `CT ${container.vmid}`}
              status={container.status}
              cpuUsage={container.cpu || 0}
              memoryUsage={container.mem ? Math.round(container.mem / 1024 / 1024) : 0}
              memoryLimit={container.maxmem ? Math.round(container.maxmem / 1024 / 1024) : 0}
              template="Unknown"
              node={container.node}
              uptime={container.uptime ? formatUptime(container.uptime) : undefined}
              vmid={container.vmid}
            />
          ))
        )}
      </div>
    </div>
  );
}