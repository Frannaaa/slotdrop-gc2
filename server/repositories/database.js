import pg from 'pg';
import { ApiError } from '../lib/validation.js';

// Lazily open the pool so the static site and health endpoint work without a DB.
export function postgresDatabase(connectionString = process.env.DATABASE_URL) {
  let pool;
  function getPool() {
    if (!connectionString) throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Configure DATABASE_URL or run npm run demo.');
    pool ??= new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000 });
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
