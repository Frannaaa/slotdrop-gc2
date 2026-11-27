// Group assignment: Janelle (M3). Quote rules from docs/routes.md.
import { COMMISSION_BASIS_POINTS, MAX_SEATS } from '../config/business.js';
import { ApiError, integer, invalid, uuid } from '../lib/validation.js';
import { findSlot } from '../repositories/slots.js';
import { requireActiveHold } from './holds.js';
import { commissionPerSeat, discountPercent, partyPrice, withinBookingWindow } from '../../public/js/business-config.js';

// Same rules as discovery, including undated practice offers.
export function checkBookable(slot, quantity, now) {
  const bookable = slot.serviceActive && slot.status === 'open' && slot.runsAsScheduled
    && withinBookingWindow(slot, now.getTime());
  if (!bookable) throw new ApiError(409, 'SLOT_UNAVAILABLE', 'This session is no longer open for booking.');
  if (slot.remainingSeats < quantity) {
    const left = Math.max(slot.remainingSeats, 0);
    throw new ApiError(409, 'SLOT_UNAVAILABLE', `Only ${left} ${left === 1 ? 'seat is' : 'seats are'} left for this session.`);
  }
}

// Quote and booking save use the same calculation in integer centavos.
// The server picks the tier. The submitted total only acknowledges the quoted amount.
export function priceQuote(slot, quantity, now, commissionBasisPoints = COMMISSION_BASIS_POINTS) {
  const { buddy, unit: unitPrice, total } = partyPrice(slot, quantity);
  const platformFee = commissionPerSeat(unitPrice, commissionBasisPoints) * quantity;
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
    discountPercent: discountPercent(slot.originalPriceCentavos, unitPrice),
    quotedAt: now.toISOString()
  };
}

export async function getQuote(db, query, now) {
  for (const key of Object.keys(query)) {
    if (!['slotId', 'quantity', 'holdId'].includes(key)) invalid('Unsupported quote field: ' + key);
    if (typeof query[key] !== 'string') invalid('Each quote field must appear once.');
  }
  if (query.slotId === undefined || query.quantity === undefined) invalid('Provide slotId and quantity.');
  const slotId = integer(query.slotId, 'slotId');
  const quantity = integer(query.quantity, 'quantity', 1, MAX_SEATS);
  const holdId = query.holdId === undefined ? null : uuid(query.holdId, 'holdId');
  // Plain quotes keep the GC2 contract. A held quote only excludes this customer's own validated hold.
  if (holdId === null) {
    const slot = await findSlot(db, slotId, now);
    if (!slot) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
    checkBookable(slot, quantity, now);
    return priceQuote(slot, quantity, now);
  }
  if (!(await findSlot(db, slotId, now))) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
  const hold = await requireActiveHold(db, holdId, { slotId, quantity }, now);
  const slot = await findSlot(db, slotId, now, holdId);
  checkBookable(slot, quantity, now);
  return { ...priceQuote(slot, quantity, now), holdId, holdExpiresAt: new Date(hold.expires_at).toISOString() };
}
