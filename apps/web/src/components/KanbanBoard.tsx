import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useKanbanStore, selectCurrentBoard, selectCurrentBoardColumns } from '../store/kanban';
import { socketService } from '../services/socket';
import { apiService } from '../services/api';
import { BoardHeader } from './BoardHeader';
import { KanbanColumn } from './KanbanColumn';
import { CardItem } from './CardItem';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';
import type { Card } from '@real-time-kanban/shared';
import { calculateOrder } from '@real-time-kanban/shared';

export function KanbanBoard() {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [boardId, setBoardId] = useState<string>('');
  
  const {
    currentBoardId,
    isLoading,
    isConnected,
    error,
    setCurrentBoard,
    setBoard,
    setLoading,
    setError,
    moveCardOptimistic,
  } = useKanbanStore();

  const currentBoard = useKanbanStore(selectCurrentBoard);
  const columns = useKanbanStore(selectCurrentBoardColumns);

  useEffect(() => {
    // Connect to socket
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentBoardId && isConnected) {
      socketService.joinBoard(currentBoardId);
    }

    return () => {
      if (currentBoardId) {
        socketService.leaveBoard(currentBoardId);
      }
    };
  }, [currentBoardId, isConnected]);

  const loadBoard = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const board = await apiService.getBoard(id);
      setBoard(board);
      setCurrentBoard(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBoard = () => {
    if (boardId.trim()) {
      loadBoard(boardId.trim());
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current as Card;
    setActiveCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    
    const { active, over } = event;
    if (!over || !currentBoard) return;

    const activeCard = active.data.current as Card;
    const overContainer = over.data.current;

    // Determine target column and position
    let targetColumnId: string;
    let targetOrder: number;

    if (overContainer?.type === 'column') {
      // Dropped on column
      targetColumnId = overContainer.id;
      const targetColumn = currentBoard.columns.find(c => c.id === targetColumnId);
      targetOrder = calculateOrder(
        targetColumn?.cards.length ? Math.max(...targetColumn.cards.map(c => c.order)) : undefined,
        undefined
      );
    } else if (overContainer?.type === 'card') {
      // Dropped on card
      const overCard = overContainer as Card;
      targetColumnId = overCard.columnId;
      
      // Find position relative to the card we dropped on
      const targetColumn = currentBoard.columns.find(c => c.id === targetColumnId);
      if (targetColumn) {
        const overCardIndex = targetColumn.cards.findIndex(c => c.id === overCard.id);
        const beforeCard = targetColumn.cards[overCardIndex - 1];
        const afterCard = targetColumn.cards[overCardIndex + 1];
        
        targetOrder = calculateOrder(
          beforeCard?.order,
          overCard.order
        );
      } else {
        return;
      }
    } else {
      return;
    }

    // Skip if no change
    if (activeCard.columnId === targetColumnId && Math.abs(activeCard.order - targetOrder) < 0.1) {
      return;
    }

    // Apply optimistic update
    const moveRequest = {
      cardId: activeCard.id,
      targetColumnId,
      targetOrder,
    };

    const optimisticUpdate = moveCardOptimistic(moveRequest);

    // Send to server
    try {
      socketService.moveCard(moveRequest);
    } catch (err) {
      // Rollback on error
      optimisticUpdate.rollback();
      setError('Failed to move card');
    }
  };

  if (!currentBoard && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Real-Time Kanban</h1>
          <div className="space-y-4">
            <div>
              <label htmlFor="boardId" className="block text-sm font-medium text-gray-700 mb-2">
                Board ID
              </label>
              <input
                id="boardId"
                type="text"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                placeholder="Enter board ID to join..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleLoadBoard()}
              />
            </div>
            <button
              onClick={handleLoadBoard}
              disabled={!boardId.trim() || isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Join Board'}
            </button>
          </div>
          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              Connecting to server...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      
      <div className="p-6">
        <BoardHeader board={currentBoard!} />
        
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6 min-h-0">
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn key={column.id} column={column} />
              ))}
            </SortableContext>
          </div>
          
          <DragOverlay>
            {activeCard ? <CardItem card={activeCard} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}