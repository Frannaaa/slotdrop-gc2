import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const origin='https://slotdrop-gc2-group-zx8j.onrender.com';
const id='57ec16ea-c871-48b2-8351-5965df467f79';
async function get(path) {
  const res=await fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(60000),redirect:'error'});
  assert.equal(res.status,200,'GET '+path+' must return 200');
  return res.json();
}
for(let i=0;i<5;i++){try{assert.equal((await get('/api/health')).status,'ok');break;}catch(e){if(i===4)throw e;await new Promise(r=>setTimeout(r,4000));}}
const receipt=await get('/api/bookings/'+id);
const list=await get('/api/bookings');
assert.ok(Array.isArray(list),'Owner booking list must be an array');
const matches=list.filter(b=>b.id===id);
assert.equal(matches.length,1,'Owner list needs exactly one matching saved booking');
for(const [field,expected] of Object.entries({id,quantity:4,totalPriceCentavos:1026000,status:'confirmed'})){
 assert.equal(receipt[field],expected,'Receipt field '+field);
 assert.equal(matches[0][field],expected,'Owner field '+field);
}
assert.equal(receipt.paymentMethod,'mock_card','Payment choice visible in Confirmation only');
for(const field of ['slotId','unitPriceCentavos','pricingType','platformFeeCentavos','providerPayoutCentavos','serviceName','providerName']){
 assert.deepEqual(matches[0][field],receipt[field],'Owner/receipt mismatch for '+field);
}
assert.equal(receipt.unitPriceCentavos,256500,'Buddy price from video');
assert.equal(receipt.pricingType,'buddy','Buddy tier from video');
assert.equal(receipt.platformFeeCentavos,102600,'10% commission on four seats');
assert.equal(receipt.providerPayoutCentavos,923400,'10% platform fee deducted');
assert.equal(receipt.providerName,'Laro Ceramics');
const whitelist=['id','slotId','quantity','unitPriceCentavos','pricingType','totalPriceCentavos','platformFeeCentavos','providerPayoutCentavos','serviceName','providerName','status','paymentMethod'];
const safe=Object.fromEntries(whitelist.map(k=>[k,receipt[k]]));
const evidence={testedAt:new Date().toISOString(),origin,sourceVideo:'https://drive.google.com/file/d/1pjoItpPhLSJo2zyTNgwlPlEDR8Pvs8eW/view?usp=sharing',videoDurationSeconds:81.621,lookupHttp:200,ownerHttp:200,matchingOwnerRows:matches.length,receipt:safe,notes:'Read-only persisted receipt and Owner API match; video shows mobile booking but not Owner UI or independent Browse page. No guest name or email saved in evidence.'};
await mkdir('outsider-evidence',{recursive:true});
await writeFile('outsider-evidence/phone-receipt-owner.json',JSON.stringify(evidence,null,2)+'\n');
console.log('SLOTDROP_OUTSIDER_BOOKING_CHECK '+JSON.stringify(evidence));
