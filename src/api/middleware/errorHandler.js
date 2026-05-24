import config from '../../config/index.js';

/**
 * Centralized error handler middleware.
 * Catches all errors and returns a structured JSON response.
 */
export function errorHandler(err, req, res, _next) {
  // Log error in development
  if (config.env === 'development') {
    console.error('❌ Error:', err);
  }

  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body.',
    });
  }

  if (err.code === '23505') {
    // PostgreSQL unique violation
    return res.status(409).json({
      error: 'A record with that information already exists.',
    });
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Referenced resource does not exist.',
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message =
    config.env === 'production' && statusCode === 500
      ? 'An internal server error occurred.'
      : err.message || 'Something went wrong.';

  res.status(statusCode).json({
    error: message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
}

/**
 * Handle 404 — route not found.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}
