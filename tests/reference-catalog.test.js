import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixture} from './helpers.js';
import {ensureReferenceCatalog,referenceCatalog} from '../server/repositories/reference-catalog.js';
import {migrateDatabase} from '../server/repositories/migrations.js';
import {insertDemoReceipt} from './receipts.js';

test('real studio demo installation is additive and preserves legacy receipts and dates',async()=>{
 const f=await fixture();
 try {
  await insertDemoReceipt(f.database);
  const receipts=(await f.db.query('SELECT * FROM bookings')).rows;
  const originalSlots=(await f.db.query('SELECT * FROM slots ORDER BY id')).rows;
  await Promise.all([ensureReferenceCatalog(f.db),ensureReferenceCatalog(f.db)]);await ensureReferenceCatalog(f.db);
  assert.deepEqual((await f.db.query('SELECT * FROM bookings')).rows,receipts);
  assert.deepEqual((await f.db.query('SELECT * FROM slots WHERE id<=8 ORDER BY id')).rows,originalSlots);
  const rows=await(await fetch(f.base+'/api/slots')).json();
  assert.equal(rows.filter(row=>row.startsAt!==null).length,16);
  assert.equal(rows.filter(row=>row.startsAt===null).length,2);
  assert.ok(rows.every(r=>r.studioReference?.bookingIsSimulated));
  assert.ok(rows.every(r=>!r.providerName.startsWith('Demo ')));
  assert.equal(new Set(rows.map(r=>r.providerName)).size,5);
  assert.ok(rows.every(r=>r.originalPriceCentavos===r.studioReference.publishedPriceCentavos));
  assert.ok(rows.every(r=>r.studioReference.partnershipConfirmed===false));
  assert.equal((await(await fetch(f.base+'/api/slots/1')).json()).serviceActive,false);
 }finally{await f.close();}
});

test('fresh seed stores the sourced catalog and 16 sample sessions in the database',async()=>{
 const f=await fixture();
 try {
  await f.db.query('TRUNCATE bookings,slots,services,providers RESTART IDENTITY CASCADE');
  await f.database.exec(await readFile(new URL('../db/seed.sql',import.meta.url),'utf8'));
  const rows=await(await fetch(f.base+'/api/slots')).json();
  assert.equal(rows.length,16);
  assert.equal((await f.db.query('SELECT COUNT(*)::int AS n FROM services')).rows[0].n,referenceCatalog.offerings.length);
  const mug=rows.find(r=>r.studioReference.key==='laro-mug');
  assert.equal(mug.providerName,'Laro Ceramics');assert.equal(mug.originalPriceCentavos,300000);
  assert.equal(mug.offerPriceCentavos,270000);assert.equal(mug.buddyPriceCentavos,256500);

 }finally{await f.close();}
});

