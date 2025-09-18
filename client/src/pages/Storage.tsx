import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardDrive, Database, Folder, Settings, Plus } from "lucide-react";

export default function Storage() {
  //todo: remove mock functionality
  const mockStoragePools = [
    {
      id: "local",
      name: "Local Storage",
      type: "directory",
      node: "pve-node-01",
      path: "/var/lib/vz",
      used: 847,
      total: 1800,
      available: 953,
      status: "available",
      content: ["images", "vztmpl", "backup"]
    },
    {
      id: "shared-nfs",
      name: "Shared NFS",
      type: "nfs",
      node: "all",
      path: "192.168.1.100:/storage/proxmox",
      used: 1200,
      total: 5000,
      available: 3800,
      status: "available",
      content: ["images", "backup"]
    },
    {
      id: "ceph-pool",
      name: "Ceph Storage",
      type: "ceph",
      node: "all",
      path: "ceph-cluster",
      used: 2400,
      total: 10000,
      available: 7600,
      status: "available",
      content: ["images"]
    },
    {
      id: "backup-local",
      name: "Backup Storage",
      type: "directory",
      node: "pve-node-02",
      path: "/backup",
      used: 450,
      total: 2000,
      available: 1550,
      status: "available",
      content: ["backup"]
    },
    {
      id: "iso-storage",
      name: "ISO Library",
      type: "directory",
      node: "pve-node-01",
      path: "/var/lib/vz/template/iso",
      used: 85,
      total: 500,
      available: 415,
      status: "available",
      content: ["iso"]
    }
  ];

  const getStorageIcon = (type: string) => {
    switch (type) {
      case "ceph": return <Database className="h-4 w-4" />;
      case "nfs": return <Folder className="h-4 w-4" />;
      default: return <HardDrive className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "unavailable": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const handleCreateStorage = () => {
    console.log("Create storage clicked"); //todo: remove mock functionality
  };

  const handleConfigureStorage = (storageId: string) => {
    console.log(`Configure storage ${storageId}`); //todo: remove mock functionality
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Storage</h1>
          <p className="text-muted-foreground">
            Manage storage pools and monitor disk usage across your cluster
          </p>
        </div>
        <Button onClick={handleCreateStorage} data-testid="button-create-storage">
          <Plus className="h-4 w-4 mr-2" />
          Add Storage
        </Button>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">19.3 TB</div>
            <p className="text-xs text-muted-foreground mt-1">Across all storage pools</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">4.98 TB</div>
            <p className="text-xs text-muted-foreground mt-1">Used space</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">14.32 TB</div>
            <p className="text-xs text-muted-foreground mt-1">Available space</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Pools */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Storage Pools</h2>
        <div className="grid gap-4">
          {mockStoragePools.map((storage) => {
            const usagePercent = (storage.used / storage.total) * 100;
            
            return (
              <Card key={storage.id} className="hover-elevate" data-testid={`storage-card-${storage.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStorageIcon(storage.type)}
                      <div>
                        <h3 className="font-semibold" data-testid={`storage-name-${storage.id}`}>
                          {storage.name}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {storage.type} • {storage.node}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getStatusColor(storage.status)}>
                        {storage.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleConfigureStorage(storage.id)}
                        data-testid={`button-configure-${storage.id}`}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Storage Usage</span>
                      <span className="font-medium" data-testid={`storage-usage-${storage.id}`}>
                        {storage.used}GB / {storage.total}GB ({usagePercent.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Path:</span>
                      <p className="font-mono text-xs mt-1 break-all" data-testid={`storage-path-${storage.id}`}>
                        {storage.path}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Content Types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {storage.content.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}