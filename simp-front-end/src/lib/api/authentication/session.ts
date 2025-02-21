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
    // Ensure this only runs on the client-side.
    if (typeof window === 'undefined') return;

    try {
      this.user = await retrieveAuth();
      this.csrfToken = await fetchCSRFToken();
      this.isAuthenticated = !!this.user;
    } catch (error: any) {
      console.error("Error in SessionManager.init:", error.message || error);
    }
  }

  /**
   * Initialize session (Server-Side) using cookies.
   * Uses Next.js `cookies()` for server components.
   */
  public async initServerSide(): Promise<void> {
    try {
      const cookieStore = cookies();
      const cookieHeader = cookieStore.toString();

      const response = await apiClient.get('/authentication/protected', {
        headers: { cookie: cookieHeader },
      });

      this.user = response.data.user;
      this.isAuthenticated = !!this.user;
    } catch (error: any) {
      console.error(
        'Error in SessionManager.initServerSide (GET /authentication/protected):',
        error.message || error
      );
      this.user = null;
      this.isAuthenticated = false;
    }
  }

  /**
   * Returns the authenticated user, or null if not authenticated.
   */
  public getUser(): any | null {
    return this.user;
  }

  /**
   * Returns a boolean indicating whether the user is logged in.
   */
  public isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Clears the session and logs the user out.
   */
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

  /**
   * Refreshes the session using the refreshAuth method.
   * On success, re-initializes the session.
   */
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

  /**
   * Returns the CSRF token used for secure requests.
   */
  public getCSRFToken(): string | null {
    return this.csrfToken;
  }
}

export const session = SessionManager.getInstance();
