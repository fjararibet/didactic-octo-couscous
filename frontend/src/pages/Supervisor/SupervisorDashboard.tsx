import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import SupervisorCalendarView from './SupervisorCalendarView';
import { StatusesPieChart } from './StatusesPieChart';
import { activityService } from '@/services/activityService';
import type { Activity } from '@/types/activity';
import SupervisorActivityDetailModal from './SupervisorActivityDetailModal';
import { calculateActivityStatus, cn } from '@/lib/utils';


const getCardColorByStatus = (activity: Activity | null) => {
  if (!activity) return 'hover:bg-gray-50';

  const status = calculateActivityStatus(activity);
  switch (status) {
    case 'pending':
      return 'bg-yellow-200 hover:bg-yellow-300';
    case 'in_progress':
      return 'bg-blue-200 hover:bg-blue-300';
    case 'done':
      return 'bg-green-400 hover:bg-green-500';
    default:
      return 'hover:bg-gray-50';
  }
};

const isSameDay = (dateString: string | null | undefined) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [nextActivity, setNextActivity] = useState<Activity | null>(null);
  const [loadingNextActivity, setLoadingNextActivity] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const fetchNextActivity = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    fetchNextActivity();
  }, [fetchNextActivity]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenModal = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleCloseModal = () => {
    setSelectedActivity(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-100 p-2">
      <div className="mx-auto h-full">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel de Supervisor</h1>
            <p className="text-xs text-gray-500 mt-0.5">Sesión: {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-sm py-1 px-3">
            Cerrar Sesión
          </Button>
        </div>

        <Card className="w-full">
          <CardContent className="grid grid-cols-[40%_60%] gap-3 py-2">
            <div className="flex flex-col space-y-2">
              <Card
                className={cn(
                  "w-full cursor-pointer col-start-1 col-end-2 transition-colors",
                  getCardColorByStatus(nextActivity)
                )}
                onClick={() => nextActivity && handleOpenModal(nextActivity)}
              >
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-sm font-bold text-blue-800">Próxima Actividad Programada</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 pt-0 px-3 relative min-h-20">
                  {loadingNextActivity ? (
                    <p className="text-sm">Cargando próxima actividad...</p>
                  ) : nextActivity ? (
                    <div className="relative">
                      <p className="text-sm font-semibold mb-0.5">{nextActivity.name}</p>
                      <p className="text-xs text-gray-600 leading-tight">Fecha: {new Date(nextActivity.scheduled_date!).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-600 leading-tight mb-6">Asignado por: {nextActivity.created_by.username}</p>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchNextActivity();
                        }}
                        className={cn(
                          "absolute bottom-0 right-0 text-xs py-1 px-2",
                          calculateActivityStatus(nextActivity) === 'done' && isSameDay(nextActivity.scheduled_date) ? "visible" : "invisible opacity-0 pointer-events-none"
                        )}
                      >
                        Siguiente Actividad
                      </Button>
                      {calculateActivityStatus(nextActivity) !== 'done' && !isSameDay(nextActivity.scheduled_date) && (
                        <p className="text-xs text-gray-500 absolute bottom-0 right-0">
                          No hay más actividades para hoy
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">No hay actividades programadas próximamente.</p>
                  )}
                </CardContent>
              </Card>
              <StatusesPieChart userId={user.id} />
            </div>
            <SupervisorCalendarView />
          </CardContent>
        </Card>
      </div>
      {selectedActivity && (
        <SupervisorActivityDetailModal
          activity={selectedActivity}
          isOpen={!!selectedActivity}
          onClose={handleCloseModal}
          onActivityUpdate={updatedActivity => {
            if (nextActivity && updatedActivity.id === nextActivity.id) {
              setNextActivity(updatedActivity);
            }
          }}
        />
      )}
    </div>
  );
};

export default SupervisorDashboard;
