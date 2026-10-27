import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { insertDemoReceipt } from './receipts.js';
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
    assert.deepEqual(metrics.topSellingService,{serviceId:1,serviceName:'Beginner Mug Handbuilding',seatsSold:2}); assert.equal(metrics.nearlyFullSessionCount,1);
    await f.database.query("UPDATE slots SET status='paused' WHERE id=1");
    assert.equal((await get('/api/metrics')).nearlyFullSessionCount,0);
    const catalog=await get('/api/owner/catalog');assert.equal(catalog.discoveryHours,72);assert.equal(catalog.services.length,4);assert.equal(catalog.slots.length,8);assert.equal(catalog.slots[0].status,'paused');
    const receipts=await get('/api/bookings');assert.equal(receipts[0].totalPriceCentavos,304000);assert.equal(receipts[0].pricingType,'buddy');
    await f.database.query("UPDATE bookings SET status='cancelled'");
    assert.equal((await get('/api/metrics')).bookingCount,0);
  }finally{await f.close();}
});
