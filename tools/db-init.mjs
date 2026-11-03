import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { postgresDatabase } from '../server/repositories/database.js';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to a new disposable PostgreSQL database.');
const db = postgresDatabase();
try {
  await db.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await db.query(await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8'));
  console.log('Fresh schema and sourced-reference demo seed loaded. Existing databases are never reset.');
} finally { await db.close(); }
