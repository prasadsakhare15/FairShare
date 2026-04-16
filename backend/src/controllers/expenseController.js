import * as expenseService from '../services/expenseService.js';
import { validationResult } from 'express-validator';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

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
    const { page, limit, offset } = parsePagination(req.query);
    const { rows, total } = await expenseService.getGroupExpenses(req.params.id, req.user.userId, { limit, offset });
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, amount, paid_by, split_type, splits } = req.body;
    await expenseService.updateExpense(
      req.params.id,
      req.params.expenseId,
      title,
      amount,
      paid_by,
      split_type,
      splits,
      req.user.userId
    );

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.params.expenseId, req.user.userId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};
