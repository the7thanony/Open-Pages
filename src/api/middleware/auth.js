/**
 * Authentication middleware for the API.
 */

/**
 * Require the user to be authenticated.
 * Returns 401 if not logged in.
 */
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

/**
 * Require the user to own the specified resource.
 * Must be used after requireAuth and after the resource is loaded.
 * Expects `req.resource` to have a `user_id` property.
 */
export function requireOwner(req, res, next) {
  if (!req.resource) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  if (req.resource.user_id !== req.session.userId) {
    return res.status(403).json({ error: 'You do not have permission to modify this resource.' });
  }
  next();
}

/**
 * Attach user info to the request from session.
 * Non-blocking — does not reject unauthenticated requests.
 */
export function attachUser(req, _res, next) {
  req.userId = req.session?.userId || null;
  req.isAuthenticated = !!req.userId;
  next();
}
