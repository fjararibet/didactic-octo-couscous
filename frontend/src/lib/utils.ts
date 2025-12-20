import { type Activity } from "@/types/activity";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateActivityStatus(activity: Activity): Activity['status'] {
  if (!activity.todos || activity.todos.length === 0) {
    return 'pending';
  }

  const doneTodos = activity.todos.filter(todo => todo.is_done).length;

  if (doneTodos === 0) {
    return 'pending';
  }

  if (doneTodos === activity.todos.length) {
    return 'done';
  }

  return 'in_progress';
}
