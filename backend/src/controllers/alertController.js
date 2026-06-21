/**
 * Alert Controller — Production-Grade Alert Management
 */
import { Alert, User } from '../models/index.js';
import logger from '../utils/logger.js';
import { getDBStatus } from '../utils/database.js';
import { 
  NotFoundError, 
  ValidationError, 
  AuthorizationError,
  DatabaseError 
} from '../utils/errors.js';
import { validatePayload } from '../utils/validation.js';
import ApiResponse from '../utils/apiResponse.js';

// ── Alert Schemas ──
const alertSchema = {
  title: { type: 'string', required: true, min: 5, max: 200 },
  message: { type: 'string', required: true, min: 10, max: 2000 },
  severity: { type: 'enum', enum: ['low', 'medium', 'high', 'critical'], required: true },
  type: { type: 'string', required: true, max: 100 },
  location: { type: 'string', max: 500 },
  targetUsers: { type: 'array' },
  riskScore: { type: 'number', min: 0, max: 1 },
};

const filterSchema = {
  severity: { type: 'enum', enum: ['low', 'medium', 'high', 'critical'] },
  type: { type: 'string', max: 100 },
  page: { type: 'number', min: 1 },
  limit: { type: 'number', min: 1, max: 100 },
  unread: { type: 'string' },
};

const mockAlerts = [
  {
    _id: 'al_1',
    title: 'Flash Flood Warning',
    message: 'Heavy rainfall expected. Avoid low-lying roads.',
    severity: 'high',
    type: 'flood',
    location: 'North Delhi',
    targetUsers: [],
    read: false,
    riskScore: 0.82,
    createdAt: new Date(),
  },
  {
    _id: 'al_2',
    title: 'Heatwave Advisory',
    message: 'Temperature may cross 45C. Stay hydrated.',
    severity: 'medium',
    type: 'heatwave',
    location: 'Central Delhi',
    targetUsers: [],
    read: false,
    riskScore: 0.64,
    createdAt: new Date(),
  },
];

function isMockMode() {
  return getDBStatus() !== 'connected';
}

// ══════════════════════════════════════════════════════
// Alert Operations
// ══════════════════════════════════════════════════════

/**
 * Get all alerts for user
 * GET /api/alerts
 */
export const getAlerts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { severity, type, page = 1, limit = 50, unread } = req.query;
    if (isMockMode()) {
      let alerts = [...mockAlerts];
      if (severity) alerts = alerts.filter((a) => a.severity === severity);
      if (type) alerts = alerts.filter((a) => a.type === type);
      if (unread === 'true') alerts = alerts.filter((a) => !a.read);
      const total = alerts.length;
      const skip = (Number(page) - 1) * Number(limit);
      alerts = alerts.slice(skip, skip + Number(limit));

      return ApiResponse.success(res, {
        alerts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }, 'Alerts retrieved successfully (Mock Mode)');
    }


    // Validate filters
    validatePayload({ severity, type, page, limit, unread }, filterSchema);

    // Build query
    const query = {
      $or: [
        { targetUsers: userId },
        { targetUsers: { $size: 0 } }, // Broadcast alerts
      ],
    };

    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (unread === 'true') query.read = false;

    // Fetch alerts with pagination
    const skip = (page - 1) * limit;
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);

    logger.info(`Retrieved ${alerts.length} alerts for user`, {
      userId,
      total,
      filters: { severity, type },
    });

    return ApiResponse.success(res, {
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Alerts retrieved successfully');
  } catch (err) {
    logger.error('Failed to get alerts:', err);
    next(err);
  }
};

/**
 * Get alert by ID
 * GET /api/alerts/:id
 */
export const getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const alert = await Alert.findById(id);

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Check authorization
    if (alert.targetUsers.length > 0 && !alert.targetUsers.includes(userId)) {
      throw new AuthorizationError('Unauthorized to view this alert');
    }

    logger.info(`Retrieved alert: ${id}`);

    return ApiResponse.success(res, alert, 'Alert retrieved successfully');
  } catch (err) {
    logger.error('Failed to get alert:', err);
    next(err);
  }
};

/**
 * Get user's risk profile with personalized alerts
 * GET /api/alerts/risk/:userId
 */
