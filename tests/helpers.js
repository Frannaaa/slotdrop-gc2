import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createApp } from '../server/app.js';
export async function fixture() {
  const database = new PGlite();
  await database.exec(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await database.exec(await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8'));
  const db = { query: (sql, values) => database.query(sql, values), transaction: run => database.transaction(tx => run(tx)) };
  const now = new Date((await database.query('SELECT NOW() AS time')).rows[0].time);
  const server = createApp({ db, clock: () => now }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  return { database, db, now, base,
    async close() { await new Promise(resolve => server.close(resolve)); await database.close(); }
  };
}
