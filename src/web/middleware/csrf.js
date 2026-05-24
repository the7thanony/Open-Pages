import crypto from 'crypto';

/**
 * CSRF Protection Middleware.
 * Generates a CSRF token per session and validates it on form submissions.
 */
export function csrfProtection(req, res, next) {
  // Generate token if not exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Make token available to templates
  res.locals.csrfToken = req.session.csrfToken;

  // Validate on state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).render('error', {
        title: 'Forbidden',
        statusCode: 403,
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      });
    }
  }

  next();
}
