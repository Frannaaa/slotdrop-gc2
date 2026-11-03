import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessSlots } from '../tools/check-demo-readiness.mjs';
const now = Date.parse('2026-11-04T02:00:00Z');
const sample = { id: 3, providerId: 1, serviceActive: true, status: 'open', runsAsScheduled: true, remainingSeats: 3,
  startsAt: new Date(now + 20 * 3600000).toISOString(), bookingClosesAt: new Date(now + 19 * 3600000).toISOString() };
test('fresh demo reports usable inventory and imminent expiration', () => {
 const result=assessSlots([sample],now);
 assert.equal(result.bookableSessions,1);
 assert.equal(result.businessCount,1);
 assert.equal(result.lessThanOneDayLeft,true);
});
test('expired, sold-out and not-yet-discoverable inventory fails readiness', () => {
 const bad=[{...sample,startsAt:new Date(now-1).toISOString()},
  {...sample,remainingSeats:0},
  {...sample,startsAt:new Date(now+72*3600000).toISOString()},
  {...sample,bookingClosesAt:new Date(now).toISOString()}];
 assert.equal(assessSlots(bad,now).bookableSessions,0);
 assert.equal(assessSlots([],now).lastCutoff,null);
 assert.throws(()=>assessSlots({},now),/Expected an array/);
});
