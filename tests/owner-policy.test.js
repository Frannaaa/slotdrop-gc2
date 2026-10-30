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
    "Activity default: 30 minutes before start. Keeping your custom deadline.",
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


test('invalid owner dates cannot retain a stale automatic booking deadline', async () => {
  const { sessionDate, suggestedCutoff } = await import('../public/js/owner-policy.js');
  assert.throws(() => suggestedCutoff('10000-11-01T15:00', 180), /valid date/);
  assert.throws(() => sessionDate('2026-02-30T15:00'), /valid date/);
  assert.throws(() => sessionDate('0001-01-01T07:59'), /valid date/);
  assert.throws(() => suggestedCutoff('0001-01-01T08:00', 30), /later session/);
  assert.equal(suggestedCutoff('2026-11-01T15:00', 180).toISOString(), '2026-11-01T04:00:00.000Z');
});

test('Owner chooses active studios after deactivating legacy fixtures', async () => {
  const { preferredServiceId } = await import('../public/js/owner-policy.js');
  const services = [
    {id:1,name:'Retired fixture',active:false},
    {id:2,name:'Real source-backed studio',active:true},
    {id:3,name:'Another active studio',active:true},
  ];
  assert.equal(preferredServiceId(services,'',null),'2');
  assert.equal(preferredServiceId(services,'1',null),'2');
  assert.equal(preferredServiceId(services,'3',null),'3');
  assert.equal(preferredServiceId(services,'1',1),'1'); // historical editor is still readable
  assert.equal(preferredServiceId(services.map(service=>({...service,active:false})),'',null),'');
});

test('Postman active-studio setup follows the current Owner catalog', async () => {
  const { readFile } = await import('node:fs/promises');
  const collection = JSON.parse(await readFile(new URL('../docs/SlotDrop-Fran.postman_collection.json', import.meta.url),'utf8'));
  const owner = collection.item.flatMap(group => group.item||[]).find(item => item.name==='Owner catalog includes managed inventory');
  const script = owner.event.find(event => event.listen==='test').script.exec.join('\n');
  assert.match(script,/services\.find\(service=>service\.active===true\)/);
  assert.match(script,/collectionVariables\.set\('serviceId'/);
});
