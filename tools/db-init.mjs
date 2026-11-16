import 'dotenv/config';
import { postgresDatabase } from '../server/repositories/database.js';
import { bootstrapDatabase } from '../server/repositories/migrations.js';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to a new disposable PostgreSQL database.');
const db = postgresDatabase();
try {
  if (!(await bootstrapDatabase(db))) {
    throw new Error('db:init requires a new course database.');
  }
  console.log('Fresh schema and sourced-reference demo seed loaded. Existing databases are never reset.');
} finally { await db.close(); }
