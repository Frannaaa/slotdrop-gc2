// Group assignment: Fran. Covers the Render start sequence in render.yaml:
// tools/db-bootstrap.mjs, then server/index.js migrations and reference catalog.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { bootstrapDatabase } from '../tools/db-bootstrap.mjs';
import { migrateDatabase } from '../server/repositories/migrations.js';
import { ensureReferenceCatalog } from '../server/repositories/reference-catalog.js';
import { createApp } from '../server/app.js';

function pglite() {
  const database = new PGlite();
  const db = {
    query: (sql, values) => database.query(sql, values),
    transaction: run => database.transaction(tx => run({ query: (sql, values) => values ? tx.query(sql, values) : tx.exec(sql).then(results => results.at(-1)) })),
    close: () => database.close(),
  };
  return db;
}

async function startSequence(db) {
  const created = await bootstrapDatabase(db);
  await migrateDatabase(db);
  await ensureReferenceCatalog(db);
  return created;
}

async function counts(db) {
  const { rows: [row] } = await db.query(`SELECT
    (SELECT COUNT(*)::int FROM providers) AS providers,
    (SELECT COUNT(*)::int FROM services) AS services,
    (SELECT COUNT(*)::int FROM slots) AS slots,
    (SELECT COUNT(*)::int FROM bookings) AS bookings`);
  return row;
}

async function withServer(db, run) {
  const server = createApp({ db, checkDatabaseHealth: true }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run('http://127.0.0.1:' + server.address().port); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('a fresh deployment database is initialized once and restarts keep saved bookings', async () => {
  const db = pglite();
  try {
    assert.equal(await startSequence(db), true);
    const seeded = await counts(db);
    assert.ok(seeded.services >= 8, 'at least eight seeded offerings');
    assert.equal(seeded.bookings, 0);

    await withServer(db, async base => {
      const health = await fetch(base + '/api/health');
      assert.equal(health.status, 200);
      const [slot] = await (await fetch(base + '/api/slots')).json();
      assert.ok(slot, 'Browse has a bookable seeded session');
      const quote = await (await fetch(`${base}/api/pricing/quote?slotId=${slot.id}&quantity=1`)).json();
      const saved = await fetch(base + '/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: randomUUID(), slotId: slot.id, quantity: 1, customerName: 'Deploy Check',
          customerEmail: 'deploy.check@example.com', paymentMethod: 'mock_card', expectedTotalCentavos: quote.totalPriceCentavos }),
      });
      assert.equal(saved.status, 201);
    });

    const before = await counts(db);
    const { rows: [receipt] } = await db.query('SELECT id, total_price_centavos FROM bookings');
    for (let restart = 0; restart < 2; restart += 1) assert.equal(await startSequence(db), false);
    assert.deepEqual(await counts(db), before, 'restart neither reseeds nor deletes');
    const { rows: [after] } = await db.query('SELECT id, total_price_centavos FROM bookings');
    assert.deepEqual(after, receipt);
  } finally { await db.close(); }
});

test('bootstrap refuses a partial schema instead of reseeding over it', async () => {
  const db = pglite();
  try {
    await db.query('CREATE TABLE providers (id integer PRIMARY KEY)');
    await assert.rejects(bootstrapDatabase(db), /Partial SlotDrop schema/);
    const { rows } = await db.query("SELECT to_regclass('bookings') AS bookings");
    assert.equal(rows[0].bookings, null, 'the failed bootstrap rolled back');
  } finally { await db.close(); }
});

test('production health reports 503 until the database tables exist', async () => {
  const db = pglite();
  try {
    await withServer(db, async base => {
      const response = await fetch(base + '/api/health');
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { status: 'unavailable', app: 'SlotDrop' });
    });
  } finally { await db.close(); }
});
