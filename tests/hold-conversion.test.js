// Group assignment: Janelle (M3). holdId on quote and booking, atomic hold conversion.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

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
const get = async (f, path) => { const r = await fetch(f.base + path); return { status: r.status, body: await r.json() }; };
const hold = (f, quantity) => send(f, '/api/holds', { requestId: randomUUID(), slotId: 1, quantity });
const quote = (f, quantity, holdId) => get(f, `/api/pricing/quote?slotId=1&quantity=${quantity}` + (holdId ? '&holdId=' + holdId : ''));
const booking = (quantity, total, holdId) => ({ requestId: randomUUID(), slotId: 1, quantity, customerName: 'Hold buyer',
  customerEmail: 'hold-buyer@example.com', paymentMethod: 'mock_card', expectedTotalCentavos: total,
  ...(holdId ? { holdId } : {}) });
const bookingCount = async f => Number((await f.db.query('SELECT COUNT(*) AS n FROM bookings')).rows[0].n);

test('own active hold is excluded once: held quote and save succeed when the session is otherwise full', async t => {
  const f = await setup(t);
  const capacity = (await get(f, '/api/slots/1')).body.capacity;
  const held = await hold(f, capacity);
  assert.equal(held.status, 201);
  assert.equal((await quote(f, capacity)).status, 409, 'plain quote still sees the held seats as taken');
  const q = await quote(f, capacity, held.body.id);
  assert.equal(q.status, 200);
  assert.equal(q.body.holdId, held.body.id);
  assert.equal(q.body.holdExpiresAt, held.body.expiresAt);
  const saved = await send(f, '/api/bookings', booking(capacity, q.body.totalPriceCentavos, held.body.id));
  assert.equal(saved.status, 201);
  assert.equal(saved.body.holdId, held.body.id);
  const read = await get(f, '/api/holds/' + held.body.id);
  assert.equal(read.body.status, 'converted');
  const slot = (await get(f, '/api/slots/1')).body;
  assert.equal(slot.confirmedSeats, capacity);
  assert.equal(slot.heldSeats, 0);
  assert.equal(slot.remainingSeats, 0, 'converted seats are counted once, as booked');
  assert.equal((await get(f, '/api/bookings/' + saved.body.id)).body.holdId, held.body.id);
});

test('identical retry after conversion returns the same receipt; a changed retry is a key conflict', async t => {
  const f = await setup(t);
  const held = await hold(f, 1);
  const q = await quote(f, 1, held.body.id);
  const body = booking(1, q.body.totalPriceCentavos, held.body.id);
  const first = await send(f, '/api/bookings', body);
  assert.equal(first.status, 201);
  const retry = await send(f, '/api/bookings', body);
  assert.equal(retry.status, 200);
  assert.deepEqual(retry.body, first.body);
  f.advance(11 * 60 * 1000);
  const lateRetry = await send(f, '/api/bookings', body);
  assert.equal(lateRetry.status, 200, 'a retry is answered from the saved booking even after the hold would have expired');
  const { holdId, ...withoutHold } = body;
  const changed = await send(f, '/api/bookings', withoutHold);
  assert.equal(changed.status, 409);
  assert.equal(changed.body.error.code, 'REQUEST_KEY_CONFLICT');
  assert.equal(await bookingCount(f), 1);
});

test('expired hold refuses quote and save with a reason and releases availability', async t => {
  const f = await setup(t);
  const held = await hold(f, 2);
  const q = await quote(f, 2, held.body.id);
  f.advance(10 * 60 * 1000 + 1000);
  const expiredQuote = await quote(f, 2, held.body.id);
  assert.equal(expiredQuote.status, 409);
  assert.equal(expiredQuote.body.error.code, 'HOLD_EXPIRED');
  const refused = await send(f, '/api/bookings', booking(2, q.body.totalPriceCentavos, held.body.id));
  assert.equal(refused.status, 409);
  assert.equal(refused.body.error.code, 'HOLD_EXPIRED');
  assert.match(refused.body.error.message, /expired/);
  assert.equal(await bookingCount(f), 0, 'no saved record');
  const slot = (await get(f, '/api/slots/1')).body;
  assert.equal(slot.heldSeats, 0);
  assert.equal(slot.remainingSeats, slot.capacity);
});

test('mismatched, released, unknown and malformed holds are refused without saving', async t => {
  const f = await setup(t);
  const held = await hold(f, 2);
  const mismatch = await quote(f, 1, held.body.id);
  assert.equal(mismatch.status, 409);
  assert.equal(mismatch.body.error.code, 'HOLD_MISMATCH');
  const mismatchSave = await send(f, '/api/bookings', booking(1, 160000, held.body.id));
  assert.equal(mismatchSave.body.error.code, 'HOLD_MISMATCH');
  assert.equal((await quote(f, 2, randomUUID())).status, 404);
  assert.equal((await quote(f, 2, 'not-a-uuid')).status, 400);
  assert.equal((await send(f, '/api/bookings', booking(2, 0, 'not-a-uuid'))).status, 400);
  await send(f, '/api/holds/' + held.body.id, undefined, 'DELETE');
  const released = await quote(f, 2, held.body.id);
  assert.equal(released.status, 409);
  assert.equal(released.body.error.code, 'HOLD_RELEASED');
  assert.equal(await bookingCount(f), 0);
});

test('stale price with a hold rolls back: hold stays active and can still complete', async t => {
  const f = await setup(t);
  const held = await hold(f, 1);
  const q = await quote(f, 1, held.body.id);
  const wrong = await send(f, '/api/bookings', booking(1, q.body.totalPriceCentavos + 100, held.body.id));
  assert.equal(wrong.status, 409);
  assert.equal(wrong.body.error.code, 'PRICE_CHANGED');
  assert.equal((await get(f, '/api/holds/' + held.body.id)).body.status, 'active');
  assert.equal(await bookingCount(f), 0);
  const ok = await send(f, '/api/bookings', booking(1, q.body.totalPriceCentavos, held.body.id));
  assert.equal(ok.status, 201);
});

test('double submit with two request keys on one hold saves exactly one booking', async t => {
  const f = await setup(t);
  const held = await hold(f, 1);
  const q = await quote(f, 1, held.body.id);
  const results = await Promise.all([
    send(f, '/api/bookings', booking(1, q.body.totalPriceCentavos, held.body.id)),
    send(f, '/api/bookings', booking(1, q.body.totalPriceCentavos, held.body.id)),
  ]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(results.find(r => r.status === 409).body.error.code, 'HOLD_CONVERTED');
  assert.equal(await bookingCount(f), 1);
});

test('GC2 hold-free quote and booking still work unchanged', async t => {
  const f = await setup(t);
  const q = await quote(f, 1);
  assert.equal(q.status, 200);
  assert.equal('holdId' in q.body, false);
  const saved = await send(f, '/api/bookings', booking(1, q.body.totalPriceCentavos));
  assert.equal(saved.status, 201);
  assert.equal(saved.body.holdId, null);
});
