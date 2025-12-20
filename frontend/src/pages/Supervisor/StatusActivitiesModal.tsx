
import { useEffect, useState } from 'react';
import { activityService } from '@/services/activityService';
import { Activity } from '@/types/activity';
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
    if (isOpen) {
      setLoading(true);
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      activityService.getActivities(userId, firstDayOfMonth, lastDayOfMonth, status)
        .then(data => {
          setActivities(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching activities:", error);
          setLoading(false);
        });
    }
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
