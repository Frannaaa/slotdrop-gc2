// Explicit local demo only; production uses DATABASE_URL through pg.
import 'dotenv/config';
import { PGlite } from '@electric-sql/pglite';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { bootstrapDatabase, upgradeDatabase } from '../server/repositories/migrations.js';
import { createApp } from '../server/app.js';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1-65535');
const directory = new URL('../.local-data/', import.meta.url);
await mkdir(directory, { recursive: true });
const database = new PGlite(fileURLToPath(directory));

const db = {
  query: (text, values) => database.query(text, values),
  transaction: run => database.transaction(tx => run({
    // PGlite needs exec() for the multi-statement schema and seed scripts.
    query: (text, values) => values === undefined
      ? tx.exec(text).then(results => results.at(-1))
      : tx.query(text, values),
  })),
};
try {
  await bootstrapDatabase(db);
  await upgradeDatabase(db);
} catch (error) {
  await database.close();
  throw error;
}
const server = createApp({ db }).listen(port, () => console.log('SlotDrop local course demo: http://localhost:' + port));
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => server.close(async () => { await database.close(); process.exit(0); }));
