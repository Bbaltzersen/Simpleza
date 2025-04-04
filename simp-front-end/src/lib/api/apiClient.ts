// apiClient.ts (Revised Interceptor Logic)
import axios, { AxiosError, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { refreshAuth } from '../api/authentication/refresh'; // adjust path

const API_BASE_URL = process.env.AUTH_API || "http://localhost:8000/v1";
// Define the refresh URL as a constant for easy comparison
const REFRESH_URL = '/authentication/refresh-token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error?: any) => void }> = [];

const processQueue = (error: any | null) => {
    console.log(`[Interceptor] Processing queue. Error: ${!!error}, Queue size: ${failedQueue.length}`);
    failedQueue.forEach(prom => {
        if (error) {
            console.log("[Interceptor] Rejecting queued promise.");
            prom.reject(error);
        } else {
             console.log("[Interceptor] Resolving queued promise (signal to retry).");
            prom.resolve();
        }
    });
    failedQueue = [];
};

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
      console.log(`[Interceptor] Request successful: ${response.config.method?.toUpperCase()} ${response.config.url} Status: ${response.status}`);
      return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;
    if (!originalRequest || !error.response) {
        console.error("[Interceptor] AxiosError missing config or response", error);
        return Promise.reject(error);
    }

    const { status } = error.response;
    const url = originalRequest.url; // Get URL relative to baseURL
    const method = originalRequest.method;
    const retried = originalRequest._retry;

    console.log(`[Interceptor] Response Error Caught. Status: ${status}, Method: ${method?.toUpperCase()}, URL: ${url}, Retried: ${retried}`);

    // --- FIX: Check if the failed request IS the refresh endpoint ---
    const isRefreshRequest = url === REFRESH_URL;

    // Handle 401 errors
    if (status === 401) {

        // --- FIX: If the refresh URL itself failed with 401, ABORT ---
        if (isRefreshRequest) {
            console.error("[Interceptor] Refresh token request failed with 401. Cannot recover session. Aborting queue and rejecting.");
            isRefreshing = false; // Reset the flag
            processQueue(error); // Reject any queued requests with this critical error
            // !! Add logic here to force user logout/redirect if desired !!
            // e.g., clear local storage, redirect to login page
            // window.location.href = '/login'; // Example, might need router push in React
            return Promise.reject(error); // Reject this promise chain
        }
        // --- End FIX ---

        // Only proceed if it wasn't the refresh request that failed 401
        // And if it hasn't been retried already
        if (!retried) {
            if (isRefreshing) {
                // Queue normal requests if refresh is already happening
                console.log(`[Interceptor] Refresh already in progress. Queuing request: ${method?.toUpperCase()} ${url}`);
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    console.log(`[Interceptor] Retrying queued request after refresh finished: ${method?.toUpperCase()} ${url}`);
                    return apiClient(originalRequest); // Retry original request
                }).catch(queueError => {
                   console.error(`[Interceptor] Error processing or retrying queued request: ${method?.toUpperCase()} ${url}`, queueError);
                   return Promise.reject(queueError);
                });
            }

            // Initiate token refresh for the original failed request
            console.log(`[Interceptor] Initiating token refresh for: ${method?.toUpperCase()} ${url}`);
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("[Interceptor] Calling refreshAuth()...");
                const refreshSucceeded = await refreshAuth();
                console.log(`[Interceptor] refreshAuth() completed. Success: ${refreshSucceeded}`);

                if (refreshSucceeded) {
                    console.log(`[Interceptor] Refresh succeeded. Processing queue and retrying original request: ${method?.toUpperCase()} ${url}`);
                    processQueue(null);
                    return apiClient(originalRequest); // Return promise from retry
                } else {
                    // refreshAuth returned false, indicating failure without throwing an error
                    console.warn(`[Interceptor] refreshAuth() returned false. Processing queue with error and rejecting original request: ${method?.toUpperCase()} ${url}`);
                    const refreshError = new Error('Token refresh failed (explicitly returned false).');
                    processQueue(refreshError);
                    return Promise.reject(error); // Reject with original 401 error
                }
            } catch (refreshErr: any) {
                // Error was thrown during refreshAuth() call
                console.error(`[Interceptor] Error during refreshAuth() call for ${method?.toUpperCase()} ${url}. Processing queue and rejecting.`, refreshErr);
                processQueue(refreshErr);
                // If refreshAuth throws (e.g., network error), reject with that specific error
                return Promise.reject(refreshErr);
            } finally {
                console.log("[Interceptor] Setting isRefreshing = false");
                isRefreshing = false;
            }
        } // End if (!retried)
    } // End if (status === 401)

    // If error is not 401, or it's a 401 that was already retried, or it's a 401 on the refresh URL (handled above)
    console.log(`[Interceptor] Error not handled by refresh logic (Status: ${status}, Retried: ${retried}, IsRefresh: ${isRefreshRequest}). Rejecting original error for ${method?.toUpperCase()} ${url}`);
    return Promise.reject(error); // Reject all other errors
  }
);

export default apiClient;