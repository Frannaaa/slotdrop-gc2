import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
test('PostgreSQL serializes an owner capacity edit behind a booking transaction', {skip:!process.env.TEST_DATABASE_URL}, async () => {
  const f=await fixture();
  let locked, release, booking, edit;
  const gotLock=new Promise(resolve=>{locked=resolve;});
  const continueBooking=new Promise(resolve=>{release=resolve;});
  try {
    booking=f.db.transaction(async client=>{
      await client.query('SELECT id FROM slots WHERE id=1 FOR UPDATE');
      locked((await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
      await continueBooking;
      await client.query(`INSERT INTO bookings (request_id,slot_id,quantity,customer_name,customer_email,payment_method,session_starts_at,
        original_unit_price_centavos,offer_unit_price_centavos,pricing_type,unit_price_centavos,commission_basis_points,total_price_centavos,platform_fee_centavos,provider_payout_centavos)
        SELECT '12345678-0000-4000-8000-000000000001',id,2,'Demo','demo@example.com','mock_card',starts_at,200000,160000,'buddy',152000,1000,304000,30400,273600 FROM slots WHERE id=1`);
    });
    const lockOwner = await gotLock;
    let finished=false;
    edit=fetch(f.base+'/api/slots/1',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({capacity:1})}).then(response=>{finished=true;return response;});
    // Observe the real blocking relationship rather than assuming a 150ms delay.
    let waiting=false;
    const deadline=performance.now()+5000;
    while (!waiting && performance.now()<deadline) {
      waiting=(await f.db.query('SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))) AS waiting',[lockOwner])).rows[0].waiting;
      if (!waiting) await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert.equal(waiting,true,'The edit must reach PostgreSQL and wait for the booking lock.');
    assert.equal(finished,false);
    release(); await booking;
    const response=await edit;
    assert.equal(response.status,409);
    assert.equal((await response.json()).error.code,'CAPACITY_CONFLICT');
    assert.equal((await f.database.query('SELECT capacity FROM slots WHERE id=1')).rows[0].capacity,4);
  } finally { release(); await Promise.allSettled([booking,edit]); await f.close(); }
});
