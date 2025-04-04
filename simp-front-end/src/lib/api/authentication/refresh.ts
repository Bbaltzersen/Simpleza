import apiClient from '../apiClient';

/**
 * Refreshes the authentication token
 */
export async function refreshAuth(): Promise<boolean> {
  try {
    const response = await apiClient.post('/authentication/refresh-token', {}, { withCredentials: true });

    if (response.status === 200) {
      console.info("Token refreshed successfully.");
      return true;
    } else {
      console.warn("Token refresh failed:", response);
      return false;
    }
  } catch (error: any) {
    console.error("Error in refreshAuth:", error.message || error);
    return false;
  }
}