test('practice offers stay bookable after scheduled dates pass and keep their saved seat limits', async () => {
 let now;
 const f=await fixture({clock:()=>now});
 now=f.now;
 try {
  // Restore the previous column requirements to test the upgrade on existing rows.
  await f.db.query('ALTER TABLE slots ALTER COLUMN starts_at SET NOT NULL, ALTER COLUMN booking_closes_at SET NOT NULL');
  await f.db.query('ALTER TABLE bookings ALTER COLUMN session_starts_at SET NOT NULL');
  const before=(await f.db.query('SELECT * FROM slots ORDER BY id')).rows;
  await migrateDatabase(f.db);
  await migrateDatabase(f.db);
  assert.deepEqual((await f.db.query('SELECT * FROM slots ORDER BY id')).rows,before);
  await Promise.all([ensureReferenceCatalog(f.db),ensureReferenceCatalog(f.db)]);

  const get=path=>fetch(f.base+path);
  const send=(path,method,body)=>fetch(f.base+path,{
   method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body),
  });
  const response=await get('/api/slots?page=1&limit=6');
  assert.equal(response.status,200);
  const firstPage=await response.json();
  const scheduled=firstPage.find(row=>row.startsAt!==null);
  assert.ok(scheduled);
  assert.equal(firstPage.filter(row=>row.startsAt===null).length,2);
  now=new Date(f.now.getTime()+60*24*3600000);
  const practice=await (await get('/api/slots?page=1&limit=6')).json();
  assert.equal(practice.length,2);
  assert.ok(practice.every(slot=>slot.startsAt===null && slot.bookingClosesAt===null));
  const [slot]=practice;
  await assert.rejects(
   f.db.query('UPDATE slots SET booking_closes_at=NOW() WHERE id=$1',[slot.id]),
   error=>error.code==='23514',
  );

  assert.deepEqual(await (await get('/api/slots?when=today')).json(),[]);
  assert.equal((await get('/api/pricing/quote?slotId='+scheduled.id+'&quantity=1')).status,409);
  assert.equal((await send('/api/slots/'+slot.id,'PATCH',{capacity:2})).status,200);
  assert.equal((await send('/api/slots/'+slot.id,'PATCH',{bookingClosesAt:now.toISOString()})).status,400);
  assert.equal((await send('/api/slots/'+slot.id,'PATCH',{status:'paused'})).status,200);
  const quotePath='/api/pricing/quote?slotId='+slot.id+'&quantity=2';
  assert.equal((await get(quotePath)).status,409);
  assert.equal((await send('/api/slots/'+slot.id,'PATCH',{status:'open'})).status,200);

  const quoteResponse=await get(quotePath);
  assert.equal(quoteResponse.status,200);
  const quote=await quoteResponse.json();
  const payload={requestId:crypto.randomUUID(),slotId:slot.id,quantity:2,
   customerName:'Practice Guest',customerEmail:'practice@example.com',paymentMethod:'mock_card',
   expectedTotalCentavos:quote.totalPriceCentavos};
  const confirmation=await send('/api/bookings','POST',payload);
  assert.equal(confirmation.status,201);
  const receipt=await confirmation.json();
  assert.equal(receipt.sessionStartsAt,null);
  assert.deepEqual(await (await get('/api/bookings/'+receipt.id)).json(),receipt);
  assert.equal((await (await get('/api/bookings')).json()).find(row=>row.id===receipt.id).sessionStartsAt,null);
  assert.equal((await send('/api/bookings','POST',payload)).status,200);
  assert.equal((await send('/api/bookings','POST',{...payload,requestId:crypto.randomUUID()})).status,409);

  await ensureReferenceCatalog(f.db);
  const soldOut=await (await get('/api/slots/'+slot.id)).json();
  assert.equal(soldOut.remainingSeats,0);
  assert.equal(soldOut.capacity,2);
  assert.deepEqual(await (await get('/api/bookings/'+receipt.id)).json(),receipt);
 } finally { await f.close(); }
});

test('startup does not silently recreate deliberately cleared scheduled inventory',async()=>{
 const f=await fixture();
 try{
  await ensureReferenceCatalog(f.db);
  const key=referenceCatalog.offerings[0].key;
  const {rows:[service]}=await f.db.query('SELECT id FROM services WHERE reference_key=$1',[key]);
  assert.ok(service);
  const count=async()=>Number((await f.db.query('SELECT COUNT(*) AS n FROM slots WHERE service_id=$1 AND starts_at IS NOT NULL',[service.id])).rows[0].n);
  assert.equal(await count(),2);
  await f.db.query('DELETE FROM slots WHERE service_id=$1 AND starts_at IS NOT NULL',[service.id]);
  assert.equal(await count(),0);
  await ensureReferenceCatalog(f.db);
  await ensureReferenceCatalog(f.db);
  assert.equal(await count(),0,'Restart must not recreate removed session allocations');
  assert.equal((await f.db.query('SELECT COUNT(*)::int AS n FROM services WHERE reference_key=$1',[key])).rows[0].n,1);
 }finally{await f.close();}
});

test('legacy backfill targets fictional providers without rewriting same-named real activities',async()=>{
 const f=await fixture();
 try{
  const {rows:[provider]}=await f.db.query(
   "INSERT INTO providers(name,city,area) VALUES('Independent Studio','Quezon City','UP Village') RETURNING id");
  const {rows:[service]}=await f.db.query(
   `INSERT INTO services(provider_id,name,category,duration_minutes,recurrence_note,
      default_booking_cutoff_minutes,activity_type,preparation_note)
    VALUES($1,'Beginner Mug Handbuilding','creative',120,'Custom activity',90,'other','Keep this studio-authored note')
    RETURNING id`,[provider.id]);
  // Simulate a legacy demo record that genuinely still needs its original backfill.
  await f.db.query("UPDATE services SET activity_type='other',technique=NULL,preparation_note='Legacy placeholder' WHERE id=1");
  await migrateDatabase(f.db);
  await migrateDatabase(f.db);
  const {rows:[custom]}=await f.db.query('SELECT activity_type,preparation_note FROM services WHERE id=$1',[service.id]);
  assert.equal(custom.activity_type,'other');
  assert.equal(custom.preparation_note,'Keep this studio-authored note');
  const {rows:[legacy]}=await f.db.query('SELECT activity_type,technique FROM services WHERE id=1');
  assert.equal(legacy.activity_type,'pottery');
  assert.equal(legacy.technique,'handbuilding');
 }finally{await f.close();}
});

