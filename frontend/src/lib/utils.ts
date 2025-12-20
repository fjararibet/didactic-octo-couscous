import { type Activity, type ActivityStatus } from "@/types/activity";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateActivityStatus(activity: Activity): ActivityStatus {
  if (!activity.todos || activity.todos.length === 0) {
    return 'pending';
  }

  const doneTodos = activity.todos.filter(todo => todo.status !== 'pending').length;

  if (doneTodos === 0) {
    return 'pending';
  } else if (doneTodos === activity.todos.length) {
    return 'done';
  } else {
    return 'in_progress';
  }
}
