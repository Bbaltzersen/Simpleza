import axios from 'axios';
import apiClient from '../apiClient'

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
  } catch (error) {
    console.error('Error retrieving authentication:', error);
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await apiClient.post('/authentication/logout');
  } catch (error) {
    console.error('Error clearing authentication:', error);
  }
}
