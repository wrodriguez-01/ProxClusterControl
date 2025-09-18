import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Server, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  EyeOff 
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ProxmoxServer {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  password: string;
  realm: string;
  useSSL: boolean;
  ignoreCert: boolean;
  isDefault: boolean;
  status: "connected" | "disconnected" | "testing" | "error";
  lastConnected?: string;
  version?: string;
  errorMessage?: string;
}

interface ServerConnectionModalProps {
  servers: ProxmoxServer[];
  onServersChange: (servers: ProxmoxServer[]) => void;
  onTestConnection: (server: ProxmoxServer) => Promise<boolean>;
  children: React.ReactNode;
}

export default function ServerConnectionModal({ 
  servers, 
  onServersChange, 
  onTestConnection, 
  children 
}: ServerConnectionModalProps) {
  const [open, setOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ProxmoxServer | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    hostname: "",
    port: 8006,
    username: "root",
    password: "",
    realm: "pam",
    useSSL: true,
    ignoreCert: false
  });

  const resetForm = () => {
    setFormData({
      name: "",
      hostname: "",
      port: 8006,
      username: "root",
      password: "",
      realm: "pam",
      useSSL: true,
      ignoreCert: false
    });
    setEditingServer(null);
    setShowPassword(false);
  };

  const handleEdit = (server: ProxmoxServer) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      hostname: server.hostname,
      port: server.port,
      username: server.username,
      password: server.password,
      realm: server.realm,
      useSSL: server.useSSL,
      ignoreCert: server.ignoreCert
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.hostname || !formData.username || !formData.password) {
      return;
    }

    const newServer: ProxmoxServer = {
      id: editingServer?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      hostname: formData.hostname,
      port: formData.port,
      username: formData.username,
      password: formData.password,
      realm: formData.realm,
      useSSL: formData.useSSL,
      ignoreCert: formData.ignoreCert,
      isDefault: editingServer?.isDefault || servers.length === 0,
      status: "disconnected"
    };

    const updatedServers = editingServer
      ? servers.map(s => s.id === editingServer.id ? newServer : s)
      : [...servers, newServer];

    onServersChange(updatedServers);
    resetForm();
  };

  const handleRemove = (serverId: string) => {
    if (confirm('Are you sure you want to remove this server connection?')) {
      onServersChange(servers.filter(s => s.id !== serverId));
    }
  };

  const handleSetDefault = (serverId: string) => {
    const updatedServers = servers.map(s => ({
      ...s,
      isDefault: s.id === serverId
    }));
    onServersChange(updatedServers);
  };

  const handleTestConnection = async (server: ProxmoxServer) => {
    setTestingServerId(server.id);
    
    // Update server status to testing
    const updatedServers = servers.map(s => 
      s.id === server.id ? { ...s, status: "testing" as const } : s
    );
    onServersChange(updatedServers);

    try {
      const success = await onTestConnection(server);
      
      const finalServers = servers.map(s => 
        s.id === server.id 
          ? { 
              ...s, 
              status: success ? "connected" as const : "error" as const,
              lastConnected: success ? new Date().toISOString() : s.lastConnected,
              errorMessage: success ? undefined : "Connection failed"
            } 
          : s
      );
      onServersChange(finalServers);
    } catch (error) {
      const errorServers = servers.map(s => 
        s.id === server.id 
          ? { 
              ...s, 
              status: "error" as const,
              errorMessage: error instanceof Error ? error.message : "Unknown error"
            } 
          : s
      );
      onServersChange(errorServers);
    } finally {
      setTestingServerId(null);
    }
  };

  const getStatusIcon = (status: ProxmoxServer['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case 'testing': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ProxmoxServer['status']) => {
    switch (status) {
      case 'connected': return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case 'disconnected': return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case 'testing': return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case 'error': return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="server-connection-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Proxmox Server Connections
          </DialogTitle>
          <DialogDescription>
            Manage connections to your Proxmox VE servers. At least one connection is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Servers */}
          <div className="space-y-4">
            <h3 className="font-semibold">Connected Servers ({servers.length})</h3>
            
            {servers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No servers configured yet</p>
                <p className="text-sm">Add your first Proxmox server to get started</p>
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {servers.map((server) => (
                    <div key={server.id} className="border rounded-lg p-4" data-testid={`server-${server.name.replace(/\s+/g, '-')}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{server.name}</h4>
                            {server.isDefault && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                Default
                              </Badge>
                            )}
                            <Badge variant="secondary" className={getStatusColor(server.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(server.status)}
                                {server.status}
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              {server.useSSL ? 'https' : 'http'}://{server.hostname}:{server.port}
                            </div>
                            <div>User: {server.username}@{server.realm}</div>
                            {server.lastConnected && (
                              <div>Last connected: {new Date(server.lastConnected).toLocaleString()}</div>
                            )}
                            {server.version && (
                              <div>Version: {server.version}</div>
                            )}
                            {server.errorMessage && (
                              <div className="text-red-600 dark:text-red-400">
                                Error: {server.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(server)}
                            disabled={testingServerId === server.id}
                            data-testid={`button-test-${server.id}`}
                          >
                            {testingServerId === server.id ? (
                              <Clock className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                          
                          {!server.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(server.id)}
                              data-testid={`button-default-${server.id}`}
                            >
                              Set Default
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(server)}
                            data-testid={`button-edit-${server.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(server.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-${server.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <Separator />

          {/* Add/Edit Server Form */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              {editingServer ? 'Edit Server' : 'Add New Server'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  placeholder="My Proxmox Server"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-server-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hostname">Hostname/IP Address</Label>
                <Input
                  id="hostname"
                  placeholder="192.168.1.100 or proxmox.local"
                  value={formData.hostname}
                  onChange={(e) => setFormData(prev => ({ ...prev, hostname: e.target.value }))}
                  data-testid="input-hostname"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 8006 }))}
                  data-testid="input-port"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  data-testid="input-username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="realm">Realm</Label>
                <select
                  id="realm"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.realm}
                  onChange={(e) => setFormData(prev => ({ ...prev, realm: e.target.value }))}
                  data-testid="select-realm"
                >
                  <option value="pam">PAM</option>
                  <option value="pve">PVE</option>
                  <option value="ad">Active Directory</option>
                  <option value="ldap">LDAP</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-ssl"
                  checked={formData.useSSL}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useSSL: checked }))}
                  data-testid="switch-ssl"
                />
                <Label htmlFor="use-ssl" className="text-sm">Use HTTPS</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ignore-cert"
                  checked={formData.ignoreCert}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ignoreCert: checked }))}
                  data-testid="switch-ignore-cert"
                />
                <Label htmlFor="ignore-cert" className="text-sm">Ignore SSL Certificate</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.hostname || !formData.username || !formData.password}
                data-testid="button-save-server"
              >
                <Plus className="h-3 w-3 mr-2" />
                {editingServer ? 'Update Server' : 'Add Server'}
              </Button>
              
              {editingServer && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Connection Info */}
          <div className="bg-muted/30 p-4 rounded-md">
            <h4 className="font-medium mb-2">Connection Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ensure Proxmox VE API is accessible from this system</li>
              <li>• Default port is 8006 (HTTPS) or 8005 (HTTP)</li>
              <li>• User must have appropriate permissions for the operations you need</li>
              <li>• For self-signed certificates, enable "Ignore SSL Certificate"</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}