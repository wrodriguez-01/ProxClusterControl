import NodeCard from "@/components/NodeCard";
import DashboardCard from "@/components/DashboardCard";
import { Server, Cpu, MemoryStick, Activity } from "lucide-react";

export default function Nodes() {
  //todo: remove mock functionality
  const mockNodes = [
    {
      name: "pve-node-01",
      status: "online" as const,
      cpuUsage: 23.4,
      memoryUsage: 12800,
      memoryTotal: 32000,
      storageUsage: 847000,
      storageTotal: 2000000,
      networkIn: 245.3,
      networkOut: 182.7,
      temperature: 42,
      uptime: "15 days, 8:32:45",
      vmCount: 7,
      containerCount: 3,
      version: "8.1.4"
    },
    {
      name: "pve-node-02", 
      status: "online" as const,
      cpuUsage: 45.7,
      memoryUsage: 18500,
      memoryTotal: 32000,
      storageUsage: 1200000,
      storageTotal: 2000000,
      networkIn: 128.9,
      networkOut: 97.4,
      temperature: 38,
      uptime: "22 days, 14:12:18",
      vmCount: 5,
      containerCount: 2,
      version: "8.1.4"
    },
    {
      name: "pve-node-03",
      status: "maintenance" as const,
      cpuUsage: 5.2,
      memoryUsage: 2400,
      memoryTotal: 16000,
      storageUsage: 320000,
      storageTotal: 1000000,
      networkIn: 12.3,
      networkOut: 8.7,
      temperature: 35,
      uptime: "2 days, 6:45:12",
      vmCount: 0,
      containerCount: 1,
      version: "8.1.4"
    }
  ];

  const totalVMs = mockNodes.reduce((sum, node) => sum + node.vmCount, 0);
  const totalContainers = mockNodes.reduce((sum, node) => sum + node.containerCount, 0);
  const onlineNodes = mockNodes.filter(node => node.status === "online").length;
  const avgCPU = mockNodes.reduce((sum, node) => sum + node.cpuUsage, 0) / mockNodes.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Nodes</h1>
        <p className="text-muted-foreground">
          Monitor and manage your Proxmox cluster nodes
        </p>
      </div>

      {/* Cluster Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Online Nodes"
          value={`${onlineNodes} / ${mockNodes.length}`}
          description="Cluster nodes active"
          progress={(onlineNodes / mockNodes.length) * 100}
          icon={<Server className="h-4 w-4" />}
          trend={{ value: 0, label: "all operational", isPositive: true }}
        />
        <DashboardCard
          title="Avg CPU Usage"
          value={`${avgCPU.toFixed(1)}%`}
          description="Across all nodes"
          progress={avgCPU}
          icon={<Cpu className="h-4 w-4" />}
          trend={{ value: 3.2, label: "from yesterday", isPositive: false }}
        />
        <DashboardCard
          title="Total VMs"
          value={totalVMs.toString()}
          description="Running virtual machines"
          icon={<MemoryStick className="h-4 w-4" />}
        />
        <DashboardCard
          title="Total Containers"
          value={totalContainers.toString()}
          description="LXC containers"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Node Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cluster Nodes</h2>
        <div className="grid gap-6">
          {mockNodes.map((node) => (
            <NodeCard key={node.name} {...node} />
          ))}
        </div>
      </div>
    </div>
  );
}