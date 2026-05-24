import { query } from '../../config/db.js';

/**
 * Post model — raw SQL queries for the posts table.
 */
const Post = {
  /**
   * Find all published posts with pagination, search, and optional user filter.
   */
  async findAll({ page = 1, limit = 9, search = '', userId = null, status = 'published', includeAuthor = true } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    // Status filter
    if (status === 'all' && userId) {
      // Show all statuses only if filtering by own user
      conditions.push(`(p.status = 'published' OR (p.status = 'draft' AND p.user_id = $${params.length + 1}))`);
      params.push(userId);
    } else {
      conditions.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }

    // Search filter
    if (search) {
      conditions.push(`(p.title ILIKE $${params.length + 1} OR u.display_name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    // User filter
    if (userId && status !== 'all') {
      conditions.push(`p.user_id = $${params.length + 1}`);
      params.push(userId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT p.*, u.display_name AS author, u.email AS author_email
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Count posts matching filters (for pagination).
   */
  async count({ search = '', userId = null, status = 'published' } = {}) {
    const params = [];
    const conditions = [];

    if (status === 'all' && userId) {
      conditions.push(`(p.status = 'published' OR (p.status = 'draft' AND p.user_id = $${params.length + 1}))`);
      params.push(userId);
    } else {
      conditions.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(p.title ILIKE $${params.length + 1} OR u.display_name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (userId && status !== 'all') {
      conditions.push(`p.user_id = $${params.length + 1}`);
      params.push(userId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT COUNT(*) as total
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;

    const result = await query(sql, params);
    return parseInt(result.rows[0].total, 10);
  },

  /**
   * Find a single post by ID with author info.
   */
  async findById(id) {
    const sql = `
      SELECT p.*, u.display_name AS author, u.email AS author_email
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Create a new post.
   */
  async create({ userId, title, content, status = 'published' }) {
    const sql = `
      INSERT INTO posts (user_id, title, content, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await query(sql, [userId, title, content, status]);
    return result.rows[0];
  },

  /**
   * Update a post (partial update).
   */
  async update(id, fields) {
    const allowed = ['title', 'content', 'status'];
    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key) && value !== undefined) {
        params.push(value);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) return Post.findById(id);

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `
      UPDATE posts
      SET ${setClauses.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await query(sql, params);
    return result.rows[0] || null;
  },

  /**
   * Delete a post by ID.
   */
  async remove(id) {
    const sql = 'DELETE FROM posts WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  },

  /**
   * Find posts by user ID (for "My Posts" view).
   */
  async findByUserId(userId, { page = 1, limit = 9, status = 'all' } = {}) {
    const offset = (page - 1) * limit;
    const params = [userId, limit, offset];
    let statusFilter = '';

    if (status !== 'all') {
      statusFilter = 'AND status = $4';
      params.push(status);
    }

    const sql = `
      SELECT p.*, u.display_name AS author
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 ${statusFilter}
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Count posts by user ID.
   */
  async countByUserId(userId, status = 'all') {
    const params = [userId];
    let statusFilter = '';
    if (status !== 'all') {
      statusFilter = 'AND status = $2';
      params.push(status);
    }

    const sql = `SELECT COUNT(*) as total FROM posts WHERE user_id = $1 ${statusFilter}`;
    const result = await query(sql, params);
    return parseInt(result.rows[0].total, 10);
  },
};

export default Post;
