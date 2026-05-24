import pg from 'pg';
import config from './index.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.db.connectionString,
});

// Log connection status
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

/**
 * Execute a SQL query against the pool.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

export default pool;
