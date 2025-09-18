import StatusBadge from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Status Badge Examples</h3>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="running" />
        <StatusBadge status="stopped" />
        <StatusBadge status="paused" />
        <StatusBadge status="error" />
        <StatusBadge status="unknown" />
      </div>
    </div>
  );
}