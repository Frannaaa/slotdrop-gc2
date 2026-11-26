// Local disposable integration rehearsal. Never writes to the deployed database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fixture } from '../tests/helpers.js';

let now;
const f = await fixture({ clock: () => now });
now = f.now;
const report = {
  checkedAt: new Date().toISOString(), sourceBaseCommit: 'd7d5a49d915b053b0599e267b39c8663c7dd9ba0',
  environment: 'Disposable local database and actual HTTP routes; not a deployed release', node: process.version,
  backendReady: false, checks: [], exchanges: [],
  manualChecksStillRequired: ['Integrated browser countdown and complete booking journey',
    'Phone-width and unaided-user evidence', 'Independent teammate review and reviewed-main deployment',
    'Enabled recurring health checks', 'Final report contributions and final-v1.0 on tested main'],
};
async function request(method, path, body) {
  const response = await fetch(f.base + path, {
    method, signal: AbortSignal.timeout(15000),
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = { method, path, ...(body === undefined ? {} : { request: body }),
    status: response.status, body: await response.json() };
  report.exchanges.push(result);
  return result;
}
const bookingBody = (slotId, quantity, total, holdId) => ({ requestId: randomUUID(), slotId, quantity,
  customerName: 'Final rehearsal fixture', customerEmail: 'final-rehearsal@example.com',
  paymentMethod: 'mock_card', expectedTotalCentavos: total, ...(holdId ? { holdId } : {}) });
const newHold = slotId => request('POST', '/api/holds', { requestId: randomUUID(), slotId, quantity: 1 });
const passed = name => report.checks.push({ name, status: 'passed' });

try {
  await f.db.query('UPDATE slots SET original_price_centavos=300000,offer_price_centavos=270000,buddy_price_centavos=256500 WHERE id=1');
  const first = await request('POST', '/api/bookings', bookingBody(1, 1, 270000));
  const buddyQuote = await request('GET', '/api/pricing/quote?slotId=1&quantity=2');
  assert.equal(buddyQuote.status, 200); assert.equal(buddyQuote.body.totalPriceCentavos, 513000);
  const secondBody = bookingBody(1, 2, buddyQuote.body.totalPriceCentavos);
  const second = await request('POST', '/api/bookings', secondBody);
  assert.equal(first.status, 201); assert.equal(second.status, 201);
  const receipt = await request('GET', '/api/bookings/' + second.body.id);
  const retry = await request('POST', '/api/bookings', secondBody);
  assert.deepEqual(receipt.body, second.body);
  assert.equal(retry.status, 200); assert.deepEqual(retry.body, second.body);
  const owner = await request('GET', '/api/bookings');
  assert.equal(owner.body.filter(row => [first.body.id, second.body.id].includes(row.id)).length, 2);
  passed('Standard/buddy save, receipt readback, identical retry and matching Owner rows');

  const metrics = await request('GET', '/api/metrics');
  assert.deepEqual(metrics.body, { bookingCount: 2, platformRevenueCentavos: 78300,
    averageOrderValueCentavos: 391500,
    topSellingService: { serviceId: 1, serviceName: 'Beginner Mug Handbuilding', seatsSold: 3 },
    nearlyFullSessionCount: 1 });
  report.ownerBonus = { verified: true, metrics: metrics.body, totalBookingValueCentavos: 783000,
    receiptIds: [first.body.id, second.body.id], remainingSeats: 1, capacity: 4 };
  passed('All five server-computed Owner analytics figures match the controlled fixture');

  const hold = await newHold(1);
  assert.equal(hold.status, 201); assert.equal(hold.body.remainingSeats, 0);
  const protectedBooking = await request('POST', '/api/bookings', bookingBody(1, 1, 270000));
  assert.equal(protectedBooking.status, 409);
  const duringHold = await request('GET', '/api/metrics');
  assert.equal(duringHold.body.bookingCount, 2);
  assert.equal(duringHold.body.platformRevenueCentavos, 78300);
  const released = await request('DELETE', '/api/holds/' + hold.body.id);
  assert.equal(released.status, 200); assert.equal(released.body.remainingSeats, 1);
  const expiring = await newHold(1);
  now = new Date(now.getTime() + 600000);
  const expired = await request('GET', '/api/holds/' + expiring.body.id);
  assert.equal(expired.body.status, 'expired'); assert.equal(expired.body.remainingSeats, 1);
  passed('Holds reserve/release/expire without selling seats or generating revenue');

  const selected = await newHold(1);
  const quote = await request('GET', '/api/pricing/quote?slotId=1&quantity=1&holdId=' + selected.body.id);
  if (quote.status === 400 && quote.body.error?.message?.includes('holdId')) {
    report.checks.push({ name: 'Hold-aware quote and booking conversion', status: 'waiting', owner: 'Janelle',
      observed: 'HTTP 400: ' + quote.body.error.message,
      required: 'Accept and validate the matching hold, exclude it once, then atomically convert it with a booking.' });
    await request('DELETE', '/api/holds/' + selected.body.id);
  } else {
    assert.equal(quote.status, 200, 'A valid own hold must remain quotable when public availability is zero');
    const mismatched = await request('GET', '/api/pricing/quote?slotId=2&quantity=1&holdId=' + selected.body.id);
    assert.equal(mismatched.status, 409);
    const body = bookingBody(1, 1, quote.body.totalPriceCentavos, selected.body.id);
    const saved = await request('POST', '/api/bookings', body);
    assert.equal(saved.status, 201);
    const { rows: [stored] } = await f.db.query('SELECT status,booking_id FROM seat_holds WHERE id=$1', [selected.body.id]);
    assert.equal(stored.status, 'converted'); assert.equal(stored.booking_id, saved.body.id);
    const full = await request('GET', '/api/slots/1');
    assert.equal(full.body.remainingSeats, 0); assert.equal(full.body.heldSeats, 0);
    const release = await request('DELETE', '/api/holds/' + selected.body.id);
    assert.equal(release.status, 409);
    now = new Date(now.getTime() + 600000);
    const replay = await request('POST', '/api/bookings', body);
    assert.equal(replay.status, 200); assert.equal(replay.body.id, saved.body.id);
    const staleHold = await newHold(2);
    now = new Date(now.getTime() + 600000);
    const refused = await request('POST', '/api/bookings', bookingBody(2, 1, 95000, staleHold.body.id));
    assert.equal(refused.status, 409);
    const { rows: [count] } = await f.db.query('SELECT COUNT(*) AS n FROM bookings');
    assert.equal(Number(count.n), 3);
    passed('Own-hold quote, mismatch refusal, atomic conversion, one seat count and expired-hold refusal');
    report.backendReady = true;
  }
} catch (error) {
  report.checks.push({ name: 'Integration assertion', status: 'failed', detail: error.message });
} finally {
  await f.close();
  await mkdir(new URL('../docs/evidence/', import.meta.url), { recursive: true });
  await writeFile(new URL('../docs/evidence/final-readiness.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ backendReady: report.backendReady, checks: report.checks,
  ownerBonus: report.ownerBonus, manualChecksStillRequired: report.manualChecksStillRequired }, null, 2));
process.exitCode = report.backendReady ? 0 : 1;
