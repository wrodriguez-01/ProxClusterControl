import ContainerCard from "../ContainerCard";

export default function ContainerCardExample() {
  //todo: remove mock functionality  
  const mockContainers = [
    {
      id: "200",
      name: "nginx-proxy",
      status: "running" as const,
      cpuUsage: 12.3,
      memoryUsage: 512,
      memoryLimit: 1024,
      template: "ubuntu-22.04-standard",
      node: "pve-node-01",
      uptime: "12 days, 06:15:30"
    },
    {
      id: "201",
      name: "redis-cache",
      status: "running" as const,
      cpuUsage: 8.7,
      memoryUsage: 256,
      memoryLimit: 512,
      template: "debian-11-standard",
      node: "pve-node-02",
      uptime: "5 days, 18:42:11"
    },
    {
      id: "202",
      name: "backup-service",
      status: "stopped" as const,
      cpuUsage: 0,
      memoryUsage: 0,
      memoryLimit: 512,
      template: "alpine-3.18-default",
      node: "pve-node-01"
    }
  ];

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Container Cards</h3>
      <div className="grid gap-4">
        {mockContainers.map((container) => (
          <ContainerCard key={container.id} {...container} />
        ))}
      </div>
    </div>
  );
}