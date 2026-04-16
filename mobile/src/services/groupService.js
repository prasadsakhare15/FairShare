import api from '../api';

export const createGroup = async (name, description, currency) => {
  const response = await api.post('/groups', { name, description, currency });
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

export const updateGroup = async (groupId, { name, description, currency }) => {
  const response = await api.patch(`/groups/${groupId}`, { name, description, currency });
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/groups/${groupId}`);
  return response.data;
};

export const leaveGroup = async (groupId) => {
  const response = await api.post(`/groups/${groupId}/leave`);
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
