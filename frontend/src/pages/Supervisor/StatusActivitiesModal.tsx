
import { useEffect, useState } from 'react';
import { activityService } from '@/services/activityService';
import { Activity, getActivityStatus } from '@/types/activity';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StatusActivitiesModalProps {
  status: string;
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const StatusActivitiesModal = ({ status, userId, isOpen, onClose }: StatusActivitiesModalProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          firstDayOfMonth.setHours(0, 0, 0, 0);
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          lastDayOfMonth.setHours(23, 59, 59, 999);

          const allActivities = await activityService.getActivitiesByAssignee(userId);

          const filteredActivities = allActivities.filter(activity => {
            const activityDate = activity.scheduled_date ? new Date(activity.scheduled_date) : null;
            const activityStatus = getActivityStatus(activity);

            return activityDate &&
                   activityDate >= firstDayOfMonth &&
                   activityDate <= lastDayOfMonth &&
                   activityStatus === status;
          });
          setActivities(filteredActivities);
        } catch (error) {
          console.error("Error fetching activities:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActivities();
  }, [isOpen, status, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actividades con estado: {status}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul>
            {activities.map(activity => (
              <li key={activity.id}>{activity.title}</li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};
