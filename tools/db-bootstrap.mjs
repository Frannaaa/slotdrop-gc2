// Initialize a dedicated deployment database exactly once, before starting the server.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { postgresDatabase } from '../server/repositories/database.js';

const tables = ['providers', 'services', 'slots', 'bookings', 'provider_applications'];

export async function bootstrapDatabase(db) {
  return db.transaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(47531008)');
    const { rows } = await client.query(
      'SELECT to_regclass(name) IS NOT NULL AS present FROM unnest($1::text[]) AS names(name)',
      [tables],
    );
    if (rows.every(({ present }) => present)) return false;
    if (rows.some(({ present }) => present)) {
      throw new Error('Partial SlotDrop schema. Inspect the database before deploying.');
    }
    for (const file of ['schema.sql', 'seed.sql']) {
      const sql = await readFile(new URL('../db/' + file, import.meta.url), 'utf8');
      await client.query(sql.replace(/^(BEGIN|COMMIT);\s*$/gm, ''));
    }
    return true;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
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
}
