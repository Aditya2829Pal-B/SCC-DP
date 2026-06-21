/**
 * Unified API Routes Directory / Router
 */
import { Router } from 'express';

// Import individual route modules
import authRoutes from './auth.js';
import complaintRoutes from './complaints.js';
import alertRoutes from './alerts.js';
import analyticsRoutes from './analytics.js';
import mlRoutes from './ml.js';
import notificationRoutes from './notifications.js';
import departmentRoutes from './departments.js';

const router = Router();

// Mount routes with distinct sub-paths
router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ml', mlRoutes);
router.use('/notifications', notificationRoutes);
router.use('/departments', departmentRoutes);

export default router;
