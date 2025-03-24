"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { retrieveAuth, clearAuth } from '../api/authentication/authHandler';
import { refreshAuth } from '../api/authentication/refresh';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session by retrieving current authentication status.
  const initSession = async () => {
    setLoading(true);
    try {
      const { user, error } = await retrieveAuth();
      if (error) {
        console.warn('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
        setError(error);
      } else {
        setUser(user);
        setIsAuthenticated(!!user);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error initializing session:', err.message || err);
      setUser(null);
      setIsAuthenticated(false);
      setError(err.message || 'Session initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize auth state when the component mounts.
    initSession();
  }, []);

  // For login, you might either open a login modal or redirect.
  // Here we simply reinitialize the session after login.
  const login = async () => {
    await initSession();
  };

  // Logout by clearing authentication on the backend, then resetting local state.
  const logout = async () => {
    try {
      await clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err: any) {
      console.error('Error during logout:', err.message || err);
      setError(err.message || 'Logout failed.');
    }
  };

  // Refresh the session using the refreshAuth function and then reinitialize.
  const refreshSession = async (): Promise<boolean> => {
    try {
      const refreshed = await refreshAuth();
      if (refreshed) {
        await initSession();
      }
      return refreshed;
    } catch (err: any) {
      console.error('Error refreshing session:', err.message || err);
      return false;
    }
  };

  // Proactive Refresh: set a timer to refresh the token before it expires.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // Only schedule a refresh if the user is authenticated and not loading.
    if (isAuthenticated && !loading) {
      const tokenLifetime = 3600; // seconds (1 hour)
      const refreshBuffer = 300;  // seconds (5 minutes before expiration)
      const timeout = (tokenLifetime - refreshBuffer) * 1000;
      timer = setTimeout(() => {
        refreshSession().then(success => {
          if (success) {
            console.info('Proactive token refresh succeeded.');
          } else {
            console.warn('Proactive token refresh failed.');
          }
        });
      }, timeout);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, loading]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
