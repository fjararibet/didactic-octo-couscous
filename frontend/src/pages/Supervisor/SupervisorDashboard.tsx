import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import SupervisorCalendarView from './SupervisorCalendarView';
import { StatusesPieChart } from './StatusesPieChart';
import { activityService } from '@/services/activityService';
import type { Activity } from '@/types/activity';


const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [nextActivity, setNextActivity] = useState<Activity | null>(null);
  const [loadingNextActivity, setLoadingNextActivity] = useState(true);

  useEffect(() => {
    const fetchNextActivity = async () => {
      if (user?.id) {
        setLoadingNextActivity(true);
        try {
          const activity = await activityService.getNextScheduledActivity(user.id);
          setNextActivity(activity);
        } catch (error) {
          console.error("Failed to fetch next scheduled activity:", error);
        } finally {
          setLoadingNextActivity(false);
        }
      }
    };

    fetchNextActivity();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Supervisor</h1>
            <p className="text-sm text-gray-500 mt-1">Sesión: {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>

        <Card className="w-full">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-4">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-blue-800">Próxima Actividad Programada</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingNextActivity ? (
                    <p>Cargando próxima actividad...</p>
                  ) : nextActivity ? (
                    <div>
                      <p className="text-lg font-semibold">{nextActivity.name}</p>
                      <p className="text-sm text-gray-600">Fecha: {new Date(nextActivity.scheduled_date!).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Asignado por: {nextActivity.created_by.username}</p>
                    </div>
                  ) : (
                    <p>No hay actividades programadas próximamente.</p>
                  )}
                </CardContent>
              </Card>
              <StatusesPieChart userId={user.id} />
            </div>
            <SupervisorCalendarView />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
