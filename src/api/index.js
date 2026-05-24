/**
 * Open Pages — API Server
 * Provides JSON API endpoints for posts and authentication.
 * Runs on port 4000 (configurable via API_PORT env var).
 */
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import config from '../config/index.js';
import pool from '../config/db.js';
import postsRouter from './routes/posts.js';
import authRouter from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();
const PgSession = connectPgSimple(session);

// ── Middleware ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(apiLimiter);

// Sessions (shared with web server via same DB store)
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
    },
  })
);

// Passport (for OAuth)
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ─────────────────────────────────────────
app.use('/posts', postsRouter);
app.use('/auth', authRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handling ─────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────
const PORT = config.api.port;
app.listen(PORT, () => {
  console.log(`\n🚀 API server running at http://localhost:${PORT}`);
  console.log(`   Environment: ${config.env}\n`);
});

export default app;
