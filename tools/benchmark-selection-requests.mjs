// Read-only benchmark for Selection's independent Detail and Quote requests.
// With no args, uses a disposable PGlite-backed fixture. Optionally:
// node tools/benchmark-selection-requests.mjs https://PUBLIC-HOST SLOT_ID QUANTITY
// No bookings, mutations or guest data are sent.
import { performance } from 'node:perf_hooks';
import { fixture } from '../tests/helpers.js';

const origin = process.argv[2];
const slotId = Number(process.argv[3] || 1);
const quantity = Number(process.argv[4] || 2);
if (!Number.isSafeInteger(slotId) || slotId < 1 ||
    !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
  throw new Error('Pass a valid SLOT_ID and QUANTITY (1–100).');
}
let testServer;
try {
  testServer = origin ? { base: new URL(origin).origin, close: async () => {} } : await fixture();
  const base = testServer.base.replace(/\/$/, '');
  const paths = [
    '/api/slots/' + slotId,
    '/api/pricing/quote?slotId=' + slotId + '&quantity=' + quantity,
  ];
  async function get(path) {
    const response = await fetch(base + path, { cache: 'no-store' });
    if (!response.ok) throw new Error('GET ' + path + ' returned HTTP ' + response.status);
    return response.json();
  }
  async function sequential() {
    const start = performance.now();
    for (const path of paths) await get(path);
    return performance.now() - start;
  }
  async function parallel() {
    const start = performance.now();
    await Promise.all(paths.map(get));
    return performance.now() - start;
  }
  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
  // Warm each endpoint once; alternate first method to reduce order effects.
  await sequential();
  await parallel();
  const sequentialTimes = [], parallelTimes = [];
  for (let i = 0; i < 7; i++) {
    if (i % 2) {
      parallelTimes.push(await parallel());
      sequentialTimes.push(await sequential());
    } else {
      sequentialTimes.push(await sequential());
      parallelTimes.push(await parallel());
    }
  }
  const sequentialMedianMs = median(sequentialTimes);
  const parallelMedianMs = median(parallelTimes);
  const result = {
    date: new Date().toISOString(),
    environment: origin ? 'provided public API' : 'disposable local fixture',
    urls: paths.map(path => base + path),
    runs: 7,
    sequentialMedianMs: Number(sequentialMedianMs.toFixed(2)),
    parallelMedianMs: Number(parallelMedianMs.toFixed(2)),
    differenceMs: Number((sequentialMedianMs - parallelMedianMs).toFixed(2)),
    caveat: 'Observed timing, not guaranteed speedup; network, cache, host and warmup affect results. Both requests were real HTTP GETs. Browser waterfall must be captured separately.',
  };
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (testServer) await testServer.close();
}
