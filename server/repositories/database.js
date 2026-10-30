import pg from 'pg';
import { ApiError } from '../lib/validation.js';

const connectionCodes = new Set(['ECONNREFUSED','ECONNRESET','EPIPE','ETIMEDOUT','ENOTFOUND','EAI_AGAIN','57P01','57P02','57P03','53300']);
const connectionMessages = new Set(['timeout exceeded when trying to connect','Connection terminated due to connection timeout','Connection terminated unexpectedly','Connection terminated']);
function databaseError(error) {
  if (connectionCodes.has(error.code) || /^08[0-9A-Z]{3}$/.test(error.code || '') || connectionMessages.has(error.message)) {
    return new ApiError(503, 'DATABASE_UNAVAILABLE', 'The database is temporarily unavailable. Please try again.');
  }
  return error;
}

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
    async query(text, values) {
      try { return await getPool().query(text, values); }
      catch (error) { throw databaseError(error); }
    },
    async transaction(run) {
      let client, releaseError;
      try { client = await getPool().connect(); }
      catch (error) { throw databaseError(error); }
      try { await client.query('BEGIN'); const result = await run(client); await client.query('COMMIT'); return result; }
      catch (error) {
        try { await client.query('ROLLBACK'); }
        catch (rollbackError) { releaseError = rollbackError; }
        throw databaseError(error);
      }
      finally { client.release(releaseError); }
    },
    close: () => pool?.end()
  };
}
