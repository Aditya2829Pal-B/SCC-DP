/**
 * Additive Joi Validation Middleware
 * Added in Phase 1 Enterprise Hardening
 * Preserves backwards compatibility with legacy validatePayload schemas.
 */

import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
        
        logger.warn('Joi validation failed', { path: req.path, errors });
        throw new ValidationError('Validation failed', errors);
      }

      // Replace req[source] with sanitized validated value
      req[source] = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validateRequest;
