import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { User, UpdateProfileRequest } from '../types/auth.types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  updateUser: (updates: UpdateProfileRequest) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Setup token expiration check
  useEffect(() => {
    const cleanup = authService.setupTokenExpirationCheck(() => {
      setUser(null);
      // Optionally show a notification to the user
      console.log('Session expired. Please sign in again.');
    });

    return cleanup;
  }, []);

  // Listen for signout events
  useEffect(() => {
    const handleSignout = () => {
      setUser(null);
    };

    window.addEventListener('auth:signout', handleSignout);

    return () => {
      window.removeEventListener('auth:signout', handleSignout);
    };
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.signin(email, password);
      setUser(response.user);
    } catch (error) {
      console.error('Signin failed:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await authService.signup(name, email, password);
      setUser(response.user);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await authService.signout();
      setUser(null);
    } catch (error) {
      console.error('Signout failed:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updates: UpdateProfileRequest) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signin,
    signup,
    signout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
