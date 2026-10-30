import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createApp } from '../server/app.js';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { postgresDatabase } from '../server/repositories/database.js';
export async function fixture({ clock } = {}) {
  let database, db, cleanup;
  if (process.env.TEST_DATABASE_URL) {
    const schema = 'test_' + randomUUID().replaceAll('-','');
    const admin = new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
    await admin.query('CREATE SCHEMA ' + schema);
    db = postgresDatabase(process.env.TEST_DATABASE_URL, {options:'-c search_path=' + schema});
    database = {query:(sql,values)=>db.query(sql,values),exec:sql=>db.query(sql)};
    cleanup = async () => { await db.close(); await admin.query('DROP SCHEMA ' + schema + ' CASCADE'); await admin.end(); };
  } else {
    database = new PGlite();
    db = { query: (sql, values) => database.query(sql, values), transaction: run => database.transaction(tx => run(tx)) };
    cleanup = () => database.close();
  }
  await database.exec(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await database.exec(await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8'));
  const now = new Date((await database.query('SELECT NOW() AS time')).rows[0].time);
  const server = createApp({ db, clock: clock || (() => now) }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  return { database, db, now, base,
    async close() { await new Promise(resolve => server.close(resolve)); await cleanup(); }
  };
}