export const getRiskProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user._id;

    // Check authorization - users can only view their own risk, admins can view all
    if (requestingUser.toString() !== userId && req.user.role !== 'admin') {
      throw new AuthorizationError('Unauthorized to view this risk profile');
    }

    if (isMockMode()) {
      return ApiResponse.success(res, {
        user: {
          id: userId,
          name: req.user.name,
          location: req.user.location,
          sensitivity: req.user.sensitivity || 1.0,
        },
        highRiskAlerts: mockAlerts.filter((a) => ['high', 'critical'].includes(a.severity)),
        statistics: {
          totalAlerts: mockAlerts.length,
          userAlerts: [
            { _id: 'high', count: mockAlerts.filter((a) => a.severity === 'high').length, avgRiskScore: 0.8 },
            { _id: 'medium', count: mockAlerts.filter((a) => a.severity === 'medium').length, avgRiskScore: 0.6 },
          ],
        },
      }, 'User risk profile retrieved successfully (Mock Mode)');
    }

    // Get user
    const user = await User.findById(userId).select('+sensitivity');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get high-risk alerts for user
    const highRiskAlerts = await Alert.find({
      $or: [
        { targetUsers: userId },
        { targetUsers: { $size: 0 } },
      ],
      severity: { $in: ['high', 'critical'] },
    })
      .sort({ riskScore: -1, createdAt: -1 })
      .limit(10);

    // Get risk statistics
    const alertStats = await Alert.aggregate([
      {
        $match: {
          $or: [
            { targetUsers: { $in: [userId] } },
            { targetUsers: { $size: 0 } },
          ],
        },
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' },
        },
      },
    ]);

    logger.info(`Retrieved risk profile for user: ${userId}`, {
      sensitivity: user.sensitivity,
      alertCount: highRiskAlerts.length,
    });

    return ApiResponse.success(res, {
      user: {
        id: user._id,
        name: user.name,
        location: user.location,
        sensitivity: user.sensitivity,
      },
      highRiskAlerts,
      statistics: {
        totalAlerts: await Alert.countDocuments(),
        userAlerts: alertStats,
      },
    }, 'User risk profile retrieved successfully');
  } catch (err) {
    logger.error('Failed to get risk profile:', err);
    next(err);
  }
};

/**
 * Mark alert as read
 * PATCH /api/alerts/:id/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    logger.info(`Alert marked as read: ${id}`);

    return ApiResponse.success(res, alert, 'Alert marked as read successfully');
  } catch (err) {
    logger.error('Failed to mark alert as read:', err);
    next(err);
  }
};

/**
 * Create alert (admin only)
 * POST /api/alerts
 */
export const createAlert = async (req, res, next) => {
  try {
    const { title, message, severity, type, location, targetUsers, riskScore } = req.body;

    // Validate payload
    validatePayload(
      { title, message, severity, type, location, riskScore },
      alertSchema
    );

    // Create alert
    const alert = new Alert({
      title,
      message,
      severity,
      type,
      location,
      targetUsers: targetUsers || [],
      riskScore: riskScore || 0,
      createdBy: req.user._id,
    });

    await alert.save();

    logger.info(`Alert created: ${alert._id}`, {
      severity,
      type,
      targetCount: targetUsers?.length || 0,
    });

    return ApiResponse.created(res, alert, 'Alert created successfully');
  } catch (err) {
    logger.error('Failed to create alert:', err);
    next(err);
  }
};

/**
 * Update alert (admin only)
 * PUT /api/alerts/:id
 */
export const updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, message, severity, type, location, targetUsers, riskScore } = req.body;

    // Validate payload (all optional)
    validatePayload(
      { title, message, severity, type, location, riskScore },
      alertSchema
    );

    const updateData = {};
    if (title) updateData.title = title;
    if (message) updateData.message = message;
    if (severity) updateData.severity = severity;
    if (type) updateData.type = type;
    if (location) updateData.location = location;
    if (targetUsers) updateData.targetUsers = targetUsers;
    if (riskScore !== undefined) updateData.riskScore = riskScore;

    const alert = await Alert.findByIdAndUpdate(id, updateData, { new: true });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    logger.info(`Alert updated: ${id}`, { updates: Object.keys(updateData) });

    return ApiResponse.success(res, alert, 'Alert updated successfully');
  } catch (err) {
    logger.error('Failed to update alert:', err);
    next(err);
  }
};

/**
 * Delete alert (admin only)
 * DELETE /api/alerts/:id
 */
export const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndDelete(id);

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    logger.info(`Alert deleted: ${id}`);

    return ApiResponse.success(res, null, 'Alert deleted successfully');
  } catch (err) {
    logger.error('Failed to delete alert:', err);
    next(err);
  }
};

/**
 * Broadcast alert to all users (admin only)
 * POST /api/alerts/broadcast
 */
export const broadcastAlert = async (req, res, next) => {
  try {
    const { title, message, severity, type, location, riskScore } = req.body;

    validatePayload(
      { title, message, severity, type, location, riskScore },
      alertSchema
    );

    // Get all users by location if provided
    let targetUsers = [];
    if (location) {
      // Can be enhanced with geospatial queries
      targetUsers = [];
    }

    const alert = new Alert({
      title,
      message,
      severity,
      type,
      location,
      targetUsers, // Empty means broadcast to all
      riskScore: riskScore || 0,
      createdBy: req.user._id,
    });

    await alert.save();

    const userCount = await User.countDocuments();

    logger.info(`Broadcast alert created: ${alert._id}`, {
      severity,
      type,
      broadcastScope: 'all users',
      estimatedUsers: userCount,
    });

    return ApiResponse.created(res, {
      alert,
      broadcast: {
        scope: 'all',
        estimatedRecipients: userCount,
      },
    }, 'Alert broadcasted successfully');
  } catch (err) {
    logger.error('Failed to broadcast alert:', err);
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// Export Controller
// ──────────────────────────────────────────────────────

export const alertController = {
  getAlerts,
  getAlertById,
  getRiskProfile,
  markAsRead,
  createAlert,
  updateAlert,
  deleteAlert,
  broadcastAlert,
};

export default alertController;
