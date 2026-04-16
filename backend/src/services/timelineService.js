import * as expenseRepository from '../repositories/expenseRepository.js';
import * as settlementRepository from '../repositories/settlementRepository.js';
import * as groupRepository from '../repositories/groupRepository.js';

export const getGroupTimeline = async (groupId, userId, pagination = {}) => {
  // Validate group membership
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }
  
  // Get ALL expenses and settlements (no pagination here — we paginate the merged result)
  const { rows: expenses } = await expenseRepository.getGroupExpenses(groupId);
  const { rows: settlements } = await settlementRepository.getGroupSettlements(groupId);
  
  // Combine and sort by date
  const timeline = [
    ...expenses.map(e => ({
      type: 'expense',
      id: e.id,
      title: e.title,
      amount: parseFloat(e.amount),
      paid_by: e.paid_by,
      paid_by_name: e.paid_by_name,
      created_by: e.created_by,
      created_by_name: e.created_by_name,
      created_at: e.created_at,
      splits: e.splits
    })),
    ...settlements.map(s => ({
      type: 'settlement',
      id: s.id,
      from_user_id: s.from_user_id,
      from_user_name: s.from_user_name,
      to_user_id: s.to_user_id,
      to_user_name: s.to_user_name,
      amount: parseFloat(s.amount),
      payment_method: s.payment_method,
      notes: s.notes,
      created_by: s.created_by,
      created_by_name: s.created_by_name,
      created_at: s.created_at
    }))
  ];
  
  // Sort by created_at descending
  timeline.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = timeline.length;

  // Paginate the merged result
  if (pagination.limit !== undefined && pagination.offset !== undefined) {
    const sliced = timeline.slice(pagination.offset, pagination.offset + pagination.limit);
    return { rows: sliced, total };
  }

  return { rows: timeline, total };
};
