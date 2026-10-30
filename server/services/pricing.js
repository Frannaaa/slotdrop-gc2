// Group assignment: Janelle (M3). Quote rules from docs/routes.md.
import { COMMISSION_BASIS_POINTS, DISCOVERY_HOURS, MAX_SEATS } from '../config/business.js';
import { ApiError, integer, invalid } from '../lib/validation.js';
import { findSlot } from '../repositories/slots.js';

// Same rules as discovery: only open, confirmed, active sessions inside the
// 72-hour window with a future cutoff and enough released seats can be priced.
export function checkBookable(slot, quantity, now) {
  const start = Date.parse(slot.startsAt);
  const bookable = slot.serviceActive && slot.status === 'open' && slot.runsAsScheduled
    && Date.parse(slot.bookingClosesAt) > now.getTime()
    && start > now.getTime() && start < now.getTime() + DISCOVERY_HOURS * 3600000;
  if (!bookable) throw new ApiError(409, 'SLOT_UNAVAILABLE', 'This session is no longer open for booking.');
  if (slot.remainingSeats < quantity) {
    const left = Math.max(slot.remainingSeats, 0);
    throw new ApiError(409, 'SLOT_UNAVAILABLE', `Only ${left} ${left === 1 ? 'seat is' : 'seats are'} left for this session.`);
  }
}

// Pure calculation, reused later by POST /api/bookings so quote and save always agree.
// All amounts are integer centavos. The server picks the tier; the client never sends a price.
export function priceQuote(slot, quantity, now, commissionBasisPoints = COMMISSION_BASIS_POINTS) {
  const buddy = quantity >= 2 && slot.buddyPriceCentavos !== null;
  const unitPrice = buddy ? slot.buddyPriceCentavos : slot.offerPriceCentavos;
  const unitFee = Math.round(unitPrice * commissionBasisPoints / 10000);
  const total = unitPrice * quantity;
  const platformFee = unitFee * quantity;
  return {
    slotId: slot.id,
    quantity,
    originalUnitPriceCentavos: slot.originalPriceCentavos,
    offerUnitPriceCentavos: slot.offerPriceCentavos,
    unitPriceCentavos: unitPrice,
    pricingType: buddy ? 'buddy' : 'standard',
    groupSavingsCentavos: (slot.offerPriceCentavos - unitPrice) * quantity,
    totalPriceCentavos: total,
    platformFeeCentavos: platformFee,
    providerPayoutCentavos: total - platformFee,
    discountPercent: Math.round((slot.originalPriceCentavos - unitPrice) * 10000 / slot.originalPriceCentavos) / 100,
    quotedAt: now.toISOString()
  };
}

export async function getQuote(db, query, now) {
  for (const key of Object.keys(query)) {
    if (!['slotId', 'quantity'].includes(key)) invalid('Unsupported quote field: ' + key);
    if (typeof query[key] !== 'string') invalid('Each quote field must appear once.');
  }
  if (query.slotId === undefined || query.quantity === undefined) invalid('Provide slotId and quantity.');
  const slotId = integer(query.slotId, 'slotId');
  const quantity = integer(query.quantity, 'quantity', 1, MAX_SEATS);
  const slot = await findSlot(db, slotId);
  if (!slot) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
  checkBookable(slot, quantity, now);
  return priceQuote(slot, quantity, now);
}
