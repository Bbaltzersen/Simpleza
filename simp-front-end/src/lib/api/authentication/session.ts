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
    if (typeof window === 'undefined') return; // Ensure client-side only

    try {
      const user = await retrieveAuth();
      const csrfToken = await fetchCSRFToken();
      this.user = user;
      this.csrfToken = csrfToken;
      this.isAuthenticated = !!user;
    } catch (error: any) {
      console.error("Error in SessionManager.init:", error.message || error);
      this.user = null;
      this.csrfToken = null;
      this.isAuthenticated = false;
    }
  }

  /**
   * Initialize session (Server-Side) using cookies.
   */
  public async initServerSide(): Promise<void> {
    try {
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();

      const response = await apiClient.get('authentication/protected', {
        headers: { cookie: cookieHeader },
      });
      
      // Response handling
      if (response.status === 200 && response.data?.user) {
        this.user = response.data.user;
        this.isAuthenticated = true;
      } else {
        console.warn("Unexpected response in initServerSide:", response);
        this.user = null;
        this.isAuthenticated = false;
      }
    } catch (error: any) {
      console.error(
        'Error in SessionManager.initServerSide (GET v1/authentication/protected):',
        error.message || error
      );
      this.user = null;
      this.isAuthenticated = false;
    }
  }

  public getUser(): any | null {
    return this.user;
  }

  public isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  public async logout(): Promise<void> {
    try {
      await clearAuth();
    } catch (error: any) {
      console.error('Error during logout in SessionManager.logout:', error.message || error);
    } finally {
      this.user = null;
      this.csrfToken = null;
      this.isAuthenticated = false;
    }
  }

  public async refreshSession(): Promise<boolean> {
    try {
      const refreshed = await refreshAuth();
      if (refreshed) {
        await this.init();
      } else {
        console.warn("Refresh session failed; session remains unauthenticated.");
      }
      return refreshed;
    } catch (error: any) {
      console.error("Error in SessionManager.refreshSession:", error.message || error);
      return false;
    }
  }

  public getCSRFToken(): string | null {
    return this.csrfToken;
  }
}

export const session = SessionManager.getInstance();
