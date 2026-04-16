import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from './config';

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return Promise.reject(refreshError);
      }
    }

    const enhanced = enhanceError(error);
    return Promise.reject(enhanced);
  }
);

function enhanceError(error) {
  if (error.response?.data?.error) {
    error.userMessage = error.response.data.error;
    return error;
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    error.userMessage = 'Request timed out. Please try again.';
    return error;
  }
  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    error.userMessage = 'Network error. Check your connection.';
    return error;
  }
  if (error.response?.status >= 500) {
    error.userMessage = 'Something went wrong. Please try again later.';
    return error;
  }
  error.userMessage = error.message || 'Something went wrong.';
  return error;
}

export default api;
