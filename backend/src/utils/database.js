/**
 * Database Connection — MongoDB with Retry Logic
 * Production-grade database connection handling
 */

import mongoose from 'mongoose';
import config from '../config/index.js';
import logger from './logger.js';

let isConnected = false;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      logger.info(`Connecting to MongoDB (attempt ${retries + 1}/${MAX_RETRIES})...`);

      await mongoose.connect(config.mongo.uri, {
        maxPoolSize: config.mongo.poolSize,
        serverSelectionTimeoutMS: config.mongo.timeout,
        socketTimeoutMS: config.mongo.timeout,
        family: 4,
        retryWrites: config.mongo.retryWrites,
        w: config.mongo.w,
      });

      isConnected = true;
      logger.info('✅ MongoDB connected successfully');
      return mongoose.connection;
    } catch (err) {
      retries++;
      logger.warn(`❌ MongoDB connection failed. Retrying in ${RETRY_DELAY / 1000}s...`, { error: err.message });

      if (retries >= MAX_RETRIES) {
        logger.error('❌ Failed to connect to MongoDB after maximum initial retries. Continuing in background...', { error: err.message });
        scheduleBackgroundReconnect();
        break;
      }

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  return mongoose.connection;
}

let reconnectTimer = null;
function scheduleBackgroundReconnect() {
  if (reconnectTimer || isConnected) return;

  reconnectTimer = setInterval(async () => {
    if (isConnected || mongoose.connection.readyState === 1) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
      return;
    }

    try {
      logger.info('🔄 Attempting background MongoDB reconnection...');
      await mongoose.connect(config.mongo.uri, {
        maxPoolSize: config.mongo.poolSize,
        serverSelectionTimeoutMS: config.mongo.timeout,
        socketTimeoutMS: config.mongo.timeout,
        family: 4,
        retryWrites: config.mongo.retryWrites,
        w: config.mongo.w,
      });

      isConnected = true;
      logger.info('✅ Background MongoDB reconnection successful!');
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    } catch (err) {
      logger.warn(`⏳ Background reconnection attempt failed: ${err.message}`);
    }
  }, 5000);
}

// Event listeners for auto-recovery
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('⚠️ MongoDB disconnected. Triggering background auto-reconnect...');
  scheduleBackgroundReconnect();
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error('⚠️ MongoDB connection error:', { error: err.message });
  scheduleBackgroundReconnect();
});

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
}

export function getDBStatus() {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[state] || 'unknown';
}
