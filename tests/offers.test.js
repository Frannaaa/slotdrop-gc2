import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { insertDemoReceipt } from './receipts.js';
test('creation resolves activity defaults and explicit cutoffs without changing the default', async () => {
  const f = await fixture();
  try {
    const startsAt = new Date(f.now.getTime()+10*3600000).toISOString();
    const body = {serviceId:1,startsAt,capacity:4,originalPriceCentavos:200000,offerPriceCentavos:160000,buddyPriceCentavos:152000,runsAsScheduled:true};
    const send = async value => { const r=await fetch(f.base+'/api/slots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});return [r.status,await r.json()]; };
    const [status, created] = await send(body);
    assert.equal(status,201);
    assert.equal(Date.parse(created.startsAt)-Date.parse(created.bookingClosesAt),180*60000);
    assert.equal((await send(body))[0],409);
    assert.equal((await send({...body,serviceId:4,bookingClosesAt:new Date(f.now.getTime()+9.75*3600000).toISOString()}))[0],201);
    assert.equal((await f.database.query('SELECT default_booking_cutoff_minutes FROM services WHERE id=4')).rows[0].default_booking_cutoff_minutes,30);
    for (const invalid of [{capacity:0},{offerPriceCentavos:200000},{buddyPriceCentavos:160000},{runsAsScheduled:false},{bookingClosesAt:startsAt},{providerId:99},{capacity:null},{offerPriceCentavos:'160000'},{startsAt:'2027-02-30T12:00:00Z'}]) assert.equal((await send({...body,...invalid}))[0],400);
    assert.equal((await send({...body,serviceId:999}))[0],404);
  } finally { await f.close(); }
});
test('locked edits reject overshrinking/cancellation, preserve receipts and adjust buddy rates atomically', async () => {
  const f = await fixture();
  try {
    await insertDemoReceipt(f.database);
    const edit=async body=>{const r=await fetch(f.base+'/api/slots/1',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return [r.status,await r.json()];};
    assert.equal((await edit({capacity:1}))[0],409);
    assert.equal((await edit({status:'cancelled'}))[0],409);
    assert.equal((await edit({startsAt:new Date().toISOString()}))[0],400);
    assert.equal((await edit({offerPriceCentavos:150000}))[0],400);
    assert.equal((await edit({offerPriceCentavos:150000,buddyPriceCentavos:null,status:'paused'}))[0],200);
    const saved=(await f.database.query('SELECT * FROM bookings')).rows[0];
    assert.equal(saved.unit_price_centavos,152000);assert.equal(saved.offer_unit_price_centavos,160000);
    assert.equal((await edit({bookingClosesAt:new Date(f.now.getTime()-1000).toISOString(),status:'open'}))[0],200);
    const list=await (await fetch(f.base+'/api/slots')).json(); assert.ok(!list.some(row=>row.id===1));
    assert.equal((await edit({capacity:2}))[1].remainingSeats,0);
  } finally { await f.close(); }
});
