import express from 'express';
import * as authController from '../controllers/authController.js';
import * as authValidation from '../validations/authValidation.js';

const router = express.Router();

router.post('/register', authValidation.registerValidation, authController.register);
router.post('/login', authValidation.loginValidation, authController.login);
router.post('/refresh', authValidation.refreshTokenValidation, authController.refresh);

export default router;
