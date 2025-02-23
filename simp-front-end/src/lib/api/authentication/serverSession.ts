import { cookies } from 'next/headers';
import apiClient from '../apiClient';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

/**
 * Retrieves authentication details on the server (Server Component Compatible)
 */
export async function initServerSideSession(): Promise<{ user: User | null; isAuthenticated: boolean }> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await apiClient.get<{ user: User }>('authentication/protected', {
      headers: { cookie: cookieHeader },
    });

    if (response.status === 200 && response.data?.user) {
      return { user: response.data.user, isAuthenticated: true };
    }

    // If API responds with a different status, treat as unauthorized
    console.warn("Unexpected response in initServerSideSession:", response.status);
    return { user: null, isAuthenticated: false };
  } catch (error: any) {
    if (error.response?.status === 401) {
      // ✅ Handle 401 Unauthorized without logging an error
      return { user: null, isAuthenticated: false };
    }

    // Log other errors (server issues, network failures, etc.)
    console.error("Error in initServerSideSession:", error.message || error);
    return { user: null, isAuthenticated: false };
  }
}
