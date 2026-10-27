import { DISCOVERY_HOURS, MAX_SEATS } from '../config/business.js';
import { integer, invalid } from '../lib/validation.js';
import { SLOT_SELECT, slotResponse } from '../repositories/slots.js';

export function dateRange(when, now) {
  // Manila has a fixed UTC+08 offset; calculate its midnight in UTC.
  const offset = 8 * 3600000, day = 24 * 3600000;
  const local = new Date(now.getTime() + offset);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset;
  if (when === 'today') return [new Date(midnight), new Date(midnight + day)];
  if (when === 'tomorrow') return [new Date(midnight + day), new Date(midnight + 2 * day)];
  if (when === 'weekend') {
    const weekday = local.getUTCDay();
    const start = weekday === 0 ? midnight - day : midnight + ((6 - weekday + 7) % 7) * day;
    return [new Date(start), new Date(start + 2 * day)];
  }
  return null;
}

export async function listSlots(db, query, now) {
  for (const key of Object.keys(query)) {
    if (!['q', 'category', 'area', 'when', 'people'].includes(key)) invalid('Unsupported filter: ' + key);
    if (typeof query[key] !== 'string') invalid('Filters must appear once.');
  }
  if (query.category !== undefined && !['creative','active'].includes(query.category)) invalid('Invalid category.');
  if (query.when !== undefined && !['today','tomorrow','weekend'].includes(query.when)) invalid('Invalid date filter.');
  if ((query.q?.length ?? 0) > 100 || (query.area?.length ?? 0) > 100) invalid('Search text is too long.');
  const people = query.people === undefined ? 1 : integer(query.people, 'people', 1, MAX_SEATS);
  const values = [now, new Date(now.getTime() + DISCOVERY_HOURS * 3600000), people];
  const where = [`s.active AND sl.status='open' AND sl.runs_as_scheduled`, 'sl.starts_at > $1 AND sl.starts_at < $2 AND sl.booking_closes_at > $1',
    `sl.capacity - COALESCE((SELECT SUM(quantity) FROM bookings WHERE slot_id=sl.id AND status='confirmed'),0) >= $3`];
  // position() is a literal substring match, so user %/_ do not become wildcards.
  if (query.q) { values.push(query.q.trim()); where.push(`(position(lower($${values.length}) in lower(s.name)) > 0 OR position(lower($${values.length}) in lower(p.name)) > 0)`); }
  if (query.category) { values.push(query.category); where.push('s.category=$' + values.length); }
  if (query.area) { values.push(query.area); where.push('lower(p.area)=lower($' + values.length + ')'); }
  const range = dateRange(query.when, now);
  if (range) { values.push(...range); where.push(`sl.starts_at >= $${values.length - 1} AND sl.starts_at < $${values.length}`); }
  const result = await db.query(SLOT_SELECT + ' WHERE ' + where.join(' AND ') + ' ORDER BY sl.starts_at, sl.id', values);
  return result.rows.map(slotResponse);
}
