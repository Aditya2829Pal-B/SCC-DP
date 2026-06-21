/**
 * Logger — Winston Structured Logging for Production
 * Supports file, console, and JSON formatting
 */

import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, context, traceId, ...meta }) => {
  let log = `[${timestamp}] [${level}]`;
  if (traceId) log += ` [${traceId}]`;
  if (context) log += ` [${context}]`;
  log += ` ${message}`;
  if (stack) log += `\n${stack}`;
  
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  if (metaStr) log += ` ${metaStr}`;
  return log;
});

const logger = winston.createLogger({
  level: config.logLevel || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    config.isDev ? combine(colorize(), logFormat) : json()
  ),
  defaultMeta: { service: 'scc-dp-api' },
  transports: [
    new winston.transports.Console()
  ],
});

// Polyfill custom methods used in legacy code
logger.http = function (req, res, ms) {
  const status = res.statusCode;
  const method = req.method;
  const path = req.path;
  const message = `${method} ${path} ${status}`;
  const meta = { duration: `${ms}ms`, userId: req.user?._id || 'anonymous', context: 'HTTP', traceId: req.traceId };

  if (status >= 500) {
    this.error(message, meta);
  } else if (status >= 400) {
    this.warn(message, meta);
  } else {
    this.info(message, meta);
  }
};

export default logger;
