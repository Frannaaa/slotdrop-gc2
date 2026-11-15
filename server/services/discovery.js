// Group assignment: Fran. See README.md#team.
import { MAX_SEATS } from '../config/business.js';
import { integer, invalid } from '../lib/validation.js';
import { searchSlots } from '../repositories/slots.js';

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

export async function listSlots(db, query, now, providerId = null) {
  for (const key of Object.keys(query)) {
    if (!['q', 'category', 'area', 'when', 'people', 'type', 'tag', 'sort', 'page', 'limit', 'view'].includes(key)) invalid('Unsupported filter: ' + key);
    if (typeof query[key] !== 'string') invalid('Filters must appear once.');
  }
  if (query.category !== undefined && !['creative','active'].includes(query.category)) invalid('Invalid category.');
  if (query.type !== undefined && !['pottery','painting','pilates','dance','other'].includes(query.type)) invalid('Invalid activity type.');
  if (query.tag !== undefined && !['beginner','handbuilding','wheel-throwing','painting-included','materials-included'].includes(query.tag)) invalid('Invalid activity attribute.');
  if (query.sort !== undefined && !['soonest','price-low','price-high'].includes(query.sort)) invalid('Invalid sort.');
  if (query.when !== undefined && !['today','tomorrow','weekend'].includes(query.when)) invalid('Invalid date filter.');
  if (query.view !== undefined && query.view !== 'closed') invalid('Invalid session view.');
  if ((query.q?.length ?? 0) > 100 || (query.area?.length ?? 0) > 100) invalid('Search text is too long.');
  if ([query.q, query.area].some(value => value?.includes('\u0000'))) invalid('Search text cannot contain null characters.');
  const people = query.people === undefined ? 1 : integer(query.people, 'people', 1, MAX_SEATS);
  const closed = query.view === 'closed';
  // Bound the closed view. Keep pagination opt-in for existing callers.
  const paginated = closed || query.page !== undefined || query.limit !== undefined;
  const page = query.page === undefined ? 1 : integer(query.page, 'page', 1, 10000);
  const limit = query.limit === undefined ? 12 : integer(query.limit, 'limit', 1, 50);
  return searchSlots(db, {
    ...query,
    q: query.q?.trim(),
    now,
    people,
    closed,
    providerId: providerId === null ? null : integer(providerId, 'providerId'),
    range: dateRange(query.when, now),
    pagination: paginated ? { limit, offset: (page - 1) * limit } : null,
  });
}
