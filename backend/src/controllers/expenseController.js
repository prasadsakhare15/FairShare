import * as expenseService from '../services/expenseService.js';
import { validationResult } from 'express-validator';

export const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, amount, paid_by, split_type, splits } = req.body;
    const expenseId = await expenseService.createExpense(
      req.params.id,
      title,
      amount,
      paid_by,
      split_type,
      splits,
      req.user.userId
    );
    
    res.status(201).json({ id: expenseId, message: 'Expense created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getGroupExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getGroupExpenses(req.params.id, req.user.userId);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};
