// Core entities
export interface Board {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  columns: Column[];
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  cards: Card[];
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  labels?: string[];
  dueDate?: Date;
}

// User and presence
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UserPresence {
  userId: string;
  user: User;
  lastSeen: Date;
  isOnline: boolean;
  currentBoard?: string;
  editingCard?: string;
}

// API Request/Response types
export interface CreateBoardRequest {
  title: string;
  description?: string;
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string;
}

export interface CreateColumnRequest {
  boardId: string;
  title: string;
  order?: number;
}

export interface UpdateColumnRequest {
  title?: string;
  order?: number;
}

export interface CreateCardRequest {
  columnId: string;
  title: string;
  description?: string;
  order?: number;
  assignedTo?: string;
  labels?: string[];
  dueDate?: Date;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  order?: number;
  columnId?: string;
  assignedTo?: string;
  labels?: string[];
  dueDate?: Date;
}

export interface MoveCardRequest {
  cardId: string;
  targetColumnId: string;
  targetOrder: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// WebSocket Events
export interface SocketEvents {
  // Client to Server events
  'board:join': (boardId: string) => void;
  'board:leave': (boardId: string) => void;
  'card:lock': (cardId: string) => void;
  'card:unlock': (cardId: string) => void;
  'card:move': (data: MoveCardRequest) => void;
  'card:create': (data: CreateCardRequest) => void;
  'card:update': (cardId: string, data: UpdateCardRequest) => void;
  'card:delete': (cardId: string) => void;
  'column:create': (data: CreateColumnRequest) => void;
  'column:update': (columnId: string, data: UpdateColumnRequest) => void;
  'column:delete': (columnId: string) => void;

  // Server to Client events
  'board:updated': (board: Board) => void;
  'card:moved': (data: { card: Card; fromColumnId: string; toColumnId: string }) => void;
  'card:created': (card: Card) => void;
  'card:updated': (card: Card) => void;
  'card:deleted': (cardId: string) => void;
  'card:locked': (data: { cardId: string; userId: string; user: User }) => void;
  'card:unlocked': (cardId: string) => void;
  'column:created': (column: Column) => void;
  'column:updated': (column: Column) => void;
  'column:deleted': (columnId: string) => void;
  'user:joined': (presence: UserPresence) => void;
  'user:left': (userId: string) => void;
  'users:online': (users: UserPresence[]) => void;
  'error': (error: { message: string; code?: string }) => void;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ValidationError extends Error {
  code = 'VALIDATION_ERROR';
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  code = 'NOT_FOUND';
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  code = 'CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// State management types
export interface OptimisticUpdate<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  timestamp: number;
  data: T;
  rollback: () => void;
}

export interface StoreState {
  boards: Record<string, Board>;
  currentBoardId: string | null;
  users: Record<string, UserPresence>;
  cardLocks: Record<string, { userId: string; user: User }>;
  optimisticUpdates: OptimisticUpdate[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

// Drag and drop types
export interface DragStartEvent {
  active: {
    id: string;
    data: {
      current: Card;
    };
  };
}

export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: Card;
    };
  };
  over: {
    id: string;
    data: {
      current?: Card | Column;
    };
  } | null;
}

export interface DropResult {
  cardId: string;
  sourceColumnId: string;
  targetColumnId: string;
  targetOrder: number;
}