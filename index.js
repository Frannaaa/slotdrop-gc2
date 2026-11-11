// Group assignment: Fran (M1). Native Express entry point for Vercel.
// Vercel detects this root file as one Express Function and serves public/ from CDN.
// Preserve original /api/... paths and reuse the booking, pricing, Owner and
// PostgreSQL routes from the Render deployment.
import express from 'express';
import { createHandler } from './server/vercel-handler.js';
import { postgresDatabase } from './server/repositories/database.js';

// The factory allows an end-to-end test of the exact Express entrypoint
// with disposable PostgreSQL instead of touching the production Neon database.
export function createVercelApp(db = postgresDatabase(process.env.DATABASE_URL, { max: 1 })) {
  const app = express();
  app.use(createHandler(db));
  return app;
}

export default createVercelApp();
