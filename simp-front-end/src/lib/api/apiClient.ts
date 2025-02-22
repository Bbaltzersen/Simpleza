import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.AUTH_API || "http://localhost:8000/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // For successful responses (2xx), simply pass them through.
    return response;
  },
  (error: AxiosError) => {
    // If no response was received (network, CORS, etc.), reject with a custom error.
    if (!error.response) {
      console.error(`Network/CORS error at endpoint "${error.config?.url}":`, error.message);
      return Promise.reject(new Error('Custom: Unable to connect to the server. Please try again later.'));
    }

    // For any error response (non-2xx), build a feedback response.
    const status = error.response.status;
    const message = error.response.statusText || 'An error occurred';

    console.info(`Feedback: Received ${status} from "${error.config?.url}".`);

    const feedbackResponse: AxiosResponse = {
      data: {
        feedback: true,
        message,
        status,
        originalData: error.response.data,
      },
      status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      config: error.config,
      request: error.request,
    };

    // Resolve the promise with the feedback response.
    return Promise.resolve(feedbackResponse);
  }
);

export default apiClient;
