import express from 'express';
import * as balanceController from '../controllers/balanceController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/groups/:id/balances', authenticateToken, balanceController.getGroupBalances);

export default router;
