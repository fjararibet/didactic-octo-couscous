const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
}

class AuthService {
  private accessToken: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.accessToken = localStorage.getItem('access_token');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    // OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append('username', email); // Backend accepts email as username
    formData.append('password', password);

    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data: LoginResponse = await response.json();

    // Store token
    this.accessToken = data.access_token;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_role', data.role);

    // Fetch user info to get user ID
    await this.fetchUserInfo();

    return data;
  }

  async fetchUserInfo(): Promise<UserInfo> {
    const response = await this.fetchWithAuth(`${API_URL}/me`);

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo: UserInfo = await response.json();

    // Store user info
    localStorage.setItem('user_id', String(userInfo.id));
    localStorage.setItem('user_email', userInfo.email);

    return userInfo;
  }

  getUserId(): number | null {
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id) : null;
  }

  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
  }

  getToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getRole(): string | null {
    return localStorage.getItem('user_role');
  }

  // Helper to get headers with auth token
  getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Make authenticated API request
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, clear token and redirect to login
    if (response.status === 401) {
      this.logout();
      window.location.href = '/login';
    }

    return response;
  }
}

export const authService = new AuthService();
