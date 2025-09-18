import ResourceChart from "../ResourceChart";

export default function ResourceChartExample() {
  //todo: remove mock functionality
  const generateMockData = (baseValue: number, variance: number = 10) => {
    const data = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const randomVariance = (Math.random() - 0.5) * variance;
      const value = Math.max(0, Math.min(100, baseValue + randomVariance));
      data.push({
        time: time.toISOString(),
        value: Math.round(value * 10) / 10
      });
    }
    return data;
  };

  const cpuData = generateMockData(25, 15);
  const memoryData = generateMockData(40, 8);

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Resource Charts</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResourceChart
          title="CPU Usage"
          data={cpuData}
          color="#3b82f6"
          unit="%"
        />
        <ResourceChart
          title="Memory Usage"
          data={memoryData}
          color="#10b981"
          unit="%"
        />
      </div>
    </div>
  );
}