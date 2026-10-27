import { ApiError, integer, invalid, object, timestamp } from '../lib/validation.js';
import { MAX_PRICE_CENTAVOS, MAX_SEATS } from '../config/business.js';
import { findSlot } from '../repositories/slots.js';
const fields = ['offerPriceCentavos','buddyPriceCentavos','capacity','bookingClosesAt','status'];
function numeric(value, name, max) {
  if (typeof value !== 'number') invalid(name + ' must be a JSON integer.');
  return integer(value, name, 1, max);
}
function rates(original, offer, buddy) {
  numeric(original, 'originalPriceCentavos', MAX_PRICE_CENTAVOS);
  numeric(offer, 'offerPriceCentavos', MAX_PRICE_CENTAVOS);
  if (offer >= original) invalid('Offer price must be below the regular price.');
  if (buddy !== null) {
    numeric(buddy, 'buddyPriceCentavos', MAX_PRICE_CENTAVOS);
    if (buddy >= offer) invalid('Buddy price must be below the standard offer.');
  }
}
async function translate(run) {
  try { return await run(); }
  catch (error) {
    if (error.code === '23505') throw new ApiError(409, 'SESSION_EXISTS', 'This activity already has a session at that time.');
    if (error.code === '23514' || error.code === '22003') invalid('The session violates a data constraint.');
    throw error;
  }
}
export async function createOffer(db, body, now) {
  object(body, ['serviceId','startsAt','bookingClosesAt','capacity','originalPriceCentavos','offerPriceCentavos','buddyPriceCentavos','runsAsScheduled']);
  const serviceId = numeric(body.serviceId, 'serviceId', Number.MAX_SAFE_INTEGER);
  const startsAt = timestamp(body.startsAt, 'startsAt');
  const capacity = numeric(body.capacity, 'capacity', MAX_SEATS);
  const buddy = body.buddyPriceCentavos ?? null;
  rates(body.originalPriceCentavos, body.offerPriceCentavos, buddy);
  if (body.runsAsScheduled !== true) invalid('Only sessions already going ahead may be offered.');
  if (startsAt <= now) invalid('Session start must be in the future.');
  return translate(() => db.transaction(async client => {
    const { rows: [service] } = await client.query('SELECT * FROM services WHERE id=$1 FOR SHARE', [serviceId]);
    if (!service) throw new ApiError(404, 'SERVICE_NOT_FOUND', 'Activity not found.');
    if (!service.active) throw new ApiError(409, 'SERVICE_INACTIVE', 'This activity is inactive.');
    const cutoff = body.bookingClosesAt === undefined ? new Date(startsAt.getTime() - Number(service.default_booking_cutoff_minutes) * 60000) : timestamp(body.bookingClosesAt, 'bookingClosesAt');
    if (cutoff <= now || cutoff >= startsAt) invalid('Booking cutoff must be in the future and before the session.');
    const { rows: [slot] } = await client.query(`INSERT INTO slots
      (service_id,starts_at,booking_closes_at,capacity,original_price_centavos,offer_price_centavos,buddy_price_centavos,runs_as_scheduled)
      VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id`, [serviceId, startsAt, cutoff, capacity, body.originalPriceCentavos, body.offerPriceCentavos, buddy]);
    return findSlot(client, slot.id);
  }));
}
export async function editOffer(db, id, body) {
  object(body, fields);
  if (!Object.keys(body).length) invalid('Provide at least one supported edit.');
  return translate(() => db.transaction(async client => {
    // Booking must lock this same row before checking/inserting seats.
    const { rows: [slot] } = await client.query('SELECT * FROM slots WHERE id=$1 FOR UPDATE', [id]);
    if (!slot) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
    const { rows: [sum] } = await client.query("SELECT COALESCE(SUM(quantity),0) AS sold FROM bookings WHERE slot_id=$1 AND status='confirmed'", [id]);
    const sold = Number(sum.sold);
    const offer = body.offerPriceCentavos === undefined ? slot.offer_price_centavos : body.offerPriceCentavos;
    const buddy = body.buddyPriceCentavos === undefined ? slot.buddy_price_centavos : body.buddyPriceCentavos;
    rates(slot.original_price_centavos, offer, buddy);
    const capacity = body.capacity === undefined ? slot.capacity : numeric(body.capacity, 'capacity', MAX_SEATS);
    if (capacity < sold) throw new ApiError(409, 'CAPACITY_CONFLICT', 'Allocation cannot be lower than seats already booked.');
    const status = body.status === undefined ? slot.status : body.status;
    if (!['open','paused','cancelled'].includes(status)) invalid('Invalid session status.');
    if (status === 'cancelled' && sold > 0) throw new ApiError(409, 'BOOKINGS_EXIST', 'Cannot cancel a session with confirmed bookings.');
    const cutoff = body.bookingClosesAt === undefined ? new Date(slot.booking_closes_at) : timestamp(body.bookingClosesAt, 'bookingClosesAt');
    if (cutoff >= new Date(slot.starts_at)) invalid('Booking cutoff must precede the session start.');
    await client.query('UPDATE slots SET offer_price_centavos=$2,buddy_price_centavos=$3,capacity=$4,status=$5,booking_closes_at=$6 WHERE id=$1', [id,offer,buddy,capacity,status,cutoff]);
    return findSlot(client, id);
  }));
}
