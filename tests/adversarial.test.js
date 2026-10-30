import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { fixture } from './helpers.js';
import { insertDemoReceipt } from './receipts.js';

test('invalid and oversized edits leave inventory and saved receipts unchanged', async () => {
  const f = await fixture();
  try {
    await insertDemoReceipt(f.database);
    const snapshot = async () => ({
      slots:(await f.database.query('SELECT * FROM slots ORDER BY id')).rows,
      bookings:(await f.database.query('SELECT * FROM bookings ORDER BY id')).rows,
    });
    const before = await snapshot();
    for (const [body, expected] of [
      [{capacity:0},400], [{capacity:101},400], [{capacity:1},409],
      [{capacity:1.2},400], [{capacity:'4'},400], [{capacity:null},400],
      [{offerPriceCentavos:200000},400], [{offerPriceCentavos:1},400],
      [{offerPriceCentavos:160000.5},400], [{buddyPriceCentavos:160000},400],
      [{status:'cancelled'},409], [{status:'OPEN'},400],
      [{bookingClosesAt:'2028-02-30T00:00:00Z'},400],
      [{bookingClosesAt:'0000-01-01T00:00:00Z'},400],
      [{bookingClosesAt:'9999-12-31T23:59:59.999-23:59'},400],
      [{startsAt:'2028-01-01T00:00:00Z'},400], [[],400], [null,400], [{},400],
    ]) {
      const response = await fetch(f.base+'/api/slots/1', {method:'PATCH',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      assert.equal(response.status, expected, JSON.stringify(body));
      const json = await response.json();
      assert.equal(typeof json.error.code, 'string');
      assert.ok(!('stack' in json.error));
    }
    for (const compressed of [false,true]) {
      const text=JSON.stringify({capacity:4,padding:'x'.repeat(20000)});
      const response=await fetch(f.base+'/api/slots/1', {method:'PATCH',
        headers:{'Content-Type':'application/json',...(compressed?{'Content-Encoding':'gzip'}:{})},
        body:compressed?gzipSync(text):text});
      assert.equal(response.status,413);
      assert.equal((await response.json()).error.code,'PAYLOAD_TOO_LARGE');
    }
    assert.deepEqual(await snapshot(), before);
  } finally { await f.close(); }
});

test('concurrent duplicate creates and conflicting edits preserve one session and receipt totals', async () => {
  const f = await fixture();
  try {
    await insertDemoReceipt(f.database);
    const receiptBefore=(await f.database.query('SELECT * FROM bookings')).rows;
    const body={serviceId:1,startsAt:new Date(f.now.getTime()+24*3600000+12345).toISOString(),
      capacity:4,originalPriceCentavos:200000,offerPriceCentavos:160000,runsAsScheduled:true};
    const send=(path,method,data)=>fetch(f.base+path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const creates=await Promise.all(Array.from({length:6},()=>send('/api/slots','POST',body)));
    assert.equal(creates.filter(r=>r.status===201).length,1);
    assert.equal(creates.filter(r=>r.status===409).length,5);
    assert.equal(Number((await f.database.query('SELECT COUNT(*) AS count FROM slots')).rows[0].count),9);
    const extreme=await send('/api/slots','POST',{...body,startsAt:'9999-12-31T23:59:59.999-23:59'});
    assert.equal(extreme.status,400);
    const edits=await Promise.all([
      send('/api/slots/1','PATCH',{capacity:1}),
      send('/api/slots/1','PATCH',{capacity:2}),
      send('/api/slots/1','PATCH',{status:'cancelled'}),
      send('/api/slots/1','PATCH',{offerPriceCentavos:161000}),
    ]);
    assert.deepEqual(edits.map(r=>r.status),[409,200,409,200]);
    const slot=await (await fetch(f.base+'/api/slots/1')).json();
    assert.equal(slot.capacity,2);
    assert.equal(slot.remainingSeats,0);
    assert.equal(slot.offerPriceCentavos,161000);
    assert.equal(slot.status,'open');
    assert.deepEqual((await f.database.query('SELECT * FROM bookings')).rows,receiptBefore);
    const list=await (await fetch(f.base+'/api/slots')).json();
    assert.ok(list.every(row=>row.id!==1));
  } finally { await f.close(); }
});
