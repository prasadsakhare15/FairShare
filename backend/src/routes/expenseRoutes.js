import express from 'express';
import * as expenseController from '../controllers/expenseController.js';
import * as expenseValidation from '../validations/expenseValidation.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/groups/:id/expenses', authenticateToken, expenseValidation.createExpenseValidation, expenseController.createExpense);
router.get('/groups/:id/expenses', authenticateToken, expenseController.getGroupExpenses);
router.patch('/groups/:id/expenses/:expenseId', authenticateToken, expenseValidation.updateExpenseValidation, expenseController.updateExpense);
router.delete('/groups/:id/expenses/:expenseId', authenticateToken, expenseController.deleteExpense);

export default router;
