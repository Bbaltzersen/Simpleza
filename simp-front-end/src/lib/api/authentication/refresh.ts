// src/api/authentication/refresh.ts
import apiClient from '../apiClient'; // Adjust path if needed

/**
 * Refreshes the authentication token using the dedicated endpoint.
 * Assumes the refresh mechanism relies on HttpOnly cookies managed by the browser.
 */
export async function refreshAuth(): Promise<boolean> {
  try {
    // No payload or specific CSRF header needed if backend relies solely on HttpOnly refresh token cookie
    // Ensure the endpoint URL is exactly correct
    console.log("refreshAuth: Attempting POST /authentication/refresh-token"); // Added log before request
    const response = await apiClient.post('/authentication/refresh-token');
    console.log("refreshAuth: Received response status", response.status); // Added log after request

    if (response.status === 200) {
      console.info("Token refreshed successfully via refreshAuth.");
      return true;
    } else {
      // Log unexpected success status codes? Might indicate issues.
      console.warn("Token refresh request returned non-200 status:", response.status, response.data);
      return false; // Indicate refresh attempt completed but wasn't successful
    }
  } catch (error: any) {
     // Log the caught error, extracting details if possible
     // The previous log showed this part working correctly:
    console.error("Error during call to /authentication/refresh-token:", error.response?.data || error.message || error);
    return false; // Indicate refresh attempt failed
  }
}