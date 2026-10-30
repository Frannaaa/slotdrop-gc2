// Group assignment: Fran. Additive upgrades only; never reseed a populated database.
import { readFile } from 'node:fs/promises';
export async function migrateDatabase(db) {
 const sql = await readFile(new URL('../../db/migrations/001_activity_attributes.sql', import.meta.url), 'utf8');
 await db.transaction(client => client.query(sql));
}
