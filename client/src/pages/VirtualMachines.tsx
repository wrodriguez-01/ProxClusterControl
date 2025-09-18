import VirtualMachineCard from "@/components/VirtualMachineCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ProxmoxVM } from "@shared/schema";

export default function VirtualMachines() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Fetch VMs from Proxmox API
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/proxmox/vms"],
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load VMs",
          description: "Could not fetch virtual machines from Proxmox server. Please check your connection.",
        });
      }
    }
  });
  
  const vms: ProxmoxVM[] = apiResponse?.success ? apiResponse.data : [];

  const filteredVMs = vms.filter(vm =>
    (vm.name || `VM ${vm.vmid}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
    vm.node.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vm.vmid.toString().includes(searchQuery)
  );

  const handleCreateVM = () => {
    toast({
      title: "Create VM",
      description: "VM creation functionality will be implemented in a future update.",
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
          <h1 className="text-3xl font-bold" data-testid="page-title">Virtual Machines</h1>
          <p className="text-muted-foreground">
            Manage and monitor your virtual machines
          </p>
        </div>
        <Button onClick={handleCreateVM} data-testid="button-create-vm">
          <Plus className="h-4 w-4 mr-2" />
          Create VM
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search VMs by name, OS, or node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-vms"
          />
        </div>
      </div>

      {/* VM Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              vms.filter(vm => vm.status === "running").length
            )}
          </div>
          <div className="text-sm text-muted-foreground">Running</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              vms.filter(vm => vm.status === "stopped").length
            )}
          </div>
          <div className="text-sm text-muted-foreground">Stopped</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              vms.length
            )}
          </div>
          <div className="text-sm text-muted-foreground">Total VMs</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              vms.length > 0
                ? Math.round(vms.reduce((acc, vm) => acc + (vm.cpu || 0), 0) / vms.length * 10) / 10
                : 0
            )}%
          </div>
          <div className="text-sm text-muted-foreground">Avg CPU</div>
        </div>
      </div>

      {/* VM List */}
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
              Failed to load virtual machines. Please check your Proxmox server connection.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : filteredVMs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {vms.length === 0 
                ? "No virtual machines found on this Proxmox server."
                : "No virtual machines found matching your search."
              }
            </p>
          </div>
        ) : (
          filteredVMs.map((vm) => (
            <VirtualMachineCard 
              key={vm.vmid} 
              id={vm.vmid.toString()}
              name={vm.name || `VM ${vm.vmid}`}
              status={vm.status}
              cpuUsage={vm.cpu || 0}
              memoryUsage={vm.mem ? Math.round(vm.mem / 1024 / 1024) : 0}
              memoryTotal={vm.maxmem ? Math.round(vm.maxmem / 1024 / 1024) : 0}
              osType="Unknown"
              node={vm.node}
              uptime={vm.uptime ? formatUptime(vm.uptime) : undefined}
              vmid={vm.vmid}
            />
          ))
        )}
      </div>
    </div>
  );
}