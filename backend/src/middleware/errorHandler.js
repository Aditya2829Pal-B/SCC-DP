/**
 * Middleware — Error Handler, Request Logger, Async Error Wrapper
 * Production-grade middleware for Express
 */

import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { validatePayload } from '../utils/validation.js';

// ── Catch async errors ──
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ── Request timing and logging ──
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const originalJson = res.json;

  res.json = function (data) {
    const duration = Date.now() - startTime;
    logger.http(req, res, duration);
    return originalJson.call(this, data);
  };

  next();
}

// ── Global error handler ──
export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.entries(err.errors).map(([field, error]) => ({
      field,
      message: error.message,
    }));
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
      ...(isDev && { stack: err.stack }),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: true,
      code: 'CONFLICT',
      message: `${field} already exists`,
      ...(isDev && { stack: err.stack }),
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: true,
      code: 'INVALID_ID',
      message: 'Invalid ID format',
      ...(isDev && { stack: err.stack }),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
      ...(isDev && { stack: err.stack }),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true,
      code: 'TOKEN_EXPIRED',
      message: 'Token has expired',
      ...(isDev && { stack: err.stack }),
    });
  }

  // Custom AppError
  if (err.isOperational) {
    const response = {
      error: true,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    };

    if (err.details) {
      response.details = err.details;
    }

    if (isDev) {
      response.stack = err.stack;
    }

    return res.status(err.statusCode || 500).json(response);
  }

  // Unknown error
  logger.error('Unhandled error:', err);

  res.status(500).json({
    error: true,
    code: 'INTERNAL_SERVER_ERROR',
    message: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}

// ── 404 handler ──
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: true,
    code: 'NOT_FOUND',
    message: `Route ${req.path} not found`,
    method: req.method,
  });
}

// ── Request validation middleware ──
export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const data = req.body || req.query || req.params;
      req.validated = validatePayload(data, schema);
      next();
    } catch (err) {
      next(err);
    }
  };
}
