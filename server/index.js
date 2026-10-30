// Group assignment: Fran. See docs/ownership-and-execution.md.
import 'dotenv/config';
import { createApp } from './app.js';
import { ensureReferenceCatalog } from './repositories/reference-catalog.js';
import { migrateDatabase } from './repositories/migrations.js';
import { postgresDatabase } from './repositories/database.js';
import { closeDatabase, errorCode, validateProductionDatabase } from './lib/lifecycle.js';
validateProductionDatabase();
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1-65535');
const db = postgresDatabase();
if (process.env.DATABASE_URL) {
  try { await migrateDatabase(db); await ensureReferenceCatalog(db); }
  catch (error) { console.error('Database upgrade failed:', errorCode(error), 'Check database availability and schema; no reseed was attempted.'); await closeDatabase(db); process.exit(1); }
}
const server = createApp({ db }).listen(port, () => console.log('SlotDrop: http://localhost:' + port));
let stopping = false;
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => { server.closeAllConnections(); }, 10000);
  timeout.unref();
  server.close(async () => {
    clearTimeout(timeout);
    if (!(await closeDatabase(db))) process.exitCode = 1;
  });
});

