import { useState, useEffect } from 'react';
import { activityService } from '@/services/activityService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated: () => void;
  userId: number;
  initialDate?: string | null;
}

const NewActivityModal = ({
  isOpen,
  onClose,
  onActivityCreated,
  userId,
  initialDate,
}: NewActivityModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    scheduled_date: '',
    scheduled_time: '09:00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set initial date when provided
  useEffect(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      const dateString = date.toISOString().split('T')[0];
      const timeString = date.toTimeString().slice(0, 5);

      setFormData(prev => ({
        ...prev,
        scheduled_date: dateString,
        scheduled_time: timeString || '09:00',
      }));
    }
  }, [initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre de la actividad es requerido');
      return;
    }

    if (!formData.scheduled_date) {
      setError('La fecha es requerida');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;

      await activityService.createActivity(
        {
          name: formData.name,
          scheduled_date: scheduledDateTime,
        },
        userId
      );

      // Reset form
      setFormData({
        name: '',
        scheduled_date: '',
        scheduled_time: '09:00',
      });

      onActivityCreated();
    } catch (err) {
      console.error('Error creating activity:', err);
      setError('Error al crear la actividad. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        scheduled_date: '',
        scheduled_time: '09:00',
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Actividad</DialogTitle>
          <DialogDescription>
            Crea una nueva actividad de seguridad y prevención
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Name */}
          <div className="space-y-2">
            <Label htmlFor="activity-name">Nombre de la Actividad</Label>
            <Input
              id="activity-name"
              placeholder="Ej: Inspección de extintores"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="activity-date">Fecha Programada</Label>
            <Input
              id="activity-date"
              type="date"
              value={formData.scheduled_date}
              onChange={e => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Scheduled Time */}
          <div className="space-y-2">
            <Label htmlFor="activity-time">Hora Programada</Label>
            <Input
              id="activity-time"
              type="time"
              value={formData.scheduled_time}
              onChange={e => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Actividad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewActivityModal;