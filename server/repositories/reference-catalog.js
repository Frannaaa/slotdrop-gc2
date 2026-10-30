import {readFile} from 'node:fs/promises';
export const referenceCatalog=JSON.parse(await readFile(new URL('../../public/data/real-studio-demo.json',import.meta.url),'utf8'));
export const studioReferences=new Map(referenceCatalog.offerings.map(row=>[row.key,row]));

// One-time, additive demo installation. Never rename old providers, shift old
// dates, alter saved prices, delete receipts or republish exhausted allocations.
export async function ensureReferenceCatalog(db) {
 return db.transaction(async client=>{
  for(const [index,item] of referenceCatalog.offerings.entries()) {
   await client.query('INSERT INTO providers(name,city,area,reference_key) VALUES($1,$2,$3,$4) ON CONFLICT(reference_key) DO NOTHING',[item.business,item.city,item.area,item.providerKey]);
   const provider=(await client.query('SELECT id FROM providers WHERE reference_key=$1',[item.providerKey])).rows[0];
   await client.query(`INSERT INTO services(provider_id,name,category,activity_type,technique,inclusions,preparation_note,cancellation_note,duration_minutes,recurrence_note,default_booking_cutoff_minutes,reference_key)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(reference_key) DO NOTHING`,
    [provider.id,item.activity,item.category,item.activityType,item.technique,item.inclusions,item.preparationNote,
     'Course simulation: changes here do not cancel or reserve a real studio visit. Check the studio website for its actual policy.',item.durationMinutes,
     'Sample dates only. Published schedule reference: '+item.publishedSchedule,item.activityType==='pottery'?180:60,item.key]);
   const service=(await client.query('SELECT id FROM services WHERE reference_key=$1 FOR UPDATE',[item.key])).rows[0];
   const hasOffers=(await client.query('SELECT 1 FROM slots WHERE service_id=$1 LIMIT 1',[service.id])).rows.length;
   if(!hasOffers) {
    const price=Math.round(item.publishedPriceCentavos*0.9),buddy=index%3===2?null:Math.round(price*0.95);
    await client.query(`WITH base AS (SELECT (date_trunc('day',NOW() AT TIME ZONE 'Asia/Manila')+INTERVAL '1 day') AT TIME ZONE 'Asia/Manila' AS day)
     INSERT INTO slots(service_id,starts_at,booking_closes_at,capacity,original_price_centavos,offer_price_centavos,buddy_price_centavos)
     SELECT $1,base.day+make_interval(hours=>$2::int+offset_day),base.day+make_interval(hours=>$2::int+offset_day)-make_interval(mins=>$3::int),4,$4,$5,$6 FROM base CROSS JOIN (VALUES(0),(24)) AS days(offset_day) ON CONFLICT(service_id,starts_at) DO NOTHING`,
     [service.id,10+index, item.activityType==='pottery'?180:60,item.publishedPriceCentavos,price,buddy]);
   }
  }
  // Only the known former test fixtures are retired. Their records and bookings remain.
  await client.query("UPDATE services s SET active=false FROM providers p WHERE s.provider_id=p.id AND s.reference_key IS NULL AND p.name IN ('Demo Clay Corner','Demo Color Room','Demo Move Studio')");
 });
}
