import { useState } from 'react';
import { activityTemplateService } from '@/services/activityTemplateService';
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
  onActivityTemplateCreated: () => void;
}

const NewActivityModal = ({
  isOpen,
  onClose,
  onActivityTemplateCreated,
}: NewActivityModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre de la actividad es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      await activityTemplateService.createActivityTemplate({
        name: formData.name,
      });

      // Reset form
      setFormData({
        name: '',
      });

      onActivityTemplateCreated();
    } catch (err) {
      console.error('Error creating activity template:', err);
      setError(
        'Error al crear la plantilla de actividad. Por favor, intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Plantilla de Actividad</DialogTitle>
          <DialogDescription>
            Crea una nueva plantilla de actividad de seguridad y prevención
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Name */}
          <div className="space-y-2">
            <Label htmlFor="activity-name">Nombre de la Plantilla</Label>
            <Input
              id="activity-name"
              placeholder="Ej: Inspección de extintores"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
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
              {isSubmitting ? 'Creando...' : 'Crear Plantilla'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewActivityModal;