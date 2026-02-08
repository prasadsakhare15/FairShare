import { body, param } from 'express-validator';

export const createExpenseValidation = [
  param('id').toInt().isInt({ min: 1 }).withMessage('Invalid group ID'),
  body('title').trim().notEmpty().withMessage('Expense title is required'),
  body('amount').toFloat().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paid_by').toInt().isInt().withMessage('Paid by user ID is required'),
  body('split_type').isIn(['equal', 'exact', 'percentage']).withMessage('Invalid split type'),
  body('splits').isArray({ min: 1 }).withMessage('At least one split is required'),
  body('splits.*.user_id').toInt().isInt().withMessage('User ID is required'),
  body('splits.*.amount').toFloat().isFloat({ min: 0 }).withMessage('Split amount must be non-negative'),
  body('splits.*.percentage').optional({ nullable: true }).toFloat().isFloat({ min: 0, max: 100 })
];

export const updateExpenseValidation = [
  param('id').toInt().isInt({ min: 1 }).withMessage('Invalid group ID'),
  param('expenseId').toInt().isInt({ min: 1 }).withMessage('Invalid expense ID'),
  body('title').trim().notEmpty().withMessage('Expense title is required'),
  body('amount').toFloat().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paid_by').toInt().isInt().withMessage('Paid by user ID is required'),
  body('split_type').isIn(['equal', 'exact', 'percentage']).withMessage('Invalid split type'),
  body('splits').isArray({ min: 1 }).withMessage('At least one split is required'),
  body('splits.*.user_id').toInt().isInt().withMessage('User ID is required'),
  body('splits.*.amount').toFloat().isFloat({ min: 0 }).withMessage('Split amount must be non-negative'),
  body('splits.*.percentage').optional({ nullable: true }).toFloat().isFloat({ min: 0, max: 100 })
];
