// Group assignment: Fran. See README.md#team.
import { BUDDY_MIN_SEATS, DISCOVERY_HOURS } from '../config/business.js';
import { safeNumber } from '../lib/validation.js';
import { studioReferences } from './reference-catalog.js';
import { discountPercent } from '../../public/js/business-config.js';

export const SLOT_SELECT = `SELECT sl.*, s.provider_id, s.name AS service_name, s.category,
  s.reference_key, s.activity_type, s.technique, s.inclusions, s.preparation_note, s.cancellation_note,
  s.duration_minutes, s.beginner_friendly, s.recurrence_note, s.active,
  s.default_booking_cutoff_minutes, p.name AS provider_name, p.city, p.area,
  inventory.seats_booked
  FROM slots sl
  JOIN services s ON s.id=sl.service_id
  JOIN providers p ON p.id=s.provider_id
  CROSS JOIN LATERAL (
    SELECT COALESCE(SUM(b.quantity), 0) AS seats_booked
    FROM bookings b WHERE b.slot_id=sl.id AND b.status='confirmed'
  ) inventory`;
export const SLOT_BOOKING_WINDOW = '(sl.starts_at IS NULL OR (sl.starts_at > $1 AND sl.starts_at < $2 AND sl.booking_closes_at > $1))';

export function slotResponse(row) {
  const number = key => safeNumber(row[key]);
  const originalPriceCentavos = number('original_price_centavos');
  const offerPriceCentavos = number('offer_price_centavos');
  return {
    id: number('id'), serviceId: number('service_id'), providerId: number('provider_id'),
    studioReference: studioReferences.get(row.reference_key) || null,
    providerName: row.provider_name, serviceName: row.service_name, category: row.category,
    activityType: row.activity_type, technique: row.technique, inclusions: row.inclusions,
    preparationNote: row.preparation_note, cancellationNote: row.cancellation_note,
    city: row.city, area: row.area, durationMinutes: number('duration_minutes'), beginnerFriendly: row.beginner_friendly,
    startsAt: row.starts_at === null ? null : new Date(row.starts_at).toISOString(),
    demoVariant: row.starts_at === null ? number('demo_variant') : null,
    bookingClosesAt: row.booking_closes_at === null ? null : new Date(row.booking_closes_at).toISOString(),
    capacity: number('capacity'), remainingSeats: number('capacity') - number('seats_booked'),
    originalPriceCentavos, offerPriceCentavos,
    buddyPriceCentavos: row.buddy_price_centavos === null ? null : number('buddy_price_centavos'),
    discountPercent: discountPercent(originalPriceCentavos, offerPriceCentavos),
    status: row.status, serviceActive: row.active, recurrenceNote: row.recurrence_note, runsAsScheduled: row.runs_as_scheduled,
    defaultBookingCutoffMinutes: number('default_booking_cutoff_minutes')
  };
}

export async function findSlot(db, id) {
  const { rows } = await db.query(SLOT_SELECT + ' WHERE sl.id=$1', [id]);
  return rows[0] ? slotResponse(rows[0]) : null;
}

export async function searchSlots(db, query) {
  const { now, people, closed, providerId, range, pagination } = query;
  const values = closed
    ? [now, people]
    : [now, new Date(now.getTime() + DISCOVERY_HOURS * 3600000), people];
  const partySize = '$' + values.length;
  function bind(value) {
    values.push(value);
    return '$' + values.length;
  }
  const where = [`s.active AND sl.status='open' AND sl.runs_as_scheduled`];
  if (closed) {
    where.push('sl.booking_closes_at <= $1', 'sl.capacity >= ' + partySize);
  } else {
    where.push(SLOT_BOOKING_WINDOW,
      'sl.capacity - inventory.seats_booked >= ' + partySize);
  }
  if (query.view === 'practice') where.push('sl.starts_at IS NULL');
  if (query.view === 'workshops') where.push('sl.starts_at IS NOT NULL');
  if (providerId !== null) where.push('s.provider_id=' + bind(providerId));
  // position() is a literal substring match, so user %/_ do not become wildcards.
  if (query.q) {
    const term = bind(query.q);
    where.push(`(position(lower(${term}) in lower(s.name)) > 0
      OR position(lower(${term}) in lower(p.name)) > 0
      OR position(lower(${term}) in lower(NULLIF(s.activity_type,'other'))) > 0
      OR position(lower(${term}) in lower(COALESCE(s.technique,''))) > 0
      OR EXISTS (SELECT 1 FROM unnest(s.inclusions) AS included(value)
        WHERE position(lower(${term}) in lower(included.value)) > 0))`);
  }
  if (query.category) where.push('s.category=' + bind(query.category));
  if (query.area) where.push('lower(p.area)=lower(' + bind(query.area) + ')');
  if (query.type) where.push('s.activity_type=' + bind(query.type));
  if (query.tag === 'beginner') where.push('s.beginner_friendly');
  if (['handbuilding', 'wheel-throwing'].includes(query.tag)) {
    where.push('s.technique=' + bind(query.tag));
  }
  if (query.tag === 'painting-included') where.push("'painting'=ANY(s.inclusions)");
  if (query.tag === 'materials-included') where.push("'materials'=ANY(s.inclusions)");
  if (range) {
    const [from, to] = range;
    where.push(`sl.starts_at >= ${bind(from)} AND sl.starts_at < ${bind(to)}`);
  }
  const effectivePrice = `CASE
    WHEN ${partySize} >= ${BUDDY_MIN_SEATS} AND sl.buddy_price_centavos IS NOT NULL
    THEN sl.buddy_price_centavos ELSE sl.offer_price_centavos END`;
  const scheduleOrder = 'sl.starts_at NULLS FIRST, sl.id';
  const defaultOrder = closed && !query.sort ? 'sl.booking_closes_at DESC, sl.id DESC' : scheduleOrder;
  const order = query.sort === 'price-low' ? effectivePrice + ' ASC, ' + scheduleOrder
    : query.sort === 'price-high' ? effectivePrice + ' DESC, ' + scheduleOrder : defaultOrder;
  const matching = SLOT_SELECT + ' WHERE ' + where.join(' AND ');
  if (query.view === 'workshops') {
    const { rows } = await db.query(`
      WITH matching AS (${matching}),
      ranked AS (
        SELECT sl.*, row_number() OVER (ORDER BY ${order}) AS position
        FROM matching sl
      ),
      page AS (
        SELECT service_id, MIN(position) AS first_position
        FROM ranked
        GROUP BY service_id
        ORDER BY first_position
        LIMIT ${bind(pagination.limit + 1)} OFFSET ${bind(pagination.offset)}
      )
      SELECT ranked.*
      FROM page JOIN ranked USING (service_id)
      ORDER BY page.first_position, ranked.starts_at, ranked.id
    `, values);
    const workshops = new Map();
    for (const row of rows) {
      const slot = slotResponse(row);
      if (!workshops.has(slot.serviceId)) workshops.set(slot.serviceId, []);
      workshops.get(slot.serviceId).push(slot);
    }
    return {
      workshops: [...workshops].slice(0, pagination.limit)
        .map(([serviceId, sessions]) => ({ serviceId, sessions })),
      hasNextPage: workshops.size > pagination.limit && Number(query.page ?? 1) < 10000,
    };
  }

  let sql = matching + ' ORDER BY ' + order;
  if (pagination) sql += ` LIMIT ${bind(pagination.limit)} OFFSET ${bind(pagination.offset)}`;
  const result = await db.query(sql, values);
  return result.rows.map(slotResponse);
}
