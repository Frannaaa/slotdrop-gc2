import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const origin='https://slotdrop-gc2-group-zx8j.onrender.com';
const id='57ec16ea-c871-48b2-8351-5965df467f79';
await mkdir('outsider-evidence',{recursive:true});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const res=await page.goto(origin+'/owner.html',{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(res.status(),200,'Owner page should load');
 const row=page.locator('#bookings tbody tr').filter({hasText:id});
 await row.waitFor({timeout:30000});
 assert.equal(await row.count(),1,'Exactly one Owner UI row for phone booking');
 const label=await row.innerText();
 assert.ok(label.includes('10,260')||label.includes('10260'),'Owner UI row shows saved PHP total');
 await row.screenshot({path:'outsider-evidence/owner-row.png',animations:'disabled'});
 assert.deepEqual(errors,[],'Owner page JavaScript errors');
 console.log('SLOTDROP_OUTSIDER_OWNER_UI '+JSON.stringify({checkedAt:new Date().toISOString(),origin,bookingId:id,ownerHttp:res.status(),matchingRows:1,hasSavedTotal:true,consoleErrors:errors.length,screenshot:'owner-row.png'}));
} finally {await browser.close();}
