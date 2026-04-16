import api from '../api';

export const createExpense = async (groupId, expenseData) => {
  const response = await api.post(`/groups/${groupId}/expenses`, expenseData);
  return response.data;
};

export const getGroupExpenses = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/expenses`);
  return Array.isArray(response.data) ? response.data : response.data.data;
};

export const updateExpense = async (groupId, expenseId, expenseData) => {
  const response = await api.patch(`/groups/${groupId}/expenses/${expenseId}`, expenseData);
  return response.data;
};

export const deleteExpense = async (groupId, expenseId) => {
  const response = await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
  return response.data;
};
