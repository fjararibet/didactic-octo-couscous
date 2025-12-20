import { type Activity, type ActivityStatus, isActivityMissed } from "@/types/activity";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateActivityStatus(activity: Activity): ActivityStatus {
  // First calculate base status from todos
  let status: ActivityStatus;

  if (!activity.todos || activity.todos.length === 0) {
    status = 'pending';
  } else {
    const doneTodos = activity.todos.filter(todo => todo.is_done).length;

    if (doneTodos === 0) {
      status = 'pending';
    } else if (doneTodos === activity.todos.length) {
      status = 'done';
    } else {
      status = 'in_progress';
    }
  }

  // Check if activity is missed (overrides other statuses)
  if (isActivityMissed(activity, status)) {
    return 'missed';
  }

  return status;
}
