/**
 * Department Controller — Smart City Administration & Department Operations
 */
import ApiResponse from '../utils/apiResponse.js';
import DepartmentService from '../services/departmentService.js';
import { Complaint } from '../models/index.js';
import { getDBStatus } from '../utils/database.js';
import complaintController from './complaintController.js';
import { NotFoundError } from '../utils/errors.js';

function isMockMode() {
  return getDBStatus() !== 'connected';
}

export const departmentController = {
  /**
   * Get all departments or filtered by level
   */
  async getDepartments(req, res, next) {
    try {
      const { level } = req.query; // 'city' or 'state'
      const departments = DepartmentService.getDepartmentsByLevel(level);
      return ApiResponse.success(res, departments, 'Departments retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single department details
   */
  async getDepartmentById(req, res, next) {
    try {
      const { id } = req.params;
      const department = DepartmentService.getDepartmentById(id);
      
      if (!department) {
        throw new NotFoundError(`Department with ID ${id}`);
      }

      return ApiResponse.success(res, department, 'Department details retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get complaints assigned to a department
   */
  async getDepartmentComplaints(req, res, next) {
    try {
      const { id } = req.params; // departmentId
      const { page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const department = DepartmentService.getDepartmentById(id);
      if (!department) {
        throw new NotFoundError(`Department with ID ${id}`);
      }

      if (isMockMode()) {
        const mockComplaints = complaintController.getMockComplaints();
        const items = mockComplaints.filter(c => c.departmentId === id);
        const total = items.length;
        const complaints = items.slice(skip, skip + Number(limit));

        return ApiResponse.success(res, {
          complaints,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / limit)
          }
        }, `Complaints for ${department.name} retrieved successfully`);
      }

      const [complaints, total] = await Promise.all([
        Complaint.find({ departmentId: id })
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Complaint.countDocuments({ departmentId: id })
      ]);

      return ApiResponse.success(res, {
        complaints,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }, `Complaints for ${department.name} retrieved successfully`);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get analytics/statistics for all departments
   */
  async getDepartmentStats(req, res, next) {
    try {
      let complaints = [];

      if (isMockMode()) {
        complaints = complaintController.getMockComplaints();
      } else {
        complaints = await Complaint.find({}, 'status departmentId department adminLevel assignedOfficer');
      }

      const stats = DepartmentService.getDepartmentStats(complaints);
      return ApiResponse.success(res, stats, 'Department statistics calculated successfully');
    } catch (err) {
      next(err);
    }
  }
};

export default departmentController;
