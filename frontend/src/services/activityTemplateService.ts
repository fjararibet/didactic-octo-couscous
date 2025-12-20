import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const activityTemplateService = {
  // Create a new activity template
  createActivityTemplate: async (templateData: { name: string; description?: string }) => {
    const response = await fetch(`${API_URL}/activity-templates/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(templateData),
    });
    if (!response.ok) {
      throw new Error('Failed to create activity template');
    }
    return response.json();
  },

  // Get all activity templates
  getActivityTemplates: async () => {
    const response = await fetch(`${API_URL}/activity-templates/`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch activity templates');
    }
    return response.json();
  },

  // Add a todo item to an activity template
  addTodoToTemplate: async (templateId: number, todoData: { description: string }) => {
    const response = await fetch(`${API_URL}/activity-templates/${templateId}/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(todoData),
    });
    if (!response.ok) {
      throw new Error('Failed to add todo to template');
    }
    return response.json();
  },
};
