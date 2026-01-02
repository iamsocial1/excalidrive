import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { storageUtils } from './storage.utils';
import { tokenUtils } from './token.utils';
import { toast } from './toast';
import { networkStatus } from './network.utils';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// Extend the AxiosRequestConfig to include _retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = storageUtils.getAuthToken();
        
        if (token && config.headers) {
          // Check if token is expired before making request
          if (tokenUtils.isTokenExpired(token)) {
            // Token is expired, attempt refresh
            this.handleTokenRefresh();
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Check for network errors
        if (!error.response) {
          if (!networkStatus.getStatus()) {
            const networkError = new Error('No internet connection. Please check your network.');
            console.error('Network error:', networkError);
            toast.error('No internet connection');
            return Promise.reject(networkError);
          }
          
          // Request timeout or other network issue
          console.error('Network request failed:', error.message);
          toast.error('Network request failed. Please try again.');
          return Promise.reject(error);
        }

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAuthToken();
            this.isRefreshing = false;
            this.onTokenRefreshed(newToken);
            this.refreshSubscribers = [];

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            
            // Refresh failed, clear auth data and redirect to login
            storageUtils.clearAuthData();
            window.dispatchEvent(new CustomEvent('auth:signout'));
            toast.error('Session expired. Please sign in again.');
            
            // Redirect to home page
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
            
            return Promise.reject(refreshError);
          }
        }

        // Handle other HTTP errors
        this.handleHttpError(error);

        return Promise.reject(error);
      }
    );
  }

  private handleHttpError(error: AxiosError<ApiErrorResponse>): void {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // Log error for debugging
    console.error('API Error:', {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Don't show toast for 401 errors (handled separately)
    if (status === 401) {
      return;
    }

    // Handle specific error codes
    switch (status) {
      case 400:
        // Bad request - validation errors
        break; // Let the component handle validation errors
      case 403:
        toast.error('Access denied. You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 409:
        toast.error(message || 'Conflict. The resource already exists.');
        break;
      case 429:
        toast.error('Too many requests. Please slow down.');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Please try again later.');
        break;
      default:
        if (status && status >= 400) {
          toast.error(message || 'An error occurred. Please try again.');
        }
    }
  }

  private async refreshAuthToken(): Promise<string> {
    const refreshToken = storageUtils.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { token } = response.data;
      storageUtils.setAuthToken(token);
      
      return token;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  private handleTokenRefresh(): void {
    // This method can be called to proactively refresh tokens
    // For now, we'll let the response interceptor handle it
  }

  public getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient().getInstance();
