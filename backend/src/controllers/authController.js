/**
 * Auth Controller — User Authentication & Management
 * Production-grade authentication controller
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { getDBStatus } from '../utils/database.js';
import { validatePayload } from '../utils/validation.js';
import ApiResponse from '../utils/apiResponse.js';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  DatabaseError,
} from '../utils/errors.js';

const authSchema = {
  signup: {
    name: { type: 'string', required: true, min: 2, max: 100 },
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    city: { type: 'string', required: false, min: 2, max: 100 },
  },
  login: {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true },
  },
};

const mockUsers = [
  {
    _id: 'mock_admin_1',
    name: 'Aditya Admin',
    email: 'aditya@demo.com',
    password: 'demo123',
    role: 'admin',
    location: { city: 'New Delhi', coordinates: [77.2090, 28.6139] },
    sensitivity: 1.0,
  },
  {
    _id: 'mock_user_1',
    name: 'Priya User',
    email: 'priya@demo.com',
    password: 'demo123',
    role: 'user',
    location: { city: 'New Delhi', coordinates: [77.2090, 28.6139] },
    sensitivity: 1.0,
  },
];

function isMockMode() {
  return getDBStatus() !== 'connected';
}

export const authController = {
  // Signup
  async signup(req, res, next) {
    try {
      const payload = validatePayload(req.body, authSchema.signup);
      const { name, email, password, city } = payload;

      if (isMockMode()) {
        const exists = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          throw new ConflictError('Email already registered');
        }

        const user = {
          _id: `mock_${Date.now()}`,
          name,
          email,
          password,
          role: 'user',
          location: {
            city: city || 'New Delhi',
            coordinates: [77.2090, 28.6139],
          },
          sensitivity: 1.0,
        };
        mockUsers.push(user);

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        return ApiResponse.created(res, {
          token,
          refreshToken,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            location: user.location,
          },
        }, 'User registered successfully (Mock Mode)');
      }

      // Check if user exists
      const existing = await User.findOne({ email });
      if (existing) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        location: {
          city: city || 'New Delhi',
          coordinates: [77.2090, 28.6139],
        },
      });

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info('User registered successfully', { userId: user._id, email });

      return ApiResponse.created(res, {
        token,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
        },
      }, 'User registered successfully');
    } catch (err) {
      next(err);
    }
  },

  // Login
  async login(req, res, next) {
    try {
      const payload = validatePayload(req.body, authSchema.login);
      const { email, password } = payload;

      if (isMockMode()) {
        let user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          const guessedName = email.split('@')[0].replace(/[._-]/g, ' ');
          user = {
            _id: `mock_${Date.now()}`,
            name: guessedName.charAt(0).toUpperCase() + guessedName.slice(1),
            email,
            password,
            role: email.toLowerCase().includes('admin') || email.toLowerCase().includes('aditya') ? 'admin' : 'user',
            location: { city: 'New Delhi', coordinates: [77.2090, 28.6139] },
            sensitivity: 1.0,
          };
          mockUsers.push(user);
        }

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        return ApiResponse.success(res, {
          token,
          refreshToken,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            location: user.location,
          },
        }, 'Logged in successfully (Mock Mode)');
      }

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info('User logged in successfully', { userId: user._id, email });

      return ApiResponse.success(res, {
        token,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
        },
      }, 'Logged in successfully');
    } catch (err) {
      next(err);
    }
  },

  // Get profile
  async getProfile(req, res, next) {
    try {
      if (isMockMode()) {
        const user = mockUsers.find((u) => u._id === req.user._id || u.email === req.user.email) || req.user;
        return ApiResponse.success(res, { user }, 'Profile retrieved successfully (Mock Mode)');
      }

      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        throw new NotFoundError('User');
      }

      return ApiResponse.success(res, { user }, 'Profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { name, city, sensitivity } = req.body;
      const updates = {};

      if (isMockMode()) {
        const user = mockUsers.find((u) => u._id === req.user._id || u.email === req.user.email);
        if (!user) {
          throw new NotFoundError('User');
        }

        if (name) user.name = name;
        if (typeof sensitivity === 'number') user.sensitivity = sensitivity;
        if (city) user.location.city = city;

        return ApiResponse.success(res, { user }, 'Profile updated successfully (Mock Mode)');
      }

      if (name) updates.name = name;
      if (sensitivity) updates.sensitivity = sensitivity;
      if (city) updates['location.city'] = city;

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');

      logger.info('User profile updated', { userId: req.user._id });

      return ApiResponse.success(res, { user }, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  },

  // Refresh token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ValidationError('Refresh token required');
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      if (isMockMode()) {
        const mockUser = mockUsers.find((u) => u._id === decoded._id) || {
          _id: decoded._id,
          email: decoded.email,
          role: decoded.role || 'user',
          name: decoded.email?.split('@')[0] || 'User',
        };

        const newToken = generateToken(mockUser);
        const newRefreshToken = generateRefreshToken(mockUser);
        return ApiResponse.success(res, { token: newToken, refreshToken: newRefreshToken }, 'Token refreshed successfully (Mock Mode)');
      }

      const user = await User.findById(decoded._id);
      if (!user) {
        throw new NotFoundError('User');
      }

      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return ApiResponse.success(res, { token: newToken, refreshToken: newRefreshToken }, 'Token refreshed successfully');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        err = new AuthenticationError('Refresh token expired');
      }
      next(err);
    }
  },
};

export default authController;
