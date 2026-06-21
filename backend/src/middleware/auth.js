/**
 * JWT Authentication Middleware — Production-Grade
 */
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

const JWT_SECRET = config.jwt.secret;

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization header format');
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      });
      req.user = decoded;
      next();
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired');
      }
      if (jwtErr.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token');
      }
      throw jwtErr;
    }
  } catch (err) {
    logger.warn('Authentication failed', { error: err.message, path: req.path });
    next(err);
  }
}

export function requireRoles(roles) {
  return (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new AuthorizationError(`Access denied. Requires one of: ${roles.join(', ')}`);
      }
      next();
    } catch (err) {
      logger.warn('Authorization failed', { userId: req.user?._id, role: req.user?.role, path: req.path });
      next(err);
    }
  };
}

// Preserve backward compatibility while supporting new enterprise roles
export const adminOnly = requireRoles(['admin', 'city_admin', 'state_admin', 'disaster_authority']);

export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      req.user = decoded;
    }
  } catch (err) {
    // Optional auth, so we don't error
  }
  next();
}

export function generateToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: config.jwt.expire,
      issuer: 'scc-dp-api',
      audience: 'scc-dp-client',
    }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwt.refreshExpire,
    }
  );
}
