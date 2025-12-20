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
import { X } from 'lucide-react';

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
  const [formData, setFormData] = useState({ name: '' });
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, newChecklistItem.trim()]);
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre de la actividad es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTemplate = await activityTemplateService.createActivityTemplate({
        name: formData.name,
      });

      if (newTemplate && checklist.length > 0) {
        await activityTemplateService.addTodoToTemplate(newTemplate.id, 
          checklist.map(item => ({description: item}))
        );
      }

      // Reset form
      setFormData({ name: '' });
      setChecklist([]);
      setNewChecklistItem('');

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
      setFormData({ name: '' });
      setChecklist([]);
      setNewChecklistItem('');
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
          <div className="space-y-2">
            <Label htmlFor="activity-name">Nombre de la Plantilla</Label>
            <Input
              id="activity-name"
              placeholder="Ej: Inspección de extintores"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Checklist</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Añadir tarea a la checklist"
                value={newChecklistItem}
                onChange={e => setNewChecklistItem(e.target.value)}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                onClick={handleAddChecklistItem}
                disabled={isSubmitting || !newChecklistItem.trim()}
              >
                Añadir
              </Button>
            </div>
            <ul className="space-y-2 pt-2">
              {checklist.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                >
                  <span>{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveChecklistItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

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