import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { activityService } from '@/services/activityService';
import type { ActivityWithSupervisors } from '@/types/activity';
import { ChevronDown, ChevronUp, Calendar, Users, User } from 'lucide-react';

const ActivitiesView = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityWithSupervisors[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

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

  const toggleActivity = (activityName: string) => {
    setExpandedActivity(expandedActivity === activityName ? null : activityName);
  };

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
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.activity_name} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleActivity(activity.activity_name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{activity.activity_name}</CardTitle>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{activity.supervisor_count} supervisor{activity.supervisor_count !== 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{activity.scheduled_dates.length} fecha{activity.scheduled_dates.length !== 1 ? 's' : ''} programada{activity.scheduled_dates.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {expandedActivity === activity.activity_name ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedActivity === activity.activity_name && (
                  <CardContent className="pt-4 border-t">
                    <div className="space-y-4">
                      {/* Supervisors Section */}
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Supervisores Asignados
                        </h3>
                        {activity.supervisors.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No hay supervisores asignados</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {activity.supervisors.map((supervisor) => (
                              <div
                                key={supervisor.id}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                              >
                                <div className={`w-10 h-10 rounded-full ${getAvatarColor(supervisor.id)} flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-sm font-bold text-white">
                                    {getInitials(supervisor.username)}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-gray-800 truncate">
                                    {supervisor.username}
                                  </p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    Supervisor
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Scheduled Dates Section */}
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Fechas Programadas
                        </h3>
                        {activity.scheduled_dates.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No hay fechas programadas</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {activity.scheduled_dates.map((date, index) => (
                              <div
                                key={index}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200"
                              >
                                {formatDate(date)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesView;
