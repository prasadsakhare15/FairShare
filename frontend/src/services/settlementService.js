import api from './api.js';

export const createSettlementRequest = async (groupId, requestData) => {
  const response = await api.post(`/groups/${groupId}/settlement-requests`, requestData);
  return response.data;
};

export const getSettlementRequests = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/settlement-requests`);
  return response.data;
};

export const approveSettlementRequest = async (groupId, requestId) => {
  const response = await api.post(`/groups/${groupId}/settlement-requests/${requestId}/approve`);
  return response.data;
};

export const rejectSettlementRequest = async (groupId, requestId) => {
  const response = await api.post(`/groups/${groupId}/settlement-requests/${requestId}/reject`);
  return response.data;
};

export const createSettlement = async (groupId, settlementData) => {
  const response = await api.post(`/groups/${groupId}/settlements`, settlementData);
  return response.data;
};

export const getGroupSettlements = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/settlements`);
  return Array.isArray(response.data) ? response.data : response.data.data;
};

export const getOptimizedSettlements = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/optimize-settlements`);
  return response.data;
};
