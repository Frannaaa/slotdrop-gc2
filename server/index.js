import 'dotenv/config';
import { createApp } from './app.js';
import { postgresDatabase } from './repositories/database.js';
import { closeDatabase, validateProductionDatabase } from './lib/lifecycle.js';
validateProductionDatabase();
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1-65535');
const db = postgresDatabase();
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

