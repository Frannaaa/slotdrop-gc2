// Fran/M1 GC2 acceptance smoke. Local by default; PUBLIC WRITES REQUIRE EXPLICIT FLAG.
// Does not test the customer's browser or substitute for the outside-group phone test.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fixture } from '../tests/helpers.js';

const request = async (base, path, options) => {
  const response = await fetch(new URL(path, base), {
    signal: AbortSignal.timeout(15000),
    ...(options || {}),
  });
  let json;
  try { json = await response.json(); }
  catch { throw new Error(path + ' returned non-JSON (HTTP ' + response.status + ')'); }
  return { status: response.status, json };
};
const ok = async (base, path) => {
  const result = await request(base, path);
  assert.equal(result.status, 200, path + ' must return HTTP 200');
  return result.json;
};

export async function runTransactionSmoke(base, chosenSlotId) {
  const [beforeSlots, beforeBookings, beforeMetrics] = await Promise.all([
    ok(base, '/api/slots'),
    ok(base, '/api/bookings'),
    ok(base, '/api/metrics'),
  ]);
  assert.ok(Array.isArray(beforeSlots), 'The session list must be an array');
  assert.ok(Array.isArray(beforeBookings), 'The Owner bookings list must be an array');
  const available = beforeSlots.filter(row =>
    Number.isSafeInteger(row.id) && row.remainingSeats >= 1);
  const slot = chosenSlotId === undefined
    ? available[0]
    : available.find(row => row.id === chosenSlotId);
  assert.ok(slot, 'No eligible simulated session with at least 1 free seat; add a NEW future demo offer through Owner');
  const quote = await ok(base, '/api/pricing/quote?slotId=' + slot.id + '&quantity=1');
  assert.ok(Number.isSafeInteger(quote.totalPriceCentavos) && quote.totalPriceCentavos > 0,
    'Quote total is not a positive integer centavos amount');
  const body = {
    requestId: randomUUID(),
    slotId: slot.id,
    quantity: 1,
    customerName: 'GC2 Fictional QA',
    customerEmail: 'qa@example.com',
    paymentMethod: 'pay_on_site',
    expectedTotalCentavos: quote.totalPriceCentavos,
  };
  const saved = await request(base, '/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(saved.status, 201, 'New booking must return HTTP 201');
  const receipt = saved.json;
  assert.match(receipt.id, /^[0-9a-f-]{36}$/i, 'Saved booking must have a UUID');
  assert.equal(receipt.slotId, slot.id);
  assert.equal(receipt.quantity, 1);
  assert.equal(receipt.totalPriceCentavos, quote.totalPriceCentavos);
  assert.equal(receipt.status, 'confirmed');
  assert.equal('customerEmail' in receipt, false, 'Public receipt must not reveal guest contact');
  assert.equal('requestId' in receipt, false, 'Public receipt must not reveal idempotency key');

  const [readback, afterSlots, afterBookings, afterMetrics] = await Promise.all([
    ok(base, '/api/bookings/' + encodeURIComponent(receipt.id)),
    ok(base, '/api/slots/' + slot.id),
    ok(base, '/api/bookings'),
    ok(base, '/api/metrics'),
  ]);
  assert.deepEqual(readback, receipt, 'Receipt readback must match saved snapshot');
  const matching = afterBookings.filter(row => row.id === receipt.id);
  assert.equal(matching.length, 1, 'Owner must show exactly one row for the new booking');
  assert.equal(matching[0].quantity, 1);
  assert.equal(matching[0].totalPriceCentavos, receipt.totalPriceCentavos);
  assert.equal(afterSlots.remainingSeats, slot.remainingSeats - 1,
    'Exactly one released seat must be consumed in this isolated run');
  assert.equal(afterMetrics.bookingCount, beforeMetrics.bookingCount + 1,
    'Owner bookingCount must rise by one transaction');

  const sameKey = await request(base, '/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(sameKey.status, 200, 'Identical retry must return HTTP 200');
  assert.deepEqual(sameKey.json, receipt, 'Retry must return the SAME saved receipt');
  const finalList = await ok(base, '/api/bookings');
  assert.equal(finalList.filter(row => row.id === receipt.id).length, 1,
    'Retry must not create duplicate Owner rows');

  return {
    mode: 'API smoke only; browser/stranger/deployed group tests NOT covered',
    testedAt: new Date().toISOString(),
    base,
    slotId: slot.id,
    bookingId: receipt.id,
    postStatus: saved.status,
    readbackStatus: 200,
    retryStatus: sameKey.status,
    ownerContainsBooking: true,
    seatsBefore: slot.remainingSeats,
    seatsAfter: afterSlots.remainingSeats,
    bookingCountBefore: beforeMetrics.bookingCount,
    bookingCountAfter: afterMetrics.bookingCount,
    totalCentavos: receipt.totalPriceCentavos,
    syntheticGuestOnly: true,
  };
}

async function main() {
  const origin = process.argv[2];
  const flag = process.argv[3];
  if (origin && flag !== '--confirm-fictional-write') {
    throw new Error('Remote test will WRITE a fictional booking. Pass the exact public URL and --confirm-fictional-write, or omit args for disposable local only.');
  }
  if (!origin && flag) throw new Error('Unexpected option without URL');
  let f;
  try {
    f = origin ? null : await fixture();
    const base = origin ? new URL(origin).origin : f.base;
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      throw new Error('Expected an HTTP(S) URL');
    }
    const result = await runTransactionSmoke(base);
    console.log(JSON.stringify(result, null, 2));
    console.log('PASS: API save, receipt, Owner row, seat decrement and idempotent retry. Browser/stranger test still required.');
  } finally {
    if (f) await f.close();
  }
}
if (process.argv[1] && process.argv[1].endsWith('check-transaction-smoke.mjs')) {
  main().catch(error => { console.error('TRANSACTION SMOKE FAILED:', error.message); process.exitCode = 1; });
}
