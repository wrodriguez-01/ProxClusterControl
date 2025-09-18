import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, RefreshCw, Settings, ArrowRight, Monitor, Box, Play, Pause } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VM {
  id: string;
  name: string;
  type: "vm" | "container";
  status: "running" | "stopped" | "paused";
  memory: number;
  cpu: number;
}

interface NodeActionsModalProps {
  nodeName: string;
  nodeStatus: "online" | "offline" | "maintenance";
  vms: VM[];
  children: React.ReactNode;
}

export default function NodeActionsModal({ nodeName, nodeStatus, vms, children }: NodeActionsModalProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedVMs, setSelectedVMs] = useState<string[]>([]);
  const [targetNode, setTargetNode] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  //todo: remove mock functionality
  const availableTargetNodes = ["pve-node-01", "pve-node-02", "pve-node-03"].filter(node => node !== nodeName);

  const handleAction = async (action: string) => {
    setIsExecuting(true);
    console.log(`Executing ${action} on ${nodeName}`, { selectedVMs, targetNode }); //todo: remove mock functionality
    
    // Simulate API call
    setTimeout(() => {
      setIsExecuting(false);
      setSelectedAction(null);
      setSelectedVMs([]);
    }, 3000);
  };

  const toggleVMSelection = (vmId: string) => {
    setSelectedVMs(prev => 
      prev.includes(vmId) ? prev.filter(id => id !== vmId) : [...prev, vmId]
    );
  };

  const getVMIcon = (type: "vm" | "container") => {
    return type === "vm" ? <Monitor className="h-3 w-3" /> : <Box className="h-3 w-3" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "text-green-600 dark:text-green-400";
      case "stopped": return "text-gray-600 dark:text-gray-400";
      case "paused": return "text-yellow-600 dark:text-yellow-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const nodeActions = [
    {
      id: "update",
      title: "Update Node",
      description: "Update Proxmox VE and system packages",
      icon: <RefreshCw className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      requiresVMs: false,
      dangerous: false
    },
    {
      id: "maintenance",
      title: nodeStatus === "maintenance" ? "Exit Maintenance" : "Enter Maintenance",
      description: nodeStatus === "maintenance" ? "Resume normal operations" : "Put node in maintenance mode",
      icon: <Settings className="h-4 w-4" />,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      requiresVMs: false,
      dangerous: false
    },
    {
      id: "migrate-all",
      title: "Migrate All VMs",
      description: "Move all running VMs to other nodes",
      icon: <ArrowRight className="h-4 w-4" />,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      requiresVMs: true,
      dangerous: false
    },
    {
      id: "migrate-selected",
      title: "Migrate Selected VMs",
      description: "Move selected VMs to another node",
      icon: <ArrowRight className="h-4 w-4" />,
      color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
      requiresVMs: true,
      dangerous: false
    },
    {
      id: "shutdown-vms",
      title: "Shutdown All VMs",
      description: "Gracefully shutdown all running VMs",
      icon: <Pause className="h-4 w-4" />,
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      requiresVMs: false,
      dangerous: true
    }
  ];

  const runningVMs = vms.filter(vm => vm.status === "running");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid={`node-actions-modal-${nodeName}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Node Actions - {nodeName}
          </DialogTitle>
          <DialogDescription>
            Perform administrative tasks and manage resources on this node
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions Panel */}
          <div className="space-y-4">
            <h3 className="font-semibold">Available Actions</h3>
            <div className="space-y-2">
              {nodeActions.map((action) => (
                <div
                  key={action.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                    selectedAction === action.id ? "ring-2 ring-primary" : "hover-elevate",
                    action.dangerous && "border-red-200 dark:border-red-800"
                  )}
                  onClick={() => setSelectedAction(action.id)}
                  data-testid={`action-${action.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{action.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{action.title}</span>
                        <Badge variant="secondary" className={action.color}>
                          {action.id}
                        </Badge>
                        {action.dangerous && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                      {action.requiresVMs && runningVMs.length === 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          No running VMs to migrate
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Details Panel */}
          <div className="space-y-4">
            {selectedAction ? (
              <div>
                <h3 className="font-semibold mb-3">
                  {nodeActions.find(a => a.id === selectedAction)?.title}
                </h3>
                
                {(selectedAction === "migrate-all" || selectedAction === "migrate-selected") && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Node</label>
                      <div className="space-y-2">
                        {availableTargetNodes.map((node) => (
                          <div key={node} className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`target-${node}`}
                              name="targetNode"
                              value={node}
                              checked={targetNode === node}
                              onChange={(e) => setTargetNode(e.target.value)}
                              className="rounded"
                            />
                            <label htmlFor={`target-${node}`} className="text-sm cursor-pointer">
                              {node}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedAction === "migrate-selected" && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Select VMs to Migrate ({selectedVMs.length} selected)
                        </label>
                        <ScrollArea className="h-48 border rounded p-2">
                          <div className="space-y-2">
                            {runningVMs.map((vm) => (
                              <div
                                key={vm.id}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded cursor-pointer hover-elevate",
                                  selectedVMs.includes(vm.id) && "bg-primary/10 border border-primary/20"
                                )}
                                onClick={() => toggleVMSelection(vm.id)}
                                data-testid={`vm-select-${vm.id}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedVMs.includes(vm.id)}
                                  onChange={() => toggleVMSelection(vm.id)}
                                  className="rounded"
                                />
                                <div className="flex items-center gap-2">
                                  {getVMIcon(vm.type)}
                                  <span className="font-medium">{vm.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {vm.type.toUpperCase()} {vm.id}
                                  </Badge>
                                  <span className={cn("text-sm", getStatusColor(vm.status))}>
                                    {vm.status}
                                  </span>
                                </div>
                                <div className="ml-auto text-xs text-muted-foreground">
                                  {(vm.memory / 1024).toFixed(1)}GB RAM
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {selectedAction === "migrate-all" && (
                      <div className="bg-muted/30 p-3 rounded">
                        <p className="text-sm">
                          This will migrate all {runningVMs.length} running VMs from {nodeName} to {targetNode || "the selected target node"}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedAction === "update" && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        This will update Proxmox VE and all system packages. The node may need to be rebooted.
                      </p>
                    </div>
                  </div>
                )}

                {selectedAction === "maintenance" && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {nodeStatus === "maintenance" 
                        ? "This will resume normal operations on the node."
                        : "This will prevent new VMs from being scheduled on this node and mark it for maintenance."
                      }
                    </p>
                  </div>
                )}

                {selectedAction === "shutdown-vms" && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-medium text-red-800 dark:text-red-200">Warning</span>
                    </div>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      This will shutdown all {runningVMs.length} running VMs. Make sure all important work is saved.
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAction(null)}
                    data-testid="button-cancel-action"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleAction(selectedAction)}
                    disabled={
                      isExecuting ||
                      (selectedAction?.includes("migrate") && !targetNode) ||
                      (selectedAction === "migrate-selected" && selectedVMs.length === 0)
                    }
                    className={cn(
                      nodeActions.find(a => a.id === selectedAction)?.dangerous && "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                    )}
                    data-testid="button-execute-action"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      `Execute ${nodeActions.find(a => a.id === selectedAction)?.title}`
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select an action to view details and configuration options</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}