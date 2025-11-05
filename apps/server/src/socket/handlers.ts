import type { Server, Socket } from 'socket.io';
import type { SocketEvents } from '@real-time-kanban/shared';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

interface ExtendedSocket extends Socket {
  userId?: string;
  boardId?: string;
  userData?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// Map to track users per board: boardId -> Set of socket IDs
const boardUsers = new Map<string, Set<string>>();
// Map to track socket user data: socketId -> user info
const socketUsers = new Map<string, { userId: string; userData: any; boardId?: string | undefined }>();
const cardLocks = new Map<string, { userId: string; socketId: string }>();

export function setupSocketHandlers(io: Server<SocketEvents, SocketEvents>) {
  // Middleware to authenticate socket connections
  io.use(async (socket: ExtendedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('JWT_SECRET not configured'));
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, avatar: true }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user.id;
      socket.userData = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: ExtendedSocket) => {
    console.log('🔌 Client connected:', socket.id, 'User:', socket.userData?.name);

    // Join board
    socket.on('board:join', async (boardId: string) => {
      try {
        if (!socket.userId || !socket.userData) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        socket.boardId = boardId;
        await socket.join(boardId);
        
        // Track user in this board
        if (!boardUsers.has(boardId)) {
          boardUsers.set(boardId, new Set());
        }
        boardUsers.get(boardId)!.add(socket.id);
        
        // Store socket user data
        socketUsers.set(socket.id, {
          userId: socket.userId,
          userData: socket.userData,
          boardId
        });
        
        // Notify others that user joined
        socket.to(boardId).emit('user:joined', {
          userId: socket.userId,
          user: socket.userData,
          lastSeen: new Date(),
          isOnline: true,
          currentBoard: boardId,
        });

        // Send current online users for this board
        const boardUserSockets = boardUsers.get(boardId) || new Set();
        const onlineUsers = Array.from(boardUserSockets)
          .map(socketId => socketUsers.get(socketId))
          .filter(userData => userData && userData.boardId === boardId)
          .map(userData => ({
            userId: userData!.userId,
            user: userData!.userData,
            lastSeen: new Date(),
            isOnline: true,
            currentBoard: boardId,
          }));

        socket.emit('users:online', onlineUsers);
        
        console.log(`👤 User ${socket.userData.name} joined board ${boardId}. Online users: ${onlineUsers.length}`);
      } catch (error) {
        console.error('Error joining board:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Leave board
    socket.on('board:leave', async (boardId: string) => {
      await socket.leave(boardId);
      
      if (socket.userId) {
        // Remove user from board tracking
        const boardUserSockets = boardUsers.get(boardId);
        if (boardUserSockets) {
          boardUserSockets.delete(socket.id);
          if (boardUserSockets.size === 0) {
            boardUsers.delete(boardId);
          }
        }
        
        // Update socket user data
        const socketUserData = socketUsers.get(socket.id);
        if (socketUserData) {
          socketUserData.boardId = undefined;
        }
        
        socket.to(boardId).emit('user:left', socket.userId);
        console.log(`👤 User ${socket.userData?.name} left board ${boardId}`);
      }
    });

    // Card locking
    socket.on('card:lock', (cardId: string) => {
      if (!socket.userId || !socket.boardId || !socket.userData) return;

      const existingLock = cardLocks.get(cardId);
      if (existingLock && existingLock.socketId !== socket.id) {
        socket.emit('error', { message: 'Card is already locked by another user' });
        return;
      }

      cardLocks.set(cardId, { userId: socket.userId, socketId: socket.id });
      
      socket.to(socket.boardId).emit('card:locked', {
        cardId,
        userId: socket.userId,
        user: socket.userData,
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
      console.log('🔌 Client disconnected:', socket.id, 'User:', socket.userData?.name);
      
      // Remove from user tracking
      const socketUserData = socketUsers.get(socket.id);
      if (socketUserData && socketUserData.boardId) {
        const boardUserSockets = boardUsers.get(socketUserData.boardId);
        if (boardUserSockets) {
          boardUserSockets.delete(socket.id);
          if (boardUserSockets.size === 0) {
            boardUsers.delete(socketUserData.boardId);
          }
        }
        
        // Notify others in the board
        socket.to(socketUserData.boardId).emit('user:left', socketUserData.userId);
      }
      
      // Clean up socket user data
      socketUsers.delete(socket.id);

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