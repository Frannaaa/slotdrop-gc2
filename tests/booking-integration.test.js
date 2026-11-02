import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

test('public booking save, replay, owner IDs and receipt readback cannot reveal contacts or retry keys', async () => {
  const f = await fixture();
  const body = {requestId:randomUUID(),slotId:1,quantity:2,customerName:'  Demo Guest  ',customerEmail:'demo@example.com',paymentMethod:'mock_card',expectedTotalCentavos:304000};
  const post = () => fetch(f.base+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const safe = receipt => {
    for (const field of ['requestId','customerName','customerEmail','privateNote','private_note']) assert.equal(field in receipt,false,field+' must remain private');
  };
  try {
    await f.database.exec("ALTER TABLE bookings ADD COLUMN private_note TEXT DEFAULT 'internal only'");
    const firstResponse=await post();assert.equal(firstResponse.status,201);
    const first=await firstResponse.json();safe(first);
    const stored=(await f.database.query('SELECT customer_name,customer_email,request_id FROM bookings WHERE id=$1',[first.id])).rows[0];
    assert.equal(stored.customer_name,'Demo Guest');assert.equal(stored.customer_email,body.customerEmail);assert.equal(stored.request_id,body.requestId);
    const retry=await post();assert.equal(retry.status,200);assert.deepEqual(await retry.json(),first);
    const list=await(await fetch(f.base+'/api/bookings')).json();assert.equal(list.length,1);safe(list[0]);
    const response=await fetch(f.base+'/api/bookings/'+list[0].id);assert.equal(response.status,200);
    const readback=await response.json();safe(readback);assert.deepEqual(readback,first);
    const conflict=await fetch(f.base+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,customerEmail:'different@example.com'})});
    assert.equal(conflict.status,409);
    assert.equal((await conflict.json()).error.code,'REQUEST_KEY_CONFLICT');
    assert.equal(Number((await f.database.query('SELECT COUNT(*) AS n FROM bookings')).rows[0].n),1);
  } finally {await f.close();}
});
