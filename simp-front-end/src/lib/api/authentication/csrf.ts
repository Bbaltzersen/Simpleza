import apiClient from '../apiClient';

export async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await apiClient.get('/authentication/csrf-token');
    return response.data.csrf_token;
  } catch (error: any) {
    console.error('Error in fetchCSRFToken (GET /authentication/csrf-token):', error.message || error);
    return null;
  }
}
