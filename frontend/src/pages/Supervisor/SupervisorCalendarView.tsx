import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import esLocale from '@fullcalendar/core/locales/es';
import type { Activity } from '@/types/activity';
import { activityService } from '@/services/activityService';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import SupervisorActivityDetailModal from './SupervisorActivityDetailModal';
import '../../styles/calendar.css';

const SupervisorCalendarView = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const loadActivities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await activityService.getActivitiesByAssignee(user.id);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleEventClick = (clickInfo: { event: { id: string } }) => {
    const activityId = parseInt(clickInfo.event.id, 10);
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      setSelectedActivity(activity);
    }
  };

  const handleCloseModal = () => {
    setSelectedActivity(null);
  };

  const handleActivityUpdate = (updatedActivity: Activity) => {
    setActivities(prevActivities =>
      prevActivities.map(activity =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    );
  };

  const scheduledActivities = activities.filter(activity => activity.scheduled_date !== null);
  
  const events = scheduledActivities.map(activity => ({
    id: String(activity.id),
    title: activity.name,
    start: activity.scheduled_date!,
    allDay: true,
  }));

  return (
    <>
      <Card className="p-4 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Calendario de Actividades</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando actividades...</div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
          />
        )}
      </Card>
      {selectedActivity && (
        <SupervisorActivityDetailModal
          activity={selectedActivity}
          isOpen={!!selectedActivity}
          onClose={handleCloseModal}
          onActivityUpdate={handleActivityUpdate}
        />
      )}
    </>
  );
};

export default SupervisorCalendarView;

