import * as settlementRepository from '../repositories/settlementRepository.js';
import * as groupRepository from '../repositories/groupRepository.js';
import * as ledgerRepository from '../repositories/ledgerRepository.js';
import { minimizeSettlements } from '../utils/helpers.js';

export const createSettlement = async (groupId, fromUserId, toUserId, amount, paymentMethod, notes, userId) => {
  // Validate group membership
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }
  
  // Validate users are members
  const fromMember = await groupRepository.isGroupMember(groupId, fromUserId);
  const toMember = await groupRepository.isGroupMember(groupId, toUserId);
  
  if (!fromMember || !toMember) {
    throw new Error('Both users must be group members');
  }
  
  if (fromUserId === toUserId) {
    throw new Error('Cannot settle with yourself');
  }
  
  return await settlementRepository.createSettlement(
    groupId,
    fromUserId,
    toUserId,
    amount,
    paymentMethod,
    notes,
    userId
  );
};

export const getGroupSettlements = async (groupId, userId, pagination = {}) => {
  // Validate group membership
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }
  
  return await settlementRepository.getGroupSettlements(groupId, pagination);
};

export const getOptimizedSettlements = async (groupId, userId) => {
  // Validate group membership
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }
  
  // Get all balances
  const balances = await ledgerRepository.getGroupBalances(groupId);
  
  // Convert to map format for minimization algorithm
  const balanceMap = {};
  balances.forEach(balance => {
    const key = `${balance.from_user_id}->${balance.to_user_id}`;
    balanceMap[key] = parseFloat(balance.amount);
  });
  
  // Get optimized settlements
  const suggestions = minimizeSettlements(balanceMap);
  
  // Enrich with user names
  const members = await groupRepository.getGroupMembers(groupId);
  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m.name);
  
  return suggestions.map(s => ({
    ...s,
    from_user_name: memberMap[s.from_user_id],
    to_user_name: memberMap[s.to_user_id]
  }));
};
