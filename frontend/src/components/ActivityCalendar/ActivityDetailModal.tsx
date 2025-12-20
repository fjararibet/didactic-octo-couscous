import { useState } from "react";
import type { Activity } from "@/types/activity";
import { isActivityMissed } from "@/types/activity";
import { activityService } from "@/services/activityService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { activityStatusBadgeColors } from '../../styles/colors';
import { calculateActivityStatus } from '../../lib/utils';

interface ActivityDetailModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  userId: number;
}

const ActivityDetailModal = ({
  activity,
  isOpen,
  onClose,
  onUpdate,
}: ActivityDetailModalProps) => {
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const currentStatus = calculateActivityStatus(activity);
  const missed = isActivityMissed(activity, currentStatus);

  const handleAddTodo = async () => {
    if (!newTodoDescription.trim()) return;

    setIsAddingTodo(true);
    try {
      await activityService.addTodoToActivity({
        description: newTodoDescription,
        activity_id: activity.id,
      });
      setNewTodoDescription("");
      onUpdate();
    } catch (error) {
      console.error("Error adding todo:", error);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const getStatusBadge = (status: Activity["status"]) => {
    const labels = {
      pending: "Pendiente",
      in_progress: "En Progreso",
      done: "Completado",
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
    if (!dateString) return "Sin programar";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "full",
    }).format(date);
  };

  const completedTodos = activity.todos.filter((t) => t.is_done).length;
  const totalTodos = activity.todos.length;
  const progressPercentage =
    totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{activity.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalles de la actividad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Estado:</span>
              {getStatusBadge(currentStatus)}
              {missed && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Atrasada
                </span>
              )}
            </div>

            {activity.scheduled_date && (
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Fecha programada:{" "}
                </span>
                <span className="text-sm text-gray-800">
                  {formatDate(activity.scheduled_date)}
                </span>
              </div>
            )}

            {activity.finished_date && (
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Fecha completada:{" "}
                </span>
                <span className="text-sm text-gray-800">
                  {formatDate(activity.finished_date)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
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

          {/* Todo List */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Tareas</h3>

            {activity.todos.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50">
                No hay tareas asignadas a esta actividad
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {activity.todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-white transition-colors"
                    >
                      {todo.is_done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`flex-1 text-sm ${
                          todo.is_done
                            ? "text-gray-500 line-through"
                            : "text-gray-800"
                        }`}
                      >
                        {todo.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add New Todo */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-base font-semibold text-gray-800">
              Agregar Nueva Tarea
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Descripción de la tarea..."
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTodo();
                  }
                }}
                disabled={isAddingTodo}
                className="text-sm"
              />
              <Button
                onClick={handleAddTodo}
                disabled={!newTodoDescription.trim() || isAddingTodo}
                size="sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Agregar</span>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;

