import apiClient from '../apiClient';

export async function refreshAuth(): Promise<boolean> {
  try {
    await apiClient.post('/authentication/refresh');
    return true;
  } catch (error: any) {
    console.error('Error in refreshAuth (POST /authentication/refresh):', error.message || error);
    return false;
  }
}
