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
import { isActivityMissed } from '@/types/activity';


const getCardColorByStatus = (activity: Activity | null) => {
  if (!activity) return '!bg-white hover:!bg-gray-50';

  const status = calculateActivityStatus(activity);
  const isMissed = isActivityMissed(activity, status);

  // If missed, always show red regardless of status
  if (isMissed) {
    return '!bg-red-200 hover:!bg-red-300';
  }

  // Otherwise use the normal status colors
  switch (status) {
    case 'pending':
      return '!bg-yellow-200 hover:!bg-yellow-300';
    case 'in_progress':
      return '!bg-blue-200 hover:!bg-blue-300';
    case 'done':
      return '!bg-green-400 hover:!bg-green-500';
    default:
      return '!bg-white hover:!bg-gray-50';
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
    <div className="h-screen bg-gray-100 p-4">
      <div className="mx-auto h-full">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de Supervisor</h1>
            <p className="text-sm text-gray-500 mt-1">Sesión: {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>

        <Card className="w-full">
          <CardContent className="grid grid-cols-2 grid-rows-2 gap-6">
            <div className="flex flex-col space-y-4">
              <Card
                className={cn(
                  "w-full cursor-pointer col-start-1 col-end-2 transition-colors",
                  getCardColorByStatus(nextActivity)
                )}
                onClick={() => nextActivity && handleOpenModal(nextActivity)}
              >
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
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchNextActivity();
                        }}
                        className={cn(
                          "absolute bottom-2 right-2",
                          calculateActivityStatus(nextActivity) === 'done' && isSameDay(nextActivity.scheduled_date) ? "visible" : "invisible opacity-0 pointer-events-none"
                        )}
                      >
                        Siguiente Actividad
                      </Button>
                      {calculateActivityStatus(nextActivity) !== 'done' && !isSameDay(nextActivity.scheduled_date) && (
                        <p className="text-sm text-gray-500 absolute bottom-2 right-2">
                          No hay más actividades para hoy. Próxima: {new Date(nextActivity.scheduled_date!).toLocaleDateString()}
                        </p>
                      )}
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
