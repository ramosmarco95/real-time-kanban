import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import type { SocketEvents } from '@real-time-kanban/shared';

import { prisma } from './lib/prisma';
import { boardRoutes } from './routes/boards';
import { columnRoutes } from './routes/columns';
import { cardRoutes } from './routes/cards';
import { setupSocketHandlers } from './socket/handlers';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const server = createServer(app);
const io = new Server<SocketEvents, SocketEvents>(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);

// Socket.IO
setupSocketHandlers(io);

// Error handling
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📥 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export { io };