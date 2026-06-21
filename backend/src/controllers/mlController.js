/**
 * ML Controller — Machine Learning Service Integration
 */

import { mlService } from '../services/mlService.js';
import logger from '../utils/logger.js';
import { 
  ValidationError,
  ServiceUnavailableError,
} from '../utils/errors.js';
import { validatePayload } from '../utils/validation.js';

// ── ML Schemas ──
const classifySchema = {
  text: { type: 'string', required: true, min: 10, max: 5000 },
};

const predictSchema = {
  location: { type: 'object', required: true },
  weatherData: { type: 'object', required: true },
};

const riskScoreSchema = {
  userId: { type: 'string', required: true },
  location: { type: 'object', required: true },
  disasterProbability: { type: 'number', min: 0, max: 1 },
};

// ══════════════════════════════════════════════════════
// ML Operations
// ══════════════════════════════════════════════════════

/**
 * Classify text using NLP service
 * POST /api/ml/classify
 */
export const classifyText = async (req, res, next) => {
  try {
    const { text } = req.body;

    // Validate payload
    validatePayload({ text }, classifySchema);

    // Call ML service
    const result = await mlService.classify(text);

    if (!result.success && result.fallback) {
      logger.warn('NLP service unavailable, using fallback classification');
    }

    logger.info('Text classified', {
      textLength: text.length,
      category: result.category,
      confidence: result.confidence,
      source: result.fallback ? 'fallback' : 'ml-service',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Classification failed:', err);
    next(err);
  }
};

/**
 * Predict disaster risk using LSTM service
 * POST /api/ml/predict
 */
export const predictDisaster = async (req, res, next) => {
  try {
    const { location, weatherData } = req.body;

    // Validate payload
    validatePayload(
      { location, weatherData },
      predictSchema
    );

    // Call ML service
    const result = await mlService.predict(weatherData);

    if (!result.success && result.fallback) {
      logger.warn('LSTM service unavailable, using fallback prediction');
    }

    logger.info('Disaster prediction generated', {
      location: location.address || 'unknown',
      probability: result.probability,
      source: result.fallback ? 'fallback' : 'ml-service',
    });

    res.json({
      success: true,
      data: {
        ...result,
        location,
      },
    });
  } catch (err) {
    logger.error('Prediction failed:', err);
    next(err);
  }
};

/**
 * Calculate personalized risk score
 * POST /api/ml/risk-score
 */
export const calculateRiskScore = async (req, res, next) => {
  try {
    const { userId, location, disasterProbability } = req.body;

    // Validate payload (userId and location are required)
    const { userId: uid, location: loc } = validatePayload(
      { userId, location },
      riskScoreSchema
    );

    // Call ML service for risk calculation
    const result = await mlService.calculateRiskScore({
      userId,
      location,
      disasterProbability,
    });

    if (!result.success && result.fallback) {
      logger.warn('Risk Engine unavailable, using fallback scoring');
    }

    logger.info('Risk score calculated', {
      userId,
      location: location.address || 'unknown',
      riskScore: result.riskScore,
      source: result.fallback ? 'fallback' : 'ml-service',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Risk score calculation failed:', err);
    next(err);
  }
};

/**
 * Batch classification of multiple texts
 * POST /api/ml/classify-batch
 */
export const classifyBatch = async (req, res, next) => {
  try {
    const { texts } = req.body;

    // Validate
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new ValidationError('texts must be a non-empty array');
    }

    if (texts.length > 100) {
      throw new ValidationError('Maximum 100 texts allowed per batch');
    }

    // Validate each text
    texts.forEach((text, idx) => {
      if (typeof text !== 'string' || text.length < 10) {
        throw new ValidationError(`Text at index ${idx} must be at least 10 characters`);
      }
    });

    // Call ML service
    const results = await mlService.classifyBatch(texts);

    logger.info('Batch classification completed', {
      batchSize: texts.length,
      successCount: results.filter((r) => r.success).length,
    });

    res.json({
      success: true,
      data: results,
      batch: {
        total: texts.length,
        processed: results.filter((r) => r.success).length,
      },
    });
  } catch (err) {
    logger.error('Batch classification failed:', err);
    next(err);
  }
};

/**
 * Check ML services health
 * GET /api/ml/health
 */
export const checkHealth = async (req, res, next) => {
  try {
    const health = await mlService.healthCheck();

    const allHealthy = Object.values(health).every((s) => s.status === 'healthy');

    logger.info('ML health check completed', {
      status: allHealthy ? 'healthy' : 'degraded',
      services: health,
    });

    res.json({
      success: true,
      status: allHealthy ? 'healthy' : 'degraded',
      data: health,
    });
  } catch (err) {
    logger.error('Health check failed:', err);
    next(err);
  }
};

/**
 * Get model information
 * GET /api/ml/models
 */
export const getModels = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        nlp: {
          name: 'Complaint Classifier',
          type: 'Text Classification',
          algorithm: 'TF-IDF + Naive Bayes',
          categories: [
            'Road Damage',
            'Water Supply',
            'Electricity',
            'Garbage',
            'Noise Pollution',
            'Flooding',
            'Street Light',
            'Sewage',
            'Others',
          ],
          accuracy: 0.87,
          lastUpdated: '2026-05-01',
        },
        lstm: {
          name: 'Disaster Predictor',
          type: 'Time Series Forecasting',
          algorithm: 'LSTM Neural Network',
          predictions: ['Flood Risk', 'Earthquake Risk', 'Heatwave Risk'],
          accuracy: 0.82,
          lastUpdated: '2026-04-15',
        },
        riskEngine: {
          name: 'Personalized Risk Scorer',
          type: 'Risk Assessment',
          algorithm: 'Multi-factor Scoring',
          factors: [
            'Disaster Probability',
            'Area Risk',
            'User Sensitivity',
            'Historical Data',
          ],
          lastUpdated: '2026-05-05',
        },
      },
    });
  } catch (err) {
    logger.error('Failed to get model information:', err);
    next(err);
  }
};

// ──────────────────────────────────────────────────────
// Export Controller
// ──────────────────────────────────────────────────────

export const mlController = {
  classifyText,
  predictDisaster,
  calculateRiskScore,
  classifyBatch,
  checkHealth,
  getModels,
};

export default mlController;
