import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

// Seed slot 1: capacity 4, offer 160000, buddy 152000. Two seats total 304000.
function booking(overrides = {}) {
  return { requestId: randomUUID(), slotId: 1, quantity: 2, customerName: 'Demo Customer', customerEmail: 'demo@example.com',
    paymentMethod: 'mock_card', expectedTotalCentavos: 304000, ...overrides };
}
const post = (f, body) => fetch(f.base + '/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bookingCount = async f => Number((await f.database.query('SELECT COUNT(*) AS n FROM bookings')).rows[0].n);

test('a new booking returns 201 with server-priced receipt snapshots', async () => {
  const f = await fixture();
  try {
    const response = await post(f, booking({ customerName: '  Demo Customer  ' }));
    assert.equal(response.status, 201);
    const receipt = await response.json();
    assert.match(receipt.id, /^[0-9a-f-]{36}$/);
    assert.equal(receipt.customerName, 'Demo Customer');
    assert.equal(receipt.pricingType, 'buddy');
    assert.equal(receipt.unitPriceCentavos, 152000);
    assert.equal(receipt.totalPriceCentavos, 304000);
    assert.equal(receipt.platformFeeCentavos, 30400);
    assert.equal(receipt.providerPayoutCentavos, 273600);
    assert.equal(receipt.commissionBasisPoints, 1000);
    assert.equal(receipt.status, 'confirmed');
    assert.equal(receipt.serviceName, 'Beginner Mug Handbuilding');
    const slot = await (await fetch(f.base + '/api/slots/1')).json();
    assert.equal(slot.remainingSeats, 2);
    assert.equal(receipt.sessionStartsAt, slot.startsAt);
  } finally { await f.close(); }
});

test('a single seat uses the standard tier', async () => {
  const f = await fixture();
  try {
    const response = await post(f, booking({ quantity: 1, expectedTotalCentavos: 160000 }));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).pricingType, 'standard');
  } finally { await f.close(); }
});

test('an identical retry returns the same booking with 200, even after the session closes', async () => {
  let now;
  const f = await fixture({ clock: () => now });
  try {
    now = f.now;
    const body = booking();
    const first = await (await post(f, body)).json();
    const retry = await post(f, { ...body, customerName: ' Demo Customer ', requestId: body.requestId.toUpperCase() });
    assert.equal(retry.status, 200);
    assert.deepEqual(await retry.json(), first);
    now = new Date(f.now.getTime() + 4 * 24 * 3600000);
    const late = await post(f, body);
    assert.equal(late.status, 200);
    assert.equal((await late.json()).id, first.id);
    assert.equal(await bookingCount(f), 1);
  } finally { await f.close(); }
});

test('reusing a key with different details returns 409 REQUEST_KEY_CONFLICT', async () => {
  const f = await fixture();
  try {
    const body = booking();
    assert.equal((await post(f, body)).status, 201);
    for (const change of [{ quantity: 1, expectedTotalCentavos: 160000 }, { customerEmail: 'other@example.com' }, { paymentMethod: 'pay_on_site' }]) {
      const response = await post(f, { ...body, ...change });
      assert.equal(response.status, 409);
      assert.equal((await response.json()).error.code, 'REQUEST_KEY_CONFLICT');
    }
    assert.equal(await bookingCount(f), 1);
  } finally { await f.close(); }
});

test('a changed price returns 409 PRICE_CHANGED with a fresh quote and saves nothing', async () => {
  const f = await fixture();
  try {
    await f.database.query('UPDATE slots SET buddy_price_centavos=150000 WHERE id=1');
    const response = await post(f, booking());
    assert.equal(response.status, 409);
    const { error } = await response.json();
    assert.equal(error.code, 'PRICE_CHANGED');
    assert.equal(error.quote.totalPriceCentavos, 300000);
    assert.equal(error.quote.pricingType, 'buddy');
    assert.equal(await bookingCount(f), 0);
    assert.equal((await post(f, booking({ expectedTotalCentavos: error.quote.totalPriceCentavos }))).status, 201);
  } finally { await f.close(); }
});

