import { CookieOptions } from 'express';

/**
 * Secure cookie configuration
 */
export const secureCookieOptions: CookieOptions = {
  httpOnly: true, // Prevents JavaScript access to cookies
  secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  sameSite: 'strict', // Prevents CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * Cookie configuration for refresh tokens (longer expiry)
 */
export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth/refresh',
};

/**
 * Cookie configuration for CSRF tokens
 */
export const csrfCookieOptions: CookieOptions = {
  httpOnly: false, // Must be accessible to JavaScript to send in headers
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

/**
 * Get cookie name with environment prefix
 */
export function getCookieName(baseName: string): string {
  const prefix = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
  return `${prefix}${baseName}`;
}

/**
 * Cookie names
 */
export const COOKIE_NAMES = {
  AUTH_TOKEN: getCookieName('auth_token'),
  REFRESH_TOKEN: getCookieName('refresh_token'),
  CSRF_TOKEN: getCookieName('csrf_token'),
};
