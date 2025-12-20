import { useState } from 'react';
import type { Activity, TodoItem } from '@/types/activity';
import { activityService } from '@/services/activityService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { activityStatusBadgeColors } from '../../styles/colors';
import { calculateActivityStatus } from '../../lib/utils';

interface SupervisorActivityDetailModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onActivityUpdate: (updatedActivity: Activity) => void;
}

const SupervisorActivityDetailModal = ({
  activity,
  isOpen,
  onClose,
  onActivityUpdate,
}: SupervisorActivityDetailModalProps) => {
  const [localActivity, setLocalActivity] = useState(activity);
  const [isDirty, setIsDirty] = useState(false);
  const todos = localActivity.todos || [];
  const currentStatus = calculateActivityStatus(localActivity);

  const handleToggleTodo = async (todoId: number) => {
    try {
      const updatedTodo = await activityService.toggleTodoStatus(todoId);
      if (updatedTodo) {
        const updatedTodos = todos.map(t =>
          t.id === todoId ? { ...t, is_done: updatedTodo.is_done } : t
        );
        setLocalActivity({ ...localActivity, todos: updatedTodos });
        setIsDirty(true);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      onActivityUpdate(localActivity);
    }
    onClose();
  };

  const getStatusBadge = (status: Activity['status']) => {
    const labels = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      done: 'Completado',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${activityStatusBadgeColors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin programar';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
    }).format(date);
  };

  const completedTodos = todos.filter(t => t.is_done).length;
  const totalTodos = todos.length;
  const progressPercentage =
    totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{localActivity.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalles de la actividad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Estado:
              </span>
              {getStatusBadge(currentStatus)}
            </div>

            {localActivity.scheduled_date && (
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Fecha programada:{' '}
                </span>
                <span className="text-sm text-gray-800">
                  {formatDate(localActivity.scheduled_date)}
                </span>
              </div>
            )}

            {localActivity.finished_date && (
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Fecha completada:{' '}
                </span>
                <span className="text-sm text-gray-800">
                  {formatDate(localActivity.finished_date)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                Progreso de Tareas
              </span>
              <span className="text-gray-600">
                {completedTodos} de {totalTodos} completadas
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Tareas</h3>

            {todos.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50">
                No hay tareas asignadas a esta actividad
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {todos.map((todo: TodoItem) => (
                    <button
                      key={todo.id}
                      onClick={() => handleToggleTodo(todo.id)}
                      className={cn(
                        'flex items-start gap-2 py-1.5 px-2 rounded hover:bg-white transition-colors w-full text-left'
                      )}
                    >
                      {todo.is_done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`flex-1 text-sm ${
                          todo.is_done
                            ? 'text-gray-500 line-through'
                            : 'text-gray-800'
                        }`}
                      >
                        {todo.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
.
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorActivityDetailModal;
