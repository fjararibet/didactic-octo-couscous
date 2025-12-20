export interface User {
  id: number;
  username: string;
  email: string;
  role: 'preventionist' | 'supervisor' | 'admin';
}

export interface TodoItem {
  id: number;
  description: string;
  is_done: boolean;
  activity_id: number;
}

export interface Activity {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'done';
  scheduled_date: string | null;
  finished_date: string | null;
  created_by: User;
  assigned_to: User | null;
  todos: TodoItem[];
}

export interface CreateActivityDto {
  name: string;
  scheduled_date?: string | null;
  assigned_to_id?: number;
}

export interface UpdateActivityDto {
  name?: string;
  status?: 'pending' | 'in_progress' | 'done';
  scheduled_date?: string | null;
  assigned_to_id?: number;
}

export interface CreateTodoDto {
  description: string;
  activity_id: number;
}