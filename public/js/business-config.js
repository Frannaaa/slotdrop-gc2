// Business rules and calculations shared by browser previews and the server.
export const DISCOVERY_HOURS = 72;

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
