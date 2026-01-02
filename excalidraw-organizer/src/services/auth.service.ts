import { apiClient } from '../utils/api.client';
import { storageUtils } from '../utils/storage.utils';
import { tokenUtils } from '../utils/token.utils';
import type {
  User,
  AuthResponse,
  SignupRequest,
  SigninRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/auth.types';

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const payload: SignupRequest = { name, email, password };
    
    const response = await apiClient.post<AuthResponse>('/auth/signup', payload);
    const { user, token, refreshToken } = response.data;

    // Store tokens and user data
    storageUtils.setAuthToken(token);
    if (refreshToken) {
      storageUtils.setRefreshToken(refreshToken);
    }
    storageUtils.setUserData(user);

    return response.data;
  }

  /**
   * Sign in an existing user
   */
  async signin(email: string, password: string): Promise<AuthResponse> {
    const payload: SigninRequest = { email, password };
    
    const response = await apiClient.post<AuthResponse>('/auth/signin', payload);
    const { user, token, refreshToken } = response.data;

    // Store tokens and user data
    storageUtils.setAuthToken(token);
    if (refreshToken) {
      storageUtils.setRefreshToken(refreshToken);
    }
    storageUtils.setUserData(user);

    return response.data;
  }

  /**
   * Sign out the current user
   */
  async signout(): Promise<void> {
    try {
      // Call backend to invalidate token
      await apiClient.post('/auth/signout');
    } catch (error) {
      console.error('Signout request failed:', error);
      // Continue with local cleanup even if backend call fails
    } finally {
      // Clear all local auth data
      storageUtils.clearAuthData();
      
      // Dispatch custom event for other components to react
      window.dispatchEvent(new CustomEvent('auth:signout'));
    }
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<void> {
    const payload: ForgotPasswordRequest = { email };
    await apiClient.post('/auth/forgot-password', payload);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload: ResetPasswordRequest = { token, newPassword };
    await apiClient.post('/auth/reset-password', payload);
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', updates);
    const updatedUser = response.data;

    // Update stored user data
    storageUtils.setUserData(updatedUser);

    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const payload: ChangePasswordRequest = { currentPassword, newPassword };
    await apiClient.put('/auth/password', payload);
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return storageUtils.getAuthToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = storageUtils.getAuthToken();
    
    if (!token) {
      return false;
    }

    // Check if token is expired
    if (tokenUtils.isTokenExpired(token)) {
      // Token expired, clear auth data
      storageUtils.clearAuthData();
      return false;
    }

    return true;
  }

  /**
   * Get current user from storage
   */
  getCurrentUser(): User | null {
    return storageUtils.getUserData<User>();
  }

  /**
   * Setup automatic token expiration check
   */
  setupTokenExpirationCheck(onExpire: () => void): () => void {
    const checkInterval = 60000; // Check every minute
    
    const intervalId = setInterval(() => {
      const token = storageUtils.getAuthToken();
      
      if (token && tokenUtils.isTokenExpired(token)) {
        storageUtils.clearAuthData();
        onExpire();
      }
    }, checkInterval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

// Export singleton instance
export const authService = new AuthService();