test('catalog startup retires only old fictional fixtures, not newly created services',async()=>{
 const f=await fixture();
 try{
  const {rows:[custom]}=await f.db.query(`INSERT INTO services
    (provider_id,name,category,duration_minutes,recurrence_note,default_booking_cutoff_minutes)
    VALUES(1,'New owner-created course','creative',90,'User-created demo offering',60)
    RETURNING id`);
  await ensureReferenceCatalog(f.db);
  await ensureReferenceCatalog(f.db);
  const {rows:[newService]}=await f.db.query('SELECT active FROM services WHERE id=$1',[custom.id]);
  const {rows:oldServices}=await f.db.query('SELECT active FROM services WHERE id BETWEEN 1 AND 4 ORDER BY id');
  assert.equal(newService.active,true,'Startup must not deactivate unrelated user-created services');
  assert.ok(oldServices.every(row=>row.active===false),'Original retired fixture activities remain inactive');
 }finally{await f.close();}
});

test('startup rolls expired reference sessions forward without touching past sessions or receipts',async()=>{
 const f=await fixture();
 try{
  await ensureReferenceCatalog(f.db);
  const key=referenceCatalog.offerings[0].key;
  const {rows:[service]}=await f.db.query('SELECT id FROM services WHERE reference_key=$1',[key]);
  const {rows:[slot]}=await f.db.query('SELECT id FROM slots WHERE service_id=$1 ORDER BY starts_at LIMIT 1',[service.id]);
  const quote=await (await fetch(f.base+'/api/pricing/quote?slotId='+slot.id+'&quantity=1')).json();
  const saved=await fetch(f.base+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   requestId:crypto.randomUUID(),slotId:Number(slot.id),quantity:1,customerName:'Fictional QA',customerEmail:'qa@example.com',
   paymentMethod:'mock_card',expectedTotalCentavos:quote.totalPriceCentavos})});
  const receipt=await saved.json();
  assert.equal(saved.status,201,JSON.stringify({quote,receipt}));
  // Simulate a deployment that kept running after every sample date passed.
  await f.db.query("UPDATE slots SET starts_at=starts_at-INTERVAL '10 days',booking_closes_at=booking_closes_at-INTERVAL '10 days' WHERE service_id=$1",[service.id]);
  const past=(await f.db.query('SELECT id,starts_at FROM slots WHERE service_id=$1 ORDER BY id',[service.id])).rows;
  const upcoming=async()=>Number((await f.db.query('SELECT COUNT(*) AS n FROM slots WHERE service_id=$1 AND starts_at>NOW()',[service.id])).rows[0].n);
  assert.equal(await upcoming(),0);
  await ensureReferenceCatalog(f.db);
  await ensureReferenceCatalog(f.db);
  assert.equal(await upcoming(),2,'Two fresh sample sessions, added once');
  assert.deepEqual((await f.db.query('SELECT id,starts_at FROM slots WHERE id=ANY($1) ORDER BY id',[past.map(r=>r.id)])).rows,past,'Past sessions keep their dates');
  const readback=await (await fetch(f.base+'/api/bookings/'+receipt.id)).json();
  assert.equal(readback.slotId,Number(slot.id));assert.equal(readback.totalPriceCentavos,receipt.totalPriceCentavos);
  const other=(await f.db.query("SELECT COUNT(*)::int AS n FROM slots s JOIN services v ON v.id=s.service_id WHERE v.reference_key<>$1 AND s.starts_at>NOW()",[key])).rows[0].n;
  assert.equal(other,14,'Services with upcoming sessions get nothing extra');
 }finally{await f.close();}
});

test('inactive reference activities are not rolled forward',async()=>{
 const f=await fixture();
 try{
  await ensureReferenceCatalog(f.db);
  const key=referenceCatalog.offerings[1].key;
  const {rows:[service]}=await f.db.query('UPDATE services SET active=false WHERE reference_key=$1 RETURNING id',[key]);
  await f.db.query("UPDATE slots SET starts_at=starts_at-INTERVAL '10 days',booking_closes_at=booking_closes_at-INTERVAL '10 days' WHERE service_id=$1",[service.id]);
  await ensureReferenceCatalog(f.db);
  assert.equal(Number((await f.db.query('SELECT COUNT(*) AS n FROM slots WHERE service_id=$1',[service.id])).rows[0].n),2);
 }finally{await f.close();}
});

