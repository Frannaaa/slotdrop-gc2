// Fran (M1): cross-route status matrix for GC2 Data/API correctness rubric.
// Real PostgreSQL on CI (TEST_DATABASE_URL), disposable PGlite locally.
// No external deployment or customer contact data is touched.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

async function call(f, path, {method = 'GET', body} = {}) {
  const response = await fetch(f.base + path, {
    method,
    ...(body === undefined ? {} : {
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body),
    }),
  });
  const payload = await response.json();
  assert.match(response.headers.get('content-type') || '', /application\/json/);
  return {status:response.status, payload};
}
function expectStatus(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.payload));
  if (code) assert.equal(result.payload?.error?.code, code);
}
const booking = (overrides = {}) => ({
  requestId: randomUUID(), slotId: 1, quantity: 2,
  customerName:'GC2 Fictional QA',customerEmail:'qa@example.com',
  paymentMethod:'mock_card',expectedTotalCentavos:304000,
  ...overrides,
});

test('rubric: every public core route produces explicit expected success and error statuses', async () => {
  const f = await fixture();
  try {
    const cases = [
      ['/api/health', 200],
      ['/api/activities', 200],
      ['/api/activities?invalidFilter=1', 400, 'INVALID_INPUT'],
      ['/api/slots', 200],
      ['/api/slots?people=0', 400, 'INVALID_INPUT'],
      ['/api/slots/not-an-id', 400, 'INVALID_INPUT'],
      ['/api/slots/999999', 404, 'SLOT_NOT_FOUND'],
      ['/api/slots/1', 200],
      ['/api/pricing/quote?slotId=1&quantity=2', 200],
      ['/api/pricing/quote?slotId=1', 400, 'INVALID_INPUT'],
      ['/api/pricing/quote?slotId=1&quantity=0', 400, 'INVALID_INPUT'],
      ['/api/pricing/quote?slotId=999999&quantity=1', 404, 'SLOT_NOT_FOUND'],
      ['/api/pricing/quote?slotId=1&quantity=99', 409, 'SLOT_UNAVAILABLE'],
      ['/api/pricing/quote?slotId=1&quantity=2&quantity=3', 400, 'INVALID_INPUT'],
      ['/api/bookings', 200],
      ['/api/bookings/not-a-uuid', 400, 'INVALID_INPUT'],
      ['/api/bookings/' + randomUUID(), 404, 'BOOKING_NOT_FOUND'],
      ['/api/metrics', 200],
      ['/api/owner/catalog', 200],
      ['/api/providers/999999', 404, 'PROVIDER_NOT_FOUND'],
      ['/api/provider-applications/not-a-uuid', 400, 'INVALID_INPUT'],
      ['/api/provider-applications/' + randomUUID(), 404, 'APPLICATION_NOT_FOUND'],
      ['/api/not-a-real-route', 404, 'ROUTE_NOT_IMPLEMENTED'],
    ];
    for (const [path,status,code] of cases) expectStatus(await call(f,path),status,code);

    const validOffer = {
      serviceId:1,startsAt:new Date(f.now.getTime()+48*3600000).toISOString(),
      capacity:4,originalPriceCentavos:200000,offerPriceCentavos:160000,
      buddyPriceCentavos:152000,runsAsScheduled:true,
    };
    expectStatus(await call(f,'/api/slots',{method:'POST',body:{...validOffer,capacity:0}}),400,'INVALID_INPUT');
    expectStatus(await call(f,'/api/slots',{method:'POST',body:{...validOffer,serviceId:999999}}),404,'SERVICE_NOT_FOUND');
    expectStatus(await call(f,'/api/slots/999999',{method:'PATCH',body:{capacity:5}}),404,'SLOT_NOT_FOUND');
    expectStatus(await call(f,'/api/slots/1',{method:'PATCH',body:{}}),400,'INVALID_INPUT');
    expectStatus(await call(f,'/api/slots/1',{method:'PATCH',body:{capacity:0}}),400,'INVALID_INPUT');

    // A valid offer can be written through the same API on isolated test data.
    const newOffer = await call(f,'/api/slots',{method:'POST',body:validOffer});
    expectStatus(newOffer,201);
    assert.ok(Number.isInteger(newOffer.payload.id));
  } finally { await f.close(); }
});

test('rubric: server rejects browser totals, commits safe money/seat snapshots, and reads the same receipt by ID', async () => {
  const f = await fixture();
  try {
    const original = await call(f,'/api/slots/1');
    expectStatus(original,200);
    const before = original.payload.remainingSeats;
    assert.equal(before,4);

    const invalidCases = [
      [booking({quantity:0}),400,'INVALID_INPUT'],
      [booking({totalPriceCentavos:304000}),400,'INVALID_INPUT'],
      [booking({expectedTotalCentavos:'304000'}),400,'INVALID_INPUT'],
      [booking({slotId:999999}),404,'SLOT_NOT_FOUND'],
      [booking({expectedTotalCentavos:1}),409,'PRICE_CHANGED'],
    ];
    for (const [body,status,code] of invalidCases) {
      const result = await call(f,'/api/bookings',{method:'POST',body});
      expectStatus(result,status,code);
      if (code === 'PRICE_CHANGED') assert.equal(result.payload.error.quote.totalPriceCentavos,304000);
    }
    assert.deepEqual((await call(f,'/api/bookings')).payload,[], 'Invalid requests must not save a booking');

    const input = booking();
    const saved = await call(f,'/api/bookings',{method:'POST',body:input});
    expectStatus(saved,201);
    assert.equal(saved.payload.pricingType,'buddy');
    assert.equal(saved.payload.quantity,2);
    assert.equal(saved.payload.unitPriceCentavos,152000);
    assert.equal(saved.payload.totalPriceCentavos,304000);
    assert.equal(saved.payload.platformFeeCentavos,30400);
    assert.equal(saved.payload.providerPayoutCentavos,273600);
    assert.equal('customerEmail' in saved.payload,false);
    assert.equal('requestId' in saved.payload,false);

    const receipt = await call(f,'/api/bookings/' + saved.payload.id);
    expectStatus(receipt,200);
    assert.deepEqual(receipt.payload,saved.payload,'Confirmation readback must use saved DB row');
    assert.equal((await call(f,'/api/slots/1')).payload.remainingSeats,before-2);
    const list = await call(f,'/api/bookings');
    expectStatus(list,200);
    assert.equal(list.payload.filter(row=>row.id===saved.payload.id).length,1);
    const metrics = await call(f,'/api/metrics');
    expectStatus(metrics,200);
    assert.equal(metrics.payload.bookingCount,1);
    assert.equal(metrics.payload.platformRevenueCentavos,30400);

    const repeated = await call(f,'/api/bookings',{method:'POST',body:input});
    expectStatus(repeated,200);
    assert.deepEqual(repeated.payload,saved.payload);
    expectStatus(await call(f,'/api/bookings',{method:'POST',body:booking()}),201);
    const full = await call(f,'/api/bookings',{method:'POST',body:booking()});
    expectStatus(full,409,'SLOT_UNAVAILABLE');
    assert.equal((await call(f,'/api/slots/1')).payload.remainingSeats,0);
    assert.equal((await call(f,'/api/metrics')).payload.bookingCount,2);
  } finally { await f.close(); }
});
