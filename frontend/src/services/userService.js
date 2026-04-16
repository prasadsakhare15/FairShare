import api from './api.js';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.patch('/users/profile', data);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/users/change-password', { currentPassword, newPassword });
  return response.data;
};

export const getBalanceSummary = async () => {
  const response = await api.get('/users/balance-summary');
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get('/users/search', { params: { q: query } });
  return response.data;
};
