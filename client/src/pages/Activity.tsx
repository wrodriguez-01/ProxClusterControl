import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function ActivityPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  //todo: remove mock functionality
  const mockTasks = [
    {
      id: "UPID:pve-node-01:000034A2:01F5E832:654321:vzcreate:101:root@pam:",
      type: "vzcreate",
      description: "Create VM 101 (web-server-03)",
      node: "pve-node-01",
      user: "root@pam",
      status: "running",
      startTime: "2024-01-15 14:32:18",
      duration: "00:02:45",
      progress: 65
    },
    {
      id: "UPID:pve-node-02:000034A1:01F5E831:654320:backup:100:root@pam:",
      type: "backup",
      description: "Backup VM 100 (web-server-01)",
      node: "pve-node-02",
      user: "root@pam", 
      status: "success",
      startTime: "2024-01-15 14:15:22",
      duration: "00:15:33",
      progress: 100
    },
    {
      id: "UPID:pve-node-01:000034A0:01F5E830:654319:qmstop:102:root@pam:",
      type: "qmstop",
      description: "Stop VM 102 (dev-environment)",
      node: "pve-node-01",
      user: "root@pam",
      status: "success",
      startTime: "2024-01-15 14:10:15",
      duration: "00:00:08",
      progress: 100
    },
    {
      id: "UPID:pve-node-02:00003499:01F5E82F:654318:vzrestore:201:admin@pam:",
      type: "vzrestore",
      description: "Restore Container 201 (nginx-proxy)",
      node: "pve-node-02",
      user: "admin@pam",
      status: "error",
      startTime: "2024-01-15 13:45:12",
      duration: "00:05:22",
      progress: 0,
      error: "Failed to restore: storage not available"
    },
    {
      id: "UPID:pve-node-03:00003498:01F5E82E:654317:migrate:100:root@pam:",
      type: "migrate",
      description: "Migrate VM 100 from pve-node-01 to pve-node-03",
      node: "pve-node-03",
      user: "root@pam",
      status: "success",
      startTime: "2024-01-15 13:20:45",
      duration: "00:08:12",
      progress: 100
    }
  ];

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "backup": return <Activity className="h-4 w-4" />;
      case "vzcreate": return <CheckCircle className="h-4 w-4" />;
      case "qmstop": return <XCircle className="h-4 w-4" />;
      case "vzrestore": return <RefreshCw className="h-4 w-4" />;
      case "migrate": return <RefreshCw className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running": return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Running</Badge>;
      case "success": return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Success</Badge>;
      case "error": return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Error</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filteredTasks = selectedStatus === "all" ? mockTasks : mockTasks.filter(task => task.status === selectedStatus);

  const taskCounts = {
    all: mockTasks.length,
    running: mockTasks.filter(t => t.status === "running").length,
    success: mockTasks.filter(t => t.status === "success").length,
    error: mockTasks.filter(t => t.status === "error").length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Activity & Tasks</h1>
        <p className="text-muted-foreground">
          Monitor running tasks and view recent activity across your cluster
        </p>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={selectedStatus === "all" ? "ring-2 ring-primary" : "hover-elevate cursor-pointer"} 
              onClick={() => setSelectedStatus("all")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{taskCounts.all}</div>
            <div className="text-sm text-muted-foreground">All Tasks</div>
          </CardContent>
        </Card>
        <Card className={selectedStatus === "running" ? "ring-2 ring-blue-500" : "hover-elevate cursor-pointer"} 
              onClick={() => setSelectedStatus("running")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{taskCounts.running}</div>
            <div className="text-sm text-muted-foreground">Running</div>
          </CardContent>
        </Card>
        <Card className={selectedStatus === "success" ? "ring-2 ring-green-500" : "hover-elevate cursor-pointer"} 
              onClick={() => setSelectedStatus("success")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{taskCounts.success}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className={selectedStatus === "error" ? "ring-2 ring-red-500" : "hover-elevate cursor-pointer"} 
              onClick={() => setSelectedStatus("error")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{taskCounts.error}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks found for the selected filter.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="border border-card-border rounded-lg p-4 hover-elevate" data-testid={`task-${task.type}-${task.node}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getTaskIcon(task.type)}
                      <div>
                        <h3 className="font-medium" data-testid={`task-description-${task.type}`}>{task.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {task.node} • {task.user} • {task.startTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                      <span className="text-sm text-muted-foreground" data-testid={`task-duration-${task.type}`}>
                        {task.duration}
                      </span>
                    </div>
                  </div>
                  
                  {task.status === "running" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {task.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-500">
                      <p className="text-sm text-red-800 dark:text-red-400">{task.error}</p>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-muted-foreground font-mono">
                    ID: {task.id}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}