import apiClient from '../apiClient';

export async function refreshAuth(): Promise<boolean> {
  try {
    await apiClient.post('/authentication/refresh');
    return true;
  } catch (error) {
    console.error('Error refreshing authentication:', error);
    return false;
  }
}
