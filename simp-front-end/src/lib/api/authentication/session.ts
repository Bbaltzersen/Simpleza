import { retrieveAuth, clearAuth } from './auth';
import { fetchCSRFToken } from './csrf';
import { refreshAuth } from './refresh';
import apiClient from '../apiClient';
import { cookies } from 'next/headers';

export class SessionManager {
  private static instance: SessionManager;
  private user: any | null = null;
  private csrfToken: string | null = null;
  private isAuthenticated: boolean = false;

  private constructor() {} // Singleton

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize the session (Client-Side)
   */
  public async init(): Promise<void> {
    if (typeof window === 'undefined') return; // Avoid running on the server

    try {
      this.user = await retrieveAuth();
      this.csrfToken = await fetchCSRFToken();
      this.isAuthenticated = !!this.user;
    } catch (error) {
      console.error("Session initialization failed:", error);
    }
  }

  /**
   * Initialize session (Server-Side) using cookies.
   * Uses Next.js `cookies()` instead of `req` for server components.
   */
  public async initServerSide(): Promise<void> {
    try {
      const cookieStore = await cookies(); // Await the cookies() call
      const cookieHeader = cookieStore.toString(); // Convert cookies to a string
  
      const response = await apiClient.get('/authentication/protected', {
        headers: { cookie: cookieHeader }, // Send cookies to backend
      });
  
      this.user = response.data.user;
      this.isAuthenticated = !!this.user;
    } catch (error) {
      this.user = null;
      this.isAuthenticated = false;
    }
  }
  

  /**
   * Get the authenticated user.
   */
  public getUser(): any | null {
    return this.user;
  }

  /**
   * Check if user is authenticated.
   */
  public isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Logout and clear the session.
   */
  public async logout(): Promise<void> {
    await clearAuth();
    this.user = null;
    this.csrfToken = null;
    this.isAuthenticated = false;
  }

  /**
   * Refresh session (if backend supports refresh tokens).
   */
  public async refreshSession(): Promise<boolean> {
    const refreshed = await refreshAuth();
    if (refreshed) {
      await this.init();
    }
    return refreshed;
  }

  /**
   * Get CSRF Token (for secure requests).
   */
  public getCSRFToken(): string | null {
    return this.csrfToken;
  }
}

// Create a global instance
export const session = SessionManager.getInstance();
