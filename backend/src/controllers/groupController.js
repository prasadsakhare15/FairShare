import * as groupService from '../services/groupService.js';
import { validationResult } from 'express-validator';

export const createGroup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description } = req.body;
    const groupId = await groupService.createGroup(name, description, req.user.userId);
    
    res.status(201).json({ id: groupId, name, description });
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (req, res, next) => {
  try {
    const groups = await groupService.getUserGroups(req.user.userId);
    res.json(groups);
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req, res, next) => {
  try {
    const group = await groupService.getGroupDetails(req.params.id, req.user.userId);
    res.json(group);
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { user_id, role } = req.body;
    await groupService.addMember(req.params.id, req.user.userId, user_id, role);
    
    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    await groupService.removeMember(req.params.id, req.user.userId, parseInt(req.params.userId));
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    await groupService.updateMemberRole(req.params.id, req.user.userId, parseInt(req.params.userId), role);
    
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
};
