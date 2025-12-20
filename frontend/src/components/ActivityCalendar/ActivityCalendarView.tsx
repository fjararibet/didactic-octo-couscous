import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import type { Activity } from '@/types/activity';
import { activityService } from '@/services/activityService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ActivityDetailModal from './ActivityDetailModal';
import NewActivityModal from './NewActivityModal';
import esLocale from '@fullcalendar/core/locales/es';
import '../../styles/calendar.css';

interface ActivityCalendarViewProps {
  userId: number;
}

const ActivityCalendarView = ({ userId }: ActivityCalendarViewProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [newActivityDate, setNewActivityDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load activities
  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await activityService.getActivitiesByCreator(userId);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [userId]);

  // Get status color
  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // amber
      case 'in_progress':
        return '#3b82f6'; // blue
      case 'done':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  // Convert activities to calendar events
  const events = activities.map(activity => {
    const completedTodos = activity.todos.filter(t => t.is_done).length;
    const totalTodos = activity.todos.length;

    return {
      id: String(activity.id),
      title: `${activity.name} (${completedTodos}/${totalTodos})`,
      start: activity.scheduled_date,
      backgroundColor: getStatusColor(activity.status),
      borderColor: getStatusColor(activity.status),
      extendedProps: {
        activity,
      },
    };
  });

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const activity = clickInfo.event.extendedProps.activity as Activity;
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  // Handle date select (for creating new activity)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setNewActivityDate(selectInfo.startStr);
    setIsNewActivityModalOpen(true);
    selectInfo.view.calendar.unselect();
  };

  // Handle activity created
  const handleActivityCreated = () => {
    loadActivities();
    setIsNewActivityModalOpen(false);
    setNewActivityDate(null);
  };

  // Handle activity updated
  const handleActivityUpdated = () => {
    loadActivities();
    setIsDetailModalOpen(false);
    setSelectedActivity(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Calendario de Actividades</h2>
        <Button onClick={() => setIsNewActivityModalOpen(true)}>
          Nueva Actividad
        </Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando actividades...</div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Lista',
            }}
            events={events}
            eventClick={handleEventClick}
            selectable={true}
            select={handleDateSelect}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="19:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
          />
        )}
      </Card>

      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedActivity(null);
          }}
          onUpdate={handleActivityUpdated}
          userId={userId}
        />
      )}

      <NewActivityModal
        isOpen={isNewActivityModalOpen}
        onClose={() => {
          setIsNewActivityModalOpen(false);
          setNewActivityDate(null);
        }}
        onActivityCreated={handleActivityCreated}
        userId={userId}
        initialDate={newActivityDate}
      />
    </div>
  );
};

export default ActivityCalendarView;