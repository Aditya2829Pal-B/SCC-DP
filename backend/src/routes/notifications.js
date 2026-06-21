/**
 * Notification Routes — Production-Grade User Notifications
 */

import express from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getStats,
  createNotification,
  broadcastNotification,
  registerDeviceToken,
} from '../controllers/notificationController.js';

const router = express.Router();

// ── Protected Routes (Authentication Required) ──

/**
 * Get user's notifications
 * GET /api/notifications?type=alert&page=1&limit=50&unread=true
 */
router.get('/', authenticate, asyncHandler(getNotifications));

/**
 * Register FCM Token
 * POST /api/notifications/token
 */
router.post('/token', authenticate, asyncHandler(registerDeviceToken));

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
router.get('/stats', authenticate, asyncHandler(getStats));

/**
 * Get single notification
 * GET /api/notifications/:id
 */
router.get('/:id', authenticate, asyncHandler(getNotificationById));

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', authenticate, asyncHandler(markAsRead));

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', authenticate, asyncHandler(markAllAsRead));

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', authenticate, asyncHandler(deleteNotification));

/**
 * Delete all notifications
 * DELETE /api/notifications
 */
router.delete('/', authenticate, asyncHandler(deleteAllNotifications));

// ── Admin Routes ──

/**
 * Create notification (admin only)
 * POST /api/notifications
 */
router.post('/', authenticate, adminOnly, asyncHandler(createNotification));

/**
 * Broadcast notification to multiple users (admin only)
 * POST /api/notifications/broadcast
 */
router.post('/broadcast', authenticate, adminOnly, asyncHandler(broadcastNotification));

export default router;
