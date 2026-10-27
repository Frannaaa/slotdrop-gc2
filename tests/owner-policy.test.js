import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cutoffGuidance,
  cutoffRequestValue,
  salesState,
} from "../public/js/owner-policy.js";
test("activity guidance updates while an explicit session deadline is preserved", () => {
  assert.match(cutoffGuidance(180, false), /180 minutes/);
  assert.equal(
    cutoffGuidance(30, true),
    "Activity default: 30 minutes before start. Your session override is preserved.",
  );
});
test("a paused session cannot imply resumed sales after its cutoff, start or capacity limit", () => {
  const now = Date.parse("2026-11-01T00:00:00Z");
  const slot = {
    status: "paused",
    startsAt: "2026-11-01T05:00:00Z",
    bookingClosesAt: "2026-11-01T03:00:00Z",
    remainingSeats: 2,
    serviceActive: true,
  };
  assert.equal(salesState(slot, now).canResume, true);
  assert.equal(
    salesState({ ...slot, bookingClosesAt: "2026-11-01T00:00:00Z" }, now).label,
    "Bookings closed",
  );
  assert.equal(
    salesState({ ...slot, remainingSeats: 0 }, now).canResume,
    false,
  );
  assert.equal(
    salesState({ ...slot, serviceActive: false }, now).canResume,
    false,
  );
  assert.equal(salesState({ ...slot, runsAsScheduled: false }, now).canResume, false);
  assert.equal(salesState({ ...slot, status: 'open', runsAsScheduled: false }, now).label, 'Session not confirmed');
});
test("editing only a price does not truncate seconds from an unchanged booking deadline", () => {
  const original = "2026-10-28T11:41:37.123Z";
  assert.equal(cutoffRequestValue("2026-10-28T19:41", original), original);
  assert.equal(
    cutoffRequestValue("2026-10-28T19:42", original),
    "2026-10-28T11:42:00.000Z",
  );
});

test('future inventory is not described as bookable before its discovery window', () => {
  const now = Date.parse('2026-11-01T00:00:00Z');
  const slot = {status:'open',startsAt:'2026-11-04T00:00:00Z',bookingClosesAt:'2026-11-03T22:00:00Z',remainingSeats:4,serviceActive:true,runsAsScheduled:true};
  assert.equal(salesState(slot,now,72).label,'Not listed yet');
  assert.equal(salesState(slot,now+1,72).label,'Bookable');
  assert.equal(salesState(slot,now,96).label,'Bookable');
  assert.equal(salesState({...slot,status:'paused'},now,72).canResume,true);
});
