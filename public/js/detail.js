import {
request,
money,
date,
positive,
pageParameters,
escapeHtml,
available,
notice,
inclusionLabel,
activityLabel,
studioEvidence,
comparisonLabel,
} from "./customer-common.js";

const content = document.querySelector("#detail"),
status = document.querySelector("#status");
let slot;
let generation = 0;
let quantity = 1;

function sync() {
  const link = document.querySelector("#continue");
  if (!link || !slot) return;
  const open = available(slot, quantity);
  link.hidden = !open;
  notice(status, open ? "" : "This session is unavailable. Browse another activity.");
}

async function load() {
  const current = ++generation;
  slot = null;
  content.replaceChildren();
  try {
    const params = pageParameters(location.search, ["slotId", "quantity"]);
    const id = positive(params.get("slotId"));
    quantity = params.has("quantity") ? positive(params.get("quantity"), 100) : 1;
    notice(status, "Loading session...");
    const loaded = await request("/api/slots/" + id);
    if (current !== generation) return;
    slot = loaded;
    content.innerHTML = `<p class="eyebrow">${escapeHtml(slot.providerName)}</p><h1>${escapeHtml(slot.serviceName)}</h1><p>${escapeHtml(slot.recurrenceNote)}</p>${slot.beginnerFriendly ? "<p>Beginner friendly</p>" : ""}<dl><dt>Activity</dt><dd>${escapeHtml(activityLabel(slot.activityType))}${slot.technique ? " + " + escapeHtml(slot.technique) : ""}</dd><dt>Included</dt><dd>${(slot.inclusions || []).length ? slot.inclusions.map(value => escapeHtml(inclusionLabel(value))).join(", ") : "No inclusions specified."}</dd><dt>Before you go</dt><dd>${escapeHtml(slot.preparationNote || "Confirm preparation details with the provider.")}</dd><dt>Changes</dt><dd>${escapeHtml(slot.cancellationNote)}</dd><dt>Where</dt><dd>${escapeHtml(slot.area)}, ${escapeHtml(slot.city)}</dd><dt>Starts</dt><dd>${date(slot.startsAt)}</dd><dt>Duration</dt><dd>${slot.durationMinutes} minutes</dd><dt>Book before</dt><dd>${date(slot.bookingClosesAt)}</dd><dt>Seats left</dt><dd>${slot.remainingSeats}</dd><dt>${comparisonLabel(slot)}</dt><dd><del>${money(slot.originalPriceCentavos)}</del> / person</dd><dt>Offer per person</dt><dd>${money(slot.offerPriceCentavos)} ${slot.discountPercent}% off</dd>${slot.buddyPriceCentavos != null ? `<dt>Bring a friend</dt><dd>${money(slot.buddyPriceCentavos)} each for 2 or more</dd>` : ""}</dl>${studioEvidence(slot)}<a id="continue" class="button" href="/selection.html?slotId=${id}&quantity=${quantity}">Choose seats</a>`;
    sync();
  } catch (error) {
    if (current === generation) notice(status, error.message, true);
  }
}

document.querySelector("#retry").addEventListener("click", load);
setInterval(sync, 1000);
load();