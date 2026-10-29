import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { migrateDatabase } from '../server/repositories/migrations.js';
import { insertDemoReceipt } from './receipts.js';

test('primary types, overlapping facts and literal search share one session inventory',async()=>{
 const f=await fixture();try{
 const get=async query=>{const response=await fetch(f.base+'/api/slots'+query);assert.equal(response.status,200);return response.json();};
 const all=await get(''),pottery=await get('?type=pottery'),painting=await get('?type=painting'),dance=await get('?type=dance');
 assert.equal(pottery.length,4);assert.equal(painting.length,2);assert.equal(dance.length,2);
 assert.equal(new Set([...pottery,...painting,...dance].map(row=>row.id)).size,all.length);
 assert.ok(pottery.every(row=>row.activityType==='pottery'));assert.ok(pottery.some(row=>row.technique==='ceramic-decoration'));
 assert.equal((await get('?q=painting')).length,6);assert.equal((await get('?tag=painting-included')).length,4);
 assert.equal((await get('?type=painting&tag=painting-included')).length,0);
 assert.equal((await get('?tag=handbuilding')).length,2);assert.equal((await get('?tag=materials-included')).length,6);
 assert.equal((await get('?type=pottery&people=7')).length,0);
 assert.equal((await get('?type=pottery&category=active')).length,0);
 assert.equal((await get('?q=%25')).length,0);
 const detail=await(await fetch(f.base+'/api/slots/1')).json();assert.ok(detail.inclusions.includes('firing'));assert.match(detail.preparationNote,/collection/);assert.match(detail.cancellationNote,/demo/i);
 await f.db.query('UPDATE services SET beginner_friendly=false WHERE id=1');assert.equal((await get('?tag=beginner')).length,6);
 for(const query of ['type=nails','type=pottery&type=painting','tag=popular','sort=nearby','sort=price-low&sort=soonest','tag=%00'])assert.equal((await fetch(f.base+'/api/slots?'+query)).status,400,query);
 }finally{await f.close();}
});

test('price sorting uses the stored tier for the requested party size',async()=>{
 const f=await fixture();try{
 await f.db.query('UPDATE slots SET buddy_price_centavos=100000 WHERE id=1');
 await f.db.query('UPDATE slots SET offer_price_centavos=150000 WHERE id=5');
 const ids=async people=>(await(await fetch(f.base+`/api/slots?type=pottery&sort=price-low&people=${people}`)).json()).map(row=>row.id);
 assert.deepEqual((await ids(1)),[2,6,5,1]);assert.deepEqual((await ids(2)),[2,6,1,5]);
 const desc=await(await fetch(f.base+'/api/slots?sort=price-high&people=2')).json();
 const prices=desc.map(row=>row.buddyPriceCentavos??row.offerPriceCentavos);assert.deepEqual(prices,[...prices].sort((a,b)=>b-a));
 }finally{await f.close();}
});

test('legacy schema upgrade is repeatable and preserves receipts, seats and customized metadata',async()=>{
 const f=await fixture();try{
 await insertDemoReceipt(f.database);
 const before=await f.db.query('SELECT * FROM bookings ORDER BY id');
 const inventory=await f.db.query('SELECT * FROM slots ORDER BY id');
 for(const column of ['activity_type','technique','inclusions','preparation_note','cancellation_note'])await f.db.query('ALTER TABLE services DROP COLUMN '+column);
 await migrateDatabase(f.db);await migrateDatabase(f.db);
 assert.deepEqual((await f.db.query('SELECT * FROM bookings ORDER BY id')).rows,before.rows);
 assert.deepEqual((await f.db.query('SELECT * FROM slots ORDER BY id')).rows,inventory.rows);
 assert.equal((await f.db.query('SELECT activity_type FROM services WHERE id=1')).rows[0].activity_type,'pottery');
 await f.db.query("UPDATE services SET preparation_note='Custom verified note' WHERE id=1");await migrateDatabase(f.db);
 assert.equal((await f.db.query('SELECT preparation_note FROM services WHERE id=1')).rows[0].preparation_note,'Custom verified note');
 }finally{await f.close();}
});
