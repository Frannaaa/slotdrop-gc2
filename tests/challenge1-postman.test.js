// Exercise the EXACT six exported Challenge 1 Postman requests through real HTTP,
// after the read-only 00a/00b requests that choose live variables on the target API.
// Fran/M1 test. CI is local/isolated, NOT a public Postman screenshot or deployed proof.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

test('exported six-case Postman collection has accurate requests, assertions and expected API results', async () => {
  const collection = JSON.parse(await readFile(new URL('../docs/SlotDrop-GC2-Challenge1.postman_collection.json',import.meta.url),'utf8'));
  assert.match(collection.info.schema,/collection\/v2\.1\.0/);
  assert.equal(collection.item.length,8);
  const [picker,quoter,...cases]=collection.item;
  for(const setup of [picker,quoter]) assert.equal(setup.request.method,'GET',setup.name+' must be read-only');
  // Setup requests must not hide extra calls; each one is visible in the Postman/Newman evidence.
  assert.ok(!JSON.stringify(collection).includes('sendRequest'),'no hidden pm.sendRequest calls');
  const expected = [
    {status:400,code:'INVALID_INPUT'},
    {status:400,code:'INVALID_INPUT'},
    {status:409,code:'SLOT_UNAVAILABLE'},
    {status:404,code:'SLOT_NOT_FOUND'},
    {status:400,code:'INVALID_INPUT'},
    {status:200,empty:true},
  ];
  const f=await fixture();
  try {
    const known = Object.fromEntries(collection.variable.map(x=>[x.key,x.value]));
    // Mirror the 00a/00b test scripts: first session with 2+ seats, one seat too many, an unused ID, the server quote.
    const slots=await fetch(f.base+'/api/slots?people=2').then(x=>x.json());
    const live=slots.find(row=>row.remainingSeats>=2&&row.remainingSeats<100);
    assert.ok(live,'fixture has a bookable session');
    const quote=await fetch(f.base+'/api/pricing/quote?slotId='+live.id+'&quantity=2').then(x=>x.json());
    const replacements={
      ...known,
      baseUrl:f.base,
      slotId:String(live.id),
      overCapacityQuantity:String(live.remainingSeats+1),
      unknownSlotId:String(Math.max(...slots.map(row=>row.id))+100000),
      expectedTotalCentavos:String(quote.totalPriceCentavos),
    };
    const expand=text=>text.replace(/\{\{(\$guid|[^{}]+)\}\}/g,(_match,key)=>
      key==='$guid'?randomUUID():String(replacements[key] ?? (()=>{throw new Error('Unknown collection variable '+key)})()));
    for(const [i,item] of cases.entries()){
      const {status,code,empty}=expected[i];
      const url=expand(typeof item.request.url==='string'?item.request.url:item.request.url.raw);
      const text=item.event?.filter(e=>e.listen==='test').flatMap(e=>e.script?.exec||[]).join('\n')||'';
      assert.match(text,new RegExp('status\\('+status+'\\)'),item.name+' missing HTTP assertion');
      if(code)assert.ok(text.includes(code),item.name+' missing error-code assertion');
      if(empty)assert.match(text,/to\.eql\(\[\]\)/,'No-match case must assert []');
      const body=item.request.body?.raw ? JSON.parse(expand(item.request.body.raw)) : undefined;
      const response=await fetch(url,{
        method:item.request.method,
        ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),
      });
      assert.equal(response.status,status,item.name+' response status');
      const result=await response.json();
      if(code)assert.equal(result.error?.code,code,item.name+' error body');
      if(empty)assert.deepEqual(result,[],item.name+' no-match body');
    }
    // Rejected requests must not have consumed seats or created bookings.
    const [list,slot]=await Promise.all([
      fetch(f.base+'/api/bookings').then(x=>x.json()),
      fetch(f.base+'/api/slots/'+live.id).then(x=>x.json()),
    ]);
    assert.deepEqual(list,[]);
    assert.equal(slot.remainingSeats,live.remainingSeats);
  } finally {await f.close();}
});
