import api from './api.js';

export const createSettlement = async (groupId, settlementData) => {
  const response = await api.post(`/groups/${groupId}/settlements`, settlementData);
  return response.data;
};

export const getGroupSettlements = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/settlements`);
  return response.data;
};

export const getOptimizedSettlements = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/optimize-settlements`);
  return response.data;
};
