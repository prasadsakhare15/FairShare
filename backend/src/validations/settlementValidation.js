import { body, param } from 'express-validator';

export const createSettlementValidation = [
  param('id').isInt().withMessage('Invalid group ID'),
  body('from_user_id').isInt().withMessage('From user ID is required'),
  body('to_user_id').isInt().withMessage('To user ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_method').optional().trim(),
  body('notes').optional().trim()
];
