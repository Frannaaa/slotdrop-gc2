import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:net';
import express from 'express';
import { postgresDatabase } from '../server/repositories/database.js';
import { errorHandler } from '../server/middleware/errors.js';

test('an unavailable PostgreSQL connection returns safe 503 JSON for reads and transactions', async () => {
  const reservation = createServer();
  reservation.listen(0,'127.0.0.1');
  await new Promise(resolve => reservation.once('listening',resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  // Only contact a closed local port; no hosted database or credentials are used.
  const db = postgresDatabase(`postgresql://demo:demo@127.0.0.1:${port}/unavailable`,{connectionTimeoutMillis:250});
  const app = express();
  app.get('/read',async (_req,res) => res.json(await db.query('SELECT 1')));
  app.get('/write',async (_req,res) => res.json(await db.transaction(client=>client.query('SELECT 1'))));
  app.use(errorHandler);
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  try {
    for(const path of ['/read','/write']) {
      const response = await fetch(base+path);
      assert.equal(response.status,503);
      assert.deepEqual(await response.json(),{error:{code:'DATABASE_UNAVAILABLE',message:'The database is temporarily unavailable. Please try again.'}});
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await db.close();
  }
});
