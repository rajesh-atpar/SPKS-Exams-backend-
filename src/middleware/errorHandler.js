/**
 * Central error handler middleware.
 * Catches errors from controllers and returns consistent JSON format.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(code && { code }),
  });
};

/**
 * 404 Not Found handler for unknown routes.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    data: null,
  });
};
