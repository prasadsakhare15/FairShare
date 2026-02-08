import * as settlementRequestRepository from '../repositories/settlementRequestRepository.js';
import * as settlementRepository from '../repositories/settlementRepository.js';
import * as groupRepository from '../repositories/groupRepository.js';
import * as ledgerRepository from '../repositories/ledgerRepository.js';

const getApproverId = (request) => {
  return request.initiator_id === request.from_user_id ? request.to_user_id : request.from_user_id;
};

export const createRequest = async (groupId, fromUserId, toUserId, amount, initiatorId, paymentMethod, notes) => {
  const member = await groupRepository.isGroupMember(groupId, initiatorId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }

  if (initiatorId !== fromUserId && initiatorId !== toUserId) {
    throw new Error('Initiator must be either the payer or the receiver');
  }

  if (fromUserId === toUserId) {
    throw new Error('Cannot settle with yourself');
  }

  const fromMember = await groupRepository.isGroupMember(groupId, fromUserId);
  const toMember = await groupRepository.isGroupMember(groupId, toUserId);
  if (!fromMember || !toMember) {
    throw new Error('Both users must be group members');
  }

  const balances = await ledgerRepository.getGroupBalances(groupId);
  const balance = balances.find(
    (b) => parseInt(b.from_user_id) === parseInt(fromUserId) && parseInt(b.to_user_id) === parseInt(toUserId)
  );
  const currentBalance = balance ? parseFloat(balance.amount) : 0;

  if (amount > currentBalance + 0.01) {
    throw new Error('Settlement amount exceeds balance');
  }

  return await settlementRequestRepository.createRequest(
    groupId,
    fromUserId,
    toUserId,
    amount,
    initiatorId,
    paymentMethod,
    notes
  );
};

export const getGroupRequests = async (groupId, userId) => {
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }

  const [pendingForApproval, myRequests] = await Promise.all([
    settlementRequestRepository.getPendingRequestsForApprover(groupId, userId),
    settlementRequestRepository.getRequestsInitiatedByUser(groupId, userId),
  ]);

  return { pendingForApproval, myRequests };
};

export const approveRequest = async (groupId, requestId, userId) => {
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }

  const request = await settlementRequestRepository.getRequestById(requestId);
  if (!request || request.group_id !== parseInt(groupId)) {
    throw new Error('Settlement request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('Request is no longer pending');
  }

  const approverId = getApproverId(request);
  if (approverId !== userId) {
    throw new Error('Only the other party can approve this request');
  }

  const settlementId = await settlementRepository.createSettlement(
    groupId,
    request.from_user_id,
    request.to_user_id,
    parseFloat(request.amount),
    request.payment_method,
    request.notes,
    userId
  );

  await settlementRequestRepository.updateRequestStatus(requestId, 'approved');

  return settlementId;
};

export const rejectRequest = async (groupId, requestId, userId) => {
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }

  const request = await settlementRequestRepository.getRequestById(requestId);
  if (!request || request.group_id !== parseInt(groupId)) {
    throw new Error('Settlement request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('Request is no longer pending');
  }

  const approverId = getApproverId(request);
  if (approverId !== userId) {
    throw new Error('Only the other party can reject this request');
  }

  await settlementRequestRepository.updateRequestStatus(requestId, 'rejected');
  return true;
};
