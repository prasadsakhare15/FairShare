import express from 'express';
import * as settlementController from '../controllers/settlementController.js';
import * as settlementValidation from '../validations/settlementValidation.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/groups/:id/settlements', authenticateToken, settlementValidation.createSettlementValidation, settlementController.createSettlement);
router.get('/groups/:id/settlements', authenticateToken, settlementController.getGroupSettlements);
router.get('/groups/:id/optimize-settlements', authenticateToken, settlementController.getOptimizedSettlements);

export default router;
