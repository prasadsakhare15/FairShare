import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/profile', authenticateToken, userController.getProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);
router.post('/change-password', authenticateToken, userController.changePassword);
router.get('/balance-summary', authenticateToken, userController.getBalanceSummary);
router.get('/search', authenticateToken, userController.searchUsers);

export default router;