test('insufficient seats and closed sessions return 409 SLOT_UNAVAILABLE', async () => {
  const f = await fixture();
  try {
    assert.equal((await post(f, booking({ quantity: 3, expectedTotalCentavos: 456000 }))).status, 201);
    const full = await post(f, booking());
    assert.equal(full.status, 409);
    assert.equal((await full.json()).error.code, 'SLOT_UNAVAILABLE');
    for (const sql of ["UPDATE slots SET status='paused' WHERE id=2", 'UPDATE slots SET runs_as_scheduled=false WHERE id=3', 'UPDATE services SET active=false WHERE id=4']) {
      await f.database.query(sql);
    }
    for (const slotId of [2, 3, 4]) {
      const response = await post(f, booking({ slotId, quantity: 1, expectedTotalCentavos: 1 }));
      assert.equal(response.status, 409);
      assert.equal((await response.json()).error.code, 'SLOT_UNAVAILABLE');
    }
    assert.equal(await bookingCount(f), 1);
  } finally { await f.close(); }
});

test('a passed cutoff is rechecked at save time', async () => {
  let now;
  const f = await fixture({ clock: () => now });
  try {
    const { rows: [slot] } = await f.database.query('SELECT booking_closes_at FROM slots WHERE id=1');
    now = new Date(new Date(slot.booking_closes_at).getTime() + 1000);
    const response = await post(f, booking());
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error.code, 'SLOT_UNAVAILABLE');
  } finally { await f.close(); }
});

test('invalid booking bodies return 400 and browser prices are refused', async () => {
  const f = await fixture();
  try {
    for (const change of [
      { requestId: 'not-a-uuid' }, { slotId: '1' }, { quantity: 0 }, { quantity: 101 }, { quantity: 1.5 },
      { customerName: '   ' }, { customerName: 'x'.repeat(101) }, { customerEmail: 'nope' }, { customerEmail: 'a@b.c'.padStart(255, 'a') },
      { paymentMethod: 'gcash' }, { expectedTotalCentavos: -1 }, { expectedTotalCentavos: '304000' },
      { totalPriceCentavos: 1 }, { unitPriceCentavos: 1 }, { pricingType: 'buddy' }, { cardNumber: '4111111111111111' }
    ]) {
      const response = await post(f, booking(change));
      assert.equal(response.status, 400, JSON.stringify(change));
      assert.equal((await response.json()).error.code, 'INVALID_INPUT');
    }
    const missing = booking(); delete missing.customerEmail;
    assert.equal((await post(f, missing)).status, 400);
    assert.equal((await post(f, [])).status, 400);
    assert.equal((await post(f, booking({ slotId: 999 }))).status, 404);
    assert.equal(await bookingCount(f), 0);
  } finally { await f.close(); }
});

test('concurrent bookings for the last seats never oversell', async () => {
  const f = await fixture();
  try {
    const responses = await Promise.all([1, 2, 3].map(() => post(f, booking())));
    const statuses = responses.map(response => response.status).sort();
    assert.deepEqual(statuses, [201, 201, 409]);
    const { rows: [row] } = await f.database.query("SELECT SUM(quantity) AS seats FROM bookings WHERE slot_id=1 AND status='confirmed'");
    assert.equal(Number(row.seats), 4);
  } finally { await f.close(); }
});

test('concurrent identical retries create exactly one booking', async () => {
  const f = await fixture();
  try {
    const body = booking();
    const responses = await Promise.all([1, 2, 3, 4].map(() => post(f, body)));
    const statuses = responses.map(response => response.status).sort();
    assert.deepEqual(statuses, [200, 200, 200, 201]);
    const ids = new Set(await Promise.all(responses.map(async response => (await response.json()).id)));
    assert.equal(ids.size, 1);
    assert.equal(await bookingCount(f), 1);
  } finally { await f.close(); }
});

test('saved receipts stay unchanged after the owner edits the offer', async () => {
  const f = await fixture();
  try {
    const saved = await (await post(f, booking())).json();
    await f.database.query('UPDATE slots SET offer_price_centavos=140000, buddy_price_centavos=130000 WHERE id=1');
    const readback = await fetch(f.base + '/api/bookings/' + saved.id);
    assert.equal(readback.status, 200);
    assert.deepEqual(await readback.json(), saved);
  } finally { await f.close(); }
});

test('receipt readback validates the ID and returns 404 for unknown bookings', async () => {
  const f = await fixture();
  try {
    const malformed = await fetch(f.base + '/api/bookings/not-a-uuid');
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error.code, 'INVALID_INPUT');
    const unknown = await fetch(f.base + '/api/bookings/' + randomUUID());
    assert.equal(unknown.status, 404);
    assert.equal((await unknown.json()).error.code, 'BOOKING_NOT_FOUND');
  } finally { await f.close(); }
});
