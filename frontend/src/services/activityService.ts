import type { Activity, CreateActivityDto, CreateTodoDto, TodoItem, UpdateActivityDto, ActivityWithSupervisors } from '@/types/activity';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const activityService = {
  // Get activity status stats for a user
  async getActivityStatusStats(userId: number): Promise<{ [key: string]: number }> {
    const response = await authService.fetchWithAuth(`${API_URL}/activity/statuses_stats/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch activity status stats');
    }

    return await response.json();
  },

  // Get detailed activity stats for a user
  async getDetailedActivityStats(userId: number): Promise<{
    status_distribution: { [key: string]: number };
    total_activities: number;
    upcoming_activities: number;
    completion_rate: number;
    prev_completion_rate: number;
    completion_trend: number;
    avg_task_completion: number;
    total_tasks: number;
    completed_tasks: number;
  }> {
    const response = await authService.fetchWithAuth(`${API_URL}/activity/statuses_stats/detailed/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch detailed activity stats');
    }

    return await response.json();
  },

  // Get general detailed activity stats for a preventionist (all assigned supervisors)
  async getGeneralDetailedActivityStats(): Promise<{
    status_distribution: { [key: string]: number };
    total_activities: number;
    upcoming_activities: number;
    completion_rate: number;
    prev_completion_rate: number;
    completion_trend: number;
    avg_task_completion: number;
    total_tasks: number;
    completed_tasks: number;
    supervisors_stats: {
      id: number;
      name: string;
      assigned: number;
      completed: number;
      completed_on_time: number;
      late: number;
    }[];
  }> {
    const response = await authService.fetchWithAuth(`${API_URL}/activity/statuses_stats/general/detailed`);

    if (!response.ok) {
      throw new Error('Failed to fetch general detailed activity stats');
    }

    return await response.json();
  },

  // Get all activities for a user (by creator)
  async getActivitiesByCreator(userId: number): Promise<Activity[]> {
    const response = await authService.fetchWithAuth(`${API_URL}/activities/by-creator/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    return await response.json();
  },

  // Get all activities for a user (by assignee)
  async getActivitiesByAssignee(userId: number): Promise<Activity[]> {
    const response = await authService.fetchWithAuth(`${API_URL}/activities/by-assignee/${userId}`);

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
        scheduled_date: data.scheduled_date ?? null,
        finished_date: null,
        assigned_to_id: data.assigned_to_id ?? null,
        activity_template_id: data.activity_template_id ?? null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create activity');
    }

    const newActivity = await response.json();
    return newActivity;
  },

  // Update an activity
  async updateActivity(id: number, data: UpdateActivityDto): Promise<Activity | null> {
    const updatePayload: Partial<UpdateActivityDto> & { finished_date?: string | null } = {};

    if (data.name !== undefined) updatePayload.name = data.name;
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

  // Get activities grouped by name with supervisors
  async getActivitiesGroupedByName(creatorId: number): Promise<ActivityWithSupervisors[]> {
    const response = await authService.fetchWithAuth(`${API_URL}/activities/grouped-by-name/${creatorId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch grouped activities');
    }

    return await response.json();
  },

  async getNextScheduledActivity(userId: number): Promise<Activity | null> {
    const activities = await activityService.getActivitiesByAssignee(userId);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingActivities = activities
      .filter(activity => activity.scheduled_date && new Date(activity.scheduled_date) >= now)
      .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime());

    return upcomingActivities.length > 0 ? upcomingActivities[0] : null;
  },
};
