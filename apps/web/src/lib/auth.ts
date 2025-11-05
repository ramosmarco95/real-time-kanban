interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await this.request('/auth/me');
      return response.user;
    } catch (error) {
      // Token might be expired, clear it
      this.logout();
      return null;
    }
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } catch (error) {
        // Ignore logout errors
      }
    }

    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = new AuthService();

// Helper functions to match Supabase API
export const getCurrentUser = async () => {
  const user = await authService.getCurrentUser();
  return user;
};

export const signOut = async () => {
  await authService.logout();
};