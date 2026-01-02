import type { TokenPayload } from '../types/auth.types';

export const tokenUtils = {
  /**
   * Decode JWT token without verification
   * Note: This is for client-side expiration checking only
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as TokenPayload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    // Add 60 second buffer to account for clock skew
    return currentTime >= expirationTime - 60000;
  },

  /**
   * Get time until token expires in milliseconds
   */
  getTimeUntilExpiration(token: string): number {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    return Math.max(0, expirationTime - currentTime);
  },
};
