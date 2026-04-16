import { body, param } from 'express-validator';

export const createGroupValidation = [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('description').optional().trim(),
  body('currency').optional().isString().isLength({ min: 1, max: 10 }).withMessage('Currency must be a string up to 10 characters')
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
  body('description').optional().trim(),
  body('currency').optional().isString().isLength({ min: 1, max: 10 }).withMessage('Currency must be a string up to 10 characters')
];
