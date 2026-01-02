import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRequest } from './auth';
import { ForbiddenError } from '../utils/errors';

/**
 * CSRF token storage (in production, use Redis or database)
 */
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * Generate a CSRF token for a user session
 */
export function generateCsrfToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  csrfTokens.set(userId, { token, expiresAt });

  // Clean up expired tokens periodically
  cleanupExpiredTokens();

  return token;
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(userId: string, token: string): boolean {
  const stored = csrfTokens.get(userId);

  if (!stored) {
    return false;
  }

  if (stored.expiresAt < Date.now()) {
    csrfTokens.delete(userId);
    return false;
  }

  return stored.token === token;
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [userId, data] of csrfTokens.entries()) {
    if (data.expiresAt < now) {
      csrfTokens.delete(userId);
    }
  }
}

/**
 * Middleware to validate CSRF token on state-changing operations
 */
export const csrfProtection = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Skip CSRF protection in development mode
  // TODO: Implement CSRF token handling in frontend before enabling in production
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Skip CSRF check for public endpoints (path is relative to mount point)
  if (req.path.startsWith('/public')) {
    next();
    return;
  }

  // Skip CSRF check for authentication endpoints (they use other protections)
  if (req.path.startsWith('/auth/signin') || req.path.startsWith('/auth/signup')) {
    next();
    return;
  }

  const userId = req.userId;
  if (!userId) {
    // If no user ID, let the auth middleware handle it
    next();
    return;
  }

  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'] as string;

  if (!csrfToken) {
    throw new ForbiddenError('CSRF token is missing');
  }

  if (!verifyCsrfToken(userId, csrfToken)) {
    throw new ForbiddenError('Invalid CSRF token');
  }

  next();
};

/**
 * Endpoint to get CSRF token
 */
export const getCsrfToken = (req: AuthRequest, res: Response): void => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = generateCsrfToken(userId);

  res.json({ csrfToken: token });
};
