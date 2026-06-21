/**
 * Complaint Routes — Production-Grade
 */
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import complaintController from '../controllers/complaintController.js';

const router = Router();

// Public listing
router.get('/', authenticate, asyncHandler(complaintController.getComplaints));
router.get('/category/:category', authenticate, asyncHandler(complaintController.getByCategory));
router.get('/geo/nearby', authenticate, asyncHandler(complaintController.getNearbyComplaints));

// Single complaint
router.get('/:id', authenticate, asyncHandler(complaintController.getComplaint));

// Create complaint
router.post('/', authenticate, asyncHandler(complaintController.createComplaint));

// Update complaint (admin)
router.put('/:id', authenticate, adminOnly, asyncHandler(complaintController.updateComplaint));

// Delete complaint (admin)
router.delete('/:id', authenticate, adminOnly, asyncHandler(complaintController.deleteComplaint));

export default router;
