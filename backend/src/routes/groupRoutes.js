import express from 'express';
import * as groupController from '../controllers/groupController.js';
import * as groupValidation from '../validations/groupValidation.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticateToken, groupValidation.createGroupValidation, groupController.createGroup);
router.get('/', authenticateToken, groupController.getUserGroups);
router.get('/:id', authenticateToken, groupController.getGroupDetails);
router.patch('/:id', authenticateToken, groupValidation.updateGroupValidation, groupController.updateGroup);
router.delete('/:id', authenticateToken, groupController.deleteGroup);
router.post('/:id/leave', authenticateToken, groupController.leaveGroup);
router.post('/:id/members', authenticateToken, groupValidation.addMemberValidation, groupController.addMember);
router.delete('/:id/members/:userId', authenticateToken, groupValidation.removeMemberValidation, groupController.removeMember);
router.patch('/:id/members/:userId/role', authenticateToken, groupController.updateMemberRole);

export default router;
