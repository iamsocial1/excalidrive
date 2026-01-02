const AUTH_TOKEN_KEY = 'excalidraw_auth_token';
const REFRESH_TOKEN_KEY = 'excalidraw_refresh_token';
const USER_DATA_KEY = 'excalidraw_user_data';

export const storageUtils = {
  // Token management
  setAuthToken(token: string): void {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  },

  getAuthToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  },

  removeAuthToken(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  },

  // Refresh token management
  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  },

  removeRefreshToken(): void {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove refresh token:', error);
    }
  },

  // User data management
  setUserData(user: unknown): void {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  },

  getUserData<T>(): T | null {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  removeUserData(): void {
    try {
      localStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Failed to remove user data:', error);
    }
  },

  // Clear all auth-related data
  clearAuthData(): void {
    this.removeAuthToken();
    this.removeRefreshToken();
    this.removeUserData();
  },
};
