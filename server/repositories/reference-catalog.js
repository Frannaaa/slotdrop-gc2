import { readFile } from 'node:fs/promises';

export const referenceCatalog = JSON.parse(
  await readFile(new URL('../../public/data/real-studio-demo.json', import.meta.url), 'utf8')
);
export const studioReferences = new Map(
  referenceCatalog.offerings.map(item => [item.key, item])
);

export function samplePrices(item, index) {
  const offer = Math.round(item.publishedPriceCentavos * 0.9);
  const buddy = index % 3 === 2 ? null : Math.round(offer * 0.95);
  return [item.publishedPriceCentavos, offer, buddy];
}

async function ensurePracticeSessions(client, item, prices) {
  // Bumi demonstrates choosing between two fictional dates; other activities
  // demonstrate the single-slot path. Both variants have no actual cutoff.
  const count = item.key === 'bumi-mug' ? 2 : 1;
  for (let variant = 1; variant <= count; variant++) {
    await client.query(
      `INSERT INTO slots (service_id, demo_variant, capacity, original_price_centavos, offer_price_centavos, buddy_price_centavos)
       SELECT s.id, $2, 20, $3, $4, $5 FROM services s WHERE s.reference_key = $1 AND s.active
       ON CONFLICT DO NOTHING`,
      [item.key, variant, ...prices],
    );
  }
}

// Add only missing references. Never alter saved booking dates, prices or receipts.
export async function ensureReferenceCatalog(db) {
  return db.transaction(async client => {
    for (const [index, item] of referenceCatalog.offerings.entries()) {
      const bookingLeadMinutes = item.activityType === 'pottery' ? 180 : 60;
      await client.query(
        'INSERT INTO providers(name,city,area,reference_key) VALUES($1,$2,$3,$4) ON CONFLICT(reference_key) DO NOTHING',
        [item.business, item.city, item.area, item.providerKey]
      );
      const { rows: [provider] } = await client.query(
        'SELECT id FROM providers WHERE reference_key=$1',
        [item.providerKey]
      );
      const { rows: addedServices } = await client.query(
        `INSERT INTO services(provider_id,name,category,activity_type,technique,inclusions,preparation_note,cancellation_note,duration_minutes,recurrence_note,default_booking_cutoff_minutes,reference_key)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT(reference_key) DO NOTHING RETURNING id`,
        [
          provider.id, item.activity, item.category, item.activityType,
          item.technique, item.inclusions, item.preparationNote,
          'Course simulation: changes here do not cancel or reserve a real studio visit. Check the studio website for its actual policy.',
          item.durationMinutes,
          'Sample dates only. Published schedule reference: ' + item.publishedSchedule,
          bookingLeadMinutes, item.key,
        ]
      );

      let serviceId = addedServices[0]?.id;
      if (!serviceId) {
        // An existing activity with cleared inventory must remain cleared after restart.
        // Only roll the sample dates forward when no remaining session can still be booked
        // (cutoff passed, paused, cancelled, not running, or sold out), so a long-lived demo deployment never ends up with an empty catalog.
        const { rows: [state] } = await client.query(
          `SELECT s.id, COUNT(sl.id)::int AS total,
             COUNT(sl.id) FILTER (WHERE sl.booking_closes_at > NOW() AND sl.status = 'open' AND sl.runs_as_scheduled
               AND sl.capacity > COALESCE((SELECT SUM(b.quantity) FROM bookings b
                 WHERE b.slot_id = sl.id AND b.status = 'confirmed'), 0))::int AS upcoming
           FROM services s LEFT JOIN slots sl ON sl.service_id = s.id AND sl.starts_at IS NOT NULL
           WHERE s.reference_key = $1 AND s.active
           GROUP BY s.id`,
          [item.key]
        );
        if (!state || state.total === 0 || state.upcoming > 0) continue;
        serviceId = state.id;
      }
      const prices = samplePrices(item, index);
      await client.query(
        `WITH base AS (
           SELECT (date_trunc('day',NOW() AT TIME ZONE 'Asia/Manila')+INTERVAL '1 day')
             AT TIME ZONE 'Asia/Manila' AS day
         )
         INSERT INTO slots(service_id,starts_at,booking_closes_at,capacity,original_price_centavos,offer_price_centavos,buddy_price_centavos)
         SELECT $1,base.day+make_interval(hours=>$2::int+offset_day),
           base.day+make_interval(hours=>$2::int+offset_day)-make_interval(mins=>$3::int),
           4,$4,$5,$6
         FROM base CROSS JOIN (VALUES(0),(24)) AS days(offset_day)
         ON CONFLICT(service_id,starts_at) DO NOTHING`,
        [serviceId, 10 + index, bookingLeadMinutes,
          ...prices]
      );
    }

    for (const [index, item] of referenceCatalog.offerings.entries()) {
      if (['laro-mug', 'bumi-mug', 'sip-open'].includes(item.key)) {
        await ensurePracticeSessions(client, item, samplePrices(item, index));
      }
    }

    // Retire only the four historical fictional fixture activities.
    // Keep all existing sessions/receipts and unrelated user-created offerings.
    await client.query(`UPDATE services s SET active=false FROM providers p
      WHERE s.provider_id=p.id AND s.reference_key IS NULL AND p.reference_key IS NULL
      AND (
        (p.name='Demo Clay Corner' AND s.name IN ('Beginner Mug Handbuilding','Ceramic Painting for Beginners'))
        OR (p.name='Demo Color Room' AND s.name='Beginner Canvas Painting')
        OR (p.name='Demo Move Studio' AND s.name='Beginner Dance Drop-in')
      )`);
  });
}
