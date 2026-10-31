// Explicit local demo only; production uses DATABASE_URL through pg.
import 'dotenv/config';
import { PGlite } from '@electric-sql/pglite';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/app.js';
const directory = new URL('../.local-data/', import.meta.url);
await mkdir(directory, { recursive: true });
const database = new PGlite(fileURLToPath(directory));
if (!(await database.query("SELECT to_regclass('public.providers') AS existing")).rows[0].existing) {
  await database.exec(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await database.exec(await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8'));
}
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1-65535');
const db = { query: (text, values) => database.query(text, values), transaction: run => database.transaction(tx => run(tx)) };
const server = createApp({ db }).listen(port, () => console.log('SlotDrop local fictional demo: http://localhost:' + port));
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => server.close(async () => { await database.close(); process.exit(0); }));
