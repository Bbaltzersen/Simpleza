import apiClient from '../apiClient';
import { fetchCSRFToken } from './csrf';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

export async function retrieveAuth(): Promise<User | null> {
  try {
    const response = await apiClient.get<{ user: User }>('/authentication/protected');
    return response.data.user;
  } catch (error: any) {
    console.error('Error in retrieveAuth (GET /authentication/protected):', error.message || error);
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await apiClient.post(
      '/authentication/logout',
      {},
      { headers: { 'X-CSRF-Token': await fetchCSRFToken() } }
    );
  } catch (error: any) {
    console.error('Error in clearAuth (POST /authentication/logout):', error.message || error);
  }
}
