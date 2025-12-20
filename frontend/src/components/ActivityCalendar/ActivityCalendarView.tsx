import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import type { Activity } from '@/types/activity';
import { activityService } from '@/services/activityService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ActivityDetailModal from './ActivityDetailModal';
import NewActivityModal from './NewActivityModal';
import esLocale from '@fullcalendar/core/locales/es';
import { Calendar } from 'lucide-react';
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
  const draggableRef = useRef<HTMLDivElement>(null);
  const draggableInstanceRef = useRef<Draggable | null>(null);

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

  // Initialize draggable for unscheduled activities
  useEffect(() => {
    if (draggableRef.current && !draggableInstanceRef.current) {
      draggableInstanceRef.current = new Draggable(draggableRef.current, {
        itemSelector: '.fc-event',
        longPressDelay: 0,
        eventData: function(eventEl) {
          const activityId = eventEl.getAttribute('data-activity-id');
          const activity = activities.find(a => a.id === parseInt(activityId || '0'));

          if (activity) {
            const completedTodos = activity.todos.filter(t => t.is_done).length;
            const totalTodos = activity.todos.length;

            return {
              title: `${activity.name} (${completedTodos}/${totalTodos})`,
              allDay: true,
              backgroundColor: getStatusColor(activity.status),
              borderColor: getStatusColor(activity.status),
              extendedProps: {
                activityId: activity.id,
              }
            };
          }
          return null;
        }
      });
    }

    return () => {
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.destroy();
        draggableInstanceRef.current = null;
      }
    };
  }, [activities]);

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

  // Separate scheduled and unscheduled activities
  const scheduledActivities = activities.filter(a => a.scheduled_date !== null);
  const unscheduledActivities = activities.filter(a => a.scheduled_date === null);

  // Convert scheduled activities to calendar events
  const events = scheduledActivities.map(activity => {
    const completedTodos = activity.todos.filter(t => t.is_done).length;
    const totalTodos = activity.todos.length;

    return {
      id: String(activity.id),
      title: `${activity.name} (${completedTodos}/${totalTodos})`,
      start: activity.scheduled_date!,
      allDay: true,
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

  // Handle activity updated (refresh without closing modal)
  const handleActivityUpdated = async () => {
    const updatedActivities = await activityService.getActivitiesByCreator(userId);
    setActivities(updatedActivities);

    // Update the selected activity with fresh data
    if (selectedActivity) {
      const updatedActivity = updatedActivities.find(a => a.id === selectedActivity.id);
      if (updatedActivity) {
        setSelectedActivity(updatedActivity);
      }
    }
  };

  // Handle event drop (when activity is dragged to new date)
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const activity = dropInfo.event.extendedProps.activity as Activity;
    const newDate = dropInfo.event.start;

    if (!newDate) return;

    try {
      await activityService.updateActivity(activity.id, {
        scheduled_date: newDate.toISOString(),
      });

      // Update state without full reload for smoother UX
      const updatedActivities = await activityService.getActivitiesByCreator(userId);
      setActivities(updatedActivities);
    } catch (error) {
      console.error('Error updating activity date:', error);
      dropInfo.revert();
    }
  };

  // Handle unscheduled activity click
  const handleUnscheduledActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Calendario de Actividades</h2>
        <Button onClick={() => setIsNewActivityModalOpen(true)}>
          Nueva Actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Unscheduled Activities Sidebar */}
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-700">Sin Programar</h3>
            <span className="text-sm text-gray-500">({unscheduledActivities.length})</span>
          </div>

          {unscheduledActivities.length > 0 ? (
            <>
              <div ref={draggableRef} className="space-y-2">
                {unscheduledActivities.map(activity => {
                  const completedTodos = activity.todos.filter(t => t.is_done).length;
                  const totalTodos = activity.todos.length;

                  return (
                    <div
                      key={activity.id}
                      data-activity-id={activity.id}
                      onClick={() => handleUnscheduledActivityClick(activity)}
                      className="fc-event p-4 rounded-xl cursor-move hover:shadow-2xl hover:scale-105 border-l-4 unscheduled-activity"
                      style={{
                        borderLeftColor: getStatusColor(activity.status),
                        backgroundColor: '#ffffff',
                        boxShadow: `0 2px 8px ${getStatusColor(activity.status)}40`,
                        border: `2px solid ${getStatusColor(activity.status)}`,
                        borderLeftWidth: '6px',
                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-900 mb-1">{activity.name}</div>
                          <div className="text-xs text-gray-500 font-medium">
                            {completedTodos}/{totalTodos} tareas completadas
                          </div>
                        </div>
                        <div
                          className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: getStatusColor(activity.status) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-4 italic">
                Arrastra las actividades al calendario para programarlas
              </p>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay actividades sin programar</p>
              <p className="text-xs mt-2">Todas las actividades tienen fecha asignada</p>
            </div>
          )}
        </Card>

        {/* Calendar */}
        <Card className="p-4 lg:col-span-3">
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
              eventDrop={handleEventDrop}
              editable={true}
              droppable={true}
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
              snapDuration="00:15:00"
              eventDragMinDistance={5}
              longPressDelay={0}
              eventDurationEditable={false}
              drop={async (info) => {
                const activityId = info.draggedEl.getAttribute('data-activity-id');
                if (activityId) {
                  const activity = unscheduledActivities.find(a => a.id === parseInt(activityId));
                  if (activity) {
                    // Format date as YYYY-MM-DD at noon UTC to avoid timezone issues
                    const year = info.date.getFullYear();
                    const month = String(info.date.getMonth() + 1).padStart(2, '0');
                    const day = String(info.date.getDate()).padStart(2, '0');
                    const newDate = `${year}-${month}-${day}T12:00:00.000Z`;

                    try {
                      await activityService.updateActivity(activity.id, {
                        scheduled_date: newDate,
                      });

                      // Update state without full reload for smoother UX
                      const updatedActivities = await activityService.getActivitiesByCreator(userId);
                      setActivities(updatedActivities);
                    } catch (error) {
                      console.error('Error scheduling activity:', error);
                    }
                  }
                }
              }}
            />
          )}
        </Card>
      </div>

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