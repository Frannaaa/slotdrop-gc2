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
