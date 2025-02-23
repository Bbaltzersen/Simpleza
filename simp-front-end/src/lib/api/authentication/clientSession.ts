import { refreshAuth } from './refresh';
import { retrieveAuth, clearAuth } from './authHandler';
import { getCSRFTokenFromCookies } from './csrfUtils';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

export class ClientSession {
  private static instance: ClientSession;
  private user: User | null = null;
  private csrfToken: string | null = null;
  private isAuthenticated: boolean = false;

  private constructor() {} // Private constructor for Singleton

  public static getInstance(): ClientSession {
    if (!ClientSession.instance) {
      ClientSession.instance = new ClientSession();
    }
    return ClientSession.instance;
  }

  /**
   * Initialize the session (Client-Side)
   */
  public async init(): Promise<void> {
    if (typeof window === 'undefined') return; // Ensure client-side only

    try {
      const { user, error } = await retrieveAuth(); // ✅ Handle both user & error
      if (error) {
        console.warn("Authentication failed:", error);
        this.user = null;
        this.isAuthenticated = false;
      } else {
        this.user = user;
        this.isAuthenticated = !!user;
      }
      this.csrfToken = getCSRFTokenFromCookies(); // Get CSRF token from cookies
    } catch (error: any) {
      console.error("Error in ClientSession.init:", error.message || error);
      this.user = null;
      this.csrfToken = null;
      this.isAuthenticated = false;
    }
  }

  public getUser(): User | null {
    return this.user;
  }

  public isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  public async logout(): Promise<void> {
    try {
      await clearAuth();
    } catch (error: any) {
      console.error('Error during logout in ClientSession.logout:', error.message || error);
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
      console.error("Error in ClientSession.refreshSession:", error.message || error);
      return false;
    }
  }

  public getCSRFToken(): string | null {
    return this.csrfToken;
  }
}

export const clientSession = ClientSession.getInstance();
