import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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
        activityService.getActivitiesByCreator(userId),
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

  const events = activities.map(activity => ({
    id: String(activity.id),
    title: `${activity.name} (${activity.todos.filter(t => t.is_done).length}/${
      activity.todos.length
    }) - ${activity.assigned_to.username}`,
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
    const updatedActivities = await activityService.getActivitiesByCreator(userId);
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
            <div className="space-y-2">
              {activityTemplates.map(template => (
                <div
                  key={template.id}
                  data-template-id={template.id}
                  className="fc-event p-4 rounded-xl cursor-move hover:shadow-2xl hover:scale-105 border-l-4"
                  style={{
                    borderLeftColor: '#6b7280',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #e5e7eb',
                    borderLeftWidth: '6px',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                >
                  <div className="font-bold text-sm text-gray-900">{template.name}</div>
                </div>
              ))}
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
                      await activityService.createActivity({
                        name: template.name,
                        scheduled_date: newDate,
                        assigned_to_id: userId,
                      });
                      loadData();
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
