export interface User {
  id: number;
  username: string;
  email: string;
  role: 'preventionist' | 'supervisor' | 'admin';
}

export type TodoStatus = 'pending' | 'yes' | 'no' | 'not_apply';

export interface TodoItem {
  id: number;
  description: string;
  status: TodoStatus;
  activity_id: number;
}

export interface Activity {
  id: number;
  name: string;
  scheduled_date: string | null;
  finished_date: string | null;
  created_by_id: number;
  assigned_to_id: number;
  activity_template_id: number | null;
  created_by: {
    id: number;
    username: string;
    email: string;
    role: 'preventionist' | 'supervisor' | 'admin';
  };
  assigned_to: {
    id: number;
    username: string;
    email: string;
    role: 'preventionist' | 'supervisor' | 'admin';
  };
  todos: TodoItem[];
}

export type ActivityStatus = 'pending' | 'in_progress' | 'done' | 'missed';

export const getActivityStatus = (activity: Activity): ActivityStatus => {
  if (!activity.todos || activity.todos.length === 0) {
    return 'pending';
  }

  const doneCount = activity.todos.filter((todo) => todo.status === 'yes' || todo.status === 'not_apply').length;

  if (doneCount === 0) {
    return 'pending';
  }

  if (doneCount === activity.todos.length) {
    return 'done';
  }

  return 'in_progress';
};


export interface ActivityTemplate {
  id: number;
  name: string;
  description: string | null;
  template_todos: {
    id: number;
    description: string;
    template_id: number;
  }[];
}


export interface CreateActivityDto {
  name: string;
  scheduled_date?: string | null;
  assigned_to_id: number;
  activity_template_id?: number;
}

export interface UpdateActivityDto {
  name?: string;
  scheduled_date?: string | null;
  assigned_to_id?: number;
}

export interface CreateTodoDto {
  description: string;
  activity_id: number;
}

export interface ActivityWithSupervisors {
  activity_name: string;
  activity_id: number | null;
  scheduled_dates: string[];
  supervisor_count: number;
  supervisors: User[];
}

export const isActivityMissed = (
  activity: Activity,
  status: ActivityStatus
): boolean => {
  // Only mark as missed if not already done
  if (status === "done") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day for comparison

  const scheduledDate = activity.scheduled_date ? new Date(activity.scheduled_date) : null;
  if (scheduledDate) {
    scheduledDate.setHours(0, 0, 0, 0); // Normalize scheduled_date to start of day
  }

  // An activity is missed if its status is not "done" and the scheduled date is in the past.
  if (scheduledDate && scheduledDate < today) {
    return true;
  }

  return false;
};

export interface DetailedStats {
  status_distribution: {
    pending: number;
    in_progress: number;
    done: number;
    missed: number;
  };
  total_activities: number;
  upcoming_activities: number;
  completion_rate: number;
  completion_trend: number;
  avg_task_completion: number;
  completed_tasks: number;
  total_tasks: number;
  prev_completion_rate: number;
}
