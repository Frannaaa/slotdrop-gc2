// Rebuild the three-page report from the recorded API evidence.
// The template states the current integration limits. Refresh that status and
// the evidence before release; generating a PDF does not certify readiness.
import { readFile, writeFile } from 'node:fs/promises';
const evidence = JSON.parse(await readFile(new URL('../docs/evidence/final-readiness.json', import.meta.url), 'utf8'));
if (!evidence.ownerBonus?.verified) throw new Error('Run npm run check:final and verify the Owner fixture first.');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const money = cents => 'PHP ' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
const metrics = evidence.ownerBonus.metrics;
const values = {
  evidenceDate: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', dateStyle: 'long' }).format(new Date(evidence.checkedAt)),
  receiptId: evidence.ownerBonus.receiptIds[1],
  nodeVersion: evidence.node,
  bookingCount: metrics.bookingCount,
  platformRevenue: money(metrics.platformRevenueCentavos),
  averageOrder: money(metrics.averageOrderValueCentavos)
};
const template = await readFile(new URL('./report-template.html', import.meta.url), 'utf8');
const html = template.replace(/\{\{([a-zA-Z]+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error('Unknown report field: ' + key);
  return escape(values[key]);
});
if (/[\u2013\u2014]/.test(html)) throw new Error('Use plain hyphens in the report.');
if (/\{\{/.test(html)) throw new Error('An unresolved report field remains.');
await writeFile(new URL('../docs/SlotDrop_Final_Report.html', import.meta.url), html);
console.log('Prepared docs/SlotDrop_Final_Report.html. Print A4 with CSS page size and inspect all three PDF pages.');

