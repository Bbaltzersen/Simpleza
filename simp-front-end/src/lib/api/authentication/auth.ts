import apiClient from '../apiClient';
import { fetchCSRFToken } from './csrf';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

export async function retrieveAuth(): Promise<User | null> {
  const response = await apiClient.get<{ user: User }>('authentication/protected');
    // Response handling: Ensure the response contains the user data.
    if (response.status === 200 && response.data?.user) {
      return response.data.user;
    } else {
      console.warn("Unexpected response in retrieveAuth:", response);
      return null;
    }
}

export async function clearAuth(): Promise<void> {
  try {
    const csrfToken = await fetchCSRFToken();
    const response = await apiClient.post(
      '/authentication/logout',
      {},
      { headers: { 'X-CSRF-Token': csrfToken || '' } }
    );
    // Response handling: Log if logout was successful.
    if (response.status === 200 || response.status === 204) {
      console.info("Logout successful.");
    } else {
      console.warn("Unexpected response in clearAuth:", response);
    }
  } catch (error: any) {
    console.error('Error in clearAuth (POST /authentication/logout):', error.message || error);
  }
}
