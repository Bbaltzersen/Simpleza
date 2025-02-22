import apiClient from '../apiClient';

export async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await apiClient.get('/authentication/csrf-token');
    // Response handling: Check that we received a token.
    if (response.status === 200 && response.data?.csrf_token) {
      return response.data.csrf_token;
    } else {
      console.warn("Unexpected response in fetchCSRFToken:", response);
      return null;
    }
  } catch (error: any) {
    console.error('Error in fetchCSRFToken (GET /authentication/csrf-token):', error.message || error);
    return null;
  }
}
