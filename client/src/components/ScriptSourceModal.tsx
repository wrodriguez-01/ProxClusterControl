import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Globe, Trash, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ScriptSource {
  id: string;
  name: string;
  url: string;
  type: "github-api" | "raw-json" | "custom-api";
  enabled: boolean;
  lastSync?: string;
  status: "syncing" | "success" | "error" | "never";
  errorMessage?: string;
  scriptCount?: number;
  description?: string;
}

interface ScriptSourceModalProps {
  sources: ScriptSource[];
  onSourcesChange: (sources: ScriptSource[]) => void;
  onSync: (sourceId?: string) => Promise<void>;
  children: React.ReactNode;
}

export default function ScriptSourceModal({ sources, onSourcesChange, onSync, children }: ScriptSourceModalProps) {
  const [open, setOpen] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    type: "raw-json" as const,
    description: ""
  });
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const defaultSources: Omit<ScriptSource, 'id'>[] = [
    {
      name: "ProxmoxVE Community Scripts",
      url: "https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/scripts.json",
      type: "raw-json",
      enabled: true,
      status: "never",
      description: "Official community-maintained Proxmox scripts repository"
    },
    {
      name: "Tteck Scripts (Legacy)",
      url: "https://raw.githubusercontent.com/tteck/Proxmox/main/scripts.json",
      type: "raw-json", 
      enabled: false,
      status: "never",
      description: "Legacy scripts from the original tteck repository"
    }
  ];

  useEffect(() => {
    if (sources.length === 0) {
      const initialSources = defaultSources.map(source => ({
        ...source,
        id: Math.random().toString(36).substr(2, 9)
      }));
      onSourcesChange(initialSources);
    }
  }, [sources.length, onSourcesChange]);

  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) return;

    const source: ScriptSource = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSource.name,
      url: newSource.url,
      type: newSource.type,
      enabled: true,
      status: "never",
      description: newSource.description
    };

    onSourcesChange([...sources, source]);
    setNewSource({ name: "", url: "", type: "raw-json", description: "" });
  };

  const handleRemoveSource = (id: string) => {
    onSourcesChange(sources.filter(s => s.id !== id));
  };

  const handleToggleSource = (id: string, enabled: boolean) => {
    onSourcesChange(sources.map(s => s.id === id ? { ...s, enabled } : s));
  };

  const handleSyncSource = async (sourceId: string) => {
    setIsSyncing(sourceId);
    try {
      await onSync(sourceId);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing("all");
    try {
      await onSync();
    } finally {
      setIsSyncing(null);
    }
  };

  const getStatusIcon = (status: ScriptSource['status']) => {
    switch (status) {
      case 'syncing': return <Clock className="h-3 w-3 text-blue-600 animate-spin" />;
      case 'success': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'never': return <Globe className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ScriptSource['status']) => {
    switch (status) {
      case 'syncing': return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case 'success': return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case 'error': return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case 'never': return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="script-sources-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Script Sources Management
          </DialogTitle>
          <DialogDescription>
            Manage external script repositories and sync settings to keep your scripts up to date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sync All Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {sources.filter(s => s.enabled).length} active sources • {sources.reduce((acc, s) => acc + (s.scriptCount || 0), 0)} total scripts
            </div>
            <Button 
              onClick={handleSyncAll}
              disabled={isSyncing === "all"}
              data-testid="button-sync-all"
            >
              {isSyncing === "all" ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Sync All Sources
                </>
              )}
            </Button>
          </div>

          {/* Existing Sources */}
          <div className="space-y-4">
            <h3 className="font-semibold">Configured Sources</h3>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="border rounded-lg p-4" data-testid={`source-${source.name.replace(/\s+/g, '-')}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={(enabled) => handleToggleSource(source.id, enabled)}
                            data-testid={`switch-source-${source.id}`}
                          />
                          <h4 className="font-medium">{source.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          <Badge variant="secondary" className={getStatusColor(source.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(source.status)}
                              {source.status}
                            </div>
                          </Badge>
                          {source.scriptCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {source.scriptCount} scripts
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {source.description}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                          {source.url}
                        </div>
                        {source.lastSync && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last sync: {new Date(source.lastSync).toLocaleString()}
                          </div>
                        )}
                        {source.errorMessage && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Error: {source.errorMessage}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncSource(source.id)}
                          disabled={isSyncing === source.id}
                          data-testid={`button-sync-${source.id}`}
                        >
                          {isSyncing === source.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSource(source.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-remove-${source.id}`}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Add New Source */}
          <div className="space-y-4">
            <h3 className="font-semibold">Add New Script Source</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source-name">Source Name</Label>
                <Input
                  id="source-name"
                  placeholder="My Custom Scripts"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  data-testid="input-source-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source-type">Source Type</Label>
                <select
                  id="source-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value as any })}
                  data-testid="select-source-type"
                >
                  <option value="raw-json">Raw JSON</option>
                  <option value="github-api">GitHub API</option>
                  <option value="custom-api">Custom API</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-url">Source URL</Label>
              <Input
                id="source-url"
                placeholder="https://raw.githubusercontent.com/user/repo/main/scripts.json"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                data-testid="input-source-url"
              />
              <div className="text-xs text-muted-foreground">
                URL should point to a JSON file containing script definitions
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-description">Description (Optional)</Label>
              <Input
                id="source-description"
                placeholder="Description of this script source"
                value={newSource.description}
                onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                data-testid="input-source-description"
              />
            </div>

            <Button 
              onClick={handleAddSource}
              disabled={!newSource.name || !newSource.url}
              data-testid="button-add-source"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add Script Source
            </Button>
          </div>

          {/* Source Format Info */}
          <div className="bg-muted/30 p-4 rounded">
            <h4 className="font-medium mb-2">Expected JSON Format</h4>
            <pre className="text-xs overflow-x-auto">
{`[
  {
    "name": "Script Name",
    "slug": "script-slug", 
    "description": "Script description",
    "category": "Category Name",
    "type": "LXC|VM|ADDON|HOST",
    "port": 8080,
    "updateable": true,
    "privileged": false,
    "website": "https://example.com",
    "command": "bash -c \\"$(curl -fsSL https://script-url)\\"",
    "dateAdded": "2024-01-01"
  }
]`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}