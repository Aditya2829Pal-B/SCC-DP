/**
 * Analytics Controller — Dashboard Statistics & Insights
 */
import { Complaint, Alert, User } from '../models/index.js';
import logger from '../utils/logger.js';
import { getDBStatus } from '../utils/database.js';
import { 
  AuthorizationError,
  DatabaseError 
} from '../utils/errors.js';
import ApiResponse from '../utils/apiResponse.js';

function isMockMode() {
  return getDBStatus() !== 'connected';
}

// ══════════════════════════════════════════════════════
// Analytics Operations
// ══════════════════════════════════════════════════════

/**
 * Get dashboard overview
 * GET /api/analytics/overview
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    if (isMockMode()) {
      return ApiResponse.success(res, {
        summary: {
          totalComplaints: 1247,
          totalAlerts: 42,
          totalUsers: 389,
          resolutionRate: '71.53%',
          avgResolutionTime: '18.6h',
        },
        complaints: {
          byStatus: {
            Submitted: 198,
            'Under Review': 143,
            'In Progress': 274,
            Resolved: 632,
          },
          byCategory: {
            'Road Damage': 287,
            'Water Supply': 234,
            Electricity: 198,
            Garbage: 167,
          },
          byPriority: {
            low: 221,
            medium: 664,
            high: 295,
            critical: 67,
          },
          total: 1247,
        },
        alerts: {
          bySeverity: {
            low: 9,
            medium: 17,
            high: 13,
            critical: 3,
          },
          total: 42,
        },
      }, 'Dashboard overview retrieved successfully (Mock Mode)');
    }

    // Fetch statistics in parallel
    const [
      totalComplaints,
      complaintsByStatus,
      complaintsByCategory,
      complaintsByPriority,
      totalAlerts,
      alertsBySeverity,
      totalUsers,
      resolvedRate,
      avgResolutionTime,
    ] = await Promise.all([
      // Total complaints
      Complaint.countDocuments(),

      // Complaints by status
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Complaints by category
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Complaints by priority
      Complaint.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Total alerts
      Alert.countDocuments(),

      // Alerts by severity
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),

      // Total users
      User.countDocuments(),

      // Resolution rate (Resolved / Total * 100)
      Complaint.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            resolved: [
              { $match: { status: 'Resolved' } },
              { $count: 'count' },
            ],
          },
        },
      ]).then((result) => {
        const total = result[0].total[0]?.count || 0;
        const resolved = result[0].resolved[0]?.count || 0;
        return total > 0 ? ((resolved / total) * 100).toFixed(2) : 0;
      }),

      // Average resolution time (hours)
      Complaint.aggregate([
        { $match: { status: 'Resolved', updatedAt: { $exists: true } } },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                3600000, // Convert to hours
              ],
            },
          },
        },
        { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } },
      ]).then((result) => {
        return result[0]?.avgTime?.toFixed(2) || 0;
      }),
    ]);

    // Format status data
    const statusMap = {};
    complaintsByStatus.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    // Format category data
    const categories = {};
    complaintsByCategory.forEach((item) => {
      categories[item._id] = item.count;
    });

    // Format priority data
    const priorities = {};
    complaintsByPriority.forEach((item) => {
      priorities[item._id] = item.count;
    });

    // Format severity data
    const severities = {};
    alertsBySeverity.forEach((item) => {
      severities[item._id] = item.count;
    });

    logger.info('Dashboard overview generated', {
      totalComplaints,
      totalAlerts,
      totalUsers,
      resolutionRate: resolvedRate,
    });

    return ApiResponse.success(res, {
      // Flat properties expected by the frontend Dashboards
      totalComplaints,
      resolvedComplaints: statusMap['Resolved'] || 0,
      pendingComplaints: totalComplaints - (statusMap['Resolved'] || 0),
      avgResolutionTime: `${avgResolutionTime}h`,
      complaintTrend: [
        { month: 'Jan', count: 0, resolved: 0 },
        { month: 'Feb', count: 0, resolved: 0 },
        { month: 'Mar', count: 0, resolved: 0 },
        { month: 'Apr', count: 0, resolved: 0 },
        { month: 'May', count: 0, resolved: 0 },
        { month: 'Jun', count: totalComplaints, resolved: statusMap['Resolved'] || 0 }
      ],
      riskDistribution: {
        high: (severities['high'] || 0) + (severities['critical'] || 0),
        medium: severities['medium'] || 0,
        low: severities['low'] || 0,
      },
      complaintsByCategory: categories,

      // Nested properties for backward compatibility
      summary: {
        totalComplaints,
        totalAlerts,
        totalUsers,
        resolutionRate: `${resolvedRate}%`,
        avgResolutionTime: `${avgResolutionTime}h`,
      },
      complaints: {
        byStatus: statusMap,
        byCategory: categories,
        byPriority: priorities,
        total: totalComplaints,
      },
      alerts: {
        bySeverity: severities,
        total: totalAlerts,
      },
    }, 'Dashboard overview retrieved successfully');
  } catch (err) {
    logger.error('Failed to generate dashboard overview:', err);
    next(err);
  }
};

/**
 * Get trends over time
 * GET /api/analytics/trends?month=6&year=2026
 */
