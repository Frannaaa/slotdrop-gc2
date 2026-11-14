// Business rules and calculations shared by browser previews and the server.
export const DISCOVERY_HOURS = 72;

export function withinBookingWindow(slot, now, hours = DISCOVERY_HOURS) {
  if (slot.startsAt === null) return slot.bookingClosesAt === null;
  const start = Date.parse(slot.startsAt);
  return start > now && start < now + hours * 3600000
    && Date.parse(slot.bookingClosesAt) > now;
}

export function partyPrice(slot, quantity = 1) {
  const buddy = quantity >= 2 && slot.buddyPriceCentavos !== null;
  const unit = buddy ? slot.buddyPriceCentavos : slot.offerPriceCentavos;
  return { buddy, unit, total: unit * quantity };
}

export function commissionPerSeat(priceCentavos, basisPoints) {
  return Math.round(priceCentavos * basisPoints / 10000);
}

export function discountPercent(originalPriceCentavos, priceCentavos) {
  return Math.round((originalPriceCentavos - priceCentavos) * 10000 / originalPriceCentavos) / 100;
}
