/**
 * ML Routes — Production-Grade Machine Learning Service Integration
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  classifyText,
  predictDisaster,
  calculateRiskScore,
  classifyBatch,
  checkHealth,
  getModels,
} from '../controllers/mlController.js';

const router = express.Router();

// ── Public Routes ──

/**
 * Health check for ML services
 * GET /api/ml/health
 */
router.get('/health', asyncHandler(checkHealth));

/**
 * Get model information
 * GET /api/ml/models
 */
router.get('/models', asyncHandler(getModels));

// ── Protected Routes ──

/**
 * Classify text using NLP service
 * POST /api/ml/classify
 * Body: { text: string }
 */
router.post('/classify', authenticate, asyncHandler(classifyText));

/**
 * Predict disaster using LSTM service
 * POST /api/ml/predict
 * Body: { location: object, weatherData: object }
 */
router.post('/predict', authenticate, asyncHandler(predictDisaster));

/**
 * Calculate personalized risk score
 * POST /api/ml/risk-score
 * Body: { userId: string, location: object, disasterProbability: number }
 */
router.post('/risk-score', authenticate, asyncHandler(calculateRiskScore));

/**
 * Batch classify multiple texts
 * POST /api/ml/classify-batch
 * Body: { texts: string[] }
 */
router.post('/classify-batch', authenticate, asyncHandler(classifyBatch));

export default router;
