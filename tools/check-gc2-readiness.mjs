// Manual GC2 checkpoint audit. Read-only: never creates bookings, offers or mock payments.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasBookingTotal } from '../public/js/customer-common.js';

export const requiredPages = [
  ['Home', '/', '/js/home.js'],
  ['Browse', '/browse.html', '/js/browse.js'],
  ['Detail', '/detail.html', '/js/detail.js'],
  ['Selection', '/selection.html', '/js/selection.js'],
  ['Checkout', '/checkout.html', '/js/checkout.js'],
  ['Confirmation', '/confirmation.html', '/js/confirmation.js'],
  ['Owner', '/owner.html', '/js/owner.js'],
];
const milliseconds = 12000;
function referencesScript(html, path) {
  return Array.from(html.matchAll(/<script\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi))
    .some(([, src]) => src.split(/[?#]/, 1)[0] === path);
}

async function inspect(base, name, path, kind, valid) {
  const url = new URL(path,base);
  try {
    const response = await fetch(url,{signal:AbortSignal.timeout(milliseconds),redirect:'error'});
    const type = response.headers.get('content-type') || '';
    if (!response.ok) return {name,pass:false,detail:'HTTP '+response.status};
    const html = kind === 'html';
    const expected = html ? 'text/html' : 'application/json';
    if (type.split(';', 1)[0].trim().toLowerCase() !== expected)
      return {name,pass:false,detail:'Expected '+expected+', received '+type};
    const data = await (html ? response.text() : response.json());
    return valid(data)
      ? {name,pass:true,detail:html ? 'HTML includes page script' : 'OK'}
      : {name,pass:false,detail:html ? 'Expected page script is missing' : 'Response shape does not match contract'};
  }catch(err){return {name,pass:false,detail:err.name==='TimeoutError'?'Request timed out':err.message};}
}
// Use one atomic response snapshot for the Browse health check and its dependents.
// A second GET can see different inventory or an outage and produce conflicting results.
async function inspectSlots(base) {
  const name = 'Database-backed Browse API';
  try {
    const response = await fetch(new URL('/api/slots', base),
      {signal:AbortSignal.timeout(milliseconds),redirect:'error'});
    if (!response.ok) return {check:{name,pass:false,detail:'HTTP '+response.status},data:null};
    const type = response.headers.get('content-type') || '';
    if (!/application\/json/i.test(type)) return {check:{name,pass:false,detail:'Expected JSON, received '+type},data:null};
    const data = await response.json();
    if (!Array.isArray(data)) return {check:{name,pass:false,detail:'Response shape does not match contract'},data:null};
    return {check:{name,pass:true,detail:'OK'},data};
  } catch (error) {
    return {check:{name,pass:false,detail:error.name==='TimeoutError'?'Request timed out':error.message},data:null};
  }
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
    // Only the booking router's documented response proves receipt lookup is wired.
    // An unrelated HTML/API fallback 404 must not be accepted as a working receipt API.
    const pass = response.status === 404 && code === 'BOOKING_NOT_FOUND';
    return {name,pass,detail:pass?'Receipt lookup route responds correctly to an unknown ID':
      'Receipt lookup not verified: HTTP '+response.status+', code '+(code||'missing')};
  } catch(error) {
    return {name,pass:false,detail:error.name==='TimeoutError'?'Request timed out':error.message};
  }
}

export async function inspectGC2(origin) {
  const base=new URL(origin);
  if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw Error('Provide an HTTP(S) URL without credentials.');
  const results=[await inspect(base,'Database readiness endpoint','/api/health','json',value=>value?.status==='ok')];
  for (const [name, path, script] of requiredPages)
    results.push(await inspect(base, name, path, 'html', html => referencesScript(html, script)));
  const {check:slots,data:inventory}=await inspectSlots(base);
  results.push(slots);
  if (slots.pass) {
    const available=inventory.filter(row=>row && row.remainingSeats>=1);
    results.push({name:'Sample inventory for public demo',pass:available.length>0,
      detail:available.length
        ? available.length+' discoverable demo offers'
        : 'No bookable offers. Adjust practice capacity or add a future dated offer in Owner.'});
    const first=available[0];
    if(first && Number.isSafeInteger(first.id)) {
      results.push(await inspect(base,'Session detail API','/api/slots/'+first.id,'json',
        v=>v && v.id===first.id && v.remainingSeats>=1 &&
          (typeof v.startsAt==='string' || v.startsAt===null && v.bookingClosesAt===null)));
      results.push(await inspect(base,'Quantity-aware quote API','/api/pricing/quote?slotId='+first.id+'&quantity=1','json',
        v=>hasBookingTotal(v) && v.slotId===first.id && v.quantity===1));
    } else {
      results.push({name:'Session detail API',pass:false,detail:'No eligible session to inspect'});
      results.push({name:'Quantity-aware quote API',pass:false,detail:'No eligible session to quote'});
    }
  } else {
    results.push({name:'Sample inventory for public demo',pass:false,detail:'Blocked until slots endpoint works'});
    results.push({name:'Session detail API',pass:false,detail:'Blocked until slots endpoint works'});
    results.push({name:'Quantity-aware quote API',pass:false,detail:'Blocked until slots endpoint works'});
  }
  results.push(await inspectReceiptReadback(base));
  results.push(await inspect(base,'Owner catalog API','/api/owner/catalog','json',v=>v
    && Array.isArray(v.services) && Array.isArray(v.slots)
    && Number.isSafeInteger(v.commissionBasisPoints) && v.commissionBasisPoints >= 0 && v.commissionBasisPoints <= 10000
    && Number.isSafeInteger(v.discoveryHours) && v.discoveryHours > 0));
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
