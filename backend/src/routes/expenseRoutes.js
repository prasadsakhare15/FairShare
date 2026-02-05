import express from 'express';
import * as expenseController from '../controllers/expenseController.js';
import * as expenseValidation from '../validations/expenseValidation.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/groups/:id/expenses', authenticateToken, expenseValidation.createExpenseValidation, expenseController.createExpense);
router.get('/groups/:id/expenses', authenticateToken, expenseController.getGroupExpenses);

export default router;
