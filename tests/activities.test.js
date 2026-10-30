import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../server/app.js';
test('real studio discovery has one primary type, sourced prices and no bookable allocations', async()=>{
 const server = createApp().listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 const get = path=>fetch(base+path);
 try {
  const response=await get('/api/activities');assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.offerings.length,9);
  for(const row of data.offerings){assert.equal(row.partnershipConfirmed,false);assert.equal(row.slotdropSeatsVerified,false);assert.equal(row.slotdropDiscountVerified,false);assert.ok(row.pricePhp>0);assert.ok(row.sourceUrl.startsWith('https://'));assert.equal(typeof row.schedule,'string');assert.ok(!Object.hasOwn(row,'remainingSeats'));}
  const pottery=(await(await get('/api/activities?type=pottery')).json()).offerings;
  assert.equal(pottery.length,7);assert.ok(pottery.every(row=>row.activityType==='pottery'));
  const painting=(await(await get('/api/activities?type=painting')).json()).offerings;
  assert.deepEqual(painting.map(row=>row.id),['sip-open']);
  assert.equal((await(await get('/api/activities?type=pilates')).json()).offerings[0].durationMinutes,null);
  assert.equal((await(await get('/api/activities?tag=wheel-throwing&q=AMT')).json()).offerings.length,1);
  assert.equal((await(await get('/api/activities?type=pottery&area=Makati')).json()).offerings.length,0);
  for(const query of ['type=nails','tag=cheap','area=nope','q=a&q=b','foo=1','q=%00','type[foo]=pottery','q='+('a'.repeat(101))])assert.equal((await get('/api/activities?'+query)).status,400,query);
  assert.equal((await get('/api/activities/not-a-booking')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
