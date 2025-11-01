import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ValidationError, NotFoundError } from '@real-time-kanban/shared';
import { generateNewOrder } from '@real-time-kanban/shared';

const router = express.Router();

// Validation schemas
const createColumnSchema = z.object({
  boardId: z.string(),
  title: z.string().min(1).max(100),
  order: z.number().optional(),
});

const updateColumnSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  order: z.number().optional(),
});

// POST /api/columns - Create new column
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const validatedData = createColumnSchema.parse(req.body);
    
    let order = validatedData.order;
    if (!order) {
      const existingColumns = await prisma.column.findMany({
        where: { boardId: validatedData.boardId },
        select: { order: true },
      });
      order = generateNewOrder(existingColumns.map((c: { order: number | null }) => c.order));
    }

    const column = await prisma.column.create({
      data: {
        ...validatedData,
        order,
      },
      include: {
        cards: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: column,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid column data', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

// PUT /api/columns/:id - Update column
router.put('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const validatedData = updateColumnSchema.parse(req.body);

    const column = await prisma.column.update({
      where: { id },
      data: validatedData,
      include: {
        cards: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: column,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid column data', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

// DELETE /api/columns/:id - Delete column
router.delete('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;

    await prisma.column.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Column deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as columnRoutes };