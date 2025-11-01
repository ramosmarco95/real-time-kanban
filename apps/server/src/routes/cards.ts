import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ValidationError, NotFoundError } from '@real-time-kanban/shared';
import { generateNewOrder, calculateOrder } from '@real-time-kanban/shared';

const router = express.Router();

// Validation schemas
const createCardSchema = z.object({
  columnId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  order: z.number().optional(),
  assignedTo: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

const updateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  columnId: z.string().optional(),
  assignedTo: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
});

const moveCardSchema = z.object({
  cardId: z.string(),
  targetColumnId: z.string(),
  targetOrder: z.number(),
});

// POST /api/cards - Create new card
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const validatedData = createCardSchema.parse(req.body);
    
    let order = validatedData.order;
    if (!order) {
      const existingCards = await prisma.card.findMany({
        where: { columnId: validatedData.columnId },
        select: { order: true },
      });
      order = generateNewOrder(existingCards.map((c: any) => c.order));
    }

    const card = await prisma.card.create({
      data: {
        ...validatedData,
        order,
        labels: validatedData.labels ? JSON.stringify(validatedData.labels) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: transformCard(card),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid card data', { errors: (error as any).errors }));
    } else {
      next(error);
    }
  }
});

// PUT /api/cards/:id - Update card
router.put('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const validatedData = updateCardSchema.parse(req.body);

    const updateData: any = { ...validatedData };
    if (validatedData.labels) {
      updateData.labels = JSON.stringify(validatedData.labels);
    }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const card = await prisma.card.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.json({
      success: true,
      data: transformCard(card),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid card data', { errors: (error as any).errors }));
    } else {
      next(error);
    }
  }
});

// POST /api/cards/move - Move card to different column/position
router.post('/move', async (req: any, res: any, next: any) => {
  try {
    const validatedData = moveCardSchema.parse(req.body);
    const { cardId, targetColumnId, targetOrder } = validatedData;

    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        columnId: targetColumnId,
        order: targetOrder,
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    res.json({
      success: true,
      data: transformCard(card),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid move data', { errors: (error as any).errors }));
    } else {
      next(error);
    }
  }
});

// DELETE /api/cards/:id - Delete card
router.delete('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;

    await prisma.card.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Transform Prisma result to our type
function transformCard(card: any) {
  return {
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
}

export { router as cardRoutes };