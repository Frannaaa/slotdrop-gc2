// Manual GC2 checkpoint audit. Read-only: never creates bookings, offers or mock payments.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const requiredPages = [
  ['Home', '/'], ['Browse', '/browse.html'], ['Detail', '/detail.html'],
  ['Selection', '/selection.html'], ['Checkout', '/checkout.html'],
  ['Confirmation', '/confirmation.html'], ['Owner', '/owner.html'],
];
const milliseconds = 12000;
async function inspect(base, name, path, kind, valid) {
  const url = new URL(path,base);
  try {
    const response = await fetch(url,{signal:AbortSignal.timeout(milliseconds),redirect:'error'});
    const type = response.headers.get('content-type') || '';
    if (!response.ok) return {name,pass:false,detail:'HTTP '+response.status};
    if (kind === 'html') return {name,pass:/text\/html/i.test(type),detail:/text\/html/i.test(type)?'HTML available':'Unexpected content type '+type};
    if (!/application\/json/i.test(type)) return {name,pass:false,detail:'Expected JSON, received '+type};
    const data=await response.json();
    return valid(data) ? {name,pass:true,detail:'OK'} : {name,pass:false,detail:'Response shape does not match contract'};
  }catch(err){return {name,pass:false,detail:err.name==='TimeoutError'?'Request timed out':err.message};}
}
// A nonexistent UUID should receive the booking route's own 404, not the
// generic unimplemented API fallback. Never creates a test booking.
async function inspectReceiptReadback(base) {
  const name = 'Saved booking receipt-by-ID route';
  try {
    const response = await fetch(new URL('/api/bookings/00000000-0000-4000-8000-000000000000', base),
      {signal:AbortSignal.timeout(milliseconds),redirect:'error'});
    const type = response.headers.get('content-type') || '';
    if (!/application\/json/i.test(type))
      return {name,pass:false,detail:'Expected JSON receipt error, received '+type};
    const data = await response.json();
    const code = data?.error?.code;
    const pass = response.status === 404 && typeof code === 'string' &&
      code !== 'ROUTE_NOT_IMPLEMENTED';
    return {name,pass,detail:pass?'Receipt lookup route responds correctly to an unknown ID':
      'Receipt lookup not verified: HTTP '+response.status+', code '+(code||'missing')};
  } catch(error) {
    return {name,pass:false,detail:error.name==='TimeoutError'?'Request timed out':error.message};
  }
}

export async function inspectGC2(origin) {
  const base=new URL(origin);
  if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw Error('Provide an HTTP(S) URL without credentials.');
  const results=[];
  for(const [name,path] of requiredPages)results.push(await inspect(base,name,path,'html'));
  const slots=await inspect(base,'Database-backed Browse API','/api/slots','json',v=>Array.isArray(v));
  results.push(slots);
  if(slots.pass) {
    try{
      const response=await fetch(new URL('/api/slots',base),{signal:AbortSignal.timeout(milliseconds)});
      const data=await response.json();
      const available=data.filter(row=>row && row.remainingSeats>=1);
      results.push({name:'Sample inventory for public demo',pass:available.length>0,detail:available.length+' discoverable sample sessions; if zero create new FUTURE offers through Owner without reseeding'});
      const first=available[0];
      if(first && Number.isSafeInteger(first.id)) {
        results.push(await inspect(base,'Session detail API','/api/slots/'+first.id,'json',
          v=>v && v.id===first.id && v.remainingSeats>=1 && typeof v.startsAt==='string'));
        results.push(await inspect(base,'Quantity-aware quote API','/api/pricing/quote?slotId='+first.id+'&quantity=1','json',
          v=>v && v.slotId===first.id && v.quantity===1 && Number.isSafeInteger(v.totalPriceCentavos)));
      } else {
        results.push({name:'Session detail API',pass:false,detail:'No eligible session to inspect'});
        results.push({name:'Quantity-aware quote API',pass:false,detail:'No eligible session to quote'});
      }
    }catch(error){results.push({name:'Sample inventory for public demo',pass:false,detail:error.message});}
  } else {
    results.push({name:'Session detail API',pass:false,detail:'Blocked until slots endpoint works'});
    results.push({name:'Quantity-aware quote API',pass:false,detail:'Blocked until slots endpoint works'});
  }
  results.push(await inspectReceiptReadback(base));
  results.push(await inspect(base,'Owner booking list API','/api/bookings','json',v=>Array.isArray(v)));
  results.push(await inspect(base,'Five metrics API','/api/metrics','json',v=>v && Number.isInteger(v.bookingCount)&&Number.isSafeInteger(v.platformRevenueCentavos)&&Number.isSafeInteger(v.averageOrderValueCentavos)&&Number.isInteger(v.nearlyFullSessionCount)&&Object.hasOwn(v,'topSellingService')));
  return results;
}
async function main(){
  const origin=process.argv[2]||'http://localhost:3000';
  const results=await inspectGC2(origin);
  for(const r of results)console.log((r.pass?'PASS':'BLOCKED')+' | '+r.name+' | '+r.detail);
  const failing=results.filter(r=>!r.pass);
  console.log('\n'+(failing.length?'GC2 preflight blocked: '+failing.length+' checks need work.':'All read-only availability checks passed. Finish a real saved demo booking, receipt readback, phone test and evidence manually.'));
  if(failing.length)process.exitCode=1;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{await main();}catch(error){console.error('GC2 preflight failed:',error.message);process.exitCode=1;}
}
