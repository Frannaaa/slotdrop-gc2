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
  assert.equal(rows.length,16);assert.ok(rows.every(r=>r.studioReference?.bookingIsSimulated));
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

test('startup does not silently recreate deliberately cleared reference inventory',async()=>{
 const f=await fixture();
 try{
  await ensureReferenceCatalog(f.db);
  const key=referenceCatalog.offerings[0].key;
  const {rows:[service]}=await f.db.query('SELECT id FROM services WHERE reference_key=$1',[key]);
  assert.ok(service);
  const count=async()=>Number((await f.db.query('SELECT COUNT(*) AS n FROM slots WHERE service_id=$1',[service.id])).rows[0].n);
  assert.equal(await count(),2);
  await f.db.query('DELETE FROM slots WHERE service_id=$1',[service.id]);
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
  await f.db.query("UPDATE slots SET starts_at=NOW()+INTERVAL '30 minutes',booking_closes_at=NOW()-INTERVAL '1 minute' WHERE id=(SELECT MIN(id) FROM slots WHERE service_id=$1)",[service.id]);
  await f.db.query("UPDATE slots SET starts_at=NOW()+INTERVAL '40 minutes',booking_closes_at=NOW()-INTERVAL '2 minutes' WHERE id=(SELECT MAX(id) FROM slots WHERE service_id=$1)",[service.id]);
  const bookable=async()=>Number((await f.db.query('SELECT COUNT(*) AS n FROM slots WHERE service_id=$1 AND booking_closes_at>NOW()',[service.id])).rows[0].n);
  assert.equal(await bookable(),0);
  await ensureReferenceCatalog(f.db);
  await ensureReferenceCatalog(f.db);
  assert.equal(await bookable(),2,'Two bookable sample sessions, added once');
 }finally{await f.close();}
});
