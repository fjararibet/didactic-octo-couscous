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
  created_by_id: number;
  assigned_to_id: number | null;
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
  } | null;
  todos: {
    id: number;
    description: string;
    is_done: boolean;
    activity_id: number;
  }[];
}

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
  assigned_to_id?: number;
  activity_template_id?: number;
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