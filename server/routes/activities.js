// Group assignment: Fran. Public research references; never booking inventory.
import { Router } from 'express';
import { readFileSync } from 'node:fs';
const invalid = message => { throw Object.assign(new Error(message), {status:400, code:'INVALID_INPUT'}); };
const catalog = JSON.parse(readFileSync(new URL('../../public/data/studio-research.json', import.meta.url), 'utf8'));
const types = new Set(['pottery','painting','pilates']);
const tags = new Set(catalog.offerings.flatMap(item=>item.tags));
export function activityRouter() {
 const router = Router();
 router.get('/', (req,res)=>{
  for (const [key,value] of Object.entries(req.query)) {
   if (!['q','type','area','tag'].includes(key)) invalid('Unsupported filter: ' + key);
   if (typeof value !== 'string' || value.length > 100 || value.includes('\u0000')) invalid('Filters must appear once and contain valid text.');
  }
  const {q='',type='',area='',tag=''} = req.query;
  if (type && !types.has(type)) invalid('Invalid activity type.');
  if (tag && !tags.has(tag)) invalid('Invalid activity tag.');
  if (area && !['Quezon City','Makati'].includes(area)) invalid('Invalid area.');
  const offerings = catalog.offerings.filter(item => (!type || item.activityType === type) && (!area || item.branch.includes(area)) && (!tag || item.tags.includes(tag)) && [item.business,item.activity,item.branch].join(' ').toLowerCase().includes(q.trim().toLowerCase()));
  res.json({...catalog,offerings});
 });
 return router;
}
