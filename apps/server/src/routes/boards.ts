import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import type { CreateBoardRequest, UpdateBoardRequest, ApiResponse, Board } from '@real-time-kanban/shared';
import { ValidationError, NotFoundError } from '@real-time-kanban/shared';

const router = express.Router();

// Validation schemas
const createBoardSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
});

const updateBoardSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

// GET /api/boards - Get all boards
router.get('/', async (req, res, next) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignedUser: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    const response: ApiResponse<Board[]> = {
      success: true,
      data: boards.map(transformBoard),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/boards/:id - Get board by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignedUser: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundError('Board', id);
    }

    const response: ApiResponse<Board> = {
      success: true,
      data: transformBoard(board),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/boards - Create new board
router.post('/', async (req, res, next) => {
  try {
    const validatedData = createBoardSchema.parse(req.body);

    const board = await prisma.board.create({
      data: validatedData,
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignedUser: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    const response: ApiResponse<Board> = {
      success: true,
      data: transformBoard(board),
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid board data', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

// PUT /api/boards/:id - Update board
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateBoardSchema.parse(req.body);

    const board = await prisma.board.update({
      where: { id },
      data: validatedData,
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignedUser: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    const response: ApiResponse<Board> = {
      success: true,
      data: transformBoard(board),
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid board data', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

// DELETE /api/boards/:id - Delete board
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.board.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Board deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Transform Prisma result to our type
function transformBoard(board: any): Board {
  return {
    id: board.id,
    title: board.title,
    description: board.description,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    columns: board.columns?.map((column: any) => ({
      id: column.id,
      boardId: column.boardId,
      title: column.title,
      order: column.order,
      createdAt: column.createdAt,
      updatedAt: column.updatedAt,
      cards: column.cards?.map((card: any) => ({
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
      })) || [],
    })) || [],
  };
}

export { router as boardRoutes };