// Group assignment: Fran. See docs/ownership-and-execution.md.
import { safeNumber } from '../lib/validation.js';
import { studioReferences } from './reference-catalog.js';
import { discountPercent } from '../../public/js/business-config.js';

export const SLOT_SELECT = `SELECT sl.*, s.provider_id, s.name AS service_name, s.category,
  s.reference_key, s.activity_type, s.technique, s.inclusions, s.preparation_note, s.cancellation_note,
  s.duration_minutes, s.beginner_friendly, s.recurrence_note, s.active,
  s.default_booking_cutoff_minutes, p.name AS provider_name, p.city, p.area,
  COALESCE((SELECT SUM(b.quantity) FROM bookings b WHERE b.slot_id=sl.id AND b.status='confirmed'),0) AS seats_booked
  FROM slots sl JOIN services s ON s.id=sl.service_id JOIN providers p ON p.id=s.provider_id`;
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
