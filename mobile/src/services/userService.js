import api from '../api';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  const u = response.data;
  return u ? { id: u.id, userId: u.id, name: u.name, email: u.email, created_at: u.created_at } : null;
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
