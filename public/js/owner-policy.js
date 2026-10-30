export function sessionDate(value) {
  const date = new Date(value + "+08:00");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
      !Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999 ||
      new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 16) !== value) {
    throw new Error("Enter a valid date from 0001 to 9999 in Philippine time.");
  }
  return date;
}
export function suggestedCutoff(value, minutes) {
  const date = new Date(sessionDate(value).getTime() - minutes * 60000);
  if (date.getUTCFullYear() < 1) throw new Error("Choose a later session start for this activity's booking lead time.");
  return date;
}
export function cutoffGuidance(minutes, override) {
  return (
    `Activity default: ${minutes} minutes before start. ` +
    (override
      ? "Keeping your custom deadline."
      : "You can change the deadline for this session.")
  );
}
export function cutoffRequestValue(input, original) {
  const displayed = original
    ? new Date(Date.parse(original) + 8 * 3600000).toISOString().slice(0, 16)
    : null;
  return original && input === displayed
    ? original
    : sessionDate(input).toISOString();
}
export function changedOfferFields(values, original) {
  return Object.fromEntries(
    Object.entries(values).filter(([key, value]) => value !== original[key]),
  );
}
export function salesState(slot, now = Date.now(), discoveryHours) {
  if (slot.status === "cancelled")
    return { label: "Cancelled", canResume: false };
  if (Date.parse(slot.startsAt) <= now)
    return { label: "Session started", canResume: false };
  if (Date.parse(slot.bookingClosesAt) <= now)
    return {
      label: "Bookings closed",
      canResume: false,
      help: "Edit the booking deadline before reopening.",
    };
  if (slot.remainingSeats <= 0)
    return {
      label: "Sold out",
      canResume: false,
      help: "No released seats remain.",
    };
  if (slot.serviceActive === false)
    return { label: "Activity inactive", canResume: false };
  if (slot.runsAsScheduled === false)
    return { label: "Session not confirmed", canResume: false,
      help: "This session is not confirmed to run. Sales are unavailable." };
  if (Date.parse(slot.startsAt) >= now + discoveryHours * 3600000)
    return { label: "Not listed yet", canResume: slot.status === "paused",
      help: `This offer appears in customer discovery less than ${discoveryHours} hours before it starts.` };
  return {
    label: slot.status === "paused" ? "Paused" : "Bookable",
    canResume: slot.status === "paused",
  };
}

/** Prefer an active activity when creating; preserve historical selection while editing. */
export function preferredServiceId(services, selected, editing = null) {
  const prior = services.find(service => String(service.id) === String(selected));
  if (prior && (prior.active || editing !== null)) return String(prior.id);
  const firstActive = services.find(service => service.active);
  return firstActive ? String(firstActive.id) : '';
}

/**
 * Operational warning for the course demo, not a substitute for GET /api/slots.
 * Count only sessions that can appear in Browse *now*, with no database writes.
 */
export function demoInventoryStatus(slots, services, now = Date.now(), discoveryHours = 72) {
  const hours = Number.isFinite(discoveryHours) && discoveryHours > 0 ? discoveryHours : 72;
  const active = new Set(services.filter(service => service.active).map(service => service.id));
  const available = slots.filter(slot => {
    const starts = Date.parse(slot.startsAt);
    const cutoff = Date.parse(slot.bookingClosesAt);
    return active.has(slot.serviceId) && slot.status === 'open' &&
      slot.runsAsScheduled === true && slot.remainingSeats >= 1 &&
      Number.isFinite(starts) && Number.isFinite(cutoff) &&
      starts > now && starts < now + hours * 3600000 && cutoff > now;
  });
  if (!available.length) {
    return {state: 'empty', count: 0,
      message: 'No demo sessions are currently discoverable in Browse. Create a future simulated session within the discovery window, with an open booking deadline and available seats; do not reseed saved bookings.'};
  }
  const latestCutoff = Math.max(...available.map(slot => Date.parse(slot.bookingClosesAt)));
  if (latestCutoff <= now + 24 * 3600000) {
    return {state: 'soon', count: available.length,
      message: available.length + ' demo session(s) are discoverable, but all current booking deadlines expire within 24 hours. Prepare future simulated offers for the checkpoint.'};
  }
  return {state: 'ready', count: available.length,
    message: available.length + ' demo session(s) are currently discoverable. These are classroom offers, not real studio availability.'};
}
