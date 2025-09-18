import DashboardCard from "../DashboardCard";
import { Cpu, HardDrive, MemoryStick, Activity } from "lucide-react";

export default function DashboardCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <DashboardCard
        title="CPU Usage"
        value="23.4%"
        description="4 cores available"
        progress={23.4}
        icon={<Cpu className="h-4 w-4" />}
        trend={{ value: 2.1, label: "from last hour", isPositive: false }}
      />
      <DashboardCard
        title="Memory Usage"
        value="12.8 GB"
        description="32 GB total"
        progress={40}
        icon={<MemoryStick className="h-4 w-4" />}
        trend={{ value: 5.2, label: "from last hour", isPositive: false }}
      />
      <DashboardCard
        title="Storage Usage"
        value="847 GB"
        description="2 TB total"
        progress={42.35}
        icon={<HardDrive className="h-4 w-4" />}
        trend={{ value: 1.3, label: "from yesterday", isPositive: false }}
      />
      <DashboardCard
        title="Active VMs"
        value="12"
        description="18 total VMs"
        icon={<Activity className="h-4 w-4" />}
        trend={{ value: 8.3, label: "uptime improvement", isPositive: true }}
      />
    </div>
  );
}