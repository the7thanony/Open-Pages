import User from '../../api/models/user.js';
import { readingTime, formatDate, timeAgo, truncate, getInitials } from '../../shared/utils.js';

/**
 * Inject template locals available to all EJS views.
 * - currentUser: the logged-in user object (or null)
 * - flash messages from connect-flash
 * - utility functions for templates
 */
export async function injectLocals(req, res, next) {
  // Current user
  if (req.session?.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.currentUser = user || null;
    } catch {
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }

  // Flash messages
  res.locals.success = req.flash ? req.flash('success') : [];
  res.locals.error = req.flash ? req.flash('error') : [];
  res.locals.info = req.flash ? req.flash('info') : [];

  // Utility functions for templates
  res.locals.readingTime = readingTime;
  res.locals.formatDate = formatDate;
  res.locals.timeAgo = timeAgo;
  res.locals.truncate = truncate;
  res.locals.getInitials = getInitials;

  // Current path for active nav highlighting
  res.locals.currentPath = req.path;

  next();
}
