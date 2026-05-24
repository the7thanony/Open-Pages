-- ============================================
-- Open Pages — Initial Migration
-- Creates: users, posts, oauth_accounts, sessions
-- ============================================

-- Track applied migrations
CREATE TABLE IF NOT EXISTS _migrations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) UNIQUE NOT NULL,
  applied_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name  VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  content     TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- OAuth accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (provider, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id);

-- Sessions table (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
  sid     VARCHAR NOT NULL PRIMARY KEY,
  sess    JSON NOT NULL,
  expire  TIMESTAMPTZ(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
