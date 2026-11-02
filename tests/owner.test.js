import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { insertDemoReceipt } from './receipts.js';

test('metrics calculate multiple bookings, tied activities and cancellation from saved receipts', async () => {
  const f = await fixture();
  try {
    await insertDemoReceipt(f.database);
    await f.database.query(`INSERT INTO bookings (request_id,slot_id,quantity,customer_name,customer_email,payment_method,session_starts_at,
      original_unit_price_centavos,offer_unit_price_centavos,pricing_type,unit_price_centavos,commission_basis_points,total_price_centavos,platform_fee_centavos,provider_payout_centavos)
      SELECT gen_random_uuid(),id,2,'Second Demo','second@example.com','pay_on_site',starts_at,150000,120000,'standard',120000,1000,240000,24000,216000 FROM slots WHERE id=3`);
    const metrics = async () => {
      const response = await fetch(f.base+'/api/metrics');
      assert.equal(response.status,200);
      return response.json();
    };
    assert.deepEqual(await metrics(),{
      bookingCount:2,platformRevenueCentavos:54400,averageOrderValueCentavos:272000,
      topSellingService:{serviceId:1,serviceName:'Beginner Mug Handbuilding',seatsSold:2},nearlyFullSessionCount:0
    });
    await f.database.query('UPDATE slots SET capacity=2 WHERE id=3');
    assert.equal((await metrics()).nearlyFullSessionCount,0);
    await f.database.query("UPDATE bookings SET status='cancelled' WHERE slot_id=1");
    assert.deepEqual(await metrics(),{
      bookingCount:1,platformRevenueCentavos:24000,averageOrderValueCentavos:240000,
      topSellingService:{serviceId:3,serviceName:'Beginner Canvas Painting',seatsSold:2},nearlyFullSessionCount:0
    });
    await f.database.query('UPDATE services SET active=false WHERE id=3');
    assert.equal((await metrics()).nearlyFullSessionCount,0);
  } finally { await f.close(); }
});
test('owner catalog includes paused inventory; metrics use saved confirmed receipts and define empty values', async () => {
  const f=await fixture();
  try {
    const get=async path=>{const r=await fetch(f.base+path);assert.equal(r.status,200);return r.json();};
    assert.deepEqual(await get('/api/metrics'),{bookingCount:0,platformRevenueCentavos:0,averageOrderValueCentavos:0,topSellingService:null,nearlyFullSessionCount:0});
    assert.deepEqual(await get('/api/bookings'),[]);
    await insertDemoReceipt(f.database);
    await f.database.query('UPDATE slots SET capacity=2 WHERE id=1');
    let metrics=await get('/api/metrics');
    assert.equal(metrics.bookingCount,1); assert.equal(metrics.platformRevenueCentavos,30400); assert.equal(metrics.averageOrderValueCentavos,304000);
    assert.deepEqual(metrics.topSellingService,{serviceId:1,serviceName:'Beginner Mug Handbuilding',seatsSold:2}); assert.equal(metrics.nearlyFullSessionCount,0);
    await f.database.query("UPDATE slots SET status='paused' WHERE id=1");
    assert.equal((await get('/api/metrics')).nearlyFullSessionCount,0);
    const catalog=await get('/api/owner/catalog');assert.equal(catalog.discoveryHours,72);assert.equal(catalog.services.length,4);assert.equal(catalog.slots.length,8);assert.equal(catalog.slots[0].status,'paused');
    const receipts=await get('/api/bookings');assert.equal(receipts[0].totalPriceCentavos,304000);assert.equal(receipts[0].pricingType,'buddy');
    await f.database.query("UPDATE bookings SET status='cancelled'");
    assert.equal((await get('/api/metrics')).bookingCount,0);
  }finally{await f.close();}
});


test('nearly-full Owner metric counts one remaining seat but excludes sold-out sessions', async () => {
  const f = await fixture();
  try {
    await insertDemoReceipt(f.database); // 2 confirmed seats in a 4-seat allocation
    await f.database.query(`INSERT INTO bookings
      (request_id,slot_id,quantity,customer_name,customer_email,payment_method,session_starts_at,
       original_unit_price_centavos,offer_unit_price_centavos,pricing_type,unit_price_centavos,
       commission_basis_points,total_price_centavos,platform_fee_centavos,provider_payout_centavos)
      SELECT gen_random_uuid(),id,1,'Third Demo','third@example.com','pay_on_site',starts_at,
        200000,160000,'standard',160000,1000,160000,16000,144000 FROM slots WHERE id=1`);
    const getMetrics = async () => (await (await fetch(f.base+'/api/metrics')).json());
    assert.equal((await getMetrics()).nearlyFullSessionCount,1); // 1/4 available
    await f.database.query('UPDATE slots SET capacity=3 WHERE id=1');
    assert.equal((await getMetrics()).nearlyFullSessionCount,0); // sold out != almost full
    await f.database.query('UPDATE slots SET capacity=4 WHERE id=1');
    await f.database.query("UPDATE slots SET status='paused' WHERE id=1");
    assert.equal((await getMetrics()).nearlyFullSessionCount,0);
  } finally { await f.close(); }
});
