// Initialize a dedicated deployment database exactly once, before starting the server.
import 'dotenv/config';
import { postgresDatabase } from '../server/repositories/database.js';
import { bootstrapDatabase } from '../server/repositories/migrations.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const db = postgresDatabase();
try {
  const created = await bootstrapDatabase(db);
  console.log(created ? 'Initialized SlotDrop demo database.' : 'SlotDrop database already initialized.');
} catch (error) {
  console.error('SlotDrop database bootstrap failed:', error.code || error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
