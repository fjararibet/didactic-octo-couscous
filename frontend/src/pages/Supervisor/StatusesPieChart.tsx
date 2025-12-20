
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { activityService } from '@/services/activityService';
import { useEffect, useState } from 'react';

const COLORS = {
  pending: '#facc15',
  in_progress: '#60a5fa',
  done: '#4ade80',
  missed: '#ef4444',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 border rounded-lg bg-background">
        <p className="font-bold text-foreground">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};


export const StatusesPieChart = ({ userId }: { userId: number }) => {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    activityService.getActivityStatusStats(userId).then((stats) => {
      const chartData = Object.entries(stats).map(([name, value]) => ({
        name,
        value,
      }));
      setData(chartData);
    });
  }, [userId]);

  return (
    <PieChart width={400} height={400}>
      <Pie
        data={data}
        cx={200}
        cy={200}
        labelLine={false}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend />
    </PieChart>
  );
};
