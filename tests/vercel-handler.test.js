// Group assignment: Fran. Runs the Vercel root Express entrypoint and handler as Vercel would: a fresh database,
// first-request startup, a saved booking, and a later cold start on the same data.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { createHandler } from '../server/vercel-handler.js';
import vercelApp, { createVercelApp } from '../index.js';
import { readFile } from 'node:fs/promises';

test('Vercel configuration uses the documented Express entrypoint and Singapore region', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.framework, 'express');
  assert.deepEqual(config.regions, ['sin1']);
  assert.equal(config.rewrites, undefined, 'No custom rewrite may discard /api/... route paths');
  assert.equal(typeof vercelApp, 'function', 'A Node-compatible Express handler is exported at root');
  assert.equal(typeof vercelApp.use, 'function', 'Vercel gets a real Express app');
  assert.equal(config.functions['index.js'].maxDuration, 30);
});

function pglite() {
  const database = new PGlite();
  return {
    query: (sql, values) => database.query(sql, values),
    transaction: run => database.transaction(tx => run({ query: (sql, values) => values ? tx.query(sql, values) : tx.exec(sql).then(results => results.at(-1)) })),
    close: () => database.close(),
  };
}

async function withHandler(handler, run) {
  const server = createServer(handler).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run('http://127.0.0.1:' + server.address().port); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('the actual Vercel Express entry routes API, pages, assets and API errors', async () => {
  const db = pglite();
  try {
    await withHandler(createVercelApp(db), async base => {
      const health = await fetch(base + '/api/health');
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), {status:'ok', app:'SlotDrop'});

      const slots = await fetch(base + '/api/slots');
      assert.equal(slots.status, 200);
      const catalog = await slots.json();
      assert.ok(catalog.length >= 8, 'the actual entrypoint exposes seeded inventory');

      const home = await fetch(base + '/');
      assert.equal(home.status, 200);
      assert.match(await home.text(), /SlotDrop/i);

      const styles = await fetch(base + '/css/style.css');
      assert.equal(styles.status, 200);
      assert.match(styles.headers.get('content-type') ?? '', /text\/css/);

      const invalid = await fetch(base + '/api/bookings', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({}),
      });
      assert.equal(invalid.status, 400);
      assert.equal((await invalid.json()).error.code, 'INVALID_INPUT');

      const unknown = await fetch(base + '/api/does-not-exist');
      assert.equal(unknown.status, 404);
      assert.equal((await unknown.json()).error.code, 'ROUTE_NOT_IMPLEMENTED');
    });
  } finally { await db.close(); }
});

test('the Vercel handler prepares an empty database on first request and keeps bookings across cold starts', async () => {
  const db = pglite();
  try {
    let bookingId;
    await withHandler(createHandler(db), async base => {
      assert.equal((await fetch(base + '/api/health')).status, 200);
      const [slot] = await (await fetch(base + '/api/slots')).json();
      assert.ok(slot, 'seeded sessions are listed');
      const quote = await (await fetch(`${base}/api/pricing/quote?slotId=${slot.id}&quantity=1`)).json();
      const saved = await fetch(base + '/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: randomUUID(), slotId: slot.id, quantity: 1, customerName: 'Vercel Check',
          customerEmail: 'vercel.check@example.com', paymentMethod: 'mock_card', expectedTotalCentavos: quote.totalPriceCentavos }),
      });
      assert.equal(saved.status, 201);
      bookingId = (await saved.json()).id;
      // Pages are still served by the same app.
      assert.equal((await fetch(base + '/')).status, 200);
    });
    // A new instance runs startup again on the same database.
    await withHandler(createHandler(db), async base => {
      const receipt = await fetch(base + '/api/bookings/' + bookingId);
      assert.equal(receipt.status, 200);
      assert.equal((await (await fetch(base + '/api/metrics')).json()).bookingCount, 1);
    });
  } finally { await db.close(); }
});

test('the Vercel handler answers 503 when the database is unreachable, then recovers', async () => {
  const real = pglite();
  let failing = true;
  const flaky = {
    query: (...args) => failing ? Promise.reject(Object.assign(new Error('down'), { code: 'ECONNREFUSED' })) : real.query(...args),
    transaction: run => failing ? Promise.reject(Object.assign(new Error('down'), { code: 'ECONNREFUSED' })) : real.transaction(run),
  };
  try {
    await withHandler(createHandler(flaky), async base => {
      const down = await fetch(base + '/api/slots');
      assert.equal(down.status, 503);
      assert.equal((await down.json()).error.code, 'DATABASE_UNAVAILABLE');
      failing = false;
      assert.equal((await fetch(base + '/api/slots')).status, 200);
    });
  } finally { await real.close(); }
});
