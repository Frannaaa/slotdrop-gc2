import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { inspectGC2, requiredPages } from '../tools/check-gc2-readiness.mjs';

function pageResponse(path) {
 const page = requiredPages.find(([, url]) => url === path);
 return page ? new Response('<script type="module" src="' + page[2] + '"></script>',
  {headers:{'content-type':'text/html'}}) : null;
}
const quote = {
 slotId:1, quantity:1, unitPriceCentavos:10000, totalPriceCentavos:10000, pricingType:'standard',
};
const catalog = {services:[],slots:[],commissionBasisPoints:1000,discoveryHours:72};

test('GC2 read-only preflight checks all required screens and core endpoints',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async url=>{
  const path=new URL(url).pathname;
  calls.push(path);
  const page = pageResponse(path);
  if (page) return page;
  if(path==='/api/health')return Response.json({status:'ok',app:'SlotDrop'});
  if(path==='/api/slots')return Response.json([{id:1,remainingSeats:4}]);
  if(path==='/api/slots/1')return Response.json({id:1,remainingSeats:4,startsAt:'2026-11-01T02:00:00.000Z'});
  if(path==='/api/bookings/00000000-0000-4000-8000-000000000000')return Response.json({error:{code:'BOOKING_NOT_FOUND'}},{status:404});
  if(path==='/api/pricing/quote')return Response.json(quote);
  if(path==='/api/owner/catalog')return Response.json(catalog);
  if(path==='/api/bookings')return Response.json([]);
  if(path==='/api/metrics')return Response.json({bookingCount:0,platformRevenueCentavos:0,averageOrderValueCentavos:0,nearlyFullSessionCount:0,topSellingService:null});
  return Response.json({error:{code:'ROUTE_NOT_IMPLEMENTED'}},{status:404});
 });
 const rows=await inspectGC2('http://127.0.0.1:3000');
 assert.equal(rows.every(r=>r.pass),true);
 assert.equal(rows.length,16);
 assert.equal(calls.filter(p=>p==='/api/health').length,1);
 assert.equal(calls.filter(p=>p==='/api/slots').length,1);
 assert.equal(calls.some(p=>p==='/api/bookings'),true);
 assert.equal(calls.some(p=>p==='/api/owner/catalog'),true);
 assert.equal(calls.some(p=>p==='/api/pricing/quote'),true);
 assert.equal(calls.some(p=>p==='/api/slots/1'),true);
 assert.equal(calls.some(p=>p.startsWith('/api/bookings/')),true);
});

test('GC2 preflight identifies missing booking services without writing data',async t=>{
 const methods=[];
 t.mock.method(globalThis,'fetch',async (url,opts)=>{
  methods.push(opts?.method??'GET');
  const path=new URL(url).pathname;
  if (path === '/owner.html') return pageResponse('/');
  const page = pageResponse(path);
  if (page) return page;
  if(path==='/api/health')return Response.json({status:'unavailable'},{status:503});
  if(path==='/api/slots')return Response.json([]);
  if(path==='/api/bookings')return Response.json([],{status:404});
  if(path==='/api/owner/catalog')return Response.json({error:{code:'DATABASE_UNAVAILABLE'}},{status:503});
  if(path==='/api/metrics')return Response.json({bookingCount:0},{status:200});
  return Response.json({error:{code:'ROUTE_NOT_IMPLEMENTED'}},{status:404});
 });
 const rows=await inspectGC2('http://localhost:3000');
 assert.equal(rows.find(r=>r.name==='Database readiness endpoint')?.detail,'HTTP 503');
 assert.equal(rows.some(r=>r.name==='Sample inventory for public demo' && !r.pass),true);
 assert.equal(rows.some(r=>r.name==='Five metrics API' && !r.pass),true);
 assert.equal(rows.find(r=>r.name==='Owner')?.detail,'Expected page script is missing');
 assert.equal(rows.find(r=>r.name==='Owner catalog API')?.detail,'HTTP 503');
 assert.equal(rows.some(r=>r.name==='Saved booking receipt-by-ID route' && !r.pass),true);
 assert.ok(methods.every(method=>method==='GET'));
});

