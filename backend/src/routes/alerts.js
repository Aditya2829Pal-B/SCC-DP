/**
 * Alert Routes — Production-Grade Alert Management
 */

import express from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getAlerts,
  getAlertById,
  getRiskProfile,
  markAsRead,
  createAlert,
  updateAlert,
  deleteAlert,
  broadcastAlert,
} from '../controllers/alertController.js';

const router = express.Router();

// ── Protected Routes (Authentication Required) ──

/**
 * Get user's alerts
 * GET /api/alerts?severity=high&type=weather&page=1&limit=50
 */
router.get('/', authenticate, asyncHandler(getAlerts));

/**
 * Get Risk Zones
 * GET /api/alerts/risk-zones
 */
router.get('/risk-zones', authenticate, (req, res) => res.json({ zones: [] }));

/**
 * Get user's risk profile
 * GET /api/alerts/risk/:userId
 */
router.get('/risk/:userId', authenticate, asyncHandler(getRiskProfile));

/**
 * Get alert by ID
 * GET /api/alerts/:id
 */
router.get('/:id', authenticate, asyncHandler(getAlertById));

/**
 * Mark alert as read
 * PATCH /api/alerts/:id/read
 */
router.patch('/:id/read', authenticate, asyncHandler(markAsRead));

// ── Admin Routes ──

/**
 * Create alert (admin only)
 * POST /api/alerts
 */
router.post('/', authenticate, adminOnly, asyncHandler(createAlert));

/**
 * Update alert (admin only)
 * PUT /api/alerts/:id
 */
router.put('/:id', authenticate, adminOnly, asyncHandler(updateAlert));

/**
 * Delete alert (admin only)
 * DELETE /api/alerts/:id
 */
router.delete('/:id', authenticate, adminOnly, asyncHandler(deleteAlert));

/**
 * Broadcast alert to all users (admin only)
 * POST /api/alerts/broadcast
 */
router.post('/broadcast', authenticate, adminOnly, asyncHandler(broadcastAlert));

export default router;
