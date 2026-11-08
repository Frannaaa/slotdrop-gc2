// Group assignment: Fran (M1). Native Express entry point for Vercel.
// Vercel detects this root file as one Express Function and serves public/ from CDN.
// The middleware below preserves original /api/... paths and reuses the same
// booking, pricing, owner and PostgreSQL code as the Render deployment.
import express from 'express';
import { createHandler } from './server/vercel-handler.js';
import { postgresDatabase } from './server/repositories/database.js';

const app = express();
app.use(createHandler(postgresDatabase(process.env.DATABASE_URL, { max: 1 })));

export default app;
