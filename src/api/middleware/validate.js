import { sanitize } from '../../shared/utils.js';

/**
 * Validate and sanitize post creation/update data.
 */
export function validatePost(req, res, next) {
  const errors = [];

  if (req.body.title !== undefined) {
    const title = req.body.title.trim();
    if (title.length < 3) errors.push('Title must be at least 3 characters.');
    if (title.length > 300) errors.push('Title must be 300 characters or fewer.');
    req.body.title = title;
  }

  if (req.body.content !== undefined) {
    const content = req.body.content.trim();
    if (content.length < 10) errors.push('Content must be at least 10 characters.');
    // Sanitize content to prevent XSS
    req.body.content = sanitize(content);
  }

  if (req.body.status !== undefined) {
    if (!['draft', 'published'].includes(req.body.status)) {
      errors.push('Status must be either "draft" or "published".');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}

/**
 * Validate registration data.
 */
export function validateRegister(req, res, next) {
  const errors = [];
  const { email, password, displayName } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (!displayName || displayName.trim().length < 2) {
    errors.push('Display name must be at least 2 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}

/**
 * Validate login data.
 */
export function validateLogin(req, res, next) {
  const errors = [];
  const { email, password } = req.body;

  if (!email) errors.push('Email is required.');
  if (!password) errors.push('Password is required.');

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}
