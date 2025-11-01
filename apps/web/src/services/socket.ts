import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '@real-time-kanban/shared';
import { useKanbanStore } from '../store/kanban';

class SocketService {
  private socket: Socket<SocketEvents, SocketEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string = 'http://localhost:3001') {
    if (this.socket?.connected) {
      return;
    }

    console.log('🔌 Connecting to socket server...');
    
    this.socket = io(url, {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from socket server...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    const store = useKanbanStore.getState();

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to socket server');
      this.reconnectAttempts = 0;
      store.setConnected(true);
      store.setError(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from socket server:', reason);
      store.setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.setError('Failed to connect to server. Please check your connection.');
      }
    });

    this.socket.on('reconnect' as any, (attemptNumber: number) => {
      console.log('🔌 Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      store.setConnected(true);
      store.setError(null);
    });

    this.socket.on('reconnect_error' as any, (error: unknown) => {
      console.error('🔌 Reconnection error:', error);
    });

    this.socket.on('reconnect_failed' as any, () => {
      console.error('🔌 Failed to reconnect after', this.maxReconnectAttempts, 'attempts');
      store.setError('Connection lost. Please refresh the page.');
    });

    // Board events
    this.socket.on('board:updated', (board) => {
      console.log('📋 Board updated:', board.id);
      store.setBoard(board);
    });

    // Card events
    this.socket.on('card:moved', (data) => {
      console.log('📝 Card moved:', data.card.id);
      store.updateCard(data.card.id, data.card);
      
      // Remove optimistic update if it exists
      const optimisticUpdates = useKanbanStore.getState().optimisticUpdates;
      const relatedUpdate = optimisticUpdates.find(u => {
        // narrow u.data to the expected shape for a move update
        const d = u.data as { cardId?: string } | undefined;
        return u.type === 'move' && d?.cardId === data.card.id;
      });
      if (relatedUpdate) {
        store.removeOptimisticUpdate(relatedUpdate.id);
      }
    });

    this.socket.on('card:created', (card) => {
      console.log('📝 Card created:', card.id);
      
      // Remove optimistic update and add real card
      const optimisticUpdates = useKanbanStore.getState().optimisticUpdates;
      const relatedUpdate = optimisticUpdates.find(u => {
        // narrow u.data to the expected shape for a create update
        const d = u.data as { tempCard?: { id?: string; columnId?: string } } | undefined;
        return u.type === 'create' && d?.tempCard?.columnId === card.columnId;
      });
      
      if (relatedUpdate) {
        // Remove temp card first (if present)
        const tempCardId = (relatedUpdate.data as { tempCard?: { id?: string } } | undefined)?.tempCard?.id;
        if (tempCardId) {
          store.removeCard(tempCardId);
        }
        store.removeOptimisticUpdate(relatedUpdate.id);
      }
      
      store.addCard(card);
    });

    this.socket.on('card:updated', (card) => {
      console.log('📝 Card updated:', card.id);
      store.updateCard(card.id, card);
    });

    this.socket.on('card:deleted', (cardId) => {
      console.log('📝 Card deleted:', cardId);
      store.removeCard(cardId);
    });

    // Card lock events
    this.socket.on('card:locked', (data) => {
      console.log('🔒 Card locked:', data.cardId, 'by', data.user.name);
      store.setCardLock(data.cardId, data.userId, data.user);
    });

    this.socket.on('card:unlocked', (cardId) => {
      console.log('🔓 Card unlocked:', cardId);
      store.removeCardLock(cardId);
    });

    // Column events
    this.socket.on('column:created', (column) => {
      console.log('📋 Column created:', column.id);
      store.addColumn(column);
    });

    this.socket.on('column:updated', (column) => {
      console.log('📋 Column updated:', column.id);
      store.updateColumn(column.id, column);
    });

    this.socket.on('column:deleted', (columnId) => {
      console.log('📋 Column deleted:', columnId);
      store.removeColumn(columnId);
    });

    // User presence events
    this.socket.on('user:joined', (presence) => {
      console.log('👤 User joined:', presence.user.name);
      store.addUserPresence(presence);
    });

    this.socket.on('user:left', (userId) => {
      console.log('👤 User left:', userId);
      store.removeUserPresence(userId);
    });

    this.socket.on('users:online', (users) => {
      console.log('👥 Online users:', users.length);
      store.setUserPresence(users);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
      store.setError(error.message);
      
      // Rollback optimistic updates on error
      const optimisticUpdates = useKanbanStore.getState().optimisticUpdates;
      optimisticUpdates.forEach(update => {
        store.rollbackOptimisticUpdate(update.id);
      });
    });
  }

  // Emit events
  joinBoard(boardId: string) {
    this.socket?.emit('board:join', boardId);
  }

  leaveBoard(boardId: string) {
    this.socket?.emit('board:leave', boardId);
  }

  lockCard(cardId: string) {
    this.socket?.emit('card:lock', cardId);
  }

  unlockCard(cardId: string) {
    this.socket?.emit('card:unlock', cardId);
  }

  moveCard(data: { cardId: string; targetColumnId: string; targetOrder: number }) {
    this.socket?.emit('card:move', data);
  }

  createCard(data: { columnId: string; title: string; description?: string; order?: number }) {
    this.socket?.emit('card:create', data);
  }

  updateCard(cardId: string, data: any) {
    this.socket?.emit('card:update', cardId, data);
  }

  deleteCard(cardId: string) {
    this.socket?.emit('card:delete', cardId);
  }

  createColumn(data: { boardId: string; title: string; order?: number }) {
    this.socket?.emit('column:create', data);
  }

  updateColumn(columnId: string, data: any) {
    this.socket?.emit('column:update', columnId, data);
  }

  deleteColumn(columnId: string) {
    this.socket?.emit('column:delete', columnId);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();