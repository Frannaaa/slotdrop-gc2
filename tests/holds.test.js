import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';
import { migrateDatabase } from '../server/repositories/migrations.js';

async function setup(t) {
  let now;
  const f = await fixture({ clock: () => now });
  now = f.now;
  t.after(() => f.close());
  return { ...f, advance: ms => { now = new Date(now.getTime() + ms); } };
}

async function send(f, path, body, method = 'POST') {
  const r = await fetch(f.base + path, {
    method, headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, body: await r.json() };
}
const hold = (quantity = 2, slotId = 1) => ({ requestId: randomUUID(), slotId, quantity });
const booking = () => ({ requestId: randomUUID(), slotId: 1, quantity: 1, customerName: 'Hold test',
  customerEmail: 'hold-test@example.com', paymentMethod: 'mock_card', expectedTotalCentavos: 160000 });

test('holding seats updates discovery, Detail, quotes and Owner without creating revenue', async t => {
  const f = await setup(t);
  const result = await send(f, '/api/holds', hold());
  assert.equal(result.status, 201);
  assert.equal(result.body.status, 'active');
  assert.equal(result.body.remainingSeats, 2);
  assert.equal(Date.parse(result.body.expiresAt) - Date.parse(result.body.serverNow), 600000);
  const detail = await (await fetch(f.base + '/api/slots/1')).json();
  assert.equal(detail.remainingSeats, 2);
  assert.equal(detail.heldSeats, 2);
  assert.equal(detail.confirmedSeats, 0);
  const browse = await (await fetch(f.base + '/api/slots?people=3')).json();
  assert.equal(browse.some(s => s.id === 1), false);
  const owner = await (await fetch(f.base + '/api/owner/catalog')).json();
  assert.equal(owner.slots.find(s => s.id === 1).remainingSeats, 2);
  assert.equal((await fetch(f.base + '/api/pricing/quote?slotId=1&quantity=3')).status, 409);
  assert.equal((await send(f, '/api/holds', hold(3))).status, 409);
  const metrics = await (await fetch(f.base + '/api/metrics')).json();
  assert.equal(metrics.bookingCount, 0);
  assert.equal(metrics.platformRevenueCentavos, 0);
});

test('expiry releases seats on the server and an identical retry never extends the hold', async t => {
  const f = await setup(t), request = hold();
  const first = await send(f, '/api/holds', request);
  f.advance(600000);
  const read = await (await fetch(f.base + '/api/holds/' + first.body.id)).json();
  assert.equal(read.status, 'expired');
  assert.equal(read.remainingSeats, 4);
  const retry = await send(f, '/api/holds', request);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.id, first.body.id);
  assert.equal(retry.body.status, 'expired');
  assert.equal(retry.body.expiresAt, first.body.expiresAt);
  assert.equal((await send(f, '/api/holds', hold())).status, 201);
});

test('release is idempotent, and replaying a released request does not reserve again', async t => {
  const f = await setup(t), request = hold();
  const first = await send(f, '/api/holds', request);
  for (let attempt = 0; attempt < 2; attempt++) {
    const released = await send(f, '/api/holds/' + first.body.id, undefined, 'DELETE');
    assert.equal(released.status, 200);
    assert.equal(released.body.status, 'released');
    assert.equal(released.body.remainingSeats, 4);
  }
  assert.equal((await send(f, '/api/holds', request)).body.status, 'released');
});

test('the session cutoff can shorten a hold below ten minutes', async t => {
  const f = await setup(t), cutoff = new Date(f.now.getTime() + 90000);
  await f.db.query('UPDATE slots SET booking_closes_at=$1 WHERE id=1', [cutoff]);
  const first = await send(f, '/api/holds', hold());
  assert.equal(first.body.expiresAt, cutoff.toISOString());
  f.advance(90000);
  const read = await (await fetch(f.base + '/api/holds/' + first.body.id)).json();
  assert.equal(read.status, 'expired');
  assert.equal((await send(f, '/api/holds', hold())).status, 409);
});

test('undated grading sessions remain reusable while their individual holds expire', async t => {
  const f = await setup(t);
  await f.db.query('UPDATE slots SET starts_at=NULL,booking_closes_at=NULL,demo_variant=1 WHERE id=1');
  const first = await send(f, '/api/holds', hold());
  assert.equal(first.status, 201);
  f.advance(600001);
  assert.equal((await send(f, '/api/holds', hold())).status, 201);
  const slot = await (await fetch(f.base + '/api/slots/1')).json();
  assert.equal(slot.startsAt, null);
  assert.equal(slot.bookingClosesAt, null);
});

test('hold retries compare the normalized key, session and quantity', async t => {
  const f = await setup(t), request = hold();
  const first = await send(f, '/api/holds', request);
  const replay = await send(f, '/api/holds', { ...request, requestId: request.requestId.toUpperCase() });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.id, first.body.id);
  for (const changed of [{ quantity: 1 }, { slotId: 2 }]) {
    const r = await send(f, '/api/holds', { ...request, ...changed });
    assert.equal(r.status, 409);
    assert.equal(r.body.error.code, 'REQUEST_KEY_CONFLICT');
  }
  assert.equal(Number((await f.db.query('SELECT COUNT(*) AS n FROM seat_holds')).rows[0].n), 1);
});

test('competing hold requests cannot both reserve the last seat', async t => {
  const f = await setup(t);
  await f.db.query('UPDATE slots SET capacity=1 WHERE id=1');
  const results = await Promise.all([send(f, '/api/holds', hold(1)), send(f, '/api/holds', hold(1))]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(Number((await f.db.query('SELECT SUM(quantity) AS n FROM seat_holds')).rows[0].n), 1);
});

test('ordinary bookings respect holds, then retain receipt retries and stale-price refusal', async t => {
  const f = await setup(t);
  const first = await send(f, '/api/holds', hold(4));
  const request = booking();
  assert.equal((await send(f, '/api/bookings', request)).status, 409);
  assert.equal(Number((await f.db.query('SELECT COUNT(*) AS n FROM bookings')).rows[0].n), 0);
  await send(f, '/api/holds/' + first.body.id, undefined, 'DELETE');
  const saved = await send(f, '/api/bookings', request);
  assert.equal(saved.status, 201);
  const retry = await send(f, '/api/bookings', request);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.id, saved.body.id);
  const stale = await send(f, '/api/bookings', { ...booking(), expectedTotalCentavos: 1 });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error.code, 'PRICE_CHANGED');
  assert.equal(stale.body.error.quote.totalPriceCentavos, 160000);
  assert.equal(Number((await f.db.query('SELECT COUNT(*) AS n FROM bookings')).rows[0].n), 1);
});

test('Owner cannot shrink or cancel held inventory and low-stock ignores holds as revenue', async t => {
  const f = await setup(t);
  await send(f, '/api/holds', hold(3));
  assert.equal((await send(f, '/api/slots/1', { capacity: 2 }, 'PATCH')).status, 409);
  assert.equal((await send(f, '/api/slots/1', { status: 'cancelled' }, 'PATCH')).body.error.code, 'ACTIVE_HOLDS_EXIST');
  const metrics = await (await fetch(f.base + '/api/metrics')).json();
  assert.equal(metrics.nearlyFullSessionCount, 1);
  assert.equal(metrics.bookingCount, 0);
  f.advance(600000);
  assert.equal((await send(f, '/api/slots/1', { capacity: 2 }, 'PATCH')).status, 200);
});

