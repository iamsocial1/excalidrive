import { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../utils/sanitize';

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters (modify in place)
  if (req.query && typeof req.query === 'object') {
    const sanitized = sanitizeObject(req.query);
    Object.keys(req.query).forEach(key => delete (req.query as any)[key]);
    Object.assign(req.query, sanitized);
  }

  // Sanitize URL parameters (modify in place)
  if (req.params && typeof req.params === 'object') {
    const sanitized = sanitizeObject(req.params);
    Object.keys(req.params).forEach(key => delete req.params[key]);
    Object.assign(req.params, sanitized);
  }

  next();
};
