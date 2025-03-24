import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import { refreshAuth } from '../api/authentication/refresh'; // adjust the import path as needed

const API_BASE_URL = process.env.AUTH_API || "http://localhost:8000/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Variables to track refresh state and queue failed requests
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (error: any) => void }> = [];

// Helper function to process the failed queue once refresh is complete
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Extend AxiosRequestConfig to optionally include a _retry flag
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Add a response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If a 401 error occurs and the request has not been retried yet...
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request if a refresh is already in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshSucceeded = await refreshAuth();
        if (refreshSucceeded) {
          processQueue(null);
          // Retry the original request with the updated access token (cookies handle the token update)
          return apiClient(originalRequest);
        } else {
          processQueue(new Error('Could not refresh token'));
          return Promise.reject(error);
        }
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
