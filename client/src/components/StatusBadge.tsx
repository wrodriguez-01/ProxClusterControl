import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "running" | "stopped" | "paused" | "error" | "unknown";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  running: {
    label: "Running",
    className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  },
  stopped: {
    label: "Stopped",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  },
  paused: {
    label: "Paused",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  },
  unknown: {
    label: "Unknown",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-500",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant="secondary"
      className={cn(config.className, className)}
      data-testid={`status-${status}`}
    >
      <div className={cn(
        "w-2 h-2 rounded-full mr-1.5",
        status === "running" && "bg-green-500 dark:bg-green-400",
        status === "stopped" && "bg-gray-500 dark:bg-gray-400",
        status === "paused" && "bg-yellow-500 dark:bg-yellow-400",
        status === "error" && "bg-red-500 dark:bg-red-400",
        status === "unknown" && "bg-gray-400 dark:bg-gray-500"
      )} />
      {config.label}
    </Badge>
  );
}