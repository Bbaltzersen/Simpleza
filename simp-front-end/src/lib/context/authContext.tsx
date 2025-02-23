'use client';

import axios from "axios";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { retrieveAuth, clearAuth } from '../api/authentication/authHandler';
import { User } from '../api/authentication/authHandler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ initialUser: User | null; children: ReactNode }> = ({ initialUser, children }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null); // ✅ Store login error messages
  
  useEffect(() => {
    async function loadUser() {
      if (!initialUser) {
        try {
          setLoading(true);
          const { user, error } = await retrieveAuth(); // ✅ Handle authentication errors
          setUser(user);
          setError(error || null);
        } catch (err) {
          console.error("Error loading user:", err);
          setError("Failed to authenticate.");
        } finally {
          setLoading(false);
        }
      }
    }
    loadUser();
  }, [initialUser]);

  const login = async () => {
    try {
      setError(null); // ✅ Reset error before login attempt
      const { user, error } = await retrieveAuth();

      if (error) {
        setError(error); // ✅ Set error message if login fails
        return;
      }

      setUser(user);
    } catch (err) {
      console.error("Error during login:", err);
      setError("Unexpected login error.");
    }
  };

  const logout = async () => {
    try {
      await clearAuth();
      setUser(null);
      setError(null); // ✅ Reset error on logout
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


export default AuthProvider;
