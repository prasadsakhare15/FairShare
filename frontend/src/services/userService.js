import api from './api.js';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
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
