// app/ClientAuthProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { retrieveAuth, clearAuth } from '../api/authentication/auth';
import { User } from '../api/authentication/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ initialUser: User | null; children: React.ReactNode }> = ({ initialUser, children }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    async function loadUser() {
      if (!initialUser) {
        const authenticatedUser = await retrieveAuth();
        setUser(authenticatedUser);
        setLoading(false);
      }
    }
    loadUser();
  }, [initialUser]);

  const login = async () => {
    const authenticatedUser = await retrieveAuth();
    setUser(authenticatedUser);
  };

  const logout = async () => {
    await clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a ClientAuthProvider");
  }
  return context;
};

export default AuthProvider;
