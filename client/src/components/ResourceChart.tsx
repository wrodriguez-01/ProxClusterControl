import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import ResourceDetailModal from "./ResourceDetailModal";

interface ResourceChartProps {
  title: string;
  data: Array<{
    time: string;
    value: number;
  }>;
  color?: string;
  unit?: string;
  className?: string;
}

export default function ResourceChart({ 
  title, 
  data, 
  color = "#3b82f6", 
  unit = "%",
  className 
}: ResourceChartProps) {
  const formatTooltip = (value: number, name: string, props: any) => {
    return [`${value}${unit}`, title];
  };

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResourceType = (title: string): "cpu" | "memory" | "network-in" | "network-out" | "disk-io" => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("cpu")) return "cpu";
    if (lowerTitle.includes("memory")) return "memory";
    if (lowerTitle.includes("network") && lowerTitle.includes("out")) return "network-out";
    if (lowerTitle.includes("network")) return "network-in";
    if (lowerTitle.includes("disk")) return "disk-io";
    return "cpu";
  };

  return (
    <ResourceDetailModal 
      resourceType={getResourceType(title)} 
      title={title}
    >
      <Card className={cn("hover-elevate cursor-pointer transition-all hover:shadow-md", className)} data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            {title}
            <span className="text-xs text-muted-foreground">Click for details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisTick}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  domain={unit.includes("MB/s") ? [0, 'dataMax'] : [0, 100]}
                />
                <Tooltip
                  formatter={formatTooltip}
                  labelFormatter={(label) => `Time: ${formatXAxisTick(label)}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </ResourceDetailModal>
  );
}