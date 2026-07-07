import logger from '../config/logger.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';

/**
 * Central error handler middleware.
 * Catches errors from controllers and returns consistent JSON format.
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user?.id
  });

  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';
  const code = err.code || ERROR_CODES.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(code && { code }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler for unknown routes.
 */
export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    data: null,
    code: ERROR_CODES.NOT_FOUND_ERROR
  });
};

/**
 * Async handler wrapper to catch errors in async functions
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
