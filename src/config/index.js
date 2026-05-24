import 'dotenv/config';

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  api: {
    port: parseInt(process.env.API_PORT, 10) || 4000,
  },
  web: {
    port: parseInt(process.env.WEB_PORT, 10) || 3000,
  },
  db: {
    connectionString: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  },
});

// Validate required vars in production
if (config.env === 'production') {
  const required = ['DATABASE_URL', 'SESSION_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default config;
