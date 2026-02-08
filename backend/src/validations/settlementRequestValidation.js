import { body, param } from 'express-validator';

export const createRequestValidation = [
  param('id').toInt().isInt({ min: 1 }).withMessage('Invalid group ID'),
  body('from_user_id').toInt().isInt({ min: 1 }).withMessage('From user ID is required'),
  body('to_user_id').toInt().isInt({ min: 1 }).withMessage('To user ID is required'),
  body('amount').toFloat().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_method').optional().trim(),
  body('notes').optional().trim(),
];
