/**
 * Auth Routes — Production-Grade
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import authController from '../controllers/authController.js';

const router = Router();

// Public routes
router.post('/signup', asyncHandler(authController.signup));
router.post('/login', asyncHandler(authController.login));

// Protected routes
router.get('/profile', authenticate, asyncHandler(authController.getProfile));
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));
router.post('/refresh-token', asyncHandler(authController.refreshToken));

export default router;
