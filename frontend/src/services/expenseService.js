import api from './api.js';

export const createExpense = async (groupId, expenseData) => {
  const response = await api.post(`/groups/${groupId}/expenses`, expenseData);
  return response.data;
};

export const getGroupExpenses = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/expenses`);
  return response.data;
};
