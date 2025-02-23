import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.AUTH_API || "http://localhost:8000/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default apiClient;
