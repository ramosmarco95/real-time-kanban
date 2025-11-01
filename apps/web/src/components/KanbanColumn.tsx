import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Column } from '@real-time-kanban/shared';
import { useKanbanStore, selectCardsByColumnId } from '../store/kanban';
import { CardItem } from './CardItem';
import { Plus, MoreHorizontal } from 'lucide-react';
import { socketService } from '../services/socket';
import { generateNewOrder } from '@real-time-kanban/shared';

interface KanbanColumnProps {
  column: Column;
}

export function KanbanColumn({ column }: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  
  const cards = useKanbanStore(selectCardsByColumnId(column.id));
  const { createCardOptimistic } = useKanbanStore();

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      id: column.id,
    },
  });

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    
    // Create optimistic update
    const optimisticUpdate = createCardOptimistic(column.id, newCardTitle.trim());
    
    // Send to server
    try {
      const order = generateNewOrder(cards.map(c => c.order));
      socketService.createCard({
        columnId: column.id,
        title: newCardTitle.trim(),
        order,
      });
    } catch (err) {
      // Rollback on error
      optimisticUpdate.rollback();
    }
    
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0 min-h-96 transition-colors ${
        isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
            {cards.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3 mb-4">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      {/* Add Card */}
      {isAddingCard ? (
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <textarea
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter card title..."
            className="w-full resize-none border-none outline-none text-sm"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddCard}
              disabled={!newCardTitle.trim()}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingCard(false);
                setNewCardTitle('');
              }}
              className="text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingCard(true)}
          className="w-full text-left text-gray-600 hover:text-gray-900 flex items-center gap-2 p-2 rounded hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} />
          Add a card
        </button>
      )}
    </div>
  );
}