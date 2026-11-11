import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openReleaseUtilization } from '../public/js/owner-insights.js';

const NOW = Date.parse('2026-11-08T02:00:00Z');
const ISO = value => new Date(NOW + value * 3600000).toISOString();
function catalog() {
  return {
    discoveryHours: 72,
    services: [{id:1,active:true},{id:2,active:false}],
    slots: [
      {id:1,serviceId:1,status:'open',runsAsScheduled:true,capacity:4,startsAt:ISO(24),bookingClosesAt:ISO(22)},
      {id:2,serviceId:1,status:'open',runsAsScheduled:true,capacity:6,startsAt:ISO(36),bookingClosesAt:ISO(33)},
      {id:3,serviceId:1,status:'paused',runsAsScheduled:true,capacity:5,startsAt:ISO(12),bookingClosesAt:ISO(10)},
      {id:4,serviceId:2,status:'open',runsAsScheduled:true,capacity:8,startsAt:ISO(12),bookingClosesAt:ISO(10)},
      {id:5,serviceId:1,status:'open',runsAsScheduled:true,capacity:8,startsAt:ISO(-3),bookingClosesAt:ISO(-4)},
      {id:6,serviceId:1,status:'open',runsAsScheduled:true,capacity:8,startsAt:ISO(100),bookingClosesAt:ISO(90)},
    ],
  };
}
test('utilization joins eligible owner catalog slots to confirmed booking summaries', () => {
  const bookings = [
    {slotId:1,quantity:2,status:'confirmed'},
    {slotId:2,quantity:1,status:'confirmed'},
    {slotId:2,quantity:2,status:'cancelled'},
    {slotId:3,quantity:4,status:'confirmed'},
    {slotId:4,quantity:7,status:'confirmed'},
    {slotId:5,quantity:8,status:'confirmed'},
    {slotId:6,quantity:8,status:'confirmed'},
  ];
  assert.deepEqual(openReleaseUtilization(catalog(), bookings, NOW), {
    eligibleSessions:2,releasedSeats:10,confirmedSeats:3,inconsistent:false,utilizationPercent:30,
  });
});

test('no currently eligible demo inventory returns an explicit unmeasurable state', () => {
  const c = catalog();
  c.slots = c.slots.map(slot => ({...slot,status:'paused'}));
  assert.deepEqual(openReleaseUtilization(c, [{slotId:1,quantity:1,status:'confirmed'}], NOW), {
    eligibleSessions:0,releasedSeats:0,confirmedSeats:0,inconsistent:false,utilizationPercent:null,
  });
});

test('ineligible, malformed and non-confirmed rows do not invent sold seats', () => {
  const c = catalog();
  c.slots[1].bookingClosesAt = ISO(-1);
  const result = openReleaseUtilization(c, [
    {slotId:1,quantity:1.5,status:'confirmed'},
    {slotId:1,quantity:-1,status:'confirmed'},
    {slotId:1,quantity:1,status:'cancelled'},
    {slotId:2,quantity:3,status:'confirmed'},
  ], NOW);
  assert.deepEqual(result, {
    eligibleSessions:1,releasedSeats:4,confirmedSeats:0,inconsistent:false,utilizationPercent:0,
  });
});

test('utilization is unavailable when one slot exceeds capacity despite spare seats elsewhere', () => {
  const result = openReleaseUtilization(catalog(), [
    {slotId:1,quantity:3,status:'confirmed'},
    {slotId:1,quantity:2,status:'confirmed'},
  ], NOW);
  assert.equal(result.confirmedSeats, 5);
  assert.equal(result.inconsistent, true);
  assert.equal(result.utilizationPercent, null);
});
