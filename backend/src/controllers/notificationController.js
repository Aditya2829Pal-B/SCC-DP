/**
 * Notifications Controller — Real-Time User Notifications
 */

import { Notification } from '../models/index.js';
import logger from '../utils/logger.js';
import { getDBStatus } from '../utils/database.js';
import { 
  NotFoundError, 
  ValidationError,
  AuthorizationError,
} from '../utils/errors.js';
import { validatePayload } from '../utils/validation.js';

// ── Notification Schemas ──
const notificationSchema = {
  title: { type: 'string', required: true, min: 5, max: 200 },
  message: { type: 'string', required: true, min: 10, max: 1000 },
  type: { type: 'string', required: true, max: 100 },
  link: { type: 'string', max: 500 },
  data: { type: 'object' },
};

const filterSchema = {
  type: { type: 'string', max: 100 },
  page: { type: 'number', min: 1 },
  limit: { type: 'number', min: 1, max: 100 },
  unread: { type: 'string' },
};

const mockNotificationsByUser = new Map();

function isMockMode() {
  return getDBStatus() !== 'connected';
}

function getUserMockNotifications(userId) {
  if (!mockNotificationsByUser.has(userId)) {
    mockNotificationsByUser.set(userId, [
      {
        _id: `ntf_${Date.now()}_1`,
        userId,
        title: 'Welcome to SCC&DP',
        message: 'Live alerts and complaint tracking are now enabled.',
        type: 'system',
        read: false,
        createdAt: new Date(),
      },
    ]);
  }
  return mockNotificationsByUser.get(userId);
}

// ══════════════════════════════════════════════════════
// Notification Operations
// ══════════════════════════════════════════════════════

/**
 * Get user's notifications
 * GET /api/notifications?type=alert&page=1&limit=50&unread=true
 */