export const getTrends = async (req, res, next) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    // Validate date parameters
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return ApiResponse.error(res, 'Invalid month or year', 400);
    }

    // Get date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Fetch trends data
    const [
      complaintTrends,
      alertTrends,
      categoryTrends,
      priorityTrends,
    ] = await Promise.all([
      // Daily complaint counts
      Complaint.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dayOfMonth: '$createdAt',
            },
            count: { $sum: 1 },
            critical: {
              $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] },
            },
            high: {
              $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Daily alert counts
      Alert.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dayOfMonth: '$createdAt',
            },
            count: { $sum: 1 },
            critical: {
              $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top categories by complaint count
      Complaint.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Priority distribution
      Complaint.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    logger.info('Trends generated', {
      month,
      year,
      complaintCount: complaintTrends.length,
    });

    return ApiResponse.success(res, {
      period: {
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1],
        year,
      },
      complaints: {
        daily: complaintTrends,
        byCategory: categoryTrends,
        byPriority: priorityTrends,
      },
      alerts: {
        daily: alertTrends,
      },
    }, 'Trends retrieved successfully');
  } catch (err) {
    logger.error('Failed to get trends:', err);
    next(err);
  }
};

/**
 * Get user statistics
 * GET /api/analytics/users
 */
export const getUserStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      usersByRole,
      topComplainters,
      usersWithAlerts,
    ] = await Promise.all([
      // Total users
      User.countDocuments(),

      // Users by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      // Top complainers
      Complaint.aggregate([
        { $group: { _id: '$userId', complaintCount: { $sum: 1 } } },
        { $sort: { complaintCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userName: '$user.name',
            complaintCount: 1,
          },
        },
      ]),

      // Users with high-risk alerts
      Alert.aggregate([
        { $match: { severity: { $in: ['high', 'critical'] } } },
        { $unwind: '$targetUsers' },
        { $group: { _id: '$targetUsers', alertCount: { $sum: 1 } } },
        { $count: 'count' },
      ]).then((result) => result[0]?.count || 0),
    ]);

    // Format role data
    const roles = {};
    usersByRole.forEach((item) => {
      roles[item._id] = item.count;
    });

    logger.info('User statistics generated', {
      totalUsers,
      topComplainersCount: topComplainters.length,
    });

    return ApiResponse.success(res, {
      summary: {
        totalUsers,
        usersByRole: roles,
        usersWithHighRiskAlerts: usersWithAlerts,
      },
      topComplainters,
    }, 'User statistics retrieved successfully');
  } catch (err) {
    logger.error('Failed to get user statistics:', err);
    next(err);
  }
};

/**
 * Get geographic statistics
 * GET /api/analytics/geographic
 */
export const getGeographicStats = async (req, res, next) => {
  try {
    const [
      complaintsByLocation,
      alertsByLocation,
    ] = await Promise.all([
      // Complaints by location/city
      Complaint.aggregate([
        {
          $group: {
            _id: '$location.address',
            count: { $sum: 1 },
            avgPriority: {
              $avg: {
                $cond: [
                  { $eq: ['$priority', 'critical'] }, 4,
                  { $cond: [{ $eq: ['$priority', 'high'] }, 3, 1] }
                ],
              },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // Alerts by location
      Alert.aggregate([
        { $match: { location: { $ne: null } } },
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 },
            avgSeverity: {
              $avg: {
                $cond: [
                  { $eq: ['$severity', 'critical'] }, 4,
                  { $cond: [{ $eq: ['$severity', 'high'] }, 3, 1] }
                ],
              },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
    ]);

    logger.info('Geographic statistics generated');

    return ApiResponse.success(res, {
      complaintsByLocation,
      alertsByLocation,
    }, 'Geographic statistics retrieved successfully');
  } catch (err) {
    logger.error('Failed to get geographic statistics:', err);
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// Export Controller
// ──────────────────────────────────────────────────────

export const analyticsController = {
  getDashboardOverview,
  getTrends,
  getUserStats,
  getGeographicStats,
};

export default analyticsController;
