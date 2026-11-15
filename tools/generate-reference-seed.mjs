import {writeFile} from 'node:fs/promises';
import {referenceCatalog, samplePrices} from '../server/repositories/reference-catalog.js';
const {offerings}=referenceCatalog;
const quote=value=>value===null?'NULL':"'"+String(value).replaceAll("'","''")+"'";
const providers=[...new Map(offerings.map(row=>[row.providerKey,row])).values()];
let sql=`-- Real studio references; schedules, allocations, cutoffs and offers are course simulations.\n-- Never run this on a populated database. Generated from public/data/real-studio-demo.json.\nBEGIN;\nDO $$ BEGIN\n IF EXISTS(SELECT 1 FROM providers) OR EXISTS(SELECT 1 FROM services) OR EXISTS(SELECT 1 FROM slots) OR EXISTS(SELECT 1 FROM bookings) THEN\n  RAISE EXCEPTION 'Seed requires an empty demo database; no data changed';\n END IF;\nEND $$;\n`;
sql+='INSERT INTO providers(id,name,city,area,reference_key) VALUES\n'+providers.map((r,i)=>`(${i+1},${quote(r.business)},${quote(r.city)},${quote(r.area)},${quote(r.providerKey)})`).join(',\n')+';\n';
sql+='INSERT INTO services(id,provider_id,name,category,activity_type,technique,inclusions,preparation_note,cancellation_note,duration_minutes,recurrence_note,default_booking_cutoff_minutes,reference_key) VALUES\n';
sql+=offerings.map((r,i)=>`(${i+1},${providers.findIndex(p=>p.providerKey===r.providerKey)+1},${quote(r.activity)},${quote(r.category)},${quote(r.activityType)},${quote(r.technique)},ARRAY[${r.inclusions.map(quote)}]::TEXT[],${quote(r.preparationNote)},'Course simulation: no real reservation, cancellation or refund is created.',${r.durationMinutes},${quote('Sample dates only. Published schedule reference: '+r.publishedSchedule)},${r.activityType==='pottery'?180:60},${quote(r.key)})`).join(',\n')+';\n';
sql+=`WITH base AS (SELECT (date_trunc('day',NOW() AT TIME ZONE 'Asia/Manila')+INTERVAL '1 day') AT TIME ZONE 'Asia/Manila' AS day),\n offers(id,service_id,hours,price,offer,buddy) AS (VALUES\n`;
sql += offerings.flatMap((item, index) => {
  const [regular, offer, buddy] = samplePrices(item, index);
  return [0, 24].map((day, offset) =>
    `(${index * 2 + offset + 1},${index + 1},${10 + index + day},${regular},${offer},${buddy ?? 'NULL'})`,
  );
}).join(',\n');
sql+=`) INSERT INTO slots(id,service_id,starts_at,booking_closes_at,capacity,original_price_centavos,offer_price_centavos,buddy_price_centavos)\n SELECT o.id,o.service_id,base.day+make_interval(hours=>o.hours),base.day+make_interval(hours=>o.hours)-make_interval(mins=>s.default_booking_cutoff_minutes),4,o.price,o.offer,o.buddy\n FROM offers o CROSS JOIN base JOIN services s ON s.id=o.service_id ORDER BY o.id;\n`;
for(const table of ['providers','services','slots'])sql+=`SELECT setval(pg_get_serial_sequence('${table}','id'),(SELECT MAX(id) FROM ${table}));\n`;
sql+='COMMIT;\n';
await writeFile(new URL('../db/seed.sql',import.meta.url),sql);
console.log('Generated real-studio reference seed with '+offerings.length*2+' explicitly simulated sessions.');