test('receipt preflight rejects unrelated 404 responses from a missing booking endpoint', async t => {
 let code = 'NOT_FOUND';
 const methods = [];
 t.mock.method(globalThis, 'fetch', async (url, options) => {
  methods.push(options?.method || 'GET');
  const path = new URL(url).pathname;
  const page = pageResponse(path);
  if (page) return page;
  if (path === '/api/slots') return Response.json([]);
  if (path === '/api/bookings/00000000-0000-4000-8000-000000000000')
   return Response.json({error:{code}}, {status:404});
  if (path === '/api/bookings') return Response.json([]);
  if (path === '/api/metrics')
   return Response.json({bookingCount:0,platformRevenueCentavos:0,
    averageOrderValueCentavos:0,nearlyFullSessionCount:0,topSellingService:null});
  return Response.json({error:{code:'ROUTE_NOT_IMPLEMENTED'}}, {status:404});
 });
 const receipt = async () => (await inspectGC2('http://localhost:3000'))
  .find(row => row.name === 'Saved booking receipt-by-ID route');
 assert.equal((await receipt()).pass, false);
 code = 'BOOKING_NOT_FOUND';
 assert.equal((await receipt()).pass, true);
 assert.ok(methods.every(method => method === 'GET'));
});

test('preflight uses one consistent inventory response even if a second read would fail', async t => {
 let inventoryReads=0;
 t.mock.method(globalThis, 'fetch', async url => {
  const path=new URL(url).pathname;
  const page = pageResponse(path);
  if (page) return page;
  if(path==='/api/health') return Response.json({status:'ok'});
  if(path==='/api/slots') {
   inventoryReads++;
   return inventoryReads === 1 ? Response.json([{id:1,remainingSeats:4}])
    : Response.json({error:{code:'DATABASE_UNAVAILABLE'}},{status:503});
  }
  if(path==='/api/slots/1') return Response.json({id:1,remainingSeats:4,startsAt:'2026-11-01T02:00:00Z'});
  if(path==='/api/pricing/quote') return Response.json(quote);
  if(path==='/api/owner/catalog') return Response.json(catalog);
  if(path==='/api/bookings/00000000-0000-4000-8000-000000000000')
   return Response.json({error:{code:'BOOKING_NOT_FOUND'}},{status:404});
  if(path==='/api/bookings') return Response.json([]);
  if(path==='/api/metrics')
   return Response.json({bookingCount:0,platformRevenueCentavos:0,
    averageOrderValueCentavos:0,nearlyFullSessionCount:0,topSellingService:null});
  return Response.json({error:{code:'ROUTE_NOT_IMPLEMENTED'}},{status:404});
 });
 const rows=await inspectGC2('http://localhost:3000');
 assert.equal(inventoryReads,1,'One inventory snapshot is sufficient for the full readiness check');
 assert.equal(rows.length,16);
 assert.equal(rows.every(row=>row.pass),true);
});

test('preflight includes inventory status when the Browse API is unavailable',async t=>{
 t.mock.method(globalThis,'fetch',async url=>{
  const path=new URL(url).pathname;
  const page = pageResponse(path);
  if (page) return page;
  if(path==='/api/slots') return Response.json({error:{code:'DATABASE_UNAVAILABLE'}},{status:503});
  if(path==='/api/bookings/00000000-0000-4000-8000-000000000000')
   return Response.json({error:{code:'BOOKING_NOT_FOUND'}},{status:404});
  if(path==='/api/bookings') return Response.json([]);
  if(path==='/api/metrics') return Response.json({bookingCount:0,platformRevenueCentavos:0,averageOrderValueCentavos:0,nearlyFullSessionCount:0,topSellingService:null});
  return Response.json({error:{code:'ROUTE_NOT_IMPLEMENTED'}},{status:404});
 });
 const rows=await inspectGC2('http://localhost:3000');
 assert.equal(rows.length,16);
 for(const name of ['Database-backed Browse API','Sample inventory for public demo','Session detail API','Quantity-aware quote API'])
  assert.equal(rows.find(row=>row.name===name)?.pass,false,name);
 assert.equal(rows.find(row=>row.name==='Saved booking receipt-by-ID route').pass,true);
});
