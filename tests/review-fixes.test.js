import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { insertDemoReceipt } from './receipts.js';
import { closeDatabase, validateProductionDatabase } from '../server/lib/lifecycle.js';
import { dateRange } from '../server/services/discovery.js';

test('tomorrow and blank search filters work through the HTTP/SQL boundary', async () => {
  const f=await fixture();
  try {
    const tomorrow=dateRange('tomorrow',f.now)[0].getTime();
    await f.db.query("UPDATE slots SET status='paused' WHERE id<>1");
    await f.db.query('UPDATE slots SET starts_at=$1,booking_closes_at=$2 WHERE id=1',[new Date(tomorrow+9*3600000),new Date(tomorrow+8*3600000)]);
    const get=async query=>{const r=await fetch(f.base+'/api/slots'+query);assert.equal(r.status,200);return r.json();};
    assert.deepEqual((await get('?when=tomorrow')).map(s=>s.id),[1]);
    assert.deepEqual(await get('?when=today'),[]);
    assert.deepEqual((await get('?q=%20%20')).map(s=>s.id),(await get('')).map(s=>s.id));
  } finally { await f.close(); }
});

test('the public owner list has no customer contact, retry key or future private columns', async () => {
  const f=await fixture();
  try {
    await insertDemoReceipt(f.database);
    await f.db.query("ALTER TABLE bookings ADD COLUMN private_support_note TEXT DEFAULT 'not public'");
    const response=await fetch(f.base+'/api/bookings');
    assert.equal(response.status,200);
    const [summary]=await response.json();
    for (const key of ['customerName','customerEmail','requestId','privateSupportNote']) assert.equal(Object.hasOwn(summary,key),false,key);
    assert.equal(summary.totalPriceCentavos,304000);
    assert.equal(summary.quantity,2);
    assert.equal(summary.serviceName,'Beginner Mug Handbuilding');
    const [stored]=(await f.db.query('SELECT customer_name,customer_email,request_id FROM bookings')).rows;
    assert.equal(stored.customer_email,'demo@example.com');
    assert.equal(stored.customer_name,'Demo');
    assert.ok(stored.request_id);
  } finally { await f.close(); }
});

test('offer edits after session start return 409 without altering inventory or receipts', async () => {
  let now;
  const f=await fixture({clock:()=>now});
  try {
    await insertDemoReceipt(f.database);
    const before=(await f.db.query('SELECT * FROM slots WHERE id=1')).rows;
    const receipts=(await f.db.query('SELECT * FROM bookings')).rows;
    now=new Date(before[0].starts_at);
    for (const body of [{capacity:5},{offerPriceCentavos:159000},{status:'paused'}]) {
      const response=await fetch(f.base+'/api/slots/1',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      assert.equal(response.status,409);
      assert.equal((await response.json()).error.code,'SESSION_STARTED');
    }
    assert.deepEqual((await f.db.query('SELECT * FROM slots WHERE id=1')).rows,before);
    assert.deepEqual((await f.db.query('SELECT * FROM bookings')).rows,receipts);
  } finally { await f.close(); }
});

test('database shutdown rejection is handled without logging its sensitive message', async () => {
  const messages=[];
  const closed=await closeDatabase({close:async()=>{throw Object.assign(new Error('postgres://secret'),{code:'ECONNRESET'});}},(...args)=>messages.push(args));
  assert.equal(closed,false);
  assert.deepEqual(messages,[['Database shutdown failed:','ECONNRESET']]);
  assert.equal(await closeDatabase({close:()=>undefined}),true);
});

test('production refuses to start without database configuration but local demos remain supported', () => {
  assert.throws(() => validateProductionDatabase({ NODE_ENV:'production' }), /DATABASE_URL is required/);
  assert.throws(() => validateProductionDatabase({ NODE_ENV:'production',DATABASE_URL:'  ' }), /DATABASE_URL is required/);
  assert.doesNotThrow(() => validateProductionDatabase({ NODE_ENV:'development' }));
  assert.doesNotThrow(() => validateProductionDatabase({ NODE_ENV:'test' }));
  assert.doesNotThrow(() => validateProductionDatabase({ NODE_ENV:'production',DATABASE_URL:'postgresql://redacted.invalid/db' }));
});
