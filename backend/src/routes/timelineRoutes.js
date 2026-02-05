import express from 'express';
import * as timelineController from '../controllers/timelineController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/groups/:id/timeline', authenticateToken, timelineController.getGroupTimeline);

export default router;
