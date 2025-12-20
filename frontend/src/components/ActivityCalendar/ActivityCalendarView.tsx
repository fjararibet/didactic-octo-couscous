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
import TemplateDetailModal from './TemplateDetailModal';
import esLocale from '@fullcalendar/core/locales/es';
import { Calendar, BarChart3 } from 'lucide-react';
import '../../styles/calendar.css';
import { SupervisorStatsModal } from '../SupervisorStatsModal';
import { activityStatusColors } from '../../styles/colors';
import { calculateActivityStatus } from '../../lib/utils';
import { assignUpToFiveActivitiesPerWeekday } from '@/lib/activityUtils';
import { isActivityMissed } from '@/types/activity';

interface ActivityCalendarViewProps {
  userId: number;
}

const ActivityCalendarView = ({ userId }: ActivityCalendarViewProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTemplates, setActivityTemplates] = useState<ActivityTemplate[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supervisorName, setSupervisorName] = useState<string>('');
  const draggableContainerRef = useRef<HTMLDivElement>(null);

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

  const events = activities.map(activity => {
    const status = calculateActivityStatus(activity);
    const isMissed = isActivityMissed(activity, status);

    // Use "missed" color if activity is missed, otherwise use status color
    const colorClass = isMissed ? activityStatusColors.missed : activityStatusColors[status];

    return {
      id: String(activity.id),
      title: `${activity.name} ${
        activity.todos.length > 0
          ? `(${Math.round(
              (activity.todos.filter(t => t.status !== 'pending').length / activity.todos.length) * 100
            )}%)`
          : ''
      }`,
      start: activity.scheduled_date!,
      allDay: true,
      classNames: [colorClass],
      extendedProps: { activity: { ...activity, status } },
    };
  });

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

  const handleAssignActivities = async () => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      await assignUpToFiveActivitiesPerWeekday(activityTemplates, year, month, userId);
      loadData();
    } catch (error) {
      console.error('Error assigning activities automatically:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Calendario de Actividades de {supervisorName}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsStatsModalOpen(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Estadísticas
          </Button>
          <Button onClick={handleAssignActivities}>
            Asignar Actividades Automáticamente
          </Button>
          <Button onClick={() => setIsNewActivityModalOpen(true)}>
            Nueva Plantilla de Actividad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4 lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-700">Plantillas de Actividad</h3>
            <span className="text-sm text-gray-500">({activityTemplates.length})</span>
          </div>
          {activityTemplates.length > 0 ? (
            <div className="relative overflow-y-auto pr-2 max-h-[calc(100vh-250px)]" style={{ scrollbarWidth: 'thin' }}>
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
                                    onClick={(e) => {
                                      // Only open modal if not dragging
                                      if (e.currentTarget === e.target || e.currentTarget.contains(e.target as Node)) {
                                        setSelectedTemplate(template);
                                        setIsTemplateModalOpen(true);
                                      }
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
                                  </div>              ))}
              </div>
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

      <TemplateDetailModal
        template={selectedTemplate}
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setSelectedTemplate(null);
        }}
      />

      <SupervisorStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        userId={userId}
        supervisorName={supervisorName}
      />
    </div>
  );
};

export default ActivityCalendarView;
