import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { activityService } from '@/services/activityService';
import { TrendingUp, TrendingDown, Calendar, CheckCircle2, ListTodo, Clock } from 'lucide-react';

const COLORS = {
  pending: '#facc15',
  in_progress: '#60a5fa',
  done: '#4ade80',
  missed: '#ef4444',
};

const statusTranslations: { [key: string]: string } = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  done: 'Completada',
  missed: 'Atrasada',
};

interface SupervisorStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  supervisorName: string;
}

export const SupervisorStatsModal = ({ isOpen, onClose, userId, supervisorName }: SupervisorStatsModalProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      activityService.getDetailedActivityStats(userId)
        .then((data) => {
          setStats(data);
        })
        .catch((error) => {
          console.error('Error fetching stats:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, userId]);

  if (!stats && !loading) return null;

  const chartData = stats ? Object.entries(stats.status_distribution).map(([name, value]) => ({
    name: statusTranslations[name] || name,
    value,
  })) : [];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Estadísticas de {supervisorName}</DialogTitle>
          <p className="text-sm text-gray-500">Resumen del mes actual</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Total Actividades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.total_activities}</p>
                  <p className="text-xs text-gray-500">Este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Próximas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{stats.upcoming_activities}</p>
                  <p className="text-xs text-gray-500">Próximos 7 días</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Tasa Cumplimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{stats.completion_rate}%</p>
                  <div className={`text-xs flex items-center gap-1 ${getTrendColor(stats.completion_trend)}`}>
                    {getTrendIcon(stats.completion_trend)}
                    {stats.completion_trend > 0 ? '+' : ''}{stats.completion_trend}% vs mes anterior
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    Tareas Completadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.avg_task_completion}%</p>
                  <p className="text-xs text-gray-500">{stats.completed_tasks} de {stats.total_tasks}</p>
                </CardContent>
              </Card>
            </div>

            {/* Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center justify-around gap-4">
                <div className="w-full md:w-1/2 flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => {
                          const originalKey = Object.keys(statusTranslations).find(
                            key => statusTranslations[key] === entry.name
                          );
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[originalKey as keyof typeof COLORS]} 
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-3">
                  {chartData.map((entry) => {
                    const originalKey = Object.keys(statusTranslations).find(
                      key => statusTranslations[key] === entry.name
                    );
                    const color = COLORS[originalKey as keyof typeof COLORS];
                    const percentage = stats.total_activities > 0 
                      ? ((entry.value / stats.total_activities) * 100).toFixed(1) 
                      : 0;
                    
                    return (
                      <div key={entry.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{entry.value}</p>
                          <p className="text-xs text-gray-500">{percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Comparison with previous month */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparación Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Mes Actual</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.completion_rate}%</p>
                    <p className="text-xs text-gray-500">{stats.status_distribution.done} completadas</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Mes Anterior</p>
                    <p className="text-3xl font-bold text-gray-600">{stats.prev_completion_rate}%</p>
                    <p className="text-xs text-gray-500">Referencia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
