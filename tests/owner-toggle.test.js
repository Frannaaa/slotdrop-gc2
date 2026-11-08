import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import * as policy from '../public/js/owner-policy.js';

test('successful Owner sales toggle reports saved status when refresh fails',async()=>{
 const elements=new Map(),writes=[];
 class Node {
  constructor(){this.children=[];this.events={};this.dataset={};this.value='';
   this.classList={toggle(){}};this.hidden=false;this.disabled=false;}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  addEventListener(type,fn){this.events[type]=fn;}
  setAttribute(){}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Node());return elements.get(id);};
 get('offer-form').elements={namedItem:name=>get(name)};
 const document={hidden:false,getElementById:get,createElement:()=>new Node(),addEventListener(){}};
 const now=Date.now();
 const slot={id:1,serviceId:1,providerName:'Demo studio',serviceName:'Demo workshop',area:'QC',
  startsAt:new Date(now+5*3600000).toISOString(),bookingClosesAt:new Date(now+3*3600000).toISOString(),
  remainingSeats:4,capacity:4,originalPriceCentavos:200000,offerPriceCentavos:160000,
  buddyPriceCentavos:null,status:'open',serviceActive:true,runsAsScheduled:true};
 const catalog={services:[{id:1,active:true,providerName:'Demo studio',name:'Demo workshop'}],
  slots:[slot],commissionBasisPoints:1000,discoveryHours:72};
 const file=await readFile(new URL('../public/js/owner.js',import.meta.url),'utf8');
 const js=file.replace(/^import[\s\S]*?from "\.\/owner-policy\.js";\n/,'')
  .replace(/^import \{ api \} from "\.\/api\.js";\n/m,'')
  .replace(/reset\(\);\nload\(\);\s*$/,'');
 const context={document,...policy,Intl,Date,setInterval(){},
  api:async(path,options)=>{
   if(options?.method==='PATCH'){writes.push({path,body:JSON.parse(options.body)});return {id:1};}
   throw new Error('Readback unavailable');
  },initialCatalog:catalog};
 runInNewContext(js+'\ncatalog=initialCatalog;loaded=true;renderSessions();',context);
 const card=get('sessions').children[0];
 const toggle=card.children.at(-1).children[1];
 assert.equal(typeof toggle.events.click,'function');
 await toggle.events.click();
 assert.deepEqual(writes,[{path:'/api/slots/1',body:{status:'paused'}}]);
 assert.match(get('page-message').textContent,/Sales status saved, but the workspace could not refresh/);
 assert.match(get('page-message').textContent,/do not toggle sales again/);
 assert.equal(get('refresh').disabled,false);
});
