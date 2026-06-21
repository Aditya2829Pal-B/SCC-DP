/**
 * Department Administration Routes
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import departmentController from '../controllers/departmentController.js';

const router = Router();

// Retrieve all departments (with optional query filter level=city|state)
router.get('/', authenticate, asyncHandler(departmentController.getDepartments));

// Retrieve performance & complaint statistics per department (Admin/All)
router.get('/stats', authenticate, asyncHandler(departmentController.getDepartmentStats));

// Retrieve details for a specific department
router.get('/:id', authenticate, asyncHandler(departmentController.getDepartmentById));

// Retrieve all complaints routed to a specific department
router.get('/:id/complaints', authenticate, asyncHandler(departmentController.getDepartmentComplaints));

export default router;
