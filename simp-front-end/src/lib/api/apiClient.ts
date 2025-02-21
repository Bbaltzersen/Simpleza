import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.AUTH_API || "http://localhost:8000/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Response interceptor for centralized error logging.
// It logs network errors and 401 Unauthorized errors without triggering a refresh.
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (!error.response) {
      console.error(`Network/CORS error at endpoint "${error.config?.url}":`, error.message);
      return Promise.reject(new Error('Custom: Unable to connect to the server. Please try again later.'));
    }
    
    // Log a warning if a 401 Unauthorized error is encountered.
    if (error.response.status === 401) {
      console.warn(`401 Unauthorized error at endpoint "${error.config?.url}"`);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
