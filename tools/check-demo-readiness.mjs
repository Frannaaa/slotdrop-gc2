// Read-only smoke check for a locally hosted or deployed SlotDrop course demo.
// A fresh sample seed expires; never silently recreate offers or reset receipts.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISCOVERY_HOURS } from '../public/js/business-config.js';

export function assessSlots(slots, now = Date.now()) {
  if (!Array.isArray(slots)) throw new Error('Expected an array from GET /api/slots.');
  const usable = slots.filter(slot =>
    slot && slot.serviceActive === true && slot.status === 'open' &&
    slot.runsAsScheduled === true && Number(slot.remainingSeats) >= 1 &&
    Number.isFinite(Date.parse(slot.startsAt)) &&
    Date.parse(slot.startsAt) > now &&
    Date.parse(slot.startsAt) < now + DISCOVERY_HOURS * 3600000 &&
    Number.isFinite(Date.parse(slot.bookingClosesAt)) &&
    Date.parse(slot.bookingClosesAt) > now
  );
  const lastCutoff = usable.length ? Math.max(...usable.map(slot => Date.parse(slot.bookingClosesAt))) : null;
  return {
    bookableSessions: usable.length,
    businessCount: new Set(usable.map(slot => slot.providerId)).size,
    lastCutoff,
    lessThanOneDayLeft: lastCutoff !== null && lastCutoff - now < 24 * 3600000,
  };
}

async function main() {
  const address = process.argv[2] || 'http://localhost:3000';
  const base = new URL(address);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password)
    throw new Error('Provide an HTTP(S) demo address without credentials.');
  const url = new URL('/api/slots', base);
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`GET ${url.pathname} returned HTTP ${response.status}.`);
  const report = assessSlots(await response.json());
  console.log(`SlotDrop demo readiness: ${report.bookableSessions} bookable sample sessions across ${report.businessCount} providers.`);
  if (!report.bookableSessions) {
    console.error('NOT READY: no bookable demo sessions. Create new FUTURE sample offers through Owner; do not reseed or modify old receipts.');
    process.exitCode = 1;
  } else {
    console.log(`Latest demo booking cutoff: ${new Date(report.lastCutoff).toLocaleString('en-PH', {timeZone:'Asia/Manila', dateStyle:'medium', timeStyle:'short'})} PHT.`);
    if (report.lessThanOneDayLeft) console.warn('WARNING: every currently bookable session closes within 24 hours. Prepare NEW sample offers for the next demo.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(); }
  catch (error) { console.error('Demo readiness check failed:', error.message); process.exitCode = 1; }
}
