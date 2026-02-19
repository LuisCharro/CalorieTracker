'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenManager } from '../api/client';
import { User } from '../contracts/types';
import { authService } from '../api/services/auth.service';

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (data: CreateUserRequest & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userId = tokenManager.getUserId();
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const user = await authService.getCurrentUser();
      setUser(user);
    } catch (error) {
      // If we get an error, clear tokens and redirect to login
      console.error('Failed to load user:', error);
      tokenManager.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        tokenManager.setTokens('mock-token', response.data.id);
        setUser(response.data);
      } else {
        throw new Error('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: CreateUserRequest & { password: string }) => {
    setIsLoading(true);
    try {
      const response = await authService.signup(data);
      if (response.success) {
        tokenManager.setTokens('mock-token', response.data.id);
        setUser(response.data);
      } else {
        throw new Error(response.error?.message || 'Signup failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
