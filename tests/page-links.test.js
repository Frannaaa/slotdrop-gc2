import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageParameters } from '../public/js/customer-common.js';
test('booking-page links preserve one unambiguous value per supported field',()=>{
 assert.equal(pageParameters('?slotId=1&quantity=2',['slotId','quantity']).get('quantity'),'2');
 assert.equal(pageParameters('?slotId=1',['slotId','quantity']).has('quantity'),false);
 for(const query of ['?slotId=1&slotId=2','?slotId=1&quantity=2&quantity=3','?slotId=1&quantity=','?slotId=1&unexpected=2']) assert.throws(()=>pageParameters(query,['slotId','quantity']),/valid link/);
 assert.throws(()=>pageParameters('?id=a&id=b',['id']),/valid link/);
});
