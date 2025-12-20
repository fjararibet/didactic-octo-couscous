import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { activityService } from '@/services/activityService';
import type { ActivityWithSupervisors } from '@/types/activity';
import { Calendar, Users } from 'lucide-react';
import SupervisorsModal from './SupervisorsModal';

const ActivitiesView = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityWithSupervisors[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<ActivityWithSupervisors | null>(null);
  const [isSupervisorsModalOpen, setIsSupervisorsModalOpen] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user?.id) return;

      try {
        const data = await activityService.getActivitiesGroupedByName(user.id);
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user?.id]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    return colors[id % colors.length];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Vista de Actividades</h1>
            <p className="text-sm text-gray-500 mt-1">Actividades agrupadas por tipo</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard/preventionist">Volver al Panel</Link>
          </Button>
        </div>

        {loading ? (
          <p>Cargando actividades...</p>
        ) : activities.length === 0 ? (
          <p className="text-gray-500 italic">No hay actividades creadas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <Card key={activity.activity_name} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{activity.activity_name}</CardTitle>
                  <div className="flex gap-3 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{activity.supervisor_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{activity.scheduled_dates.length}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4">
                  {/* Supervisors Section */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm">Supervisores</h3>
                    {activity.supervisors.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Sin supervisores</p>
                    ) : (
                      <div className="flex items-center gap-2 overflow-hidden">
                        {activity.supervisors.slice(0, 2).map((supervisor) => (
                          <Link
                            to={`/preventionist/supervisor/${supervisor.id}`}
                            key={supervisor.id}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow min-w-0 flex-shrink"
                          >
                            <div className={`w-8 h-8 rounded-full ${getAvatarColor(supervisor.id)} flex items-center justify-center shrink-0`}>
                              <span className="text-xs font-bold text-white">
                                {getInitials(supervisor.username)}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {supervisor.username}
                            </p>
                          </Link>
                        ))}

                        {activity.supervisors.length > 2 && (
                          <div className="shrink-0">
                            <div
                              className="flex items-center gap-1 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors whitespace-nowrap"
                              onClick={() => {
                                setSelectedActivityForModal(activity);
                                setIsSupervisorsModalOpen(true);
                              }}
                            >
                              <span className="text-xs font-bold text-blue-700">...</span>
                              <span className="text-xs font-bold text-blue-700">+{activity.supervisors.length - 2}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Dates Section */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm">Fechas Programadas</h3>
                    {activity.scheduled_dates.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Sin fechas</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {activity.scheduled_dates.slice(0, 6).map((date, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200"
                          >
                            {formatDate(date)}
                          </div>
                        ))}
                        {activity.scheduled_dates.length > 6 && (
                          <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            +{activity.scheduled_dates.length - 6} más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedActivityForModal && (
        <SupervisorsModal
          supervisors={selectedActivityForModal.supervisors}
          activityName={selectedActivityForModal.activity_name}
          isOpen={isSupervisorsModalOpen}
          onClose={() => {
            setIsSupervisorsModalOpen(false);
            setSelectedActivityForModal(null);
          }}
          getInitials={getInitials}
          getAvatarColor={getAvatarColor}
        />
      )}
    </div>
  );
};

export default ActivitiesView;
