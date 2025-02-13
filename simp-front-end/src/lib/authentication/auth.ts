import axios from 'axios';

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

const API_BASE_URL = process.env.AUTH_API;

const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export async function retrieveAuth(): Promise<User | null> {
  try {
    const response = await authClient.get<User>('/protected');
    return response.data;
  } catch (error) {
    console.error('Error retrieving authentication', error);
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await authClient.post('/logout');
  } catch (error) {
    console.error('Error clearing authentication', error);
  }
}
