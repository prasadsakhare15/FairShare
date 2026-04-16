import * as groupRepository from '../repositories/groupRepository.js';

export const createGroup = async (name, description, createdBy, currency) => {
  return await groupRepository.createGroup(name, description, createdBy, currency);
};

export const getUserGroups = async (userId) => {
  return await groupRepository.getUserGroups(userId);
};

export const getGroupDetails = async (groupId, userId) => {
  const group = await groupRepository.getGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  
  const member = await groupRepository.isGroupMember(groupId, userId);
  if (!member) {
    throw new Error('You are not a member of this group');
  }
  
  const members = await groupRepository.getGroupMembers(groupId);
  
  return {
    ...group,
    members,
    userRole: member.role
  };
};

export const addMember = async (groupId, userId, newUserId, role = 'member') => {
  // Check if requester is admin
  const requesterMember = await groupRepository.isGroupMember(groupId, userId);
  if (!requesterMember || requesterMember.role !== 'admin') {
    throw new Error('Only admins can add members');
  }
  
  // Check if user is already a member
  const existingMember = await groupRepository.isGroupMember(groupId, newUserId);
  if (existingMember) {
    throw new Error('User is already a member');
  }
  
  return await groupRepository.addGroupMember(groupId, newUserId, role);
};

export const removeMember = async (groupId, userId, memberToRemoveId) => {
  // Check if requester is admin
  const requesterMember = await groupRepository.isGroupMember(groupId, userId);
  if (!requesterMember || requesterMember.role !== 'admin') {
    throw new Error('Only admins can remove members');
  }
  
  // Cannot remove yourself
  if (userId === memberToRemoveId) {
    throw new Error('Cannot remove yourself');
  }
  
  return await groupRepository.removeGroupMember(groupId, memberToRemoveId);
};

export const updateGroup = async (groupId, name, description, userId, currency) => {
  const requesterMember = await groupRepository.isGroupMember(groupId, userId);
  if (!requesterMember || requesterMember.role !== 'admin') {
    throw new Error('Only admins can update the group');
  }

  return await groupRepository.updateGroup(groupId, name, description, currency);
};

export const deleteGroup = async (groupId, userId) => {
  const requesterMember = await groupRepository.isGroupMember(groupId, userId);
  if (!requesterMember || requesterMember.role !== 'admin') {
    throw new Error('Only admins can delete the group');
  }

  return await groupRepository.deleteGroup(groupId);
};

export const leaveGroup = async (groupId, userId) => {
  const requesterMember = await groupRepository.isGroupMember(groupId, userId);
  if (!requesterMember) {
    throw new Error('You are not a member of this group');
  }

  const adminCount = await groupRepository.getAdminCount(groupId);
  if (requesterMember.role === 'admin' && adminCount <= 1) {
    throw new Error('Cannot leave: you are the only admin. Transfer admin role or delete the group.');
  }

  return await groupRepository.removeGroupMember(groupId, userId);
};

export const updateMemberRole = async (groupId, userId, targetUserId, role) => {
  // Check if requester is admin
  const requesterMember = await groupRepository.isGroupMember(groupId, userId);
  if (!requesterMember || requesterMember.role !== 'admin') {
    throw new Error('Only admins can update roles');
  }
  
  return await groupRepository.updateMemberRole(groupId, targetUserId, role);
};
