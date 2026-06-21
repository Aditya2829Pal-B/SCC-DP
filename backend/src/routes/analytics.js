/**
 * Analytics Routes — Production-Grade Dashboard & Statistics
 */

import express from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getDashboardOverview,
  getTrends,
  getUserStats,
  getGeographicStats,
} from '../controllers/analyticsController.js';

const router = express.Router();

// ── Admin-Only Routes ──

/**
 * Get dashboard overview
 * GET /api/analytics/overview
 */
router.get('/overview', authenticate, adminOnly, asyncHandler(getDashboardOverview));

/**
 * Get trends over time
 * GET /api/analytics/trends?month=6&year=2026
 */
router.get('/trends', authenticate, adminOnly, asyncHandler(getTrends));

/**
 * Get user statistics
 * GET /api/analytics/users
 */
router.get('/users', authenticate, adminOnly, asyncHandler(getUserStats));

/**
 * Get geographic statistics
 * GET /api/analytics/geographic
 */
router.get('/geographic', authenticate, adminOnly, asyncHandler(getGeographicStats));

export default router;
