import type { 
  Board, 
  Card, 
  Column, 
  ApiResponse, 
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateColumnRequest,
  UpdateColumnRequest,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest 
} from '@real-time-kanban/shared';
import { authService } from '../lib/auth';

// Auto-detect API base URL based on environment
const getApiBaseUrl = () => {
  // If explicitly set in environment, use that
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In production (Netlify), use relative paths to serverless functions
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Default to local development server
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const token = authService.getToken();
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Board API
  async getBoards(): Promise<Board[]> {
    const response = await this.request<Board[]>('/boards');
    return response.data || [];
  }

  async getBoard(id: string): Promise<Board> {
    const response = await this.request<Board>(`/boards/${id}`);
    if (!response.data) {
      throw new Error('Board not found');
    }
    return response.data;
  }

  async createBoard(data: CreateBoardRequest): Promise<Board> {
    const response = await this.request<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to create board');
    }
    return response.data;
  }

  async updateBoard(id: string, data: UpdateBoardRequest): Promise<Board> {
    const response = await this.request<Board>(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to update board');
    }
    return response.data;
  }

  async deleteBoard(id: string): Promise<void> {
    await this.request(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  // Column API
  async createColumn(data: CreateColumnRequest): Promise<Column> {
    const response = await this.request<Column>('/columns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to create column');
    }
    return response.data;
  }

  async updateColumn(id: string, data: UpdateColumnRequest): Promise<Column> {
    const response = await this.request<Column>(`/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to update column');
    }
    return response.data;
  }

  async deleteColumn(id: string): Promise<void> {
    await this.request(`/columns/${id}`, {
      method: 'DELETE',
    });
  }

  // Card API
  async createCard(data: CreateCardRequest): Promise<Card> {
    const response = await this.request<Card>('/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to create card');
    }
    return response.data;
  }

  async updateCard(id: string, data: UpdateCardRequest): Promise<Card> {
    const response = await this.request<Card>(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to update card');
    }
    return response.data;
  }

  async moveCard(data: MoveCardRequest): Promise<Card> {
    const response = await this.request<Card>('/cards/move', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error('Failed to move card');
    }
    return response.data;
  }

  async deleteCard(id: string): Promise<void> {
    await this.request(`/cards/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();