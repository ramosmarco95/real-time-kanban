import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  Board, 
  Card, 
  Column, 
  UserPresence, 
  StoreState, 
  OptimisticUpdate,
  MoveCardRequest 
} from '@real-time-kanban/shared';
import { generateId, calculateOrder } from '@real-time-kanban/shared';

interface KanbanActions {
  // Board actions
  setCurrentBoard: (boardId: string | null) => void;
  setBoard: (board: Board) => void;
  
  // Card actions
  addCard: (card: Card) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  removeCard: (cardId: string) => void;
  
  // Optimistic card actions
  moveCardOptimistic: (request: MoveCardRequest) => OptimisticUpdate;
  createCardOptimistic: (columnId: string, title: string) => OptimisticUpdate;
  
  // Column actions
  addColumn: (column: Column) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  removeColumn: (columnId: string) => void;
  
  // User presence
  setUserPresence: (users: UserPresence[]) => void;
  addUserPresence: (user: UserPresence) => void;
  removeUserPresence: (userId: string) => void;
  
  // Card locks
  setCardLock: (cardId: string, userId: string, user: any) => void;
  removeCardLock: (cardId: string) => void;
  
  // Connection state
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Optimistic updates
  addOptimisticUpdate: (update: OptimisticUpdate) => void;
  removeOptimisticUpdate: (updateId: string) => void;
  rollbackOptimisticUpdate: (updateId: string) => void;
}

