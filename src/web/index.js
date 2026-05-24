/**
 * Open Pages — Web Server
 * Renders EJS pages and proxies to the API server.
 * Runs on port 3000 (configurable via WEB_PORT env var).
 */
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import pool from '../config/db.js';
import User from '../api/models/user.js';
import { injectLocals } from './middleware/locals.js';
import { csrfProtection } from './middleware/csrf.js';
import pagesRouter from './routes/pages.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const app = express();
const PgSession = connectPgSimple(session);

// ── View Engine ────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'views'));

// ── Static Files ───────────────────────────────────
app.use(express.static(path.join(projectRoot, 'public')));

// ── Body Parsing ───────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sessions ───────────────────────────────────────
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
    },
  })
);

// ── Flash Messages ─────────────────────────────────
app.use(flash());

// ── Passport Setup ─────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
if (config.google.clientID && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || email?.split('@')[0] || 'User';

          const user = await User.createFromOAuth({
            email,
            displayName,
            provider: 'google',
            providerId: profile.id,
          });

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy configured');
} else {
  console.warn('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)');
}

app.use(passport.initialize());
app.use(passport.session());

// ── Template Locals (user, flash, utils) ───────────
app.use(injectLocals);

// ── CSRF Protection ───────────────────────────────
app.use(csrfProtection);

// ── Routes ─────────────────────────────────────────
app.use('/', pagesRouter);
app.use('/', authRouter);

// ── Error Pages ────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found — Open Pages',
    statusCode: 404,
    message: 'The page you\'re looking for doesn\'t exist.',
  });
});

app.use((err, req, res, _next) => {
  console.error('❌ Web error:', err);
  res.status(500).render('error', {
    title: 'Error — Open Pages',
    statusCode: 500,
    message: config.env === 'production'
      ? 'Something went wrong. Please try again later.'
      : err.message,
  });
});

// ── Start Server ───────────────────────────────────
const PORT = config.web.port;
app.listen(PORT, () => {
  console.log(`\n🌐 Web server running at http://localhost:${PORT}`);
  console.log(`   Environment: ${config.env}\n`);
});

export default app;
