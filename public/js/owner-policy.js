export function cutoffGuidance(minutes, override) {
  return (
    `Activity default: ${minutes} minutes before start. ` +
    (override
      ? "Your session override is preserved."
      : "You can override this session.")
  );
}
export function cutoffRequestValue(input, original) {
  const displayed = original
    ? new Date(Date.parse(original) + 8 * 3600000).toISOString().slice(0, 16)
    : null;
  return original && input === displayed
    ? original
    : new Date(input + "+08:00").toISOString();
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
