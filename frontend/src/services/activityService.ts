import type { Activity, CreateActivityDto, CreateTodoDto, TodoItem, UpdateActivityDto } from '@/types/activity';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const activityService = {
  // Get all activities for a user (by creator)
  async getActivitiesByCreator(userId: number): Promise<Activity[]> {
    const response = await authService.fetchWithAuth(`${API_URL}/activities/by-creator/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    return await response.json();
  },

  // Get a single activity by ID
  async getActivityById(id: number): Promise<Activity | null> {
    const response = await authService.fetchWithAuth(`${API_URL}/activities/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch activity');
    }

    const activity = await response.json();

    // Fetch todos for this activity
    const todosResponse = await authService.fetchWithAuth(`${API_URL}/todos?activity_id=${id}`);
    if (todosResponse.ok) {
      activity.todos = await todosResponse.json();
    } else {
      activity.todos = [];
    }

    return activity;
  },

  // Create a new activity
  async createActivity(data: CreateActivityDto): Promise<Activity> {
    const response = await authService.fetchWithAuth(`${API_URL}/activities/`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        status: 'pending',
        scheduled_date: data.scheduled_date ?? null,
        finished_date: null,
        assigned_to_id: data.assigned_to_id ?? null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create activity');
    }

    const newActivity = await response.json();
    newActivity.todos = [];

    return newActivity;
  },

  // Update an activity
  async updateActivity(id: number, data: UpdateActivityDto): Promise<Activity | null> {
    const updatePayload: Partial<UpdateActivityDto> & { finished_date?: string | null } = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === 'done') {
        updatePayload.finished_date = new Date().toISOString();
      }
    }
    if (data.scheduled_date !== undefined) {
      updatePayload.scheduled_date = data.scheduled_date;
    }
    if (data.assigned_to_id !== undefined) {
      updatePayload.assigned_to_id = data.assigned_to_id;
    }

    const response = await authService.fetchWithAuth(`${API_URL}/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to update activity');
    }

    return await response.json();
  },

  // Update activity status
  async updateActivityStatus(id: number, status: Activity['status']): Promise<Activity | null> {
    return this.updateActivity(id, { status });
  },

  // Add a todo to an activity
  async addTodoToActivity(data: CreateTodoDto): Promise<TodoItem> {
    const response = await authService.fetchWithAuth(`${API_URL}/todos/`, {
      method: 'POST',
      body: JSON.stringify({
        description: data.description,
        is_done: false,
        activity_id: data.activity_id,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add todo');
    }

    return await response.json();
  },

  // Toggle todo status
  async toggleTodoStatus(todoId: number): Promise<TodoItem | null> {
    // First, get the current todo to know its current state
    const todoResponse = await authService.fetchWithAuth(`${API_URL}/todos/${todoId}`);

    if (todoResponse.status === 404) {
      return null;
    }

    if (!todoResponse.ok) {
      throw new Error('Failed to fetch todo');
    }

    const todo: TodoItem = await todoResponse.json();

    // Update with toggled status
    const response = await authService.fetchWithAuth(`${API_URL}/todos/${todoId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        is_done: !todo.is_done,
      }),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to update todo');
    }

    return await response.json();
  },
};