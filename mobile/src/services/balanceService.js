import api from '../api';

export const getGroupBalances = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/balances`);
  return response.data;
};
