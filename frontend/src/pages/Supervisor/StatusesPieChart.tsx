
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { activityService } from '@/services/activityService';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, ListTodo, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import type { DetailedStats } from '@/types/activity';

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


const statusTranslations: { [key: string]: string } = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  done: 'Completada',
  missed: 'Atrasada',
};

const statusReverseTranslations: { [key: string]: string } = Object.fromEntries(
  Object.entries(statusTranslations).map(([key, value]) => [value, key])
);

export const StatusesPieChart = ({ userId }: { userId: number }) => {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      activityService.getActivityStatusStats(userId),
      activityService.getDetailedActivityStats(userId)
    ]).then(([stats, detailed]) => {
      const chartData = Object.entries(stats).map(([name, value]) => ({
        name: statusTranslations[name] || name,
        value,
      }));
      setData(chartData);
      setDetailedStats(detailed);
    }).catch((error) => {
      console.error('Error fetching stats:', error);
    }).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Cargando estadísticas...</div>;
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-2">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-1">
        <Card className="flex flex-col items-center justify-center py-1 px-1">
          <div className="flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5 text-gray-500" />
            <p className="text-[10px] text-gray-600">Total</p>
          </div>
          <p className="text-sm font-bold">{detailedStats?.total_activities || 0}</p>
        </Card>

        <Card className="flex flex-col items-center justify-center py-1 px-1">
          <div className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-gray-500" />
            <p className="text-[10px] text-gray-600">Próximas</p>
          </div>
          <p className="text-sm font-bold text-blue-600">{detailedStats?.upcoming_activities || 0}</p>
        </Card>

        <Card className="flex flex-col items-center justify-center py-1 px-1">
          <div className="flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-gray-500" />
            <p className="text-[10px] text-gray-600">Cumpl.</p>
          </div>
          <div className="flex items-center gap-0.5">
            <p className="text-sm font-bold text-green-600">{detailedStats?.completion_rate || 0}%</p>
            {detailedStats?.completion_trend !== undefined && detailedStats.completion_trend !== 0 && (
              <span className={`text-xs ${getTrendColor(detailedStats.completion_trend)}`}>
                {getTrendIcon(detailedStats.completion_trend)}
              </span>
            )}
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center py-1 px-1">
          <div className="flex items-center gap-0.5">
            <ListTodo className="w-2.5 h-2.5 text-gray-500" />
            <p className="text-[10px] text-gray-600">Tareas</p>
          </div>
          <p className="text-sm font-bold">{detailedStats?.avg_task_completion || 0}%</p>
          <p className="text-[9px] text-gray-400 leading-none">{detailedStats?.completed_tasks || 0}/{detailedStats?.total_tasks || 0}</p>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-xs">Distribución por Estado</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center pt-0 pb-2">
          <PieChart width={280} height={200}>
            <Pie
              data={data}
              cx={140}
              cy={100}
              labelLine={false}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[statusReverseTranslations[entry.name] as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </CardContent>
      </Card>
    </div>
  );
};
