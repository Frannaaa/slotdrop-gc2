import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers.js';
import {migrateDatabase} from '../server/repositories/migrations.js';
const sample=()=>({requestId:randomUUID(),businessName:'Sample studio',website:'https://example.com/studio',city:'Quezon City',area:'Katipunan',activityTypes:['pottery','painting'],contactName:'Sample owner',contactEmail:'owner@example.com',representativeRole:'owner',authorized:true,demoAcknowledged:true});
test('studio application is persisted once, stays pending and never publishes contacts or grants ownership',async()=>{
 const f=await fixture({realCatalog:true});
 const send=body=>fetch(f.base+'/api/provider-applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  const provider=(await(await fetch(f.base+'/api/slots')).json())[0].providerId;
  const before=(await f.db.query('SELECT * FROM providers ORDER BY id')).rows;
  const input={...sample(),providerId:provider};
  const responses=await Promise.all([send(input),send(input)]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,201]);
  const [saved,retried]=await Promise.all(responses.map(r=>r.json()));
  assert.deepEqual(saved,retried);assert.deepEqual(Object.keys(saved).sort(),['createdAt','id','status']);assert.equal(saved.status,'pending');
  assert.equal((await f.db.query('SELECT COUNT(*)::int AS n FROM provider_applications')).rows[0].n,1);
  const record=(await f.db.query('SELECT * FROM provider_applications WHERE id=$1',[saved.id])).rows[0];
  assert.equal(record.contact_email,input.contactEmail);assert.equal(record.authorized,true);
  await migrateDatabase(f.db);await migrateDatabase(f.db);
  assert.deepEqual(await(await fetch(f.base+'/api/provider-applications/'+saved.id)).json(),saved);
  assert.equal((await send({...input,contactEmail:'different@example.com'})).status,409);
  assert.deepEqual((await f.db.query('SELECT * FROM providers ORDER BY id')).rows,before);
  const profile=await(await fetch(f.base+'/api/providers/'+provider)).json();
  assert.equal(profile.profileStatus,'unclaimed_reference');assert.equal(profile.partnershipConfirmed,false);
  assert.ok(profile.activities.length);assert.ok(profile.slots.every(slot=>slot.providerId===provider));
  const publicText=JSON.stringify(profile)+JSON.stringify(saved);
  for(const secret of [input.contactEmail,input.contactName,input.requestId,record.payload_signature])assert.equal(publicText.includes(secret),false);
  assert.equal((await fetch(f.base+'/api/provider-applications')).status,404);
 }finally{await f.close();}
});
test('studio applications reject malformed fields, unsupported claims and invalid reference links',async()=>{
 const f=await fixture({realCatalog:true});
 const send=body=>fetch(f.base+'/api/provider-applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  const valid=sample();
  for(const change of [{requestId:'bad'},{authorized:false},{demoAcknowledged:false},{activityTypes:[]},{activityTypes:['pottery','pottery']},{activityTypes:['arbitrary']},{representativeRole:'visitor'},{website:'http://example.com'},{website:'https://user:secret@example.com'},{contactEmail:'invalid'},{contactEmail:'x\u0000@example.com'},{businessName:' '.repeat(8)},{businessName:'x'.repeat(121)},{status:'approved'},{providerId:'1 or 1=1'}])assert.equal((await send({...valid,...change})).status,400,JSON.stringify(change));
  assert.equal((await send({...valid,providerId:1})).status,404);
  assert.equal((await send({...valid,providerId:99999})).status,404);
  for(const path of ['/api/providers/1','/api/providers/99999','/api/provider-applications/'+randomUUID()])assert.equal((await fetch(f.base+path)).status,404,path);
  for(const path of ['/api/providers/no','/api/provider-applications/no'])assert.equal((await fetch(f.base+path)).status,400,path);
  assert.equal((await f.db.query('SELECT COUNT(*)::int AS n FROM provider_applications')).rows[0].n,0);
 }finally{await f.close();}
});
