import { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { Activity, ActivityTemplate } from '@/types/activity';
import { activityService } from '@/services/activityService';
import { activityTemplateService } from '@/services/activityTemplateService';
import { userService } from '@/services/userService';
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
  const [activityTemplates, setActivityTemplates] = useState<ActivityTemplate[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supervisorName, setSupervisorName] = useState<string>('');
  const draggableContainerRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in_progress':
        return '#3b82f6';
      case 'done':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [activityData, templateData, userData] = await Promise.all([
        activityService.getActivitiesByAssignee(userId),
        activityTemplateService.getActivityTemplates(),
        userService.getUserById(userId),
      ]);
      setActivities(activityData);
      setActivityTemplates(templateData);
      setSupervisorName(userData.username);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (draggableContainerRef.current) {
      const draggable = new Draggable(draggableContainerRef.current, {
        itemSelector: '.fc-event.template-card',
        eventData: function (eventEl) {
          const templateId = eventEl.getAttribute('data-template-id');
          return {
            id: `template-${templateId}`,
            title: eventEl.innerText.split('\n')[0], // Get the name from the template card
            create: true,
            extendedProps: {
              templateId: templateId ? parseInt(templateId) : null,
            },
          };
        },
      });

      return () => draggable.destroy();
    }
  }, [activityTemplates]); // Re-initialize if templates change

  const events = activities.map(activity => ({
    id: String(activity.id),
    title: `${activity.name} ${
      activity.todos.length > 0
        ? `(${Math.round(
            (activity.todos.filter(t => t.is_done).length / activity.todos.length) * 100
          )}%)`
        : ''
    }`,
    start: activity.scheduled_date!,
    allDay: true,
    backgroundColor: getStatusColor(activity.status),
    borderColor: getStatusColor(activity.status),
    extendedProps: { activity },
  }));

  const handleEventClick = (clickInfo: EventClickArg) => {
    const activity = clickInfo.event.extendedProps.activity as Activity;
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const handleActivityTemplateCreated = () => {
    loadData();
    setIsNewActivityModalOpen(false);
  };

  const handleActivityUpdated = async () => {
    const updatedActivities = await activityService.getActivitiesByAssignee(userId);
    setActivities(updatedActivities);
    if (selectedActivity) {
      const updatedActivity = updatedActivities.find(a => a.id === selectedActivity.id);
      if (updatedActivity) {
        setSelectedActivity(updatedActivity);
      }
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const activity = dropInfo.event.extendedProps.activity as Activity;
    const newDate = dropInfo.event.start;
    if (!newDate) return;
    try {
      await activityService.updateActivity(activity.id, {
        scheduled_date: newDate.toISOString(),
      });
      loadData();
    } catch (error) {
      console.error('Error updating activity date:', error);
      dropInfo.revert();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Calendario de Actividades de {supervisorName}
        </h2>
        <Button onClick={() => setIsNewActivityModalOpen(true)}>
          Nueva Plantilla de Actividad
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-700">Plantillas de Actividad</h3>
            <span className="text-sm text-gray-500">({activityTemplates.length})</span>
          </div>
          {activityTemplates.length > 0 ? (
            <div ref={draggableContainerRef} className="space-y-2">
              {activityTemplates.map(template => (
                                  <div
                                    key={template.id}
                                    data-template-id={template.id}
                                    className="fc-event p-4 rounded-xl cursor-move hover:shadow-2xl hover:scale-105 border-l-4 template-card relative group"
                                    style={{
                                      borderLeftColor: '#6b7280', // gray
                                      backgroundColor: '#ffffff',
                                      boxShadow: `0 2px 8px rgba(107, 114, 128, 0.25)`,
                                      border: `2px solid #e5e7eb`,
                                      borderLeftWidth: '6px',
                                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="font-bold text-sm text-gray-900 mb-1">{template.name}</div>
                                        <div className="text-xs text-gray-500 font-medium">
                                          {template.template_todos.length} tareas
                                        </div>
                                      </div>
                                      <div
                                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                                        style={{ backgroundColor: '#6b7280' }} // gray
                                      />
                                    </div>

                                    {/* Tooltip con lista de tareas */}
                                    {template.template_todos.length > 0 && (
                                      <div className="absolute bottom-full mb-2 left-0 right-0 z-[9999] hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 max-w-xs">
                                        <div className="font-semibold mb-2 text-gray-100">Tareas de la plantilla:</div>
                                        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                                          {template.template_todos.map((todo, idx) => (
                                            <li key={todo.id} className="flex items-start gap-2">
                                              <span className="text-gray-400 shrink-0">{idx + 1}.</span>
                                              <span className="text-gray-200">{todo.description}</span>
                                            </li>
                                          ))}
                                        </ul>
                                        {/* Flecha del tooltip */}
                                        <div
                                          className="absolute top-full left-4 border-8 border-transparent border-t-gray-900"
                                        />
                                      </div>
                                    )}
                                  </div>              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay plantillas de actividad</p>
            </div>
          )}
        </Card>

        <Card className="p-4 lg:col-span-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
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
              height="auto"
              drop={async info => {
                const templateId = info.draggedEl.getAttribute('data-template-id');
                if (templateId) {
                  const template = activityTemplates.find(t => t.id === parseInt(templateId));
                  if (template) {
                    const newDate = `${info.dateStr}T12:00:00.000Z`;
                    try {
                      const newActivity = await activityService.createActivity({
                        name: template.name,
                        scheduled_date: newDate,
                        assigned_to_id: userId,
                        activity_template_id: parseInt(templateId),
                      });
                      setActivities(prevActivities => [...prevActivities, newActivity]);
                    } catch (error) {
                      console.error('Error creating activity from template:', error);
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
        onClose={() => setIsNewActivityModalOpen(false)}
        onActivityTemplateCreated={handleActivityTemplateCreated}
      />
    </div>
  );
};

export default ActivityCalendarView;
