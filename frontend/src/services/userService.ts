import { authService, type UserInfo } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class UserService {
  async getSupervisors(): Promise<UserInfo[]> {
    const response = await authService.fetchWithAuth(`${API_URL}/users/supervisors`);

    if (!response.ok) {
      throw new Error('Failed to fetch supervisors');
    }

    return response.json();
  }
  async getUserById(userId: number): Promise<UserInfo> {
    const response = await authService.fetchWithAuth(`${API_URL}/users/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user ${userId}`);
    }
    return response.json();
  }
}

export const userService = new UserService();
