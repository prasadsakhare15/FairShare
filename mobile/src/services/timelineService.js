import api from '../api';

export const getGroupTimeline = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/timeline`);
  return Array.isArray(response.data) ? response.data : response.data.data;
};
