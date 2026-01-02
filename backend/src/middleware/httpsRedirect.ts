import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce HTTPS in production
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction): void => {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  // Check if request is already secure
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    next();
    return;
  }

  // Redirect to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  res.redirect(301, httpsUrl);
};

/**
 * Middleware to set Strict-Transport-Security header
 */
export const hsts = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    // Set HSTS header for 1 year
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};
