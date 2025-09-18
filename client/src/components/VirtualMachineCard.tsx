import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import { Play, Square, RotateCcw, Settings, Monitor, Power, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VirtualMachineCardProps {
  id: string;
  vmid: number;
  name: string;
  status: "running" | "stopped" | "paused" | "suspended";
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  osType: string;
  node: string;
  uptime?: string;
  className?: string;
}

export default function VirtualMachineCard({
  id,
  vmid,
  name,
  status,
  cpuUsage,
  memoryUsage,
  memoryTotal,
  osType,
  node,
  uptime,
  className
}: VirtualMachineCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // VM Actions Mutation
  const vmActionMutation = useMutation({
    mutationFn: async ({ action }: { action: string }) => {
      const endpoint = `/api/proxmox/vms/${node}/${vmid}/${action}`;
      const response = await apiRequest("POST", endpoint);
      return response.json();
    },
    onSuccess: (data, variables) => {
      const { action } = variables;
      toast({
        title: "Success",
        description: `VM ${name} ${action} command sent successfully`,
      });
      
      // Invalidate VM queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/proxmox/vms"] });
      setIsLoading(null);
    },
    onError: (error, variables) => {
      const { action } = variables;
      console.error(`Failed to ${action} VM:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} VM ${name}. ${error.message || 'Please try again.'}`,
      });
      setIsLoading(null);
    }
  });

  const handleAction = async (action: string) => {
    // Confirm destructive actions
    if (action === "delete") {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete VM "${name}" (${id})?\n\nThis action cannot be undone and will destroy all data on this virtual machine.`
      );
      if (!confirmed) return;
    }

    // Handle actions that aren't implemented yet
    if (action === "configure" || action === "delete") {
      toast({
        title: `${action === 'configure' ? 'Configure' : 'Delete'} VM`,
        description: `VM ${action === 'configure' ? 'configuration' : 'deletion'} functionality will be implemented in a future update.`,
      });
      return;
    }

    setIsLoading(action);
    
    try {
      // Frontend actions map directly to backend API endpoints
      // shutdown = graceful shutdown, stop = force stop, restart = reboot
      vmActionMutation.mutate({ action });
    } catch (error) {
      console.error(`Error handling ${action}:`, error);
      setIsLoading(null);
    }
  };

  const memoryUsagePercent = memoryTotal > 0 ? (memoryUsage / memoryTotal) * 100 : 0;

  return (
    <Card className={cn("hover-elevate", className)} data-testid={`vm-card-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium" data-testid={`vm-name-${id}`}>{name}</span>
            </div>
            <StatusBadge status={status} />
          </div>
          <span className="text-sm text-muted-foreground font-mono" data-testid={`vm-id-${id}`}>
            VM {id}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">OS:</span>
            <span className="ml-2 font-medium" data-testid={`vm-os-${id}`}>{osType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Node:</span>
            <span className="ml-2 font-medium" data-testid={`vm-node-${id}`}>{node}</span>
          </div>
        </div>

        {status === "running" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CPU Usage</span>
              <span className="font-medium" data-testid={`vm-cpu-${id}`}>{cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Memory Usage</span>
              <span className="font-medium" data-testid={`vm-memory-${id}`}>
                {memoryUsage.toFixed(1)}MB / {memoryTotal.toFixed(1)}MB ({memoryUsagePercent.toFixed(1)}%)
              </span>
            </div>
            {uptime && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium" data-testid={`vm-uptime-${id}`}>{uptime}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-card-border">
          <div className="flex gap-2 flex-wrap">
            {status === "stopped" ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleAction("start")}
                disabled={isLoading !== null}
                data-testid={`button-start-${id}`}
              >
                <Play className="h-3 w-3 mr-1" />
                {isLoading === "start" ? "Starting..." : "Start"}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("shutdown")}
                  disabled={isLoading !== null}
                  data-testid={`button-shutdown-${id}`}
                >
                  <Power className="h-3 w-3 mr-1" />
                  {isLoading === "shutdown" ? "Shutting down..." : "Shutdown"}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("stop")}
                  disabled={isLoading !== null}
                  data-testid={`button-stop-${id}`}
                >
                  <Square className="h-3 w-3 mr-1" />
                  {isLoading === "stop" ? "Stopping..." : "Force Stop"}
                </Button>
              </>
            )}
            
            {status === "running" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("restart")}
                disabled={isLoading !== null}
                data-testid={`button-restart-${id}`}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {isLoading === "restart" ? "Restarting..." : "Restart"}
              </Button>
            )}
          </div>
          
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("configure")}
              disabled={isLoading !== null}
              data-testid={`button-configure-${id}`}
            >
              <Settings className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction("delete")}
              disabled={isLoading !== null}
              className="text-red-600 hover:text-red-700"
              data-testid={`button-delete-${id}`}
            >
              <Trash2 className="h-3 w-3" />
              {isLoading === "delete" && <span className="ml-1">Deleting...</span>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}