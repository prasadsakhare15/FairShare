import * as expenseRepository from '../repositories/expenseRepository.js';
import * as groupRepository from '../repositories/groupRepository.js';

export const createExpense = async (groupId, title, amount, paidBy, splitType, splits, userId) => {
  // Validate group membership
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }
  
  // Validate paidBy is a member
  const paidByMember = await groupRepository.isGroupMember(groupId, paidBy);
  if (!paidByMember) {
    throw new Error('Payer must be a group member');
  }
  
  // Validate splits
  let totalSplit = 0;
  for (const split of splits) {
    // Validate user is a member
      const splitMember = await groupRepository.isGroupMember(groupId, split.user_id);
      if (!splitMember) {
        throw new Error(`User ${split.user_id} is not a group member`);
      }
      
      totalSplit += parseFloat(split.amount);
      
      if (splitType === 'percentage' && (!split.percentage || split.percentage < 0 || split.percentage > 100)) {
        throw new Error('Invalid percentage split');
      }
  }
  
  // Validate total matches expense amount (allow small floating point differences)
  if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
    throw new Error(`Split total (${totalSplit}) does not match expense amount (${amount})`);
  }
  
  return await expenseRepository.createExpense(
    groupId,
    title,
    amount,
    paidBy,
    splitType,
    userId,
    splits
  );
};

export const getGroupExpenses = async (groupId, userId) => {
  // Validate group membership
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }
  
  return await expenseRepository.getGroupExpenses(groupId);
};

export const updateExpense = async (groupId, expenseId, title, amount, paidBy, splitType, splits, userId) => {
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }

  const paidByMember = await groupRepository.isGroupMember(groupId, paidBy);
  if (!paidByMember) {
    throw new Error('Payer must be a group member');
  }

  let totalSplit = 0;
  for (const split of splits) {
    const splitMember = await groupRepository.isGroupMember(groupId, split.user_id);
    if (!splitMember) {
      throw new Error(`User ${split.user_id} is not a group member`);
    }
    totalSplit += parseFloat(split.amount);
    if (splitType === 'percentage' && (!split.percentage || split.percentage < 0 || split.percentage > 100)) {
      throw new Error('Invalid percentage split');
    }
  }

  if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
    throw new Error(`Split total (${totalSplit}) does not match expense amount (${amount})`);
  }

  return await expenseRepository.updateExpense(
    expenseId,
    groupId,
    title,
    amount,
    paidBy,
    splitType,
    splits
  );
};

export const deleteExpense = async (groupId, expenseId, userId) => {
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }

  return await expenseRepository.deleteExpense(expenseId, groupId);
};