test('hold input and unknown IDs return named refusals without saving', async t => {
  const f = await setup(t);
  for (const body of [{ ...hold(), quantity: 0 }, { ...hold(), quantity: -3 }, { ...hold(), quantity: '2' },
    { ...hold(), quantity: 1.5 }, { ...hold(), requestId: 'invalid' }, { slotId: 1, quantity: 1 },
    { ...hold(), expiresAt: '2099-01-01T00:00:00Z' }]) {
    const result = await send(f, '/api/holds', body);
    assert.equal(result.status, 400);
    assert.equal(result.body.error.code, 'INVALID_INPUT');
  }
  assert.equal((await send(f, '/api/holds', hold(1, 999999))).status, 404);
  assert.equal((await fetch(f.base + '/api/holds/not-a-uuid')).status, 400);
  assert.equal((await fetch(f.base + '/api/holds/' + randomUUID())).status, 404);
  assert.equal((await send(f, '/api/holds/' + randomUUID(), undefined, 'DELETE')).status, 404);
  assert.equal(Number((await f.db.query('SELECT COUNT(*) AS n FROM seat_holds')).rows[0].n), 0);
});

test('an earlier Owner cutoff shortens existing holds, and extending it never renews them', async t => {
  const f = await setup(t);
  const held = await send(f, '/api/holds', hold());
  const cutoff = new Date(f.now.getTime() + 60000).toISOString();
  assert.equal((await send(f, '/api/slots/1', { bookingClosesAt: cutoff }, 'PATCH')).status, 200);
  assert.equal((await (await fetch(f.base + '/api/holds/' + held.body.id)).json()).expiresAt, cutoff);
  await send(f, '/api/slots/1', { bookingClosesAt: new Date(f.now.getTime() + 300000).toISOString() }, 'PATCH');
  f.advance(60000);
  const read = await (await fetch(f.base + '/api/holds/' + held.body.id)).json();
  assert.equal(read.status, 'expired');
  assert.equal(read.remainingSeats, 4);
});

test('Owner closing sales immediately releases active holds without creating a booking', async t => {
  const f = await setup(t);
  const held = await send(f, '/api/holds', hold());
  const updated = await send(f, '/api/slots/1', { bookingClosesAt: new Date(f.now.getTime() - 1000).toISOString() }, 'PATCH');
  assert.equal(updated.status, 200);
  assert.equal(updated.body.remainingSeats, 4);
  const read = await (await fetch(f.base + '/api/holds/' + held.body.id)).json();
  assert.equal(read.status, 'released');
  assert.equal((await send(f, '/api/holds', hold())).status, 409);
  assert.equal(Number((await f.db.query('SELECT COUNT(*) AS n FROM bookings')).rows[0].n), 0);
});

test('hold migration upgrades populated data and repeated migrations preserve receipts and holds', async t => {
  const f = await setup(t);
  const saved = await send(f, '/api/bookings', booking());
  await f.db.query('DROP TABLE seat_holds');
  await migrateDatabase(f.db);
  const held = await send(f, '/api/holds', hold());
  assert.equal(held.status, 201);
  await migrateDatabase(f.db);
  await migrateDatabase(f.db);
  assert.equal((await fetch(f.base + '/api/bookings/' + saved.body.id)).status, 200);
  const reloaded = await (await fetch(f.base + '/api/holds/' + held.body.id)).json();
  assert.equal(reloaded.status, 'active');
  assert.equal(reloaded.expiresAt, held.body.expiresAt);
});

test('a converted hold cannot release booked seats (conversion storage fixture)', async t => {
  const f = await setup(t);
  const held = await send(f, '/api/holds', hold(1));
  const saved = await send(f, '/api/bookings', booking());
  // Janelle implements atomic API conversion; this fixture exercises its storage handoff.
  await f.db.query("UPDATE seat_holds SET status='converted',booking_id=$2 WHERE id=$1", [held.body.id, saved.body.id]);
  const result = await send(f, '/api/holds/' + held.body.id, undefined, 'DELETE');
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, 'HOLD_CONVERTED');
  const read = await (await fetch(f.base + '/api/holds/' + held.body.id)).json();
  assert.equal(read.status, 'converted');
  assert.equal(read.remainingSeats, 3);
});
