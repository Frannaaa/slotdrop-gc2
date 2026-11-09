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
