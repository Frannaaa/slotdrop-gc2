import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixture} from './helpers.js';
import {ensureReferenceCatalog,referenceCatalog} from '../server/repositories/reference-catalog.js';
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
