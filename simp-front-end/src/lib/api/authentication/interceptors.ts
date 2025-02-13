import apiClient from '../apiClient';
import { refreshAuth } from './refresh';

apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) { 
      const refreshed = await refreshAuth();
      if (refreshed) {
        return apiClient(error.config); 
      }
    }
    return Promise.reject(error);
  }
);
