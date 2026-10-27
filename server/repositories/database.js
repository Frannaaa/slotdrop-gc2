import pg from 'pg';
import { ApiError } from '../lib/validation.js';

// Lazily open the pool so the static site and health endpoint work without a DB.
export function postgresDatabase(connectionString = process.env.DATABASE_URL, options = {}) {
  let pool;
  function getPool() {
    if (!connectionString) throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Configure DATABASE_URL or run npm run demo.');
    if (!pool) {
      pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000, query_timeout: 10000, ...options });
      pool.on('error', error => console.error('Idle database connection failed:', error.code || 'UNKNOWN'));
    }
    return pool;
  }
  return {
    query: (text, values) => getPool().query(text, values),
    async transaction(run) {
      const client = await getPool().connect();
      try { await client.query('BEGIN'); const result = await run(client); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    close: () => pool?.end()
  };
}
