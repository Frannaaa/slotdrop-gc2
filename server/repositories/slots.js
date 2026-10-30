import { safeNumber } from '../lib/validation.js';

export const SLOT_SELECT = `SELECT sl.*, s.provider_id, s.name AS service_name, s.category,
  s.duration_minutes, s.beginner_friendly, s.recurrence_note, s.active,
  s.default_booking_cutoff_minutes, p.name AS provider_name, p.city, p.area,
  COALESCE((SELECT SUM(b.quantity) FROM bookings b WHERE b.slot_id=sl.id AND b.status='confirmed'),0) AS seats_booked
  FROM slots sl JOIN services s ON s.id=sl.service_id JOIN providers p ON p.id=s.provider_id`;

export function slotResponse(row) {
  const number = key => safeNumber(row[key]);
  return {
    id: number('id'), serviceId: number('service_id'), providerId: number('provider_id'),
    providerName: row.provider_name, serviceName: row.service_name, category: row.category,
    city: row.city, area: row.area, durationMinutes: number('duration_minutes'), beginnerFriendly: row.beginner_friendly,
    startsAt: new Date(row.starts_at).toISOString(), bookingClosesAt: new Date(row.booking_closes_at).toISOString(),
    capacity: number('capacity'), remainingSeats: number('capacity') - number('seats_booked'),
    originalPriceCentavos: number('original_price_centavos'), offerPriceCentavos: number('offer_price_centavos'),
    buddyPriceCentavos: row.buddy_price_centavos === null ? null : number('buddy_price_centavos'),
    discountPercent: Math.round((number('original_price_centavos') - number('offer_price_centavos')) * 10000 / number('original_price_centavos')) / 100,
    status: row.status, serviceActive: row.active, recurrenceNote: row.recurrence_note, runsAsScheduled: row.runs_as_scheduled,
    defaultBookingCutoffMinutes: number('default_booking_cutoff_minutes')
  };
}

export async function findSlot(db, id) {
  const { rows } = await db.query(SLOT_SELECT + ' WHERE sl.id=$1', [id]);
  return rows[0] ? slotResponse(rows[0]) : null;
}
