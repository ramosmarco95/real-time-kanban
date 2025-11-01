import React from 'react';
import type { Board } from '@real-time-kanban/shared';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { useKanbanStore, selectOnlineUsers } from '../store/kanban';
import companyLogo from '../assets/company-logo-gradiant.png';

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const { isConnected } = useKanbanStore();
  const onlineUsers = useKanbanStore(selectOnlineUsers);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={companyLogo}
            alt="Company Logo" 
            className="w-auto"
            style={{ width: '60px', borderRadius: '8px' }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
            {board.description && (
              <p className="text-gray-600 mt-1">{board.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Online users */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} />
            <span>{onlineUsers.length} online</span>
          </div>
          
          {/* Connection status */}
          <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}