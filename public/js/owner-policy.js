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
export function salesState(slot, now = Date.now()) {
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
  return {
    label: slot.status === "paused" ? "Paused" : "Bookable",
    canResume: slot.status === "paused",
  };
}
