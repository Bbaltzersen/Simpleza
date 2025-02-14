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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const authenticatedUser = await retrieveAuth();
      setUser(authenticatedUser);
      setLoading(false);
    }
    loadUser();
  }, []);

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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
