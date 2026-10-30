import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { insertDemoReceipt } from './receipts.js';
import { priceQuote } from '../server/services/pricing.js';

const at = new Date('2026-11-01T00:00:00Z');
const slot = { id: 9, originalPriceCentavos: 200000, offerPriceCentavos: 160000, buddyPriceCentavos: 152000 };

test('the server picks the standard or buddy tier from party size', () => {
  assert.deepEqual(priceQuote(slot, 1, at), {
    slotId: 9, quantity: 1, originalUnitPriceCentavos: 200000, offerUnitPriceCentavos: 160000,
    unitPriceCentavos: 160000, pricingType: 'standard', groupSavingsCentavos: 0,
    totalPriceCentavos: 160000, platformFeeCentavos: 16000, providerPayoutCentavos: 144000,
    discountPercent: 20, quotedAt: '2026-11-01T00:00:00.000Z'
  });
  const pair = priceQuote(slot, 2, at);
  assert.equal(pair.pricingType, 'buddy');
  assert.equal(pair.unitPriceCentavos, 152000);
  assert.equal(pair.groupSavingsCentavos, 16000);
  assert.equal(pair.totalPriceCentavos, 304000);
  assert.equal(pair.platformFeeCentavos, 30400);
  assert.equal(pair.providerPayoutCentavos, 273600);
  assert.equal(pair.discountPercent, 24);
  const noBuddy = priceQuote({ ...slot, buddyPriceCentavos: null }, 3, at);
  assert.equal(noBuddy.pricingType, 'standard');
  assert.equal(noBuddy.totalPriceCentavos, 480000);
  assert.equal(noBuddy.groupSavingsCentavos, 0);
});

test('the fee is rounded per seat, then multiplied, and payout keeps the remainder', () => {
  // 12,345 centavos x 10% = 1,234.5, rounded to 1,235 per seat, matching the bookings CHECK constraint.
  const quote = priceQuote({ id: 1, originalPriceCentavos: 20000, offerPriceCentavos: 12345, buddyPriceCentavos: null }, 3, at);
  assert.equal(quote.totalPriceCentavos, 37035);
  assert.equal(quote.platformFeeCentavos, 3705);
  assert.equal(quote.providerPayoutCentavos, 33330);
  assert.equal(quote.platformFeeCentavos + quote.providerPayoutCentavos, quote.totalPriceCentavos);
});

test('GET /api/pricing/quote prices seeded sessions from the database', async () => {
  const f = await fixture();
  try {
    const get = async query => { const response = await fetch(f.base + '/api/pricing/quote' + query); return [response.status, await response.json()]; };
    let [status, quote] = await get('?slotId=1&quantity=2');
    assert.equal(status, 200);
    assert.equal(quote.pricingType, 'buddy');
    assert.equal(quote.totalPriceCentavos, 304000);
    assert.equal(quote.quotedAt, f.now.toISOString());
    [status, quote] = await get('?slotId=3&quantity=2');
    assert.equal(status, 200);
    assert.equal(quote.pricingType, 'standard');
    assert.equal(quote.totalPriceCentavos, 240000);
    // Database prices win: a later offer edit changes the next quote.
    await f.database.query('UPDATE slots SET offer_price_centavos=150000 WHERE id=1');
    assert.equal((await get('?slotId=1&quantity=1'))[1].totalPriceCentavos, 150000);
  } finally { await f.close(); }
});

test('invalid quote requests return 400 and unknown sessions return 404', async () => {
  const f = await fixture();
  try {
    const check = async (query, status, code) => {
      const response = await fetch(f.base + '/api/pricing/quote' + query);
      assert.equal(response.status, status, query);
      assert.equal((await response.json()).error.code, code, query);
    };
    for (const query of ['', '?slotId=1', '?quantity=1', '?slotId=1&quantity=0', '?slotId=1&quantity=101',
      '?slotId=1&quantity=1.5', '?slotId=abc&quantity=1', '?slotId=1&quantity=1&quantity=2',
      '?slotId=1&quantity=1&unitPriceCentavos=1', '?slotId=1&quantity=1&pricingType=buddy']) {
      await check(query, 400, 'INVALID_INPUT');
    }
    await check('?slotId=999&quantity=1', 404, 'SLOT_NOT_FOUND');
  } finally { await f.close(); }
});

test('sessions that cannot be booked return 409 SLOT_UNAVAILABLE', async () => {
  const f = await fixture();
  try {
    const status = async query => (await fetch(f.base + '/api/pricing/quote' + query)).status;
    assert.equal(await status('?slotId=1&quantity=5'), 409); // only 4 seats released
    await insertDemoReceipt(f.database); // a confirmed booking takes 2 of slot 1's 4 seats
    assert.equal(await status('?slotId=1&quantity=3'), 409);
    assert.equal(await status('?slotId=1&quantity=2'), 200);
    await f.database.query("UPDATE slots SET status='paused' WHERE id=2");
    await f.database.query('UPDATE slots SET booking_closes_at=$1 WHERE id=3', [f.now]);
    await f.database.query('UPDATE services SET active=false WHERE id=4');
    await f.database.query('UPDATE slots SET runs_as_scheduled=false WHERE id=7');
    for (const id of [2, 3, 4, 7]) {
      const response = await fetch(f.base + '/api/pricing/quote?slotId=' + id + '&quantity=1');
      assert.equal(response.status, 409, 'slot ' + id);
      assert.equal((await response.json()).error.code, 'SLOT_UNAVAILABLE');
    }
    assert.equal(await status('?slotId=6&quantity=1'), 200);
  } finally { await f.close(); }
});
