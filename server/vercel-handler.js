// Group assignment: Fran. Shared serverless first-request readiness handler.
// The Vercel root Express entry point imports this helper. Startup checks run once
// per warm instance, and a failed startup can be safely retried on another request.
import { createApp } from './app.js';
import { migrateDatabase } from './repositories/migrations.js';
import { ensureReferenceCatalog } from './repositories/reference-catalog.js';
import { errorCode } from './lib/lifecycle.js';
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

