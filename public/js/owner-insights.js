// Derived Owner insight: joins two different API responses without trusting browser totals.
// Group assignment: Fran (M1). This is simulated released-seat utilization, not venue occupancy.
export function openReleaseUtilization(catalog, bookings, now = Date.now()) {
  const services = Array.isArray(catalog?.services) ? catalog.services : [];
  const slots = Array.isArray(catalog?.slots) ? catalog.slots : [];
  const receipts = Array.isArray(bookings) ? bookings : [];
  const nowMs = Number(now);
  const discoveryHours = Number.isFinite(catalog?.discoveryHours)
    ? catalog.discoveryHours : 72;
  const activeServiceIds = new Set(services.filter(service => service.active).map(service => service.id));
  const eligible = slots.filter(slot =>
    activeServiceIds.has(slot.serviceId) &&
    slot.status === 'open' &&
    slot.runsAsScheduled === true &&
    Number.isSafeInteger(slot.capacity) && slot.capacity > 0 &&
    Date.parse(slot.bookingClosesAt) > nowMs &&
    Date.parse(slot.startsAt) > nowMs &&
    Date.parse(slot.startsAt) < nowMs + discoveryHours * 3600000
  );
  const eligibleIds = new Set(eligible.map(slot => slot.id));
  const confirmedBySlot = new Map();
  for (const receipt of receipts) {
    if (receipt.status === 'confirmed' && eligibleIds.has(receipt.slotId)
        && Number.isSafeInteger(receipt.quantity) && receipt.quantity > 0) {
      confirmedBySlot.set(receipt.slotId, (confirmedBySlot.get(receipt.slotId) ?? 0) + receipt.quantity);
    }
  }
  const releasedSeats = eligible.reduce((sum, slot) => sum + slot.capacity, 0);
  const confirmedSeats = [...confirmedBySlot.values()].reduce((sum, quantity) => sum + quantity, 0);
  const inconsistent = eligible.some(slot => (confirmedBySlot.get(slot.id) ?? 0) > slot.capacity);
  return {
    eligibleSessions: eligible.length,
    releasedSeats,
    confirmedSeats,
    inconsistent,
    utilizationPercent: releasedSeats === 0 || inconsistent
      ? null : Math.round(100 * confirmedSeats / releasedSeats),
  };
}