test('sessions that start later but are past their booking cutoff do not block the roll-forward',async()=>{
 const f=await fixture();
 try{
  await ensureReferenceCatalog(f.db);
  const key=referenceCatalog.offerings[2].key;
  const {rows:[service]}=await f.db.query('SELECT id FROM services WHERE reference_key=$1',[key]);
  // Every session still starts in the future, but customers can no longer book any of them.
  await f.db.query("UPDATE slots SET starts_at=NOW()+INTERVAL '30 minutes',booking_closes_at=NOW()-INTERVAL '1 minute' WHERE id=(SELECT MIN(id) FROM slots WHERE service_id=$1 AND starts_at IS NOT NULL)",[service.id]);
  await f.db.query("UPDATE slots SET starts_at=NOW()+INTERVAL '40 minutes',booking_closes_at=NOW()-INTERVAL '2 minutes' WHERE id=(SELECT MAX(id) FROM slots WHERE service_id=$1 AND starts_at IS NOT NULL)",[service.id]);
  const bookable=async()=>Number((await f.db.query('SELECT COUNT(*) AS n FROM slots WHERE service_id=$1 AND booking_closes_at>NOW()',[service.id])).rows[0].n);
  assert.equal(await bookable(),0);
  await ensureReferenceCatalog(f.db);
  await ensureReferenceCatalog(f.db);
  assert.equal(await bookable(),2,'Two bookable sample sessions, added once');
 }finally{await f.close();}
});

test('paused or sold-out sessions with a future cutoff do not block the roll-forward',async()=>{
 const f=await fixture();
 try{
  await ensureReferenceCatalog(f.db);
  const serviceFor=async index=>(await f.db.query('SELECT id FROM services WHERE reference_key=$1',[referenceCatalog.offerings[index].key])).rows[0].id;
  const open=async id=>Number((await f.db.query("SELECT COUNT(*) AS n FROM slots WHERE service_id=$1 AND booking_closes_at>NOW() AND status='open'",[id])).rows[0].n);
  // Paused: the owner paused every session, but they still start later.
  const paused=await serviceFor(3);
  await f.db.query("UPDATE slots SET status='paused' WHERE service_id=$1",[paused]);
  // Sold out: every seat in every session is booked through the real API.
  const soldOut=await serviceFor(4);
  for(const {id,capacity} of (await f.db.query('SELECT id,capacity FROM slots WHERE service_id=$1',[soldOut])).rows){
   const quote=await (await fetch(f.base+'/api/pricing/quote?slotId='+id+'&quantity='+capacity)).json();
   const saved=await fetch(f.base+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    requestId:crypto.randomUUID(),slotId:Number(id),quantity:Number(capacity),customerName:'Fictional QA',customerEmail:'qa@example.com',
    paymentMethod:'mock_card',expectedTotalCentavos:quote.totalPriceCentavos})});
   assert.equal(saved.status,201,JSON.stringify(await saved.json()));
  }
  // Move them off the start times the roll-forward would generate, so the test checks the counting rule
  // rather than the (service, start time) uniqueness that already prevents duplicate sessions.
  for(const id of [paused,soldOut]){
   await f.db.query("UPDATE slots SET starts_at=NOW()+INTERVAL '2 hours',booking_closes_at=NOW()+INTERVAL '1 hour' WHERE id=(SELECT MIN(id) FROM slots WHERE service_id=$1)",[id]);
   await f.db.query("UPDATE slots SET starts_at=NOW()+INTERVAL '3 hours',booking_closes_at=NOW()+INTERVAL '1 hour' WHERE id=(SELECT MAX(id) FROM slots WHERE service_id=$1)",[id]);
  }
  assert.equal(await open(paused),0);
  await ensureReferenceCatalog(f.db);
  await ensureReferenceCatalog(f.db);
  assert.equal(await open(paused),2,'Two open sessions added next to the paused ones, once');
  const bookableSoldOut=Number((await f.db.query("SELECT COUNT(*) AS n FROM slots sl WHERE sl.service_id=$1 AND sl.booking_closes_at>NOW() AND sl.capacity>COALESCE((SELECT SUM(quantity) FROM bookings WHERE slot_id=sl.id AND status='confirmed'),0)",[soldOut])).rows[0].n);
  assert.equal(bookableSoldOut,2,'Two bookable sessions added after the sold-out ones, once');
  assert.equal(Number((await f.db.query("SELECT COUNT(*) AS n FROM slots WHERE service_id=$1 AND status='paused'",[paused])).rows[0].n),2,'Paused sessions stay paused');
 }finally{await f.close();}
});
