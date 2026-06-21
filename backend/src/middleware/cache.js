import { createClient } from 'redis';
import logger from '../utils/logger.js';
import config from '../config/index.js';

let redisClient;
let isConnected = false;

if (config.redis && config.redis.url) {
  redisClient = createClient({ url: config.redis.url });
  
  redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err.message }));
  redisClient.on('ready', () => {
    isConnected = true;
    logger.info('Redis cache layer connected');
  });
  
  redisClient.connect().catch(err => {
    logger.warn('Redis failed to connect initially, caching will gracefully fallback to DB', { error: err.message });
  });
}

/**
 * Enterprise Redis Caching Middleware
 * Used to cache heavy aggregate queries (e.g., Analytics, Dashboards)
 */
export const cacheRoute = (durationSeconds = 300) => {
  return async (req, res, next) => {
    if (!isConnected || !redisClient || req.method !== 'GET') {
      return next(); // Fallback to live DB if Redis is down or not a GET request
    }

    const key = `sccdp:cache:${req.originalUrl || req.url}`;
    
    try {
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      } else {
        // Intercept res.json to cache the output before sending
        const originalSend = res.json;
        res.json = function(body) {
          try {
            redisClient.setEx(key, durationSeconds, JSON.stringify(body));
          } catch (e) {
            logger.error('Failed to write to Redis cache', { error: e.message });
          }
          originalSend.call(this, body);
        };
        next();
      }
    } catch (err) {
      logger.error('Redis get error', { error: err.message });
      next(); // Fail gracefully
    }
  };
};

export default cacheRoute;
