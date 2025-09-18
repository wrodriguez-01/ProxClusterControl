import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ResourceDetailModal from "./ResourceDetailModal";

interface DashboardCardProps {
  title: string;
  value: string;
  description?: string;
  progress?: number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export default function DashboardCard({
  title,
  value,
  description,
  progress,
  icon,
  trend,
  className
}: DashboardCardProps) {
  const getResourceType = (title: string): "cpu" | "memory" | "network-in" | "network-out" | "disk-io" => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("cpu")) return "cpu";
    if (lowerTitle.includes("memory")) return "memory";
    if (lowerTitle.includes("network") && lowerTitle.includes("out")) return "network-out";
    if (lowerTitle.includes("network")) return "network-in";
    if (lowerTitle.includes("disk")) return "disk-io";
    return "cpu";
  };

  const isResourceCard = title.toLowerCase().includes("cpu") || 
                         title.toLowerCase().includes("memory") || 
                         title.toLowerCase().includes("network") ||
                         title.toLowerCase().includes("storage");

  const CardComponent = (
    <Card className={cn("hover-elevate", isResourceCard && "cursor-pointer transition-all hover:shadow-md", className)} data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {isResourceCard && (
            <span className="text-xs text-muted-foreground hidden sm:inline">Click for details</span>
          )}
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" data-testid={`progress-${title.toLowerCase().replace(/\s+/g, '-')}`} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Used</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}
        
        {trend && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className={cn(
              "font-medium",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>{" "}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (isResourceCard) {
    return (
      <ResourceDetailModal 
        resourceType={getResourceType(title)} 
        title={title}
      >
        {CardComponent}
      </ResourceDetailModal>
    );
  }

  return CardComponent;
}