import apiClient from '../apiClient';

export async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await apiClient.get('/authentication/csrf-token');
    return response.data.csrf_token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
}
