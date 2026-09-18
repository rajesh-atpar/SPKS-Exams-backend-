import logger from '../config/logger.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    cause: err.cause?.cause?.message || err.cause?.message,
    path: req.path,
    method: req.method,
    user: req.user?.id
  });

  if (res.headersSent) return;

  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(err.errors && { errors: err.errors }),
    ...(err.code && { code: err.code }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    code: ERROR_CODES.NOT_FOUND_ERROR
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
