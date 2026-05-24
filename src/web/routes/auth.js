import { Router } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import User from '../../api/models/user.js';

const router = Router();

/**
 * GET /login
 * Login page.
 */
router.get('/login', (req, res) => {
  if (res.locals.currentUser) return res.redirect('/');
  res.render('login', { title: 'Log In — Open Pages' });
});

/**
 * POST /login
 * Handle login form submission.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/login');
    }

    const user = await User.findByEmail(email);
    if (!user || !user.password_hash) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      req.flash('success', `Welcome back, ${user.display_name}!`);
      res.redirect(req.session.returnTo || '/');
      delete req.session.returnTo;
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /register
 * Registration page.
 */
router.get('/register', (req, res) => {
  if (res.locals.currentUser) return res.redirect('/');
  res.render('register', { title: 'Sign Up — Open Pages' });
});

/**
 * POST /register
 * Handle registration form submission.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate
    const errors = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please provide a valid email.');
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters.');
    if (!displayName || displayName.trim().length < 2) errors.push('Display name must be at least 2 characters.');

    if (errors.length) {
      req.flash('error', errors.join(' '));
      return res.redirect('/register');
    }

    // Check if email exists
    const existing = await User.findByEmail(email);
    if (existing) {
      req.flash('error', 'An account with that email already exists.');
      return res.redirect('/register');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, displayName: displayName.trim() });

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      req.flash('success', `Welcome to Open Pages, ${user.display_name}!`);
      res.redirect('/');
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /logout
 * Destroy session and redirect.
 */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

/**
 * GET /auth/google
 * Initiate Google OAuth.
 */
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback.
 */
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: 'Google login failed.' }),
  (req, res) => {
    req.session.userId = req.user.id;
    req.session.save(() => {
      req.flash('success', `Welcome, ${req.user.display_name}!`);
      res.redirect('/');
    });
  }
);

export default router;
