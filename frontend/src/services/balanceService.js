import api from './api.js';

export const getGroupBalances = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/balances`);
  return response.data;
};
