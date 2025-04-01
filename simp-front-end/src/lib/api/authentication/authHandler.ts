import apiClient from '../apiClient';
import { getCSRFTokenFromCookies } from './csrfUtils'; 

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

export async function retrieveAuth(): Promise<{ user: User | null; error?: string }> {
    try {
      const csrfToken = getCSRFTokenFromCookies();
      const response = await apiClient.get<{ user?: User; details?: string }>('authentication/protected', {
        headers: { 'X-CSRF-Token': csrfToken || '' }, // Include CSRF token
      });
  
      if (response.status === 200 && response.data?.user) {
        return { user: response.data.user };
      }
  
      if (response.data?.details) {
        return { user: null, error: response.data.details };
      }
  
      console.warn("Unexpected response in retrieveAuth:", response.status);
      return { user: null, error: "Unexpected authentication response." };
  
    } catch (error: any) {
      if (error.response?.status === 401) {
        // ✅ Extract the error message from the response JSON
        const errorMessage = error.response.data?.details || "Unauthorized access.";
        return { user: null, error: errorMessage };
      }
  
      console.error('Network or unknown error in retrieveAuth:', error.message || error);
      return { user: null, error: "Network error or unknown authentication issue." };
    }
  }
  
  

/**
 * Logs the user out and clears authentication tokens
 */
export async function clearAuth(): Promise<void> {
  try {
    const csrfToken = getCSRFTokenFromCookies();

    if (!csrfToken) {
      console.warn("CSRF token missing! Logout might fail.");
      return;
    }

    const response = await apiClient.post(
      '/authentication/logout',
      {},
      { headers: { 'X-CSRF-Token': csrfToken } }
    );

    if (response.status === 200 || response.status === 204) {
      console.info("Logout successful.");
    } else {
      console.warn("Unexpected response in clearAuth:", response);
    }
  } catch (error: any) {
    console.error('Error in clearAuth (POST /authentication/logout):', error.message || error);
  }
}