import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Network as NetworkIcon, 
  Shield, 
  Plus, 
  MoreHorizontal, 
  Trash, 
  Edit,
  Globe,
  Wifi,
  Router,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import FirewallRuleModal from "@/components/FirewallRuleModal";

export interface FirewallRule {
  id?: string;
  enabled: boolean;
  action: "ACCEPT" | "REJECT" | "DROP";
  direction: "IN" | "OUT";
  protocol: "tcp" | "udp" | "icmp" | "all";
  source: string;
  destination: string;
  port?: string;
  comment?: string;
  node: string;
}

interface NetworkInterface {
  name: string;
  type: "ethernet" | "bridge" | "bond" | "vlan";
  status: "up" | "down";
  ipv4?: string;
  ipv6?: string;
  gateway?: string;
  mac: string;
  speed?: string;
  node: string;
}

interface VirtualNetwork {
  id: string;
  name: string;
  type: "bridge" | "vlan" | "vxlan";
  vlanId?: number;
  ports: string[];
  comment?: string;
}

export default function NetworkPage() {
  const [selectedTab, setSelectedTab] = useState("firewall");
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const mockFirewallRules: FirewallRule[] = [
    {
      id: "1",
      enabled: true,
      action: "ACCEPT",
      direction: "IN",
      protocol: "tcp",
      source: "0.0.0.0/0",
      destination: "10.0.0.0/24",
      port: "22",
      comment: "SSH Access",
      node: "cluster"
    },
    {
      id: "2", 
      enabled: true,
      action: "ACCEPT",
      direction: "IN",
      protocol: "tcp",
      source: "192.168.1.0/24",
      destination: "10.0.0.0/24",
      port: "8006",
      comment: "Proxmox Web UI",
      node: "cluster"
    },
    {
      id: "3",
      enabled: false,
      action: "REJECT",
      direction: "OUT",
      protocol: "tcp",
      source: "10.0.0.0/24",
      destination: "0.0.0.0/0",
      port: "25",
      comment: "Block SMTP",
      node: "pve-node-01"
    },
    {
      id: "4",
      enabled: true,
      action: "ACCEPT",
      direction: "IN",
      protocol: "icmp",
      source: "10.0.0.0/24",
      destination: "10.0.0.0/24",
      comment: "ICMP Ping",
      node: "cluster"
    }
  ];

  const mockInterfaces: NetworkInterface[] = [
    {
      name: "vmbr0",
      type: "bridge",
      status: "up",
      ipv4: "10.0.0.10/24",
      gateway: "10.0.0.1",
      mac: "aa:bb:cc:dd:ee:01",
      node: "pve-node-01"
    },
    {
      name: "eth0",
      type: "ethernet",
      status: "up",
      ipv4: "192.168.1.100/24",
      mac: "aa:bb:cc:dd:ee:02",
      speed: "1000 Mbps",
      node: "pve-node-01"
    },
    {
      name: "bond0",
      type: "bond",
      status: "up",
      ipv4: "10.0.1.10/24",
      mac: "aa:bb:cc:dd:ee:03",
      speed: "2000 Mbps",
      node: "pve-node-02"
    }
  ];

  const mockVirtualNetworks: VirtualNetwork[] = [
    {
      id: "1",
      name: "vmbr0",
      type: "bridge",
      ports: ["eth0", "eth1"],
      comment: "Main VM bridge"
    },
    {
      id: "2", 
      name: "vlan100",
      type: "vlan",
      vlanId: 100,
      ports: ["vmbr0"],
      comment: "Production VLAN"
    },
    {
      id: "3",
      name: "vxlan200",
      type: "vxlan",
      ports: ["vmbr0"],
      comment: "Overlay network"
    }
  ];

  const handleCreateRule = (rule: FirewallRule) => {
    console.log("Creating firewall rule:", rule); //todo: remove mock functionality
    // Here you would typically make an API call to create the rule
  };

  const handleRuleAction = (action: string, ruleId: string) => {
    console.log(`${action} rule ${ruleId}`); //todo: remove mock functionality
  };

  const handleEditRule = (rule: FirewallRule) => {
    console.log("Editing firewall rule:", rule); //todo: remove mock functionality
  };

  const handleInterfaceAction = (action: string, interfaceName: string) => {
    console.log(`${action} interface ${interfaceName}`); //todo: remove mock functionality
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "ACCEPT": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "REJECT": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "DROP": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "up" ? 
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> :
      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };

  const filteredRules = mockFirewallRules.filter(rule =>
    rule.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.source.includes(searchQuery) ||
    rule.destination.includes(searchQuery) ||
    rule.port?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Network</h1>
          <p className="text-muted-foreground">
            Manage network configuration, firewall rules, and virtual networks
          </p>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium">Firewall Rules</div>
            </div>
            <div className="text-2xl font-bold">{mockFirewallRules.length}</div>
            <div className="text-xs text-muted-foreground">
              {mockFirewallRules.filter(r => r.enabled).length} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <NetworkIcon className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium">Interfaces</div>
            </div>
            <div className="text-2xl font-bold">{mockInterfaces.length}</div>
            <div className="text-xs text-muted-foreground">
              {mockInterfaces.filter(i => i.status === "up").length} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-medium">Virtual Networks</div>
            </div>
            <div className="text-2xl font-bold">{mockVirtualNetworks.length}</div>
            <div className="text-xs text-muted-foreground">bridges & VLANs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <div className="text-sm font-medium">Traffic</div>
            </div>
            <div className="text-2xl font-bold">245.3</div>
            <div className="text-xs text-muted-foreground">MB/s total</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="firewall" data-testid="tab-firewall">
            <Shield className="h-4 w-4 mr-2" />
            Firewall
          </TabsTrigger>
          <TabsTrigger value="interfaces" data-testid="tab-interfaces">
            <NetworkIcon className="h-4 w-4 mr-2" />
            Interfaces
          </TabsTrigger>
          <TabsTrigger value="virtual" data-testid="tab-virtual">
            <Wifi className="h-4 w-4 mr-2" />
            Virtual Networks
          </TabsTrigger>
          <TabsTrigger value="dns" data-testid="tab-dns">
            <Globe className="h-4 w-4 mr-2" />
            DNS & Routing
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Firewall Tab */}
        <TabsContent value="firewall" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search rules by comment, source, or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-96"
                data-testid="input-search-firewall"
              />
            </div>
            <FirewallRuleModal mode="create" onSave={handleCreateRule}>
              <Button data-testid="button-create-rule">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </FirewallRuleModal>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Firewall Rules ({filteredRules.length})</h3>
            <div className="space-y-2">
              {filteredRules.map((rule) => (
                <Card key={rule.id} className="hover-elevate" data-testid={`firewall-rule-${rule.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => console.log(`Toggle rule ${rule.id}`, checked)}
                          data-testid={`switch-rule-${rule.id}`}
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getActionColor(rule.action)}>
                            {rule.action}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rule.direction}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rule.protocol.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">{rule.comment || "Unnamed Rule"}</div>
                          <div className="text-muted-foreground">
                            {rule.source} → {rule.destination}
                            {rule.port && ` : ${rule.port}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {rule.node === "cluster" ? "Cluster" : rule.node}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" data-testid={`rule-actions-${rule.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <FirewallRuleModal 
                              mode="edit" 
                              rule={rule} 
                              onSave={handleEditRule}
                            >
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-3 w-3" />
                                Edit Rule
                              </DropdownMenuItem>
                            </FirewallRuleModal>
                            <DropdownMenuItem onClick={() => handleRuleAction("duplicate", rule.id!)}>
                              Duplicate Rule
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRuleAction("delete", rule.id!)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash className="mr-2 h-3 w-3" />
                              Delete Rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Network Interfaces Tab */}
        <TabsContent value="interfaces" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Network Interfaces</h3>
            <Button data-testid="button-create-interface">
              <Plus className="h-4 w-4 mr-2" />
              Create Interface
            </Button>
          </div>

          <div className="grid gap-4">
            {mockInterfaces.map((iface) => (
              <Card key={iface.name} className="hover-elevate" data-testid={`interface-${iface.name}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(iface.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{iface.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {iface.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {iface.node}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {iface.ipv4 && <div>IPv4: {iface.ipv4}</div>}
                          {iface.ipv6 && <div>IPv6: {iface.ipv6}</div>}
                          <div>MAC: {iface.mac}</div>
                          {iface.speed && <div>Speed: {iface.speed}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={iface.status === "up" ? 
                          "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                          "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }
                      >
                        {iface.status.toUpperCase()}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" data-testid={`interface-actions-${iface.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleInterfaceAction("edit", iface.name)}>
                            <Edit className="mr-2 h-3 w-3" />
                            Edit Interface
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInterfaceAction(iface.status === "up" ? "down" : "up", iface.name)}>
                            {iface.status === "up" ? "Bring Down" : "Bring Up"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInterfaceAction("restart", iface.name)}>
                            Restart Interface
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Virtual Networks Tab */}
        <TabsContent value="virtual" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Virtual Networks</h3>
            <Button data-testid="button-create-vnet">
              <Plus className="h-4 w-4 mr-2" />
              Create Virtual Network
            </Button>
          </div>

          <div className="grid gap-4">
            {mockVirtualNetworks.map((vnet) => (
              <Card key={vnet.id} className="hover-elevate" data-testid={`vnet-${vnet.name}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{vnet.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {vnet.type}
                        </Badge>
                        {vnet.vlanId && (
                          <Badge variant="outline" className="text-xs">
                            VLAN {vnet.vlanId}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Ports: {vnet.ports.join(", ")}</div>
                        {vnet.comment && <div>{vnet.comment}</div>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" data-testid={`vnet-actions-${vnet.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-3 w-3" />
                          Edit Network
                        </DropdownMenuItem>
                        <DropdownMenuItem>Add Port</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                          <Trash className="mr-2 h-3 w-3" />
                          Delete Network
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* DNS & Routing Tab */}
        <TabsContent value="dns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>DNS Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-dns">Primary DNS Server</Label>
                  <Input id="primary-dns" value="8.8.8.8" data-testid="input-primary-dns" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-dns">Secondary DNS Server</Label>
                  <Input id="secondary-dns" value="8.8.4.4" data-testid="input-secondary-dns" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-domain">Search Domain</Label>
                  <Input id="search-domain" value="proxmox.local" data-testid="input-search-domain-dns" />
                </div>
                <Button className="w-full" data-testid="button-save-dns">
                  Save DNS Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Static Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    No custom routes configured
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-add-route">
                    <Plus className="h-3 w-3 mr-2" />
                    Add Static Route
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    No security groups configured
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-create-security-group">
                    <Plus className="h-3 w-3 mr-2" />
                    Create Security Group
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="default-policy">Default Policy</Label>
                  <select 
                    id="default-policy"
                    className="flex h-8 w-32 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    data-testid="select-default-policy"
                  >
                    <option value="accept">ACCEPT</option>
                    <option value="reject">REJECT</option>
                    <option value="drop">DROP</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="log-level">Log Level</Label>
                  <select 
                    id="log-level"
                    className="flex h-8 w-32 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    data-testid="select-log-level"
                  >
                    <option value="none">None</option>
                    <option value="info">Info</option>
                    <option value="notice">Notice</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-firewall">Enable Firewall</Label>
                  <Switch id="enable-firewall" defaultChecked data-testid="switch-enable-firewall" />
                </div>
                <Button className="w-full" data-testid="button-save-security">
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}