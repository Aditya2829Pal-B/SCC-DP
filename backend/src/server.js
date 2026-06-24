/**
 * SCC&DP Backend — Production-Grade API Server
 * Smart City Complaint & Disaster Prediction Platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Imports
import config from './config/index.js';
import logger from './utils/logger.js';
import { connectDB, disconnectDB, getDBStatus } from './utils/database.js';
import { requestLogger, errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { mlService } from './services/mlService.js';

// Routes
import apiRoutes from './routes/index.js';

// ══════════════════════════════════════════════════════
// Express App Setup
// ══════════════════════════════════════════════════════

const app = express();

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN || '', // Expects DSN from env
  environment: config.nodeEnv,
  tracesSampleRate: 1.0,
});

// Correlation ID Middleware
app.use((req, res, next) => {
  req.traceId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('X-Correlation-ID', req.traceId);
  next();
});

// ── Security Middleware ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// XSS Protection
app.use(xss());

// NoSQL Injection Protection
app.use(mongoSanitize());

// API Rate Limiting (DDoS Mitigation)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ── CORS ──
app.use(cors(config.cors));

// ── Disable Browser Caching for API ──
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ── Request Logging ──
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.debug(message.trim(), { context: 'HTTP' }),
  },
}));

// ── Body Parser ──
app.use(express.json({ limit: config.security.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.security.maxRequestSize }));

// ── Custom Request Logger ──
app.use(requestLogger);

// ──────────────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────────────

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'SCC&DP API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: getDBStatus(),
    environment: config.nodeEnv,
  });
});

// Liveness probe (Kubernetes)
app.get('/live', (req, res) => {
  res.status(200).send('OK');
});

// Readiness probe (Kubernetes)
app.get('/ready', (req, res) => {
  if (getDBStatus() === 'connected' || getDBStatus() === 'disconnected') {
    // If we're disconnected but that's fine for mock mode, return OK. Otherwise, check properly.
    // For now we accept 'disconnected' as ready if we are in mock mode (dev) or if DB isn't strictly required
    res.status(200).send('OK');
  } else {
    res.status(503).send('Not Ready');
  }
});

// Metrics endpoint (Prometheus format placeholder)
app.get('/api/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP sccdp_api_uptime_seconds The uptime of the API gateway\n# TYPE sccdp_api_uptime_seconds counter\nsccdp_api_uptime_seconds ${process.uptime()}`);
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'SCC&DP - Smart City Complaint & Disaster Prediction API',
    version: '1.0.0',
    environment: config.nodeEnv,
    documentation: 'https://docs.sccadp.local',
    endpoints: {
      auth: {
        signup: { method: 'POST', path: '/api/auth/signup' },
        login: { method: 'POST', path: '/api/auth/login' },
        profile: { method: 'GET', path: '/api/auth/profile', auth: true },
        updateProfile: { method: 'PUT', path: '/api/auth/profile', auth: true },
        refreshToken: { method: 'POST', path: '/api/auth/refresh-token' },
      },
      complaints: {
        list: { method: 'GET', path: '/api/complaints', auth: true },
        create: { method: 'POST', path: '/api/complaints', auth: true },
        get: { method: 'GET', path: '/api/complaints/:id', auth: true },
        update: { method: 'PUT', path: '/api/complaints/:id', auth: true, admin: true },
        delete: { method: 'DELETE', path: '/api/complaints/:id', auth: true, admin: true },
        nearby: { method: 'GET', path: '/api/complaints/geo/nearby', auth: true },
        byCategory: { method: 'GET', path: '/api/complaints/category/:category', auth: true },
      },
      alerts: {
        list: { method: 'GET', path: '/api/alerts', auth: true },
        risk: { method: 'GET', path: '/api/alerts/risk/:userId', auth: true },
      },
      analytics: {
        overview: { method: 'GET', path: '/api/analytics/overview', auth: true, admin: true },
        trends: { method: 'GET', path: '/api/analytics/trends', auth: true, admin: true },
      },
      ml: {
        classify: { method: 'POST', path: '/api/ml/classify' },
        predict: { method: 'POST', path: '/api/ml/predict' },
        riskScore: { method: 'POST', path: '/api/ml/risk-score' },
        health: { method: 'GET', path: '/api/ml/health' },
      },
    },
  });
});

// ML Health check
app.get('/api/ml/health', async (req, res) => {
  try {
    const health = await mlService.healthCheck();
    res.json({
      success: true,
      services: health,
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: 'ML services unavailable',
    });
  }
});

// Mount API routes
app.use('/api', apiRoutes);

// ──────────────────────────────────────────────────────
// Error Handling
// ──────────────────────────────────────────────────────

// The error handler must be before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ══════════════════════════════════════════════════════
// Server Startup
// ══════════════════════════════════════════════════════

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 SCC&DP API Gateway started`, {
        port: config.port,
        environment: config.nodeEnv,
        database: getDBStatus(),
      });
      logger.info(`📋 API Docs: http://localhost:${config.port}/api`);
      logger.info(`💚 Health: http://localhost:${config.port}/health`);
    });

    // ── Graceful Shutdown ──
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await disconnectDB();
        logger.info('Server shutdown complete');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await disconnectDB();
        logger.info('Server shutdown complete');
        process.exit(0);
      });
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled rejection:', err);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      process.exit(1);
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
