// Group assignment: Fran. Additive upgrades only; never reseed a populated database.
import { readFile } from 'node:fs/promises';
export async function migrateDatabase(db) {
 for (const name of ['001_activity_attributes.sql','002_studio_references.sql','003_provider_applications.sql']) {
  const sql = await readFile(new URL('../../db/migrations/'+name, import.meta.url), 'utf8');
  await db.transaction(client => client.query(sql));
 }
}
