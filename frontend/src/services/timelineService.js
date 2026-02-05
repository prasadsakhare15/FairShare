import api from './api.js';

export const getGroupTimeline = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/timeline`);
  return response.data;
};
