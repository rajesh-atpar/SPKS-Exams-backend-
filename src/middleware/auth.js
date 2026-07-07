import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided',
        code: ERROR_CODES.AUTHENTICATION_ERROR
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user exists in Supabase
    const { data: user, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token',
        code: ERROR_CODES.AUTHENTICATION_ERROR
      });
    }

    // Get user role and additional data from database
    let userData = null;
    let userType = null;

    // Check if admin
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('*, roles(*)')
      .eq('email', user.user.email)
      .single();

    if (adminData) {
      userData = adminData;
      userType = 'admin';
    } else {
      // Check if student
      const { data: studentData } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('email', user.user.email)
        .single();

      if (studentData) {
        userData = studentData;
        userType = 'student';
      }
    }

    if (!userData) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not found',
        code: ERROR_CODES.AUTHENTICATION_ERROR
      });
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      userType: userType,
      ...userData
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token verification failed',
      code: ERROR_CODES.AUTHENTICATION_ERROR
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
        code: ERROR_CODES.AUTHENTICATION_ERROR
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.userType)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions',
        code: ERROR_CODES.AUTHORIZATION_ERROR
      });
    }

    next();
  };
};

export const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.userType !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Admin access required',
          code: ERROR_CODES.AUTHORIZATION_ERROR
        });
      }

      // Get admin's role permissions
      const { data: rolePermissions, error } = await supabaseAdmin
        .from('role_permissions')
        .select('permissions(*)')
        .eq('role_id', req.user.role_id);

      if (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Error checking permissions',
          code: ERROR_CODES.INTERNAL_ERROR
        });
      }

      const hasPermission = rolePermissions.some(
        rp => rp.permissions.name === permission
      );

      if (!hasPermission) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Permission denied',
          code: ERROR_CODES.AUTHORIZATION_ERROR
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error checking permissions',
        code: ERROR_CODES.INTERNAL_ERROR
      });
    }
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { data: user, error } = await supabaseAdmin.auth.getUser(token);
    
    if (!error && user.user) {
      let userData = null;
      let userType = null;

      const { data: adminData } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('email', user.user.email)
        .single();

      if (adminData) {
        userData = adminData;
        userType = 'admin';
      } else {
        const { data: studentData } = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('email', user.user.email)
          .single();

        if (studentData) {
          userData = studentData;
          userType = 'student';
        }
      }

      if (userData) {
        req.user = {
          id: userData.id,
          email: userData.email,
          userType: userType,
          ...userData
        };
      }
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};
