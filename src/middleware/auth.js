import jwt from 'jsonwebtoken';
import { repos } from '../repositories/repos.js';
import { ERROR_CODES, HTTP_STATUS, STAFF_ROLES, USER_STATUS } from '../config/constants.js';
import { omit } from '../utils/case.js';
import logger from '../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const publicUser = (user) => omit(user, ['passwordHash', 'password', 'hashedPassword']);

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided',
        code: ERROR_CODES.AUTHENTICATION_ERROR
      });
    }

    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const user = await repos.users.findById(decoded.userId);

    if (!user || user.status === USER_STATUS.DELETED) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not found',
        code: ERROR_CODES.AUTHENTICATION_ERROR
      });
    }

    const status = String(user.status || 'active').toLowerCase();
    if (['inactive', 'blocked', 'deleted', 'banned', 'suspended'].includes(status)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Account is not active',
        code: ERROR_CODES.AUTHORIZATION_ERROR
      });
    }

    req.user = publicUser(user);
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token verification failed',
      code: ERROR_CODES.AUTHENTICATION_ERROR
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    const user = await repos.users.findById(decoded.userId);
    req.user = user && user.status === USER_STATUS.ACTIVE ? publicUser(user) : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
      code: ERROR_CODES.AUTHENTICATION_ERROR
    });
  }

  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Insufficient permissions',
      code: ERROR_CODES.AUTHORIZATION_ERROR
    });
  }

  next();
};

export const authorizeStaff = authorize(...STAFF_ROLES);
export const authorizeAdmin = authorize('admin');
export const authorizeAppUser = authorize('user');
