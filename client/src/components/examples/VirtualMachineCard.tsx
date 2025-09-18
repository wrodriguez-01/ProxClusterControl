import VirtualMachineCard from "../VirtualMachineCard";

export default function VirtualMachineCardExample() {
  //todo: remove mock functionality
  const mockVMs = [
    {
      id: "100",
      name: "web-server-01",
      status: "running" as const,
      cpuUsage: 23.4,
      memoryUsage: 2048,
      memoryTotal: 4096,
      osType: "Ubuntu 22.04",
      node: "pve-node-01",
      uptime: "7 days, 14:32:18"
    },
    {
      id: "101", 
      name: "database-server",
      status: "running" as const,
      cpuUsage: 45.7,
      memoryUsage: 6144,
      memoryTotal: 8192,
      osType: "CentOS 8",
      node: "pve-node-02",
      uptime: "15 days, 08:45:22"
    },
    {
      id: "102",
      name: "dev-environment",
      status: "stopped" as const,
      cpuUsage: 0,
      memoryUsage: 0,
      memoryTotal: 2048,
      osType: "Debian 11",
      node: "pve-node-01"
    }
  ];

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Virtual Machine Cards</h3>
      <div className="grid gap-4">
        {mockVMs.map((vm) => (
          <VirtualMachineCard key={vm.id} {...vm} />
        ))}
      </div>
    </div>
  );
}