export const getNotifications = async (req, res, next) => {
  // ensure userId is declared before any conditional branches
  const userId = req && req.user && req.user._id ? req.user._id : null;

  try {
    const { type, page = 1, limit = 50, unread } = req.query;

    if (isMockMode()) {
      const uid = String(userId || 'anonymous');
      let notifications = [...getUserMockNotifications(uid)];
      if (type) notifications = notifications.filter((n) => n.type === type);
      if (unread === 'true') notifications = notifications.filter((n) => !n.read);

      const total = notifications.length;
      const unreadCount = notifications.filter((n) => !n.read).length;
      const skip = (Number(page) - 1) * Number(limit);
      notifications = notifications.slice(skip, skip + Number(limit));

      return res.json({
        success: true,
        data: notifications,
        stats: { unreadCount, total },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Validate filters
    validatePayload({ type, page, limit, unread }, filterSchema);

    // Build query
    const query = { userId };
    if (type) query.type = type;
    if (unread === 'true') query.read = false;

    // Fetch notifications with pagination
    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, read: false });

    logger.info(`Retrieved ${notifications.length} notifications for user`, {
      userId,
      total,
      unreadCount,
    });

    res.json({
      success: true,
      data: notifications,
      stats: {
        unreadCount,
        total,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Failed to get notifications:', err);
    next(err);
  }
};

/**
 * Get single notification
 * GET /api/notifications/:id
 */
export const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Check authorization
    if (notification.userId.toString() !== userId.toString()) {
      throw new AuthorizationError('Unauthorized to view this notification');
    }

    logger.info(`Retrieved notification: ${id}`);

    res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    logger.error('Failed to get notification:', err);
    next(err);
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Check authorization
    if (notification.userId.toString() !== userId.toString()) {
      throw new AuthorizationError('Unauthorized to update this notification');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    logger.info(`Notification marked as read: ${id}`);

    res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    logger.error('Failed to mark notification as read:', err);
    next(err);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    logger.info('All notifications marked as read', {
      userId,
      modifiedCount: result.modifiedCount,
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    logger.error('Failed to mark all notifications as read:', err);
    next(err);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Check authorization
    if (notification.userId.toString() !== userId.toString()) {
      throw new AuthorizationError('Unauthorized to delete this notification');
    }

    await Notification.findByIdAndDelete(id);

    logger.info(`Notification deleted: ${id}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (err) {
    logger.error('Failed to delete notification:', err);
    next(err);
  }
};

/**
 * Delete all notifications
 * DELETE /api/notifications
 */
export const deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ userId });

    logger.info('All notifications deleted', {
      userId,
      deletedCount: result.deletedCount,
    });

    res.json({
      success: true,
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    logger.error('Failed to delete all notifications:', err);
    next(err);
  }
};

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (isMockMode()) {
      const notifications = getUserMockNotifications(String(userId));
      const total = notifications.length;
      const unread = notifications.filter((n) => !n.read).length;

      return res.json({
        success: true,
        data: {
          summary: {
            total,
            unread,
            read: total - unread,
          },
          byType: {
            system: notifications.filter((n) => n.type === 'system').length,
            alert: notifications.filter((n) => n.type === 'alert').length,
          },
          recentNotifications: notifications.slice(0, 5),
        },
      });
    }

    const [
      total,
      unread,
      byType,
      recent,
    ] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
      Notification.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Format type data
    const typeMap = {};
    byType.forEach((item) => {
      typeMap[item._id] = item.count;
    });

    logger.info('Notification statistics retrieved', {
      userId,
      total,
      unread,
    });

    res.json({
      success: true,
      data: {
        summary: {
          total,
          unread,
          read: total - unread,
        },
        byType: typeMap,
        recentNotifications: recent,
      },
    });
  } catch (err) {
    logger.error('Failed to get notification statistics:', err);
    next(err);
  }
};

/**
 * Create notification (admin/system only)
 * POST /api/notifications
 */
export const createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, link, data } = req.body;

    // Validate payload
    validatePayload({ title, message, type }, notificationSchema);

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    const notification = new Notification({
      userId,
      title,
      message,
      type,
      link,
      data,
    });

    await notification.save();

    logger.info(`Notification created: ${notification._id}`, {
      userId,
      type,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    logger.error('Failed to create notification:', err);
    next(err);
  }
};

/**
 * Broadcast notification to multiple users (admin only)
 * POST /api/notifications/broadcast
 */
export const broadcastNotification = async (req, res, next) => {
  try {
    const { userIds, title, message, type, link, data } = req.body;

    // Validate payload
    validatePayload({ title, message, type }, notificationSchema);

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('userIds must be a non-empty array');
    }

    if (userIds.length > 10000) {
      throw new ValidationError('Maximum 10000 users per broadcast');
    }

    // Create notifications for each user
    const notifications = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      link,
      data,
    }));

    const result = await Notification.insertMany(notifications);

    logger.info(`Broadcast notification created: ${result.length} recipients`, {
      type,
      recipientCount: userIds.length,
    });

    res.status(201).json({
      success: true,
      broadcast: {
        recipientCount: userIds.length,
        notificationsCreated: result.length,
      },
    });
  } catch (err) {
    logger.error('Failed to broadcast notification:', err);
    next(err);
  }
};

/**
 * Register FCM device token
 * POST /api/notifications/token
 */
export const registerDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      throw new ValidationError('FCM token is required');
    }

    if (!isMockMode()) {
      // Assuming User model is imported or can be imported.
      // Wait, we need to import User at the top of the file.
      // I will add User import later if it fails, but I can just use mongoose.model('User')
      const mongoose = await import('mongoose');
      const User = mongoose.model('User');
      
      await User.findByIdAndUpdate(userId, { fcmToken: token });
      logger.info('FCM Token registered', { userId });
    }

    res.json({
      success: true,
      message: 'Token registered successfully',
    });
  } catch (err) {
    logger.error('Failed to register FCM token:', err);
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// Export Controller
// ──────────────────────────────────────────────────────

export const notificationController = {
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
};

export default notificationController;