export const useKanbanStore = create<StoreState & KanbanActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    boards: {},
    currentBoardId: null,
    users: {},
    cardLocks: {},
    optimisticUpdates: [],
    isConnected: false,
    isLoading: false,
    error: null,

    // Board actions
    setCurrentBoard: (boardId) => set({ currentBoardId: boardId }),
    
    setBoard: (board) => set((state) => ({
      boards: { ...state.boards, [board.id]: board }
    })),

    // Card actions
    addCard: (card) => set((state) => {
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      if (!currentBoard) return state;

      const updatedBoard = {
        ...currentBoard,
        columns: currentBoard.columns.map(column => 
          column.id === card.columnId 
            ? { ...column, cards: [...column.cards, card].sort((a, b) => a.order - b.order) }
            : column
        )
      };

      return {
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      };
    }),

    updateCard: (cardId, updates) => set((state) => {
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      if (!currentBoard) return state;

      const updatedBoard = {
        ...currentBoard,
        columns: currentBoard.columns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.id === cardId ? { ...card, ...updates } : card
          )
        }))
      };

      return {
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      };
    }),

    removeCard: (cardId) => set((state) => {
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      if (!currentBoard) return state;

      const updatedBoard = {
        ...currentBoard,
        columns: currentBoard.columns.map(column => ({
          ...column,
          cards: column.cards.filter(card => card.id !== cardId)
        }))
      };

      return {
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      };
    }),

    // Optimistic card actions
    moveCardOptimistic: (request) => {
      const updateId = generateId();
      const state = get();
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      
      if (!currentBoard) {
        return { id: updateId, type: 'move', timestamp: Date.now(), data: request, rollback: () => {} };
      }

      // Find the card being moved
      let cardToMove: Card | null = null;
      let sourceColumn: Column | null = null;
      
      for (const column of currentBoard.columns) {
        const card = column.cards.find(c => c.id === request.cardId);
        if (card) {
          cardToMove = card;
          sourceColumn = column;
          break;
        }
      }

      if (!cardToMove || !sourceColumn) {
        return { id: updateId, type: 'move', timestamp: Date.now(), data: request, rollback: () => {} };
      }

      // Store original state for rollback
      const originalBoardState = { ...currentBoard };

      // Apply optimistic update
      const updatedCard = { ...cardToMove, columnId: request.targetColumnId, order: request.targetOrder };
      
      const updatedBoard = {
        ...currentBoard,
        columns: currentBoard.columns.map(column => {
          if (column.id === sourceColumn!.id) {
            // Remove card from source column
            return {
              ...column,
              cards: column.cards.filter(c => c.id !== request.cardId)
            };
          } else if (column.id === request.targetColumnId) {
            // Add card to target column
            return {
              ...column,
              cards: [...column.cards, updatedCard].sort((a, b) => a.order - b.order)
            };
          }
          return column;
        })
      };

      set((state) => ({
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      }));

      const update: OptimisticUpdate = {
        id: updateId,
        type: 'move',
        timestamp: Date.now(),
        data: request,
        rollback: () => {
          set((state) => ({
            boards: { ...state.boards, [currentBoard.id]: originalBoardState }
          }));
        }
      };

      get().addOptimisticUpdate(update);
      return update;
    },

    createCardOptimistic: (columnId, title) => {
      const updateId = generateId();
      const state = get();
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      
      if (!currentBoard) {
        return { id: updateId, type: 'create', timestamp: Date.now(), data: { columnId, title }, rollback: () => {} };
      }

      const targetColumn = currentBoard.columns.find(c => c.id === columnId);
      if (!targetColumn) {
        return { id: updateId, type: 'create', timestamp: Date.now(), data: { columnId, title }, rollback: () => {} };
      }

      // Store original state for rollback
      const originalBoardState = { ...currentBoard };

      // Create temporary card
      const tempCard: Card = {
        id: `temp-${updateId}`,
        columnId,
        title,
        description: '',
        order: calculateOrder(
          targetColumn.cards.length > 0 ? Math.max(...targetColumn.cards.map(c => c.order)) : undefined,
          undefined
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Apply optimistic update
      const updatedBoard = {
        ...currentBoard,
        columns: currentBoard.columns.map(column => 
          column.id === columnId
            ? { ...column, cards: [...column.cards, tempCard].sort((a, b) => a.order - b.order) }
            : column
        )
      };

      set((state) => ({
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      }));

      const update: OptimisticUpdate = {
        id: updateId,
        type: 'create',
        timestamp: Date.now(),
        data: { columnId, title, tempCard },
        rollback: () => {
          set((state) => ({
            boards: { ...state.boards, [currentBoard.id]: originalBoardState }
          }));
        }
      };

      get().addOptimisticUpdate(update);
      return update;
    },

    // Column actions
    addColumn: (column) => set((state) => {
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      if (!currentBoard) return state;

      const updatedBoard = {
        ...currentBoard,
        columns: [...currentBoard.columns, column].sort((a, b) => a.order - b.order)
      };

      return {
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      };
    }),

    updateColumn: (columnId, updates) => set((state) => {
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      if (!currentBoard) return state;

      const updatedBoard = {
        ...currentBoard,
        columns: currentBoard.columns.map(column => 
          column.id === columnId ? { ...column, ...updates } : column
        )
      };

      return {
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      };
    }),

    removeColumn: (columnId) => set((state) => {
      const currentBoard = state.currentBoardId ? state.boards[state.currentBoardId] : null;
      if (!currentBoard) return state;

      const updatedBoard = {
        ...currentBoard,
        columns: currentBoard.columns.filter(column => column.id !== columnId)
      };

      return {
        boards: { ...state.boards, [currentBoard.id]: updatedBoard }
      };
    }),

    // User presence
    setUserPresence: (users) => set(() => ({
      users: users.reduce((acc, user) => ({ ...acc, [user.userId]: user }), {})
    })),

    addUserPresence: (user) => set((state) => ({
      users: { ...state.users, [user.userId]: user }
    })),

    removeUserPresence: (userId) => set((state) => {
      const { [userId]: removed, ...rest } = state.users;
      return { users: rest };
    }),

    // Card locks
    setCardLock: (cardId, userId, user) => set((state) => ({
      cardLocks: { ...state.cardLocks, [cardId]: { userId, user } }
    })),

    removeCardLock: (cardId) => set((state) => {
      const { [cardId]: removed, ...rest } = state.cardLocks;
      return { cardLocks: rest };
    }),

    // Connection state
    setConnected: (connected) => set({ isConnected: connected }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // Optimistic updates
    addOptimisticUpdate: (update) => set((state) => ({
      optimisticUpdates: [...state.optimisticUpdates, update]
    })),

    removeOptimisticUpdate: (updateId) => set((state) => ({
      optimisticUpdates: state.optimisticUpdates.filter(u => u.id !== updateId)
    })),

    rollbackOptimisticUpdate: (updateId) => {
      const state = get();
      const update = state.optimisticUpdates.find(u => u.id === updateId);
      if (update) {
        update.rollback();
        get().removeOptimisticUpdate(updateId);
      }
    },
  }))
);

// Selectors
export const selectCurrentBoard = (state: StoreState) => 
  state.currentBoardId ? state.boards[state.currentBoardId] : null;

export const selectCurrentBoardColumns = (state: StoreState) => 
  selectCurrentBoard(state)?.columns || [];

export const selectCardsByColumnId = (columnId: string) => (state: StoreState) => {
  const board = selectCurrentBoard(state);
  const column = board?.columns.find(c => c.id === columnId);
  return column?.cards || [];
};

export const selectOnlineUsers = (state: StoreState) => 
  Object.values(state.users).filter(user => user.isOnline);

export const selectCardLock = (cardId: string) => (state: StoreState) => 
  state.cardLocks[cardId];