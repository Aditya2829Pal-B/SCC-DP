/**
 * Complaints Controller — Complaint Management
 * Production-grade complaints handling with NLP classification
 */

import { Complaint, User } from '../models/index.js';
import { mlService } from '../services/mlService.js';
import DepartmentService from '../services/departmentService.js';
import RoutingEngineService from '../services/routingEngine.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import { getDBStatus } from '../utils/database.js';
import { validatePayload } from '../utils/validation.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const complaintSchema = {
  create: {
    title: { type: 'string', required: true, min: 5, max: 200 },
    description: { type: 'string', required: true, min: 10, max: 5000 },
    category: { type: 'string', required: false },
    location: { type: 'object', required: false },
    address: { type: 'string', required: false, max: 300 },
  },
  update: {
    status: { type: 'enum', options: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'] },
    priority: { type: 'enum', options: ['low', 'medium', 'high', 'critical'] },
    adminNotes: { type: 'string', max: 2000 },
  },
};

const mockComplaints = [];

function isMockMode() {
  return getDBStatus() !== 'connected';
}

export const complaintController = {
  // Get mock complaints array (useful for other controllers in mock mode)
  getMockComplaints() {
    return mockComplaints;
  },

  // Create complaint
  async createComplaint(req, res, next) {
    try {
      const payload = validatePayload(req.body, complaintSchema.create);
      const { title, description, category, location, address } = payload;

      let nlpCategory = category || 'Other';
      let nlpConfidence = 0.5;

      // Call NLP service for classification
      try {
        const classification = await mlService.classify(`${title}. ${description}`);
        nlpCategory = classification.category;
        nlpConfidence = classification.confidence;
      } catch (err) {
        logger.warn('NLP classification failed, using fallback', { error: err.message });
      }

      // Determine priority based on confidence
      const priority =
        nlpConfidence > 0.85 ? 'high' :
        nlpConfidence > 0.7 ? 'medium' : 'low';

      // Route the complaint to the correct department and authorities
      const userCity = req.user ? req.user.location?.city : '';
      const routing = RoutingEngineService.routeComplaint({
        category: nlpCategory,
        title,
        description,
        address: address || (location ? location.address : ''),
        userCity
      });

      if (isMockMode()) {
        const complaint = {
          _id: `cmp_${Date.now()}`,
          userId: req.user._id,
          userName: req.user.name,
          title,
          description,
          category: nlpCategory,
          status: 'Submitted',
          priority,
          location: location ? {
            type: 'Point',
            coordinates: location.coordinates,
            address: address || location.address,
          } : undefined,
          nlpCategory,
          nlpConfidence,
          department: routing.department,
          departmentId: routing.departmentId,
          adminLevel: routing.adminLevel,
          assignedOfficer: routing.assignedOfficer,
          departmentContact: routing.departmentContact,
          assignedDepartment: routing.assignedDepartment,
          assignedCityAuthority: routing.assignedCityAuthority,
          assignedStateAuthority: routing.assignedStateAuthority,
          escalated: routing.escalated,
          escalatedAt: routing.escalatedAt,
          escalationHistory: routing.escalationHistory,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockComplaints.unshift(complaint);

        return ApiResponse.created(res, {
          complaint,
          classification: {
            category: nlpCategory,
            confidence: nlpConfidence,
          },
        }, 'Complaint submitted and auto-routed successfully (Mock Mode)');
      }

      // Create complaint in DB
      const complaint = await Complaint.create({
        userId: req.user._id,
        userName: req.user.name,
        title,
        description,
        category: nlpCategory,
        status: 'Submitted',
        priority,
        location: location ? {
          type: 'Point',
          coordinates: location.coordinates,
          address: address || location.address,
        } : undefined,
        nlpCategory,
        nlpConfidence,
        department: routing.department,
        departmentId: routing.departmentId,
        adminLevel: routing.adminLevel,
        assignedOfficer: routing.assignedOfficer,
        departmentContact: routing.departmentContact,
        assignedDepartment: routing.assignedDepartment,
        assignedCityAuthority: routing.assignedCityAuthority,
        assignedStateAuthority: routing.assignedStateAuthority,
        escalated: routing.escalated,
        escalatedAt: routing.escalatedAt,
        escalationHistory: routing.escalationHistory,
      });

      logger.info('Complaint created and auto-routed', {
        complaintId: complaint._id,
        userId: req.user._id,
        category: nlpCategory,
        departmentId: routing.departmentId,
      });

      return ApiResponse.created(res, {
        complaint,
        classification: {
          category: nlpCategory,
          confidence: nlpConfidence,
        },
      }, 'Complaint submitted and auto-routed successfully');
    } catch (err) {
      next(err);
    }
  },

  // Get complaints
  async getComplaints(req, res, next) {
    try {
      const { userId, category, status, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter = {};
      if (userId) filter.userId = userId;
      if (category) filter.category = category;
      if (status) filter.status = status;

      if (isMockMode()) {
        // Dynamic escalation check on memory items
        mockComplaints.forEach((c) => RoutingEngineService.checkAndApplyEscalation(c));

        let items = [...mockComplaints];
        if (userId) items = items.filter((c) => String(c.userId) === String(userId));
        if (category) items = items.filter((c) => c.category === category);
        if (status) items = items.filter((c) => c.status === status);

        const total = items.length;
        const complaints = items.slice(skip, skip + Number(limit));

        return ApiResponse.success(res, {
          complaints,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / limit),
          },
        }, 'Complaints list retrieved successfully (Mock Mode)');
      }

      const [complaints, total] = await Promise.all([
        Complaint.find(filter)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Complaint.countDocuments(filter),
      ]);

      // Check and apply escalations dynamically on query
      for (const complaint of complaints) {
        const wasEscalated = RoutingEngineService.checkAndApplyEscalation(complaint);
        if (wasEscalated) {
          await complaint.save();
        }
      }

      return ApiResponse.success(res, {
        complaints,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      }, 'Complaints list retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // Get single complaint
  async getComplaint(req, res, next) {
    try {
      if (isMockMode()) {
        const complaint = mockComplaints.find((c) => c._id === req.params.id);
        if (!complaint) {
          throw new NotFoundError('Complaint');
        }

        RoutingEngineService.checkAndApplyEscalation(complaint);

        return ApiResponse.success(res, { complaint }, 'Complaint retrieved successfully (Mock Mode)');
      }

      const complaint = await Complaint.findById(req.params.id).populate('userId', 'name email');
      if (!complaint) {
        throw new NotFoundError('Complaint');
      }

      const wasEscalated = RoutingEngineService.checkAndApplyEscalation(complaint);
      if (wasEscalated) {
        await complaint.save();
      }

      return ApiResponse.success(res, { complaint }, 'Complaint retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // Update complaint
  async updateComplaint(req, res, next) {
    try {
      const payload = validatePayload(req.body, complaintSchema.update);
      const { status, priority, adminNotes } = payload;

      if (isMockMode()) {
        const idx = mockComplaints.findIndex((c) => c._id === req.params.id);
        if (idx === -1) {
          throw new NotFoundError('Complaint');
        }

        if (status) mockComplaints[idx].status = status;
        if (priority) mockComplaints[idx].priority = priority;
        if (adminNotes) mockComplaints[idx].adminNotes = adminNotes;
        mockComplaints[idx].updatedAt = new Date();

        return ApiResponse.success(res, { complaint: mockComplaints[idx] }, 'Complaint updated successfully (Mock Mode)');
      }

      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status, priority, adminNotes },
        { new: true, runValidators: true }
      );

      if (!complaint) {
        throw new NotFoundError('Complaint');
      }

      logger.info('Complaint updated', {
        complaintId: req.params.id,
        userId: req.user._id,
        changes: { status, priority },
      });

      return ApiResponse.success(res, { complaint }, 'Complaint updated successfully');
    } catch (err) {
      next(err);
    }
  },

  // Get nearby complaints (geo query)
  async getNearbyComplaints(req, res, next) {
    try {
      const { lng, lat, maxDistance = 5000 } = req.query;

      if (!lng || !lat) {
        throw new ValidationError('Longitude and latitude required');
      }

      if (isMockMode()) {
        return ApiResponse.success(res, {
          complaints: mockComplaints.slice(0, 100),
          count: Math.min(mockComplaints.length, 100),
        }, 'Nearby complaints retrieved successfully (Mock Mode)');
      }

      const complaints = await Complaint.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [Number(lng), Number(lat)],
            },
            $maxDistance: Number(maxDistance),
          },
        },
      }).limit(100);

      return ApiResponse.success(res, {
        complaints,
        count: complaints.length,
      }, 'Nearby complaints retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // Get complaints by category
  async getByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (isMockMode()) {
        const items = mockComplaints.filter((c) => c.category === category);
        const total = items.length;
        const complaints = items.slice(skip, skip + Number(limit));

        return ApiResponse.success(res, {
          complaints,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / limit),
          },
        }, `Complaints in category ${category} retrieved successfully (Mock Mode)`);
      }

      const [complaints, total] = await Promise.all([
        Complaint.find({ category })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Complaint.countDocuments({ category }),
      ]);

      return ApiResponse.success(res, {
        complaints,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      }, `Complaints in category ${category} retrieved successfully`);
    } catch (err) {
      next(err);
    }
  },

  // Delete complaint (admin)
  async deleteComplaint(req, res, next) {
    try {
      if (isMockMode()) {
        const idx = mockComplaints.findIndex((c) => c._id === req.params.id);
        if (idx === -1) {
          throw new NotFoundError('Complaint');
        }
        mockComplaints.splice(idx, 1);

        return ApiResponse.success(res, null, 'Complaint deleted successfully (Mock Mode)');
      }

      const complaint = await Complaint.findByIdAndDelete(req.params.id);
      if (!complaint) {
        throw new NotFoundError('Complaint');
      }

      logger.info('Complaint deleted', {
        complaintId: req.params.id,
        userId: req.user._id,
      });

      return ApiResponse.success(res, null, 'Complaint deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};

export default complaintController;
