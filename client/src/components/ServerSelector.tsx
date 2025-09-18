import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Settings, CheckCircle, AlertCircle, X } from "lucide-react";
import { ProxmoxServer } from "./ServerConnectionModal";

interface ServerSelectorProps {
  servers: ProxmoxServer[];
  currentServerId?: string;
  onServerChange: (serverId: string) => void;
  onManageServers: () => void;
}

export default function ServerSelector({ 
  servers, 
  currentServerId, 
  onServerChange, 
  onManageServers 
}: ServerSelectorProps) {
  const currentServer = servers.find(s => s.id === currentServerId) || servers.find(s => s.isDefault);
  
  const getStatusIcon = (status: ProxmoxServer['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'disconnected': return <AlertCircle className="h-3 w-3 text-gray-400" />;
      case 'testing': return <AlertCircle className="h-3 w-3 text-blue-600" />;
      case 'error': return <X className="h-3 w-3 text-red-600" />;
    }
  };

  if (servers.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-md">
        <Server className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No servers configured</span>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onManageServers}
          data-testid="button-setup-servers"
        >
          <Settings className="h-3 w-3 mr-1" />
          Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid="server-selector">
      <Server className="h-4 w-4 text-muted-foreground" />
      
      <Select
        value={currentServer?.id || ""}
        onValueChange={onServerChange}
      >
        <SelectTrigger className="w-64" data-testid="server-select-trigger">
          <div className="flex items-center gap-2">
            {currentServer && getStatusIcon(currentServer.status)}
            <SelectValue placeholder="Select Proxmox server" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {servers.map((server) => (
            <SelectItem key={server.id} value={server.id} data-testid={`server-option-${server.id}`}>
              <div className="flex items-center gap-2 w-full">
                {getStatusIcon(server.status)}
                <div className="flex-1">
                  <div className="font-medium">{server.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {server.hostname}:{server.port}
                  </div>
                </div>
                {server.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentServer && (
        <div className="flex items-center gap-1">
          <Badge 
            variant="secondary" 
            className={
              currentServer.status === 'connected' 
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : currentServer.status === 'error'
                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
            }
          >
            {currentServer.status}
          </Badge>
        </div>
      )}

      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onManageServers}
        data-testid="button-manage-servers"
      >
        <Settings className="h-3 w-3" />
      </Button>
    </div>
  );
}