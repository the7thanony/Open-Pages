import { query } from '../../config/db.js';

/**
 * User model — raw SQL queries for the users table.
 */
const User = {
  /**
   * Find a user by ID.
   */
  async findById(id) {
    const sql = 'SELECT id, email, display_name, created_at FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Find a user by email (includes password_hash for auth).
   */
  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email.toLowerCase()]);
    return result.rows[0] || null;
  },

  /**
   * Create a new user with email/password.
   */
  async create({ email, passwordHash, displayName }) {
    const sql = `
      INSERT INTO users (email, password_hash, display_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, display_name, created_at
    `;
    const result = await query(sql, [email.toLowerCase(), passwordHash, displayName]);
    return result.rows[0];
  },

  /**
   * Find a user by OAuth provider info.
   */
  async findByOAuth(provider, providerId) {
    const sql = `
      SELECT u.id, u.email, u.display_name, u.created_at
      FROM users u
      JOIN oauth_accounts oa ON u.id = oa.user_id
      WHERE oa.provider = $1 AND oa.provider_id = $2
    `;
    const result = await query(sql, [provider, providerId]);
    return result.rows[0] || null;
  },

  /**
   * Create a user from OAuth and link the account.
   */
  async createFromOAuth({ email, displayName, provider, providerId }) {
    // Check if user with this email already exists
    let user = await User.findByEmail(email);

    if (!user) {
      // Create new user (no password since OAuth)
      const createSql = `
        INSERT INTO users (email, display_name)
        VALUES ($1, $2)
        RETURNING id, email, display_name, created_at
      `;
      const result = await query(createSql, [email.toLowerCase(), displayName]);
      user = result.rows[0];
    }

    // Link OAuth account (ignore if already linked)
    const linkSql = `
      INSERT INTO oauth_accounts (user_id, provider, provider_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (provider, provider_id) DO NOTHING
    `;
    await query(linkSql, [user.id, provider, providerId]);

    return user;
  },
};

export default User;
