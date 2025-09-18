import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Cpu, MemoryStick, Network, HardDrive, Server, Monitor, Box } from "lucide-react";

interface ResourceConsumer {
  id: string;
  name: string;
  type: "vm" | "container";
  node: string;
  usage: number;
  limit?: number;
  status: "running" | "stopped" | "paused";
}

interface NodeResource {
  node: string;
  total: number;
  used: number;
  available: number;
  consumers: ResourceConsumer[];
}

interface ResourceDetailModalProps {
  resourceType: "cpu" | "memory" | "network-in" | "network-out" | "disk-io";
  title: string;
  children: React.ReactNode;
}

export default function ResourceDetailModal({ resourceType, title, children }: ResourceDetailModalProps) {
  //todo: remove mock functionality
  const mockDetailedData = {
    "cpu": {
      totalUsage: 34.2,
      peakUsage: 67.8,
      avgUsage24h: 28.5,
      nodes: [
        {
          node: "pve-node-01",
          total: 8,
          used: 2.4,
          available: 5.6,
          consumers: [
            { id: "100", name: "web-server-01", type: "vm" as const, node: "pve-node-01", usage: 23.4, status: "running" as const },
            { id: "101", name: "database-server", type: "vm" as const, node: "pve-node-01", usage: 45.7, status: "running" as const },
            { id: "200", name: "nginx-proxy", type: "container" as const, node: "pve-node-01", usage: 12.3, status: "running" as const }
          ]
        },
        {
          node: "pve-node-02", 
          total: 8,
          used: 3.2,
          available: 4.8,
          consumers: [
            { id: "103", name: "backup-server", type: "vm" as const, node: "pve-node-02", usage: 12.8, status: "running" as const },
            { id: "201", name: "redis-cache", type: "container" as const, node: "pve-node-02", usage: 8.7, status: "running" as const }
          ]
        }
      ],
      historicalData: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        value: 25 + Math.sin(i * 0.3) * 15 + Math.random() * 8
      }))
    },
    "memory": {
      totalUsage: 18.2,
      peakUsage: 24.8,
      avgUsage24h: 16.4,
      nodes: [
        {
          node: "pve-node-01",
          total: 32000,
          used: 12800,
          available: 19200,
          consumers: [
            { id: "100", name: "web-server-01", type: "vm" as const, node: "pve-node-01", usage: 2048, limit: 4096, status: "running" as const },
            { id: "101", name: "database-server", type: "vm" as const, node: "pve-node-01", usage: 6144, limit: 8192, status: "running" as const },
            { id: "200", name: "nginx-proxy", type: "container" as const, node: "pve-node-01", usage: 512, limit: 1024, status: "running" as const }
          ]
        },
        {
          node: "pve-node-02",
          total: 32000, 
          used: 6400,
          available: 25600,
          consumers: [
            { id: "103", name: "backup-server", type: "vm" as const, node: "pve-node-02", usage: 1024, limit: 2048, status: "running" as const },
            { id: "201", name: "redis-cache", type: "container" as const, node: "pve-node-02", usage: 256, limit: 512, status: "running" as const }
          ]
        }
      ],
      historicalData: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        value: 40 + Math.sin(i * 0.2) * 12 + Math.random() * 6
      }))
    },
    "network-in": {
      totalUsage: 245.3,
      peakUsage: 1247.8,
      avgUsage24h: 189.2,
      unit: "MB/s",
      nodes: [
        {
          node: "pve-node-01",
          total: 1000,
          used: 245.3,
          available: 754.7,
          consumers: [
            { id: "100", name: "web-server-01", type: "vm" as const, node: "pve-node-01", usage: 156.2, status: "running" as const },
            { id: "200", name: "nginx-proxy", type: "container" as const, node: "pve-node-01", usage: 89.1, status: "running" as const }
          ]
        }
      ],
      historicalData: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        value: 200 + Math.sin(i * 0.4) * 80 + Math.random() * 40
      }))
    },
    "network-out": {
      totalUsage: 182.7,
      peakUsage: 856.3,
      avgUsage24h: 145.8,
      unit: "MB/s",
      nodes: [
        {
          node: "pve-node-01",
          total: 1000,
          used: 182.7,
          available: 817.3,
          consumers: [
            { id: "100", name: "web-server-01", type: "vm" as const, node: "pve-node-01", usage: 98.4, status: "running" as const },
            { id: "200", name: "nginx-proxy", type: "container" as const, node: "pve-node-01", usage: 84.3, status: "running" as const }
          ]
        }
      ],
      historicalData: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        value: 160 + Math.sin(i * 0.5) * 60 + Math.random() * 30
      }))
    },
    "disk-io": {
      totalUsage: 87.5,
      peakUsage: 245.2,
      avgUsage24h: 65.3,
      unit: "MB/s",
      nodes: [
        {
          node: "pve-node-01",
          total: 500,
          used: 87.5,
          available: 412.5,
          consumers: [
            { id: "101", name: "database-server", type: "vm" as const, node: "pve-node-01", usage: 45.2, status: "running" as const },
            { id: "100", name: "web-server-01", type: "vm" as const, node: "pve-node-01", usage: 28.1, status: "running" as const }
          ]
        }
      ],
      historicalData: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        value: 70 + Math.sin(i * 0.6) * 25 + Math.random() * 15
      }))
    }
  };

  const data = mockDetailedData[resourceType] || mockDetailedData.cpu;
  const unit = resourceType.includes("network") || resourceType === "disk-io" ? " MB/s" : resourceType === "memory" ? " MB" : "%";

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "cpu": return <Cpu className="h-4 w-4" />;
      case "memory": return <MemoryStick className="h-4 w-4" />;
      case "network-in":
      case "network-out": return <Network className="h-4 w-4" />;
      case "disk-io": return <HardDrive className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getConsumerIcon = (type: "vm" | "container") => {
    return type === "vm" ? <Monitor className="h-3 w-3" /> : <Box className="h-3 w-3" />;
  };

  const formatValue = (value: number, showUnit: boolean = true) => {
    if (resourceType === "memory") {
      return `${(value / 1024).toFixed(1)}${showUnit ? " GB" : ""}`;
    }
    return `${value.toFixed(1)}${showUnit ? unit : ""}`;
  };

  const topConsumers = data.nodes.flatMap((node: NodeResource) => node.consumers)
    .sort((a: ResourceConsumer, b: ResourceConsumer) => b.usage - a.usage)
    .slice(0, 10);

  const nodeUsageData = data.nodes.map((node: NodeResource) => ({
    node: node.node,
    used: resourceType === "memory" ? node.used / 1024 : node.used,
    available: resourceType === "memory" ? node.available / 1024 : node.available
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]" data-testid={`modal-${resourceType}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getResourceIcon(resourceType)}
            {title} - Detailed View
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid={`current-usage-${resourceType}`}>
                    {formatValue(data.totalUsage)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatValue(data.peakUsage)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Peak (24h)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatValue(data.avgUsage24h)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Average (24h)</p>
                </CardContent>
              </Card>
            </div>

            {/* Historical Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Historical Usage (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.historicalData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number) => [formatValue(value), title]}
                        labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString()}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Node Usage Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Node Usage Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nodeUsageData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="node" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatValue(value * (resourceType === "memory" ? 1024 : 1)), 
                            name === "used" ? "Used" : "Available"
                          ]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar dataKey="used" stackId="a" fill="#ef4444" name="used" />
                        <Bar dataKey="available" stackId="a" fill="#22c55e" name="available" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Resource Consumers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Resource Consumers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {topConsumers.map((consumer: ResourceConsumer, index: number) => (
                        <div key={consumer.id} className="flex items-center justify-between p-2 rounded border border-card-border" data-testid={`top-consumer-${index}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                                {index + 1}
                              </Badge>
                              {getConsumerIcon(consumer.type)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{consumer.name}</div>
                              <div className="text-xs text-muted-foreground">{consumer.type.toUpperCase()} {consumer.id} • {consumer.node}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatValue(consumer.usage)}</div>
                            {consumer.limit && (
                              <div className="text-xs text-muted-foreground">
                                / {formatValue(consumer.limit)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Node Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Node Details</h3>
              {data.nodes.map((node: NodeResource) => (
                <Card key={node.node}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        {node.node}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {formatValue(node.used)} / {formatValue(node.total)} used
                      </div>
                    </div>
                    <Progress value={(node.used / node.total) * 100} className="h-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Resource Consumers ({node.consumers.length})</h4>
                      {node.consumers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active consumers</p>
                      ) : (
                        <div className="grid gap-2">
                          {node.consumers.map((consumer: ResourceConsumer) => (
                            <div key={consumer.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <div className="flex items-center gap-2">
                                {getConsumerIcon(consumer.type)}
                                <span className="font-medium text-sm">{consumer.name}</span>
                                <Badge variant="outline" className="text-xs">{consumer.type.toUpperCase()} {consumer.id}</Badge>
                              </div>
                              <div className="text-sm font-medium">
                                {formatValue(consumer.usage)}
                                {consumer.limit && (
                                  <span className="text-muted-foreground"> / {formatValue(consumer.limit)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}