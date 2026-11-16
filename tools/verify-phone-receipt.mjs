import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin='https://slotdrop-gc2-group-zx8j.onrender.com';
const bookingId='57ec16ea-c871-48b2-8351-5965df467f79';
async function get(path){
  const r=await fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(30000)});
  assert.equal(r.status,200,'GET '+path+' should return 200');
  return r.json();
}
const booking=await get('/api/bookings/'+bookingId);
assert.equal(booking.id,bookingId);
assert.equal(booking.status,'confirmed');
assert.equal(booking.providerName,'Laro Ceramics');
assert.equal(booking.quantity,4);
assert.equal(booking.unitPriceCentavos,256500);
assert.equal(booking.totalPriceCentavos,1026000);
assert.equal(booking.paymentMethod,'mock_card');
const ownerRows=await get('/api/bookings');
assert.ok(Array.isArray(ownerRows),'Owner bookings endpoint should return an array');
const matching=ownerRows.filter(row=>row.id===bookingId);
assert.equal(matching.length,1,'Exactly one Owner row must match the recorded phone booking');
for (const key of ['id','slotId','quantity','totalPriceCentavos','platformFeeCentavos','providerPayoutCentavos','status']) {
 assert.equal(matching[0][key],booking[key], 'Owner row must match receipt '+key);
}
const summary={verifiedAt:new Date().toISOString(),origin,bookingId,receiptGet:200,ownerGet:200,matchingOwnerRows:matching.length,session:booking.serviceName,studio:booking.providerName,quantity:booking.quantity,pricePerPersonCentavos:booking.unitPriceCentavos,totalCentavos:booking.totalPriceCentavos,paymentMethod:booking.paymentMethod,status:booking.status,createdAt:booking.createdAt,codeCommitDuringVerification:'d3d2f1381c0ef8776685abf46c081130f33dd889'};
await mkdir('phone-receipt-evidence',{recursive:true});
await writeFile('phone-receipt-evidence/receipt-owner-match.json',JSON.stringify(summary,null,2)+'\n');
console.log('SLOTDROP_PHONE_RECEIPT_VERIFIED '+JSON.stringify(summary));
