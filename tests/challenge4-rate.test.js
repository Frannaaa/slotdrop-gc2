// Fran M1: Challenge 4 rule-change inventory and unchanged receipt proof.
// Does NOT alter the class commission rule or claim a deployed browser trace.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { COMMISSION_BASIS_POINTS } from '../server/config/business.js';
import { fixture } from './helpers.js';

test('active commission has one editable source and is reflected in quote, Owner and saved receipt', async () => {
  const files = [
    'server/config/business.js',
    'server/services/pricing.js',
    'server/services/bookings.js',
    'server/repositories/owner.js',
    'public/js/owner.js',
  ];
  const sources = Object.fromEntries(await Promise.all(files.map(async path => [
    path, await readFile(new URL('../'+path,import.meta.url),'utf8')
  ])));
  assert.match(sources[files[0]],/export const COMMISSION_BASIS_POINTS\s*=\s*\d+/);
  for(const path of files.slice(1)){
    assert.doesNotMatch(sources[path],/(?:export\s+)?const\s+COMMISSION_BASIS_POINTS\s*=/,
      'Only the config file may define the active rate: '+path);
  }
  assert.match(sources['server/services/pricing.js'],/COMMISSION_BASIS_POINTS/);
  assert.match(sources['server/services/bookings.js'],/COMMISSION_BASIS_POINTS/);
  assert.match(sources['server/repositories/owner.js'],/commissionBasisPoints: COMMISSION_BASIS_POINTS/);
  assert.match(sources['public/js/owner.js'],/catalog\.commissionBasisPoints/);
  const f=await fixture();
  try{
    const catalogResponse=await fetch(f.base+'/api/owner/catalog');
    assert.equal(catalogResponse.status,200);
    const catalog=await catalogResponse.json();
    assert.equal(catalog.commissionBasisPoints,COMMISSION_BASIS_POINTS);
    const quoteResponse=await fetch(f.base+'/api/pricing/quote?slotId=1&quantity=2');
    assert.equal(quoteResponse.status,200);
    const quote=await quoteResponse.json();
    const feePerSeat=Math.round(quote.unitPriceCentavos*COMMISSION_BASIS_POINTS/10000);
    assert.equal(quote.platformFeeCentavos,feePerSeat*2);
    const book=await fetch(f.base+'/api/bookings',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        requestId:randomUUID(),slotId:1,quantity:2,
        customerName:'Fictional owner rule QA',customerEmail:'qa@example.com',
        paymentMethod:'mock_card',expectedTotalCentavos:quote.totalPriceCentavos,
      }),
    });
    assert.equal(book.status,201);
    const receipt=await book.json();
    assert.equal(receipt.commissionBasisPoints,COMMISSION_BASIS_POINTS);
    assert.equal(receipt.platformFeeCentavos,quote.platformFeeCentavos);
    assert.equal(receipt.providerPayoutCentavos,receipt.totalPriceCentavos-receipt.platformFeeCentavos);
    const original=JSON.stringify(receipt);
    const patch=await fetch(f.base+'/api/slots/1',{
      method:'PATCH',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({offerPriceCentavos:150000}),
    });
    assert.equal(patch.status,200);
    const after=await fetch(f.base+'/api/bookings/'+receipt.id);
    assert.equal(after.status,200);
    assert.equal(JSON.stringify(await after.json()),original,
      'Already saved historical receipts cannot be repriced by later changes');
  } finally {await f.close();}
});
