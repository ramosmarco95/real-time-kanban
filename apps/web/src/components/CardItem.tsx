import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '@real-time-kanban/shared';
import { useKanbanStore, selectCardLock } from '../store/kanban';
import { Calendar, User, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface CardItemProps {
  card: Card;
  isDragging?: boolean;
}

export function CardItem({ card, isDragging = false }: CardItemProps) {
  const cardLock = useKanbanStore(selectCardLock(card.id));
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      ...card,
    },
    disabled: !!cardLock, // Disable dragging if card is locked
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLocked = !!cardLock;
  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg p-3 shadow-sm border cursor-pointer
        transition-all duration-200
        ${isBeingDragged ? 'opacity-50 scale-105 shadow-lg' : ''}
        ${isLocked ? 'border-orange-300 bg-orange-50' : 'hover:shadow-md border-gray-200'}
      `}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="flex items-center gap-2 text-orange-600 text-xs mb-2">
          <Lock size={12} />
          <span>Locked by {cardLock.user.name}</span>
        </div>
      )}

      {/* Card title */}
      <h4 className="font-medium text-gray-900 mb-2">{card.title}</h4>

      {/* Card description */}
      {card.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{card.description}</p>
      )}

      {/* Card metadata */}
      <div className="space-y-2">
        {/* Due date and assigned user */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {/* Due date */}
          {card.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{format(new Date(card.dueDate), 'MMM d')}</span>
            </div>
          )}

          {/* Assigned user */}
          {card.assignedTo && (
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{card.assignedTo}</span>
            </div>
          )}
        </div>

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs whitespace-nowrap"
              >
                {label}
              </span>
            ))}
            {card.labels.length > 3 && (
              <span className="text-gray-400 text-xs">+{card.labels.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}