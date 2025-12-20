import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ActivityTemplate } from '@/types/activity';
import { CheckCircle2 } from 'lucide-react';

interface TemplateDetailModalProps {
  template: ActivityTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

const TemplateDetailModal = ({ template, isOpen, onClose }: TemplateDetailModalProps) => {
  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {template.description && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Descripción</h3>
              <p className="text-gray-600">{template.description}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">
              Tareas de la plantilla ({template.template_todos.length})
            </h3>
            {template.template_todos.length > 0 ? (
              <ul className="space-y-2">
                {template.template_todos.map((todo) => (
                  <li key={todo.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800">{todo.description}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No hay tareas definidas para esta plantilla</p>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              💡 <strong>Tip:</strong> Arrastra esta plantilla al calendario para crear una nueva actividad
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDetailModal;
