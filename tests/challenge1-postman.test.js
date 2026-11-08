// Exercise the EXACT six exported Challenge 1 Postman requests through real HTTP.
// Fran/M1 test. CI is local/isolated, NOT a public Postman screenshot or deployed proof.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fixture } from './helpers.js';

test('exported six-case Postman collection has accurate requests, assertions and expected API results', async () => {
  const collection = JSON.parse(await readFile(new URL('../docs/SlotDrop-GC2-Challenge1.postman_collection.json',import.meta.url),'utf8'));
  assert.match(collection.info.schema,/collection\/v2\.1\.0/);
  assert.equal(collection.item.length,6);
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
    assert.equal(Number(known.slotId),1,'fixture must match the collection sample slot');
    const replacements={
      ...known,
      baseUrl:f.base,
      slotId:String(known.slotId),
      overCapacityQuantity:String(known.overCapacityQuantity),
      unknownSlotId:String(known.unknownSlotId),
      expectedTotalCentavos:String(known.expectedTotalCentavos),
    };
    const expand=text=>text.replace(/\{\{(\$guid|[^{}]+)\}\}/g,(_match,key)=>
      key==='$guid'?randomUUID():String(replacements[key] ?? (()=>{throw new Error('Unknown collection variable '+key)})()));
    for(const [i,item] of collection.item.entries()){
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
      fetch(f.base+'/api/slots/1').then(x=>x.json()),
    ]);
    assert.deepEqual(list,[]);
    assert.equal(slot.remainingSeats,4);
  } finally {await f.close();}
});
