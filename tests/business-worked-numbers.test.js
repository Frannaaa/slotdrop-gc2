// Group 1 business-model worked-number regression. Fran (M1) test, not supplier demand evidence.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

test('GC1-to-GC2 worked availability/buddy example matches authoritative saved receipts and Owner decisions', async () => {
  const f = await fixture();
  const api = async (path, options) => {
    const response = await fetch(f.base + path, options);
    return { status: response.status, body: await response.json() };
  };
  const post = (path, body) => api(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  try {
    // Deliberately model fictional rates. Not approved Laro offers or measured demand.
    const start = new Date(f.now.getTime() + 55 * 3600000).toISOString();
    const close = new Date(f.now.getTime() + 50 * 3600000).toISOString();
    const made = await post('/api/slots', {
      serviceId: 1, startsAt: start, bookingClosesAt: close, capacity: 4,
      originalPriceCentavos: 300000, offerPriceCentavos: 270000,
      buddyPriceCentavos: 256500, runsAsScheduled: true,
    });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    const slotId = made.body.id;

    const standard = await api('/api/pricing/quote?slotId=' + slotId + '&quantity=1');
    const buddy = await api('/api/pricing/quote?slotId=' + slotId + '&quantity=2');
    assert.equal(standard.status, 200);
    assert.equal(buddy.status, 200);
    assert.deepEqual([
      standard.body.unitPriceCentavos, standard.body.totalPriceCentavos,
      standard.body.platformFeeCentavos, standard.body.providerPayoutCentavos,
      standard.body.pricingType,
    ], [270000, 270000, 27000, 243000, 'standard']);
    assert.deepEqual([
      buddy.body.unitPriceCentavos, buddy.body.totalPriceCentavos,
      buddy.body.platformFeeCentavos, buddy.body.providerPayoutCentavos,
      buddy.body.pricingType,
    ], [256500, 513000, 51300, 461700, 'buddy']);

    // Counterfactual comparison: same two seats at standard would cost 540000,
    // so buddy reduces fee by 2700 centavos, provider payout by 24300.
    const twoStandardTotal = 2 * standard.body.totalPriceCentavos;
    const twoStandardFee = 2 * standard.body.platformFeeCentavos;
    const twoStandardPayout = 2 * standard.body.providerPayoutCentavos;
    assert.equal(twoStandardTotal - buddy.body.totalPriceCentavos, 27000);
    assert.equal(twoStandardFee - buddy.body.platformFeeCentavos, 2700);
    assert.equal(twoStandardPayout - buddy.body.providerPayoutCentavos, 24300);
    // If second attendee is incremental rather than empty allocation:
    assert.equal(buddy.body.totalPriceCentavos - standard.body.totalPriceCentavos, 243000);
    assert.equal(buddy.body.platformFeeCentavos - standard.body.platformFeeCentavos, 24300);
    assert.equal(buddy.body.providerPayoutCentavos - standard.body.providerPayoutCentavos, 218700);

    async function save(quantity, expectedTotalCentavos) {
      return post('/api/bookings', {
        requestId: randomUUID(), slotId, quantity,
        customerName: 'Fictional GC2 participant', customerEmail: 'qa@example.com',
        paymentMethod: 'pay_on_site', expectedTotalCentavos,
      });
    }
    const first = await save(2, buddy.body.totalPriceCentavos);
    assert.equal(first.status, 201);
    assert.equal(first.body.totalPriceCentavos, 513000);
    assert.equal(first.body.pricingType, 'buddy');
    assert.equal((await api('/api/slots/' + slotId)).body.remainingSeats, 2);

    const second = await save(1, standard.body.totalPriceCentavos);
    assert.equal(second.status, 201);
    assert.equal(second.body.pricingType, 'standard');
    assert.equal((await api('/api/slots/' + slotId)).body.remainingSeats, 1);

    const metrics = await api('/api/metrics');
    assert.equal(metrics.status, 200);
    assert.equal(metrics.body.bookingCount, 2);
    assert.equal(metrics.body.platformRevenueCentavos, 78300);
    assert.equal(metrics.body.averageOrderValueCentavos, 391500);
    assert.equal(metrics.body.topSellingService.seatsSold, 3);
    assert.equal(metrics.body.nearlyFullSessionCount, 1);

    const cannotOversell = await save(2, buddy.body.totalPriceCentavos);
    assert.equal(cannotOversell.status, 409);
    assert.equal(cannotOversell.body.error.code, 'SLOT_UNAVAILABLE');
    const [list, savedReceipt] = await Promise.all([
      api('/api/bookings'), api('/api/bookings/' + first.body.id),
    ]);
    assert.equal(list.status, 200);
    assert.equal(savedReceipt.status, 200);
    assert.equal(list.body.filter(row => row.slotId === slotId).length, 2);
    assert.deepEqual(savedReceipt.body, first.body);
  } finally { await f.close(); }
});
