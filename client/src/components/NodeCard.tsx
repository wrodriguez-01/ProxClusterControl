import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Server, Cpu, MemoryStick, HardDrive, Network, Thermometer, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import NodeActionsModal from "./NodeActionsModal";

interface NodeCardProps {
  name: string;
  status: "online" | "offline" | "maintenance";
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  storageUsage: number;
  storageTotal: number;
  networkIn: number;
  networkOut: number;
  temperature?: number;
  uptime: string;
  vmCount: number;
  containerCount: number;
  version: string;
  className?: string;
}

export default function NodeCard({
  name,
  status,
  cpuUsage,
  memoryUsage,
  memoryTotal,
  storageUsage,
  storageTotal,
  networkIn,
  networkOut,
  temperature,
  uptime,
  vmCount,
  containerCount,
  version,
  className
}: NodeCardProps) {
  const memoryPercent = (memoryUsage / memoryTotal) * 100;
  const storagePercent = (storageUsage / storageTotal) * 100;

  const statusConfig = {
    online: { label: "Online", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
    offline: { label: "Offline", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
    maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" }
  };

  //todo: remove mock functionality
  const mockVMs = [
    { id: "100", name: "web-server-01", type: "vm" as const, status: "running" as const, memory: 2048, cpu: 23.4 },
    { id: "101", name: "database-server", type: "vm" as const, status: "running" as const, memory: 6144, cpu: 45.7 },
    { id: "200", name: "nginx-proxy", type: "container" as const, status: "running" as const, memory: 512, cpu: 12.3 }
  ].slice(0, vmCount + containerCount);

  return (
    <Card className={cn("hover-elevate", className)} data-testid={`node-card-${name}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg" data-testid={`node-name-${name}`}>{name}</h3>
              <p className="text-sm text-muted-foreground">Proxmox VE {version}</p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={statusConfig[status].color}
            data-testid={`node-status-${name}`}
          >
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Resource Usage */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span>CPU</span>
              </div>
              <span className="font-medium" data-testid={`node-cpu-${name}`}>{cpuUsage.toFixed(1)}%</span>
            </div>
            <Progress value={cpuUsage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" />
                <span>RAM</span>
              </div>
              <span className="font-medium" data-testid={`node-memory-${name}`}>{memoryPercent.toFixed(1)}%</span>
            </div>
            <Progress value={memoryPercent} className="h-2" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>Storage</span>
            </div>
            <span className="font-medium" data-testid={`node-storage-${name}`}>
              {(storageUsage / 1024).toFixed(1)}GB / {(storageTotal / 1024).toFixed(1)}GB
            </span>
          </div>
          <Progress value={storagePercent} className="h-2" />
        </div>

        {/* Network and Temperature */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Network className="h-3 w-3" />
              <span>Network</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>In:</span>
                <span className="font-medium" data-testid={`node-network-in-${name}`}>{networkIn.toFixed(1)} MB/s</span>
              </div>
              <div className="flex justify-between">
                <span>Out:</span>
                <span className="font-medium" data-testid={`node-network-out-${name}`}>{networkOut.toFixed(1)} MB/s</span>
              </div>
            </div>
          </div>

          {temperature && (
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Thermometer className="h-3 w-3" />
                <span>Temperature</span>
              </div>
              <div className="text-lg font-semibold" data-testid={`node-temperature-${name}`}>
                {temperature}°C
              </div>
            </div>
          )}
        </div>

        {/* Resources and Uptime */}
        <div className="pt-2 border-t border-card-border">
          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400" data-testid={`node-vms-${name}`}>
                {vmCount}
              </div>
              <div className="text-xs text-muted-foreground">VMs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400" data-testid={`node-containers-${name}`}>
                {containerCount}
              </div>
              <div className="text-xs text-muted-foreground">Containers</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium" data-testid={`node-uptime-${name}`}>
                {uptime}
              </div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <NodeActionsModal 
              nodeName={name} 
              nodeStatus={status} 
              vms={mockVMs}
            >
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                data-testid={`button-node-actions-${name}`}
              >
                <Settings className="h-3 w-3 mr-2" />
                Node Actions
              </Button>
            </NodeActionsModal>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}