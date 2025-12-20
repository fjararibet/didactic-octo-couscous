import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { activityService } from "@/services/activityService";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  ListTodo,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { DetailedStats } from "@/types/activity";

const COLORS = {
  pending: "#facc15",
  in_progress: "#60a5fa",
  done: "#4ade80",
  missed: "#ef4444",
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
  pending: "Pendiente",
  in_progress: "En Progreso",
  done: "Completada",
  missed: "Atrasada",
};

const statusReverseTranslations: { [key: string]: string } = Object.fromEntries(
  Object.entries(statusTranslations).map(([key, value]) => [value, key]),
);

interface DetailedStats {
  total_activities: number;
  upcoming_activities: number;
  completion_rate: number;
  completion_trend: number;
  avg_task_completion: number;
  completed_tasks: number;
  total_tasks: number;
}

export const StatusesPieChart = ({ userId }: { userId: number }) => {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [stats, detailed] = await Promise.all([
          activityService.getActivityStatusStats(userId),
          activityService.getDetailedActivityStats(userId),
        ]);
        const chartData = Object.entries(stats).map(([name, value]) => ({
          name: statusTranslations[name] || name,
          value,
        }));
        setData(chartData);
        setDetailedStats(detailed);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Cargando estadísticas...
      </div>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-3">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-1.5">
        <Card className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <p className="text-base font-bold">
            {detailedStats?.total_activities || 0}
          </p>
        </Card>

        <Card className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <p className="text-xs text-gray-600">Próximas</p>
          </div>
          <p className="text-base font-bold text-blue-600">
            {detailedStats?.upcoming_activities || 0}
          </p>
        </Card>

        <Card className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-gray-500" />
            <p className="text-xs text-gray-600">Cumplimiento</p>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-base font-bold text-green-600">
              {detailedStats?.completion_rate || 0}%
            </p>
            {detailedStats?.completion_trend !== undefined &&
              detailedStats.completion_trend !== 0 && (
                <span
                  className={`text-xs ${getTrendColor(detailedStats.completion_trend)}`}
                >
                  {getTrendIcon(detailedStats.completion_trend)}
                </span>
              )}
          </div>
        </Card>

        <Card className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <ListTodo className="w-3 h-3 text-gray-500" />
            <p className="text-xs text-gray-600">Tareas</p>
          </div>
          <p className="text-base font-bold">
            {detailedStats?.avg_task_completion || 0}%
          </p>
          <p className="text-xs text-gray-400 leading-none">
            {detailedStats?.completed_tasks || 0}/
            {detailedStats?.total_tasks || 0}
          </p>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribución por Estado</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center pt-0">
          <PieChart width={400} height={300}>
            <Pie
              data={data}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    COLORS[
                      statusReverseTranslations[
                        entry.name
                      ] as keyof typeof COLORS
                    ]
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </CardContent>
      </Card>
    </div>
  );
};
