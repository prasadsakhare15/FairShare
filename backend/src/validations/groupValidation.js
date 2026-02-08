import { body, param } from 'express-validator';

export const createGroupValidation = [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('description').optional().trim()
];

export const addMemberValidation = [
  param('id').isInt().withMessage('Invalid group ID'),
  body('user_id').isInt().withMessage('User ID is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
];

export const removeMemberValidation = [
  param('id').isInt().withMessage('Invalid group ID'),
  param('userId').isInt().withMessage('Invalid user ID')
];

export const updateGroupValidation = [
  param('id').isInt().withMessage('Invalid group ID'),
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('description').optional().trim()
];
