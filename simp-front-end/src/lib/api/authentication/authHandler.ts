// src/api/authentication/authHandler.ts
import apiClient from '../apiClient'; // Adjust path if needed

// User interface remains the same
export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

/**
 * Retrieves the current user's authentication status and details.
 * CSRF token is automatically added by the apiClient request interceptor.
 */
export async function retrieveAuth(): Promise<{ user: User | null; error?: string }> {
  try {
    // Request interceptor handles the CSRF token
    const response = await apiClient.get<{ user?: User; details?: string }>('authentication/protected');

    // Check for successful response with user data
    if (response.status === 200 && response.data?.user) {
      return { user: response.data.user };
    }

    // Handle cases where the endpoint returns 200 but no user (e.g., valid session, no data)
    // Or cases where it returns non-200 but includes details (adjust based on your API)
    if (response.data?.details) {
       console.warn("retrieveAuth received details but no user:", response.data.details);
       return { user: null, error: response.data.details };
    }

    // Fallback for unexpected successful responses without user or details
    console.warn("Unexpected response structure in retrieveAuth:", response.status, response.data);
    return { user: null, error: "Unexpected authentication response." };

  } catch (error: any) {
    // The interceptor handles 401s for refresh, but retrieveAuth might still fail
    // (e.g., after failed refresh, network error, other non-401 errors).
    const errorData = error.response?.data as { details?: string };
    const errorMessage = errorData?.details || error.message || "Failed to retrieve authentication status.";

    if (error.response?.status === 401) {
         // This might be reached if the refresh attempt *also* failed
         console.warn('retrieveAuth failed with 401 (likely after failed refresh):', errorMessage);
         return { user: null, error: "Session expired or invalid." }; // User-friendly message
    }

    console.error('Error in retrieveAuth:', errorMessage, error.response?.status);
    return { user: null, error: errorMessage };
  }
}

/**
 * Logs the user out by calling the logout endpoint.
 * CSRF token is automatically added by the apiClient request interceptor.
 */
export async function clearAuth(): Promise<{ success: boolean; error?: string }> {
  try {
    // Request interceptor handles the CSRF token
    const response = await apiClient.post('/authentication/logout');

    // Typically 200 or 204 indicate success
    if (response.status === 200 || response.status === 204) {
      console.info("Logout successful via clearAuth.");
      return { success: true };
    } else {
      console.warn("Unexpected status code during logout:", response.status, response.data);
       const errorMsg = (response.data as { details?: string })?.details || "Logout failed with unexpected status.";
      return { success: false, error: errorMsg };
    }
  } catch (error: any) {
     const errorData = error.response?.data as { details?: string };
     const errorMessage = errorData?.details || error.message || "Failed to execute logout.";
     console.error('Error in clearAuth:', errorMessage, error.response?.status);
     return { success: false, error: errorMessage };
  }
}