import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Server, 
  Network, 
  Shield, 
  Bell, 
  Clock,
  Save,
  RefreshCw,
  Database,
  HardDrive
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Cluster Settings
    clusterName: "pve-cluster",
    quorumExpected: 3,
    migration: {
      enabled: true,
      network: "10.0.0.0/24",
      secure: true
    },
    
    // Authentication
    auth: {
      sessionTimeout: 7200,
      twoFactorRequired: false,
      passwordComplexity: true
    },
    
    // Notifications
    notifications: {
      emailEnabled: true,
      emailServer: "smtp.proxmox.local",
      emailFrom: "proxmox@proxmox.local",
      alerts: true,
      maintenance: true
    },
    
    // Backup Settings
    backup: {
      retention: 7,
      compression: "lzo",
      defaultStorage: "backup-nfs",
      scheduling: true
    },
    
    // Network Settings
    network: {
      dns1: "8.8.8.8",
      dns2: "8.8.4.4",
      searchDomain: "proxmox.local",
      timeSync: true,
      ntpServer: "pool.ntp.org"
    }
  });

  const handleSave = () => {
    console.log("Saving settings:", settings); //todo: remove mock functionality
  };

  const handleReset = () => {
    console.log("Resetting to defaults"); //todo: remove mock functionality
  };

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Settings</h1>
          <p className="text-muted-foreground">
            Configure cluster-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} data-testid="button-reset-settings">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} data-testid="button-save-settings">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cluster Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Cluster Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cluster-name">Cluster Name</Label>
              <Input
                id="cluster-name"
                value={settings.clusterName}
                onChange={(e) => updateSetting('clusterName', e.target.value)}
                data-testid="input-cluster-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quorum-expected">Expected Quorum Votes</Label>
              <Input
                id="quorum-expected"
                type="number"
                value={settings.quorumExpected}
                onChange={(e) => updateSetting('quorumExpected', parseInt(e.target.value))}
                data-testid="input-quorum-expected"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Migration Settings</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="migration-enabled">Enable Live Migration</Label>
                <Switch
                  id="migration-enabled"
                  checked={settings.migration.enabled}
                  onCheckedChange={(checked) => updateSetting('migration.enabled', checked)}
                  data-testid="switch-migration-enabled"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="migration-network">Migration Network</Label>
                <Input
                  id="migration-network"
                  value={settings.migration.network}
                  onChange={(e) => updateSetting('migration.network', e.target.value)}
                  data-testid="input-migration-network"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="migration-secure">Secure Migration</Label>
                <Switch
                  id="migration-secure"
                  checked={settings.migration.secure}
                  onCheckedChange={(checked) => updateSetting('migration.secure', checked)}
                  data-testid="switch-migration-secure"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (seconds)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.auth.sessionTimeout}
                onChange={(e) => updateSetting('auth.sessionTimeout', parseInt(e.target.value))}
                data-testid="input-session-timeout"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-2fa">Require Two-Factor Authentication</Label>
              <Switch
                id="require-2fa"
                checked={settings.auth.twoFactorRequired}
                onCheckedChange={(checked) => updateSetting('auth.twoFactorRequired', checked)}
                data-testid="switch-require-2fa"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="password-complexity">Password Complexity Rules</Label>
              <Switch
                id="password-complexity"
                checked={settings.auth.passwordComplexity}
                onCheckedChange={(checked) => updateSetting('auth.passwordComplexity', checked)}
                data-testid="switch-password-complexity"
              />
            </div>
          </CardContent>
        </Card>

        {/* Network Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dns1">Primary DNS</Label>
                <Input
                  id="dns1"
                  value={settings.network.dns1}
                  onChange={(e) => updateSetting('network.dns1', e.target.value)}
                  data-testid="input-dns1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dns2">Secondary DNS</Label>
                <Input
                  id="dns2"
                  value={settings.network.dns2}
                  onChange={(e) => updateSetting('network.dns2', e.target.value)}
                  data-testid="input-dns2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-domain">Search Domain</Label>
              <Input
                id="search-domain"
                value={settings.network.searchDomain}
                onChange={(e) => updateSetting('network.searchDomain', e.target.value)}
                data-testid="input-search-domain"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Time Synchronization</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="time-sync">Enable NTP Sync</Label>
                <Switch
                  id="time-sync"
                  checked={settings.network.timeSync}
                  onCheckedChange={(checked) => updateSetting('network.timeSync', checked)}
                  data-testid="switch-time-sync"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ntp-server">NTP Server</Label>
                <Input
                  id="ntp-server"
                  value={settings.network.ntpServer}
                  onChange={(e) => updateSetting('network.ntpServer', e.target.value)}
                  data-testid="input-ntp-server"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled">Email Notifications</Label>
              <Switch
                id="email-enabled"
                checked={settings.notifications.emailEnabled}
                onCheckedChange={(checked) => updateSetting('notifications.emailEnabled', checked)}
                data-testid="switch-email-enabled"
              />
            </div>

            {settings.notifications.emailEnabled && (
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="email-server">SMTP Server</Label>
                  <Input
                    id="email-server"
                    value={settings.notifications.emailServer}
                    onChange={(e) => updateSetting('notifications.emailServer', e.target.value)}
                    data-testid="input-email-server"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-from">From Address</Label>
                  <Input
                    id="email-from"
                    value={settings.notifications.emailFrom}
                    onChange={(e) => updateSetting('notifications.emailFrom', e.target.value)}
                    data-testid="input-email-from"
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Alert Types</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts">System Alerts</Label>
                <Switch
                  id="alerts"
                  checked={settings.notifications.alerts}
                  onCheckedChange={(checked) => updateSetting('notifications.alerts', checked)}
                  data-testid="switch-alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance-alerts">Maintenance Notifications</Label>
                <Switch
                  id="maintenance-alerts"
                  checked={settings.notifications.maintenance}
                  onCheckedChange={(checked) => updateSetting('notifications.maintenance', checked)}
                  data-testid="switch-maintenance-alerts"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-retention">Retention Period (days)</Label>
              <Input
                id="backup-retention"
                type="number"
                value={settings.backup.retention}
                onChange={(e) => updateSetting('backup.retention', parseInt(e.target.value))}
                data-testid="input-backup-retention"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-compression">Compression</Label>
              <select 
                id="backup-compression"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={settings.backup.compression}
                onChange={(e) => updateSetting('backup.compression', e.target.value)}
                data-testid="select-backup-compression"
              >
                <option value="none">None</option>
                <option value="lzo">LZO (fast)</option>
                <option value="gzip">GZIP (balanced)</option>
                <option value="zstd">ZSTD (best)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-storage">Default Backup Storage</Label>
              <select 
                id="default-storage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={settings.backup.defaultStorage}
                onChange={(e) => updateSetting('backup.defaultStorage', e.target.value)}
                data-testid="select-default-storage"
              >
                <option value="backup-nfs">Backup NFS</option>
                <option value="local">Local Storage</option>
                <option value="ceph-pool">Ceph Pool</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="backup-scheduling">Enable Automatic Scheduling</Label>
              <Switch
                id="backup-scheduling"
                checked={settings.backup.scheduling}
                onCheckedChange={(checked) => updateSetting('backup.scheduling', checked)}
                data-testid="switch-backup-scheduling"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Proxmox VE Version:</span>
                <div className="font-medium">8.1.4</div>
              </div>
              <div>
                <span className="text-muted-foreground">Kernel Version:</span>
                <div className="font-medium">6.5.11-8-pve</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cluster Status:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Online
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">API Version:</span>
                <div className="font-medium">8.1.4</div>
              </div>
              <div>
                <span className="text-muted-foreground">Repository:</span>
                <div className="font-medium">pve-enterprise</div>
              </div>
              <div>
                <span className="text-muted-foreground">License:</span>
                <Badge variant="outline" className="text-xs">Valid</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Check Updates
                </Button>
                <Button size="sm" variant="outline">
                  <HardDrive className="h-3 w-3 mr-1" />
                  Cleanup Storage
                </Button>
                <Button size="sm" variant="outline">
                  <Database className="h-3 w-3 mr-1" />
                  Backup Config
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}