import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { inspectGC2 } from './check-gc2-readiness.mjs';

const origin = 'https://slotdrop-gc2-group-zx8j.onrender.com';
const build = 'd3d2f1381c0ef8776685abf46c081130f33dd889';
const out = 'final-live-evidence';
const browse = origin + '/browse.html';
await mkdir(out, { recursive: true });
async function save(name, value) {
  await writeFile(out + '/' + name + '.json', JSON.stringify(value, null, 2) + '\n');
  console.log('SLOTDROP_' + name.toUpperCase().replaceAll('-', '_') + ' ' + JSON.stringify(value));
}
async function json(path) {
  const r = await fetch(origin + path, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
  assert.equal(r.status, 200, path);
  return r.json();
}
async function readiness() {
  for (let i = 0; i < 5; i++) {
    try { assert.equal((await json('/api/health')).status, 'ok'); break; }
    catch(e) { if (i === 4) throw e; await new Promise(r => setTimeout(r, 5000)); }
  }
  const checks = await inspectGC2(origin);
  await save('readiness', { measuredAt:new Date().toISOString(), origin, expectedBuild:build, checks });
  assert.equal(checks.length, 16);
  assert.ok(checks.every(x => x.pass), 'One or more GC2 readiness checks failed');
  const icon = await fetch(origin + '/favicon.svg', { signal: AbortSignal.timeout(30000) });
  assert.equal(icon.status, 200, 'Missing production favicon');
  const practice = await json('/api/slots?view=practice');
  assert.ok(Array.isArray(practice) && practice.length >= 2, 'Need bookable grading sessions');
  assert.ok(practice.some(x => x.remainingSeats >= 1), 'Grading practice sessions are sold out');
  const workshops = await json('/api/slots?view=workshops&page=1&limit=6');
  assert.ok(Array.isArray(workshops.workshops), 'Browse grouped workshops contract');
  await save('inventory', {measuredAt:new Date().toISOString(),expectedBuild:build,practice:practice.map(x=>({id:x.id,serviceName:x.serviceName,remainingSeats:x.remainingSeats})),workshopGroups:workshops.workshops.length,hasNextPage:workshops.hasNextPage});
}
async function browserAudit() {
  const {chromium}=await import('playwright');
  const browser=await chromium.launch();
  try {
    const page=await browser.newPage({viewport:{width:412,height:823},deviceScaleFactor:1.75,isMobile:true,hasTouch:true});
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    const responses=[];
    page.on('response', r=>{ if(r.url().startsWith(origin+'/') && r.request().resourceType()==='fetch') responses.push({url:r.url().slice(origin.length),status:r.status()}); });
    const response=await page.goto(browse,{waitUntil:'domcontentloaded',timeout:65000});
    assert.equal(response.status(),200);
    await page.locator('#results .activity-card').first().waitFor({timeout:30000});
    await page.waitForLoadState('networkidle', {timeout:25000});
    const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth}));
    const cards=await page.locator('#results .activity-card').count();
    assert.ok(cards>=1 && cards<=6);
    assert.ok(layout.document<=layout.viewport+1, 'Horizontal overflow');
    const panel=page.locator('#practice-sessions');
    assert.equal(await panel.count(),1);
    await panel.locator('summary').click();
    await page.locator('#practice-results .activity-card').first().waitFor({timeout:30000});
    const practiceCards=await page.locator('#practice-results .activity-card').count();
    await page.screenshot({path:out+'/browse-mobile.png',fullPage:true,animations:'disabled'});
    await save('mobile-browser',{measuredAt:new Date().toISOString(), expectedBuild:build,layout,cards,practiceCards,fetchResponses:responses,pageErrors:errors});
    assert.deepEqual(errors,[]);
    assert.ok(practiceCards>=2);
  } finally {await browser.close();}
}
async function lighthouseAudit() {
  const {chromium}=await import('playwright');
  const {default:lighthouse}=await import('lighthouse');
  for (let iteration=1; iteration<=2; iteration++) {
    const port=9270+iteration;
    const browser=await chromium.launch({args:['--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port]});
    try {
      const {lhr}=await lighthouse(browse,{port,logLevel:'error',onlyCategories:['performance','accessibility','best-practices']});
      assert.ok(!lhr.runtimeError,lhr.runtimeError?.message);
      const scores=Object.fromEntries(Object.entries(lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)]));
      const failures=Object.fromEntries(Object.entries(lhr.categories).map(([k,c])=>[k,c.auditRefs.filter(({id,weight})=>weight>0&&lhr.audits[id].score!==null&&lhr.audits[id].score<1).map(({id})=>({id,score:lhr.audits[id].score}))]));
      await save('lighthouse-'+iteration,{measuredAt:lhr.fetchTime,expectedBuild:build,version:lhr.lighthouseVersion,scores,failures,runtimeWarnings:lhr.runWarnings});
      await writeFile(out+'/lighthouse-full-'+iteration+'.json',JSON.stringify(lhr));
    } finally {await browser.close();}
  }
}
const mode=process.argv[2];
if(mode==='readiness') await readiness();
else if(mode==='browser') await browserAudit();
else if(mode==='lighthouse') await lighthouseAudit();
else throw Error('Expected readiness, browser or lighthouse');
