import type { Server, Socket } from 'socket.io';
import type { SocketEvents } from '@real-time-kanban/shared';
import { prisma } from '../lib/prisma';

interface ExtendedSocket extends Socket {
  userId?: string;
  boardId?: string;
}

const userPresence = new Map<string, { userId: string; boardId?: string; socket: ExtendedSocket }>();
const cardLocks = new Map<string, { userId: string; socketId: string }>();

export function setupSocketHandlers(io: Server<SocketEvents, SocketEvents>) {
  io.on('connection', (socket: ExtendedSocket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join board
    socket.on('board:join', async (boardId: string) => {
      try {
        socket.boardId = boardId;
        await socket.join(boardId);
        
        // Add to presence
        if (socket.userId) {
          userPresence.set(socket.id, { userId: socket.userId, boardId, socket });
          
          // Notify others
          socket.to(boardId).emit('user:joined', {
            userId: socket.userId,
            user: { id: socket.userId, name: 'User', email: '', avatar: '' }, // TODO: get real user data
            lastSeen: new Date(),
            isOnline: true,
            currentBoard: boardId,
          });
        }

        // Send current online users
        const onlineUsers = Array.from(userPresence.values())
          .filter(p => p.boardId === boardId)
          .map(p => ({
            userId: p.userId,
            user: { id: p.userId, name: 'User', email: '', avatar: '' },
            lastSeen: new Date(),
            isOnline: true,
            currentBoard: boardId,
          }));

        socket.emit('users:online', onlineUsers);
      } catch (error) {
        console.error('Error joining board:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Leave board
    socket.on('board:leave', async (boardId: string) => {
      await socket.leave(boardId);
      
      if (socket.userId) {
        userPresence.delete(socket.id);
        socket.to(boardId).emit('user:left', socket.userId);
      }
    });

    // Card locking
    socket.on('card:lock', (cardId: string) => {
      if (!socket.userId || !socket.boardId) return;

      const existingLock = cardLocks.get(cardId);
      if (existingLock && existingLock.socketId !== socket.id) {
        socket.emit('error', { message: 'Card is already locked by another user' });
        return;
      }

      cardLocks.set(cardId, { userId: socket.userId, socketId: socket.id });
      
      socket.to(socket.boardId).emit('card:locked', {
        cardId,
        userId: socket.userId,
        user: { id: socket.userId, name: 'User', email: '', avatar: '' },
      });
    });

    socket.on('card:unlock', (cardId: string) => {
      const lock = cardLocks.get(cardId);
      if (lock && lock.socketId === socket.id) {
        cardLocks.delete(cardId);
        
        if (socket.boardId) {
          socket.to(socket.boardId).emit('card:unlocked', cardId);
        }
      }
    });

    // Card operations
    socket.on('card:move', async (data) => {
      try {
        if (!socket.boardId) return;

        const card = await prisma.card.update({
          where: { id: data.cardId },
          data: {
            columnId: data.targetColumnId,
            order: data.targetOrder,
          },
          include: {
            assignedUser: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        });

        const transformedCard = {
          id: card.id,
          columnId: card.columnId,
          title: card.title,
          description: card.description,
          order: card.order,
          assignedTo: card.assignedTo,
          labels: card.labels ? JSON.parse(card.labels) : [],
          dueDate: card.dueDate,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        };

        // Broadcast to all clients in the board
        io.to(socket.boardId).emit('card:moved', {
          card: transformedCard,
          fromColumnId: data.cardId, // This should be the original column ID
          toColumnId: data.targetColumnId,
        });
      } catch (error) {
        console.error('Error moving card:', error);
        socket.emit('error', { message: 'Failed to move card' });
      }
    });

    socket.on('card:create', async (data) => {
      try {
        if (!socket.boardId) return;

        const card = await prisma.card.create({
          data: {
            ...data,
            labels: data.labels ? JSON.stringify(data.labels) : null,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          },
          include: {
            assignedUser: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        });

        const transformedCard = {
          id: card.id,
          columnId: card.columnId,
          title: card.title,
          description: card.description,
          order: card.order,
          assignedTo: card.assignedTo,
          labels: card.labels ? JSON.parse(card.labels) : [],
          dueDate: card.dueDate,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        };

        io.to(socket.boardId).emit('card:created', transformedCard);
      } catch (error) {
        console.error('Error creating card:', error);
        socket.emit('error', { message: 'Failed to create card' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
      
      // Remove from presence
      const presence = userPresence.get(socket.id);
      if (presence) {
        userPresence.delete(socket.id);
        if (presence.boardId && presence.userId) {
          socket.to(presence.boardId).emit('user:left', presence.userId);
        }
      }

      // Remove any card locks
      for (const [cardId, lock] of cardLocks.entries()) {
        if (lock.socketId === socket.id) {
          cardLocks.delete(cardId);
          if (socket.boardId) {
            socket.to(socket.boardId).emit('card:unlocked', cardId);
          }
        }
      }
    });
  });
}