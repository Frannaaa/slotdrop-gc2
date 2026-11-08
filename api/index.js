// Group assignment: Fran. Vercel entry point for the backup deployment.
// Vercel runs this as a serverless function instead of `npm start`, so the startup work in
// server/index.js (bootstrap, migrations, reference catalog) runs once per instance before
// the first request instead. All three steps are safe to repeat and never reseed data.
import { createApp } from '../server/app.js';
import { postgresDatabase } from '../server/repositories/database.js';
import { migrateDatabase } from '../server/repositories/migrations.js';
import { ensureReferenceCatalog } from '../server/repositories/reference-catalog.js';
import { errorCode } from '../server/lib/lifecycle.js';
import { bootstrapDatabase } from '../tools/db-bootstrap.mjs';

export function createHandler(db) {
  const app = createApp({ db });
  let ready;
  function prepare() {
    ready ??= (async () => {
      await bootstrapDatabase(db);
      await migrateDatabase(db);
      await ensureReferenceCatalog(db);
    })().catch(error => {
      ready = undefined; // Let the next request try again.
      throw error;
    });
    return ready;
  }
  return async function handler(req, res) {
    try {
      await prepare();
    } catch (error) {
      console.error('Database startup failed:', errorCode(error));
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'DATABASE_UNAVAILABLE', message: 'The database is temporarily unavailable. Please try again.' } }));
      return;
    }
    return app(req, res);
  };
}

// One connection per function instance; use the database's pooled connection string.
export default createHandler(postgresDatabase(process.env.DATABASE_URL, { max: 1 }));
