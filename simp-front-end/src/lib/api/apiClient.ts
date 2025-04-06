// src/api/apiClient.ts

import axios, { AxiosError, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { refreshAuth } from './authentication/refresh'; // Adjust path if needed
import { getCSRFTokenFromCookies } from './authentication/csrfUtils'; // Adjust path if needed

// Ensure your environment variable is correctly prefixed for client-side access if using Next.js
const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API || process.env.AUTH_API || "http://localhost:8000/v1";

console.log("API Client Initialized. Base URL:", API_BASE_URL); // Log base URL on init

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending HttpOnly cookies (like refresh tokens)
  // You might want to add a reasonable timeout
  // timeout: 10000, // e.g., 10 seconds
});

// --- Request Interceptor for CSRF Token ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only add CSRF token for potentially state-changing methods or specific GETs
    const methodsNeedingCSRF = ['post', 'put', 'delete', 'patch'];
    // Make sure the URL check correctly matches your protected endpoint structure
    const isProtectedGet = config.url === 'authentication/protected' || config.url === '/authentication/protected';

    if ((config.method && methodsNeedingCSRF.includes(config.method)) || isProtectedGet) {
      const csrfToken = getCSRFTokenFromCookies();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
        // console.log(`INTERCEPTOR (Request): Added CSRF token for ${config.method?.toUpperCase()} to ${config.url}`);
      } else {
        console.warn(`INTERCEPTOR (Request): CSRF token missing for method ${config.method?.toUpperCase()} to ${config.url}. Request proceeding without it.`);
      }
    }
    return config;
  },
  (error) => {
    console.error("INTERCEPTOR (Request): Error", error); // Log request errors
    return Promise.reject(error);
  }
);

// --- Response Interceptor for Token Refresh ---

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      // We don't typically pass the token here as cookies handle it
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Extend AxiosRequestConfig to optionally include a _retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response, // Simply return successful responses
  async (error: AxiosError) => {
    // Make sure error and error.config are defined
    if (!error || !error.config) {
        console.error("INTERCEPTOR (Response): Invalid error object received", error);
        return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;
    const status = error.response?.status;
    const requestUrl = originalRequest.url;

    console.log(`INTERCEPTOR (Response): Intercepted request to ${requestUrl} with status ${status}`); // Log every intercepted error

    // Check if it's a 401 error, not from the refresh endpoint itself, and not already retried
    if (
        status === 401 &&
        requestUrl !== '/authentication/refresh-token' && // Avoid retry loop on refresh failure
        !originalRequest._retry
       ) {

      if (isRefreshing) {
        console.log(`INTERCEPTOR (Response): 401 received for ${requestUrl}, refresh already in progress. Queuing request.`); // Log queuing
        // If refresh is already happening, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          console.log(`INTERCEPTOR (Response): Retrying queued request for ${requestUrl} after refresh.`); // Log retry from queue
          return apiClient(originalRequest); // Retry the original request
        }).catch(err => {
          console.error(`INTERCEPTOR (Response): Error processing queued request for ${requestUrl}`, err); // Log queue processing error
          return Promise.reject(err); // Propagate error if queue processing fails
        });
      }

      // Mark this request as retried and start refreshing
      originalRequest._retry = true;
      isRefreshing = true;
      console.log(`INTERCEPTOR (Response): 401 received for ${requestUrl}. Initiating token refresh.`); // Log refresh initiation

      try {
        console.log("INTERCEPTOR (Response): Calling refreshAuth..."); // Log before refresh call
        const refreshSucceeded = await refreshAuth(); // Attempt to refresh the token
        console.log("INTERCEPTOR (Response): refreshAuth finished. Succeeded:", refreshSucceeded); // Log after refresh call

        if (refreshSucceeded) {
          console.log(`INTERCEPTOR (Response): Refresh successful. Processing queue and retrying ${requestUrl}.`); // Log success and retry
          processQueue(null); // Process queued requests successfully
          // Retry the original request. The request interceptor will add the new CSRF token if applicable.
          return apiClient(originalRequest);
        } else {
          console.warn(`INTERCEPTOR (Response): refreshAuth returned false. Rejecting ${requestUrl} and queue.`); // Log refresh failure
          const refreshError = new Error('Unable to refresh authentication token.');
          processQueue(refreshError); // Reject queued requests
          // Optionally trigger a global logout action here
          // window.dispatchEvent(new Event('force-logout'));
          return Promise.reject(error); // Reject the original request with the original 401 error
        }
      } catch (refreshErr: any) {
        console.error(`INTERCEPTOR (Response): Exception during refreshAuth call triggered by ${requestUrl}:`, refreshErr); // Log specific exception during refresh
        processQueue(refreshErr); // Reject queued requests with the specific refresh error
        // Optionally trigger a global logout action here
        // window.dispatchEvent(new Event('force-logout'));
        return Promise.reject(error); // Reject the original request (or refreshErr)
      } finally {
        console.log("INTERCEPTOR (Response): Refresh attempt finally block. Setting isRefreshing=false."); // Log finally block execution
        isRefreshing = false;
      }
    } else {
      // Log why the interceptor is rejecting without attempting refresh
        if (status === 401) {
            console.warn(`INTERCEPTOR (Response): Rejecting 401 for ${requestUrl} because it was already retried or it's the refresh endpoint itself.`);
        } else {
            console.warn(`INTERCEPTOR (Response): Rejecting request for ${requestUrl} with status ${status} (not 401 or already handled).`);
        }
    }

    // For errors other than 401 handled above, or if retry failed, just reject
    return Promise.reject(error);
  }
);

export default apiClient;