import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not defined in environment variables');
      throw new Error('Server configuration error');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      req.userId = decoded.userId;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired. Please sign in again');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthorizationError('Invalid token');
      }
      throw new AuthorizationError('Token verification failed');
    }
  } catch (error) {
    next(error);
  }
};
