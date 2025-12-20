import { useState, useEffect } from 'react';
import type { Activity, TodoItem, TodoStatus } from '@/types/activity';
import { isActivityMissed } from '@/types/activity';
import { activityService } from '@/services/activityService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, XCircle, Ban, Send } from 'lucide-react';
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
  const todos = localActivity.todos || [];
  const currentStatus = calculateActivityStatus(localActivity);
  const missed = isActivityMissed(localActivity, currentStatus);

  useEffect(() => {
    setLocalActivity(activity);
  }, [activity]);

  const handleCycleTodoStatus = async (todoId: number, currentStatus: TodoStatus) => {
    let nextStatus: TodoStatus = 'yes';
    if (currentStatus === 'pending') nextStatus = 'yes';
    else if (currentStatus === 'yes') nextStatus = 'no';
    else if (currentStatus === 'no') nextStatus = 'not_apply';
    else if (currentStatus === 'not_apply') nextStatus = 'pending';

    try {
      const updatedTodo = await activityService.updateTodoStatus(todoId, nextStatus);
      if (updatedTodo) {
        const updatedTodos = todos.map(t =>
          t.id === todoId ? { ...t, status: updatedTodo.status } : t
        );
        const newLocalActivity = { ...localActivity, todos: updatedTodos };
        setLocalActivity(newLocalActivity);
        onActivityUpdate(newLocalActivity);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleSendToReview = async () => {
    try {
      const updated = await activityService.updateActivity(localActivity.id, {
        in_review: true,
      });
      if (updated) {
        onActivityUpdate(updated);
        onClose();
      }
    } catch (error) {
      console.error('Error sending to review:', error);
    }
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

  const completedTodos = todos.filter(t => t.status !== 'pending').length;
  const totalTodos = todos.length;
  const progressPercentage =
    totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  const getTodoIcon = (status: TodoStatus) => {
    switch (status) {
      case 'yes':
        return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />;
      case 'no':
        return <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
      case 'not_apply':
        return <Ban className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />;
    }
  };

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
              {missed && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Atrasada
                </span>
              )}
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
                      onClick={() => handleCycleTodoStatus(todo.id, todo.status)}
                      className={cn(
                        'flex items-start gap-2 py-1.5 px-2 rounded hover:bg-white transition-colors w-full text-left'
                      )}
                    >
                      {getTodoIcon(todo.status)}
                      <span
                        className={`flex-1 text-sm ${
                          todo.status !== 'pending'
                            ? 'text-gray-500'
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
            <Button
              onClick={handleSendToReview}
              disabled={completedTodos !== totalTodos || localActivity.in_review}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {localActivity.in_review ? 'En Revisión' : 'Enviar a Revisión'}
            </Button>
          </div>

          {/* Legend */}
          <div className="pt-2 border-t flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span>Completada</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-600" />
              <span>No Realizada</span>
            </div>
            <div className="flex items-center gap-1">
              <Ban className="w-3 h-3 text-gray-500" />
              <span>No Aplica</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="w-3 h-3 text-gray-400" />
              <span>Pendiente</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorActivityDetailModal;
