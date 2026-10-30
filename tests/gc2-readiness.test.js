import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { inspectGC2, requiredPages } from '../tools/check-gc2-readiness.mjs';

test('GC2 read-only preflight checks all required screens and core endpoints',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async url=>{
  const path=new URL(url).pathname;
  calls.push(path);
  if(requiredPages.some(([,v])=>v===path))return new Response('<main>Demo</main>',{status:200,headers:{'content-type':'text/html'}});
  if(path==='/api/slots')return Response.json([{id:1,remainingSeats:4}]);
  if(path==='/api/slots/1')return Response.json({id:1,remainingSeats:4,startsAt:'2026-11-01T02:00:00.000Z'});
  if(path==='/api/bookings/00000000-0000-4000-8000-000000000000')return Response.json({error:{code:'BOOKING_NOT_FOUND'}},{status:404});
  if(path==='/api/pricing/quote')return Response.json({slotId:1,quantity:1,totalPriceCentavos:10000});
  if(path==='/api/bookings')return Response.json([]);
  if(path==='/api/metrics')return Response.json({bookingCount:0,platformRevenueCentavos:0,averageOrderValueCentavos:0,nearlyFullSessionCount:0,topSellingService:null});
  return Response.json({error:{code:'ROUTE_NOT_IMPLEMENTED'}},{status:404});
 });
 const rows=await inspectGC2('http://127.0.0.1:3000');
 assert.equal(rows.every(r=>r.pass),true);
 assert.equal(rows.length,14);
 assert.equal(calls.includes('/api/slots'),true);
 assert.equal(calls.some(p=>p==='/api/bookings'),true);
 assert.equal(calls.some(p=>p==='/api/pricing/quote'),true);
 assert.equal(calls.some(p=>p==='/api/slots/1'),true);
 assert.equal(calls.some(p=>p.startsWith('/api/bookings/')),true);
});

test('GC2 preflight identifies missing booking services without writing data',async t=>{
 const methods=[];
 t.mock.method(globalThis,'fetch',async (url,opts)=>{
  methods.push(opts?.method??'GET');
  const path=new URL(url).pathname;
  if(requiredPages.some(([,v])=>v===path))return new Response('<main>Demo</main>',{headers:{'content-type':'text/html'}});
  if(path==='/api/slots')return Response.json([]);
  if(path==='/api/bookings')return Response.json([],{status:404});
  if(path==='/api/metrics')return Response.json({bookingCount:0},{status:200});
  return Response.json({error:{code:'ROUTE_NOT_IMPLEMENTED'}},{status:404});
 });
 const rows=await inspectGC2('http://localhost:3000');
 assert.equal(rows.some(r=>r.name==='Sample inventory for public demo' && !r.pass),true);
 assert.equal(rows.some(r=>r.name==='Five metrics API' && !r.pass),true);
 assert.equal(rows.some(r=>r.name==='Saved booking receipt-by-ID route' && !r.pass),true);
 assert.ok(methods.every(method=>method==='GET'));
});
