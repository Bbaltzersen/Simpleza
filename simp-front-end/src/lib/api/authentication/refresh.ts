import apiClient from '../apiClient';

export async function refreshAuth(): Promise<boolean> {
  try {
    const response = await apiClient.post('v1/authentication/refresh');
    // Response handling: Expect a 200 OK for a successful refresh.
    if (response.status === 200) {
      console.info("Refresh authentication successful.");
      return true;
    } else {
      console.warn("Unexpected response in refreshAuth:", response);
      return false;
    }
  } catch (error: any) {
    console.error('Error in refreshAuth (POST /authentication/refresh):', error.message || error);
    return false;
  }
}
