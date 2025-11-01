import type { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, ConflictError } from '@real-time-kanban/shared';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: error.message,
      details: error.details,
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: error.message,
    });
  }

  if (error instanceof ConflictError) {
    return res.status(409).json({
      success: false,
      error: error.message,
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}