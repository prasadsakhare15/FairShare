import api from './api.js';

export const createGroup = async (name, description) => {
  const response = await api.post('/groups', { name, description });
  return response.data;
};

export const getUserGroups = async () => {
  const response = await api.get('/groups');
  return response.data;
};

export const getGroupDetails = async (groupId) => {
  const response = await api.get(`/groups/${groupId}`);
  return response.data;
};

export const addGroupMember = async (groupId, userId, role = 'member') => {
  const response = await api.post(`/groups/${groupId}/members`, { user_id: userId, role });
  return response.data;
};

export const removeGroupMember = async (groupId, userId) => {
  const response = await api.delete(`/groups/${groupId}/members/${userId}`);
  return response.data;
};

export const updateMemberRole = async (groupId, userId, role) => {
  const response = await api.patch(`/groups/${groupId}/members/${userId}/role`, { role });
  return response.data;
};
