import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with context
  const context = {
    method: req.method,
    path: req.path,
    userId: (req as any).userId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  if (err instanceof AppError) {
    logger.error(err.message, err, context);

    // Send appropriate response
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected error', err, context);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};
