// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Make sure these import paths are correct for your project structure
import { retrieveAuth, clearAuth, User } from '../api/authentication/authHandler';
import { refreshAuth } from '../api/authentication/refresh';

// Re-declare or ensure User interface is available
// export interface User { user_id: string; username: string; email: string; role: string; }

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; // Indicates loading of initial auth state or re-initialization
  error: string | null;
  initSession: () => Promise<void>; // Exposed for potential manual re-init
  login: () => Promise<void>; // Placeholder/Re-initializer
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>; // Manual refresh trigger
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOG ---
  console.log("AuthProvider: Rendering or Re-rendering...");

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Start loading on initial mount
  const [error, setError] = useState<string | null>(null);

  // Initialize session or re-validate existing session
  const initSession = useCallback(async () => {
    // Removed the problematic guard clause in the previous step

    // Start the process
    console.log("AuthContext: Initializing session (setting loading=true)...");
    setLoading(true);
    setError(null); // Clear previous errors on new attempt

    try {
      console.log("AuthContext: Calling retrieveAuth..."); // Log before await
      const { user: fetchedUser, error: fetchError } = await retrieveAuth();
      // Log result immediately after await returns
      console.log("AuthContext: retrieveAuth finished.", { user: fetchedUser ? 'User Object' : fetchedUser, error: fetchError });

      if (fetchError) {
        console.warn('AuthContext: Initialization failed (retrieveAuth returned error).', fetchError);
        setUser(null);
        setIsAuthenticated(false);
        // Set error state unless it's a standard unauthorized/expired message
        if (fetchError !== "Session expired or invalid." && fetchError !== "Unauthorized access.") {
             setError(fetchError);
        } else {
             setError(null); // Clear specific auth errors, user is just logged out
        }
      } else if (fetchedUser) {
        console.log('AuthContext: Initialization successful. User found.');
        setUser(fetchedUser);
        setIsAuthenticated(true);
        setError(null);
      } else {
         // Successful response but no user data - treat as logged out
         console.log('AuthContext: Initialization successful. No active session.');
         setUser(null);
         setIsAuthenticated(false);
         setError(null);
      }
    } catch (err: any) {
      // Catch unexpected errors during the try block (e.g., error within state setting)
      console.error('AuthContext: Unexpected error during initSession try block:', err);
      setUser(null);
      setIsAuthenticated(false);
      setError(err.message || 'Session initialization failed unexpectedly.');
    } finally {
      // --- Log inside finally ---
      console.log("AuthContext: Entering finally block...");
      setLoading(false); // CRITICAL: Set loading false
      // Log state right after setting loading false
      console.log("AuthContext: setLoading(false) called. Initialization finished.");
    }
    // Dependencies for useCallback - keep loading/error for potential re-memoization if needed elsewhere
  }, [loading, error]);

  // --- FIX APPLIED HERE ---
  // Effect to run initialization ONLY ONCE on mount
  useEffect(() => {
    console.log("AuthProvider: useEffect hook running ON MOUNT (will call initSession)...");
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <--- EMPTY DEPENDENCY ARRAY ensures it runs only once

  // Placeholder login function
  const login = async () => {
    console.log("AuthContext: 'login' called, re-initializing session...");
    await initSession();
  };

  // Logout: Clear backend session, then clear local state.
  const logout = async () => {
    console.log("AuthContext: Logging out...");
    setError(null);
    // Indicate immediate logout state, don't wait for API necessarily
    setUser(null);
    setIsAuthenticated(false);
    try {
      const { success, error: clearError } = await clearAuth();
      if (!success) {
          console.error("AuthContext: Logout API call failed:", clearError);
          // Maybe set error state here if needed, but user is already logged out locally
          // setError(clearError || "Logout failed on the server.");
      } else {
          console.log("AuthContext: Logout API call successful.");
      }
    } catch (err: any) {
       console.error('AuthContext: Error during clearAuth call:', err);
       // setError(err.message || 'Logout failed unexpectedly.');
    } finally {
       console.log("AuthContext: Local state cleared after logout attempt.");
    }
  };

  // Manual Refresh Trigger: Attempt refresh and re-initialize session
  const refreshSession = async (): Promise<boolean> => {
    console.log("AuthContext: Manual refresh triggered...");
    // Indicate loading during manual refresh process
    setLoading(true);
    setError(null);
    try {
      const refreshed = await refreshAuth();
      if (refreshed) {
        console.log("AuthContext: Manual refresh successful, re-initializing session...");
        await initSession(); // Re-fetch user data with new token
        // initSession's finally block will set loading to false
        return true;
      } else {
        console.warn("AuthContext: Manual refresh failed (refreshAuth returned false).");
        setError("Failed to refresh session.");
        setLoading(false); // Ensure loading is false if initSession isn't called
        // Optional: Trigger logout if manual refresh fails critically
        // await logout();
        return false;
      }
    } catch (err: any) {
      console.error('AuthContext: Error during manual refreshSession:', err);
      setError(err.message || 'Failed to refresh session unexpectedly.');
      setLoading(false); // Ensure loading is false on error
      // Optional: Trigger logout
      // await logout();
      return false;
    }
  };

  // Define the context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    initSession, // Expose initSession
    login,
    logout,
    refreshSession, // Expose manual refresh
  };

  // --- LOG ---
  // Log the value being provided, selectively stringifying state
  console.log("AuthProvider: Providing context value:", {
      loading: value.loading,
      isAuthenticated: value.isAuthenticated,
      error: value.error, // Log error message directly
      userExists: !!value.user // Just log if user object exists
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};