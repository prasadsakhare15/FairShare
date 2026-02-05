import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/profile', authenticateToken, userController.getProfile);
router.get('/search', authenticateToken, userController.searchUsers);

export default router;
