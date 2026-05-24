import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /auth/register
 * Create a new user account.
 */
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if email already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ errors: ['An account with that email already exists.'] });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ email, passwordHash, displayName });

    // Start session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      res.status(201).json({
        message: 'Account created successfully.',
        user: { id: user.id, email: user.email, displayName: user.display_name },
      });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * Authenticate with email and password.
 */
router.post('/login', loginLimiter, validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ errors: ['Invalid email or password.'] });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ errors: ['Invalid email or password.'] });
    }

    // Start session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      res.json({
        message: 'Logged in successfully.',
        user: { id: user.id, email: user.email, displayName: user.display_name },
      });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 * Destroy the current session.
 */
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

/**
 * GET /auth/me
 * Return the currently authenticated user.
 */
router.get('/me', async (req, res) => {
  if (!req.session?.userId) {
    return res.json({ user: null });
  }

  const user = await User.findById(req.session.userId);
  res.json({
    user: user
      ? { id: user.id, email: user.email, displayName: user.display_name }
      : null,
  });
});

export default router;
