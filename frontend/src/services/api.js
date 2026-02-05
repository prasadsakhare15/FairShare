import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api',
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: token refresh + user-friendly errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const base = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api';
        const response = await axios.post(
          `${base}/auth/refresh`,
          { refreshToken },
          { timeout: API_TIMEOUT }
        );
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    const enhanced = enhanceError(error);
    return Promise.reject(enhanced);
  }
);

/**
 * Attach a user-friendly message to the error for UI display.
 */
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
    error.userMessage = 'Network error. Check your connection and try again.';
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
