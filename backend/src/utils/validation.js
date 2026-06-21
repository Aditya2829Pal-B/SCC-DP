/**
 * Validation Utilities — Input Validation & Sanitization
 */

import { ValidationError } from './errors.js';

export const validators = {
  // Email validation
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError('Invalid email format');
    }
    return value.toLowerCase().trim();
  },

  // Password validation
  password: (value) => {
    if (value.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
      throw new ValidationError('Password must contain uppercase letter and number');
    }
    return value;
  },

  // Required string
  string: (value, min = 1, max = 1000) => {
    if (typeof value !== 'string') {
      throw new ValidationError('Must be a string');
    }
    if (value.trim().length < min) {
      throw new ValidationError(`Minimum length is ${min}`);
    }
    if (value.length > max) {
      throw new ValidationError(`Maximum length is ${max}`);
    }
    return value.trim();
  },

  // Required number
  number: (value, min = -Infinity, max = Infinity) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError('Must be a number');
    }
    if (num < min || num > max) {
      throw new ValidationError(`Must be between ${min} and ${max}`);
    }
    return num;
  },

  // Enum validation
  enum: (value, options) => {
    if (!options.includes(value)) {
      throw new ValidationError(`Must be one of: ${options.join(', ')}`);
    }
    return value;
  },

  // Array validation
  array: (value) => {
    if (!Array.isArray(value)) {
      throw new ValidationError('Must be an array');
    }
    return value;
  },

  // Object validation
  object: (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError('Must be an object');
    }
    return value;
  },

  // Coordinates validation (GeoJSON)
  coordinates: (coords) => {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new ValidationError('Coordinates must be [longitude, latitude]');
    }
    const [lng, lat] = coords;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new ValidationError('Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180');
    }
    return coords;
  },

  // URL validation
  url: (value) => {
    try {
      new URL(value);
      return value;
    } catch {
      throw new ValidationError('Invalid URL');
    }
  },

  // Sanitize HTML
  sanitizeHtml: (value) => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
};

// Validate request payload
export function validatePayload(payload, schema) {
  const errors = [];
  const validated = {};

  for (const [field, rules] of Object.entries(schema)) {
    try {
      if (rules.required && (payload[field] === undefined || payload[field] === null)) {
        throw new ValidationError(`${field} is required`);
      }

      if (payload[field] !== undefined && payload[field] !== null) {
        if (rules.type === 'email') {
          validated[field] = validators.email(payload[field]);
        } else if (rules.type === 'password') {
          validated[field] = validators.password(payload[field]);
        } else if (rules.type === 'string') {
          validated[field] = validators.string(payload[field], rules.min, rules.max);
        } else if (rules.type === 'number') {
          validated[field] = validators.number(payload[field], rules.min, rules.max);
        } else if (rules.type === 'enum') {
          validated[field] = validators.enum(payload[field], rules.options);
        } else if (rules.type === 'array') {
          validated[field] = validators.array(payload[field]);
        } else if (rules.type === 'coordinates') {
          validated[field] = validators.coordinates(payload[field]);
        } else {
          validated[field] = payload[field];
        }

        if (rules.sanitize) {
          validated[field] = validators.sanitizeHtml(validated[field]);
        }
      }
    } catch (err) {
      errors.push({ field, message: err.message });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return validated;
}
