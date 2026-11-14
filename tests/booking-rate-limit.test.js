import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers.js';
import {retryLimitedBooking} from '../public/js/customer-common.js';

test('POST-only per-socket limiter emits 429/Retry-After and recovers without double booking',async()=>{
 let current=1000;
 const f=await fixture({bookingRateLimit:{max:2,windowMs:10000,now:()=>current,useRenderForwardedIp:false}});
 const submit=body=>fetch(f.base+'/api/bookings',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify(body),
 });
 const body={
  requestId:randomUUID(),slotId:1,quantity:1,customerName:'Fictional QA',
  customerEmail:'qa@example.com',paymentMethod:'mock_card',
  expectedTotalCentavos:160000,
 };
 try{
  for(let i=0;i<2;i++)assert.equal((await submit({})).status,400);
  const blocked=await fetch(f.base+'/api/bookings',{
    method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'1.2.3.4'},
    body:JSON.stringify(body),
  });
  assert.equal(blocked.status,429);
  assert.equal(blocked.headers.get('retry-after'),'10');
  const data=await blocked.json();
  assert.deepEqual(data,{error:{
    code:'RATE_LIMITED',message:'Too many booking attempts. Try again shortly.',
    retryAfterSeconds:10,
  }});
  assert.equal((await fetch(f.base+'/api/bookings')).status,200,
    'Owner reads must never be throttled');
  assert.deepEqual(await (await fetch(f.base+'/api/bookings')).json(),[],
    'Blocked request must not save');
  current+=10000;
  const accepted=await submit(body);
  assert.equal(accepted.status,201);
  const saved=await accepted.json();
  assert.equal(saved.totalPriceCentavos,160000);
  assert.equal((await submit(body)).status,200,'Same retry key must replay safely');
  const owner=await (await fetch(f.base+'/api/bookings')).json();
  assert.equal(owner.filter(row=>row.id===saved.id).length,1);
  assert.equal((await (await fetch(f.base+'/api/slots/1')).json()).remainingSeats,3);
 }finally{await f.close();}
});

test('Render booking limits separate ingress client addresses with a socket fallback', async () => {
  const f = await fixture({ bookingRateLimit: { max: 1, useRenderForwardedIp: true } });
  const submit = forwarded => fetch(f.base + '/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(forwarded ? { 'X-Forwarded-For': forwarded } : {}),
    },
    body: '{}',
  });
  try {
    assert.equal((await submit('192.0.2.10, 10.0.0.1')).status, 400);
    assert.equal((await submit('192.0.2.10, 10.0.0.2')).status, 429);
    assert.equal((await submit('192.0.2.11, 10.0.0.1')).status, 400);
    assert.equal((await submit('192.0.2.11, 10.0.0.1')).status, 429);
    assert.equal((await submit()).status, 400);
    assert.equal((await submit('invalid, 192.0.2.11')).status, 429);
  } finally {
    await f.close();
  }
});

test('browser helper waits once on 429 and resends identical body but never retries uncertain errors',async()=>{
 const previous=globalThis.fetch;
 const sent=[], waits=[], messages=[];
 const body=JSON.stringify({requestId:randomUUID(),slotId:1,quantity:1});
 const reply=(status,payload)=>new Response(JSON.stringify(payload),{
  status,headers:{'content-type':'application/json'},
 });
 try{
  let step=0;
  globalThis.fetch=async(_url,options)=>{
    sent.push(options.body);
    step++;
    return step===1
     ?reply(429,{error:{code:'RATE_LIMITED',message:'Wait.',retryAfterSeconds:3}})
     :reply(201,{id:'saved-booking'});
  };
  const saved=await retryLimitedBooking('/api/bookings',{method:'POST',body},{
    wait:async ms=>waits.push(ms),onWait:seconds=>messages.push(seconds),
  });
  assert.deepEqual(saved,{id:'saved-booking'});
  assert.deepEqual(waits,[3000]);
  assert.deepEqual(messages,[3]);
  assert.deepEqual(sent,[body,body],'Never generate a new requestId during 429 retry');

  let calls=0;
  globalThis.fetch=async()=>{calls++;return reply(409,{error:{code:'PRICE_CHANGED',message:'Price changed'}})};
  await assert.rejects(()=>retryLimitedBooking('/api/bookings',{method:'POST',body},{
    wait:async()=>assert.fail('409 must not wait or retry'),
  }),error=>error.code==='PRICE_CHANGED');
  assert.equal(calls,1);

  calls=0;
  globalThis.fetch=async()=>{calls++;throw new TypeError('Simulated connection lost')};
  await assert.rejects(()=>retryLimitedBooking('/api/bookings',{method:'POST',body},{
    wait:async()=>assert.fail('Uncertain network failure must not automatically retry'),
  }),error=>error.uncertain===true);
  assert.equal(calls,1);
 }finally{globalThis.fetch=previous;}
});
