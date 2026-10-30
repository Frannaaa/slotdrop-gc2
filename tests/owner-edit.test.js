import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';
import { changedOfferFields } from '../public/js/owner-policy.js';

test('a stale price-only editor preserves a later pause, capacity and deadline change', async () => {
  const f = await fixture();
  try {
    const original = await (await fetch(f.base+'/api/slots/1')).json();
    const patch = async body => {
      const response = await fetch(f.base+'/api/slots/1',{
        method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
      });
      assert.equal(response.status,200);
      return response.json();
    };
    const deadline = new Date(Date.parse(original.bookingClosesAt)+15*60000).toISOString();
    await patch({status:'paused',capacity:8,bookingClosesAt:deadline});
    const draft = {
      capacity:original.capacity,offerPriceCentavos:161000,buddyPriceCentavos:original.buddyPriceCentavos,
      bookingClosesAt:original.bookingClosesAt,status:original.status
    };
    const saved = await patch(changedOfferFields(draft,original));
    assert.equal(saved.offerPriceCentavos,161000);
    assert.equal(saved.status,'paused');
    assert.equal(saved.capacity,8);
    assert.equal(saved.bookingClosesAt,deadline);
    assert.deepEqual(changedOfferFields({...draft,offerPriceCentavos:original.offerPriceCentavos},original),{});
    assert.deepEqual(changedOfferFields({...draft,buddyPriceCentavos:null},original),{offerPriceCentavos:161000,buddyPriceCentavos:null});
  } finally { await f.close(); }
});
