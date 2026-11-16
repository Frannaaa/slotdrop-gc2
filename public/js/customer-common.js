// Group assignment: Fran. See README.md#team.
import { withinBookingWindow, partyPrice as previewPrice } from "./business-config.js";

export { previewPrice };
export const money = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value / 100,
  );
export const date = (value) =>
  value === null ? "Practice booking" : new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function positive(value, max = Number.MAX_SAFE_INTEGER) {
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 1 ||
    Number(value) > max
  )
    throw new Error(
      max === Number.MAX_SAFE_INTEGER
        ? "Open a valid session link."
        : `Choose a whole number from 1 to ${max}.`,
    );
  return Number(value);
}
export function pageParameters(search, allowed) {
  const params = new URLSearchParams(search),
    seen = new Set();
  for (const [key, value] of params) {
    if (!allowed.includes(key) || seen.has(key) || value === "")
      throw new Error("Open a valid link with each field appearing once.");
    seen.add(key);
  }
  return params;
}

export function isBookingId(value) {
  return typeof value === "string"
    && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
}

export function hasBookingTotal(value) {
  return Number.isSafeInteger(value?.slotId) && value.slotId > 0
    && Number.isSafeInteger(value.quantity) && value.quantity > 0
    && ["standard", "buddy"].includes(value.pricingType)
    && Number.isSafeInteger(value.unitPriceCentavos) && value.unitPriceCentavos > 0
    && Number.isSafeInteger(value.totalPriceCentavos)
    && value.totalPriceCentavos === value.unitPriceCentavos * value.quantity;
}

export function isBookingReceipt(value) {
  return isBookingId(value?.id) && hasBookingTotal(value)
    && ["confirmed", "cancelled"].includes(value.status)
    && ["mock_card", "pay_on_site"].includes(value.paymentMethod)
    && typeof value.serviceName === "string" && typeof value.providerName === "string"
    && (value.sessionStartsAt === null || (typeof value.sessionStartsAt === "string"
      && Number.isFinite(Date.parse(value.sessionStartsAt))));
}

export async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data?.error?.message || "Request failed.");
      error.code = data?.error?.code;
      error.quote = data?.quote ?? data?.error?.quote;
      error.status = response.status;
      if (response.status === 429) error.retryAfterSeconds = data?.error?.retryAfterSeconds;
      throw error;
    }
    return data;
  } catch (error) {
    if (
      error.name === "AbortError" ||
      error instanceof TypeError ||
      error instanceof SyntaxError
    ) {
      const failure = new Error(
        options.method === "POST"
          ? "Could not confirm the booking. Keep your details and retry the same request."
          : "Could not load this information. Check your connection and try again.",
      );
      failure.uncertain = options.method === "POST";
      throw failure;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
// Retry only HTTP 429 and keep the original serialized body and request ID.
// Checkout keeps the form locked while it waits.
export async function retryLimitedBooking(path, options, {
  maxRetries = 1,
  onWait = () => {},
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  if (options?.method !== 'POST' || typeof options.body !== 'string')
    throw new Error('Booking retry requires a prebuilt POST body with stable requestId.');
  if (!Number.isSafeInteger(maxRetries) || maxRetries < 0 || maxRetries > 2)
    throw new Error('Choose at most two rate-limit retries.');
  const payload = options.body;
  for (let attempt = 0; ; attempt++) {
    try { return await request(path, {...options, body: payload}); }
    catch (error) {
      if (error.status !== 429 || attempt >= maxRetries) throw error;
      const seconds = Number.isSafeInteger(error.retryAfterSeconds)
        ? Math.min(60, Math.max(1, error.retryAfterSeconds)) : 1;
      onWait(seconds);
      await wait(seconds * 1000);
    }
  }
}

export function available(slot, quantity = 1) {
  return (
    slot.serviceActive &&
    slot.status === "open" &&
    slot.runsAsScheduled &&
    slot.remainingSeats >= quantity &&
    withinBookingWindow(slot, Date.now())
  );
}
export function closedSessionLabel(slot, now = Date.now()) {
  if (slot.startsAt === null) return "";
  const end = Date.parse(slot.startsAt) + slot.durationMinutes * 60000;
  if (end <= now) return "Event ended";
  if (Date.parse(slot.bookingClosesAt) <= now) return "Booking closed";
  return "";
}
export const activityLabel = (type) =>
  ({
    pottery: "Pottery",
    painting: "Canvas painting",
    pilates: "Pilates",
    dance: "Dance",
    other: "Activity",
  })[type] || "Activity";
export const inclusionLabel = (key) =>
  ({
    materials: "Materials included",
    painting: "Painting included",
    firing: "Firing included",
    equipment: "Equipment included",
  })[key] || key;
export const comparisonLabel = (slot) =>
  !slot.studioReference
    ? "Regular price"
    : slot.originalPriceCentavos === slot.studioReference.publishedPriceCentavos
      ? "Reference price"
      : "Demo base price";
// Use the same source-link rules on cards and studio profiles.
export function safeHttpsUrl(value) {
  try {
    const source = new URL(value);
    return source.protocol === "https:" && !source.username && !source.password
      ? source.href
      : null;
  } catch {
    return null;
  }
}
export function studioEvidence(slot) {
  const reference = slot.studioReference;
  if (!reference) return "";
  const source = safeHttpsUrl(reference.sourceUrl);
  if (!source) return "";
  const priceSource = safeHttpsUrl(reference.priceSourceUrl);
  return `<p class="reference">Real studio reference · <a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Published details ↗</a>${priceSource ? ` · <a href="${escapeHtml(priceSource)}" target="_blank" rel="noopener noreferrer">Price source ↗</a>` : ""} · checked ${escapeHtml(reference.checkedAt)}</p><p class="reference">Seats and prices are simulated. Booking here does not reserve a place with the studio.</p>`;
}
const cardDateFormat = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function sessionLinks(sessions, quantity) {
  return `<ul class="session-options" aria-label="Available dates">
    ${sessions.map((slot) => {
      const time = cardDateFormat.format(new Date(slot.startsAt));
      const cutoff = cardDateFormat.format(new Date(slot.bookingClosesAt));
      const price = previewPrice(slot, quantity);
      const seats = slot.remainingSeats === 1 ? "1 seat left" : `${slot.remainingSeats} seats left`;
      return `<li>
        <a href="/detail.html?slotId=${slot.id}&quantity=${quantity}">
          <strong>${time}</strong>
          <span>${money(price.total)} ${quantity === 1 ? "per person" : `for ${quantity} people`} · ${seats}</span>
          <small>Book by ${cutoff}</small>
        </a>
      </li>`;
    }).join("")}
  </ul>`;
}

export function card(slot, quantity = 1, { closed = false, compact = false, sessions = [] } = {}) {
  const selectedQuantity =
    Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= 100
      ? quantity
      : 1;
  const price = closed ? null : previewPrice(slot, selectedQuantity);
  const practice = slot.startsAt === null;
  const photo = slot.studioReference?.photo;
  const photoPage = safeHttpsUrl(photo?.page);
  const photoKey = slot.studioReference?.key;
  const hasPhoto = !closed && photoPage && typeof photoKey === "string"
    && /^[a-z-]+$/.test(photoKey) && typeof photo.alt === "string"
    && typeof photo.credit === "string";
  const sessionDate = practice ? "" : closed ? date(slot.startsAt) : cardDateFormat.format(new Date(slot.startsAt));
  const sessionLabel = closed
    ? closedSessionLabel(slot) || "Booking closed"
    : practice && !compact ? "Practice booking" : "";
  const actionLabel = closed ? "View details" : practice ? "Try practice booking" : "View workshop";
  const seats = slot.remainingSeats === 1 ? "1 seat left" : `${slot.remainingSeats} seats left`;
  let bookingNote = "";
  if (!closed && practice) {
    bookingNote = "Sample booking with no expiry for grading.";
  } else if (!closed && Number.isFinite(Date.parse(slot.bookingClosesAt))) {
    bookingNote = `Book by ${cardDateFormat.format(new Date(slot.bookingClosesAt))}`;
  }
  return /* HTML */ `<article class="activity-card card${closed ? " closed-card" : ""}">
    ${hasPhoto
      ? `<figure class="card-photo">
          <img src="/images/workshops/${photoKey}.webp" alt="${escapeHtml(photo.alt)}" width="720" height="405" loading="lazy" decoding="async">
          <figcaption><a href="${escapeHtml(photoPage)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml("Photo source: " + photo.credit)}">Photo source ↗</a></figcaption>
        </figure>`
      : ""}
    <div class="card-body">
      <p class="card-context">
        <span class="eyebrow">${escapeHtml(slot.area)} · ${escapeHtml(slot.city)}</span>
        ${sessionLabel ? `<span class="session-label${closed ? "" : " practice"}">${sessionLabel}</span>` : ""}
      </p>
      <h2>${escapeHtml(slot.serviceName || slot.title || "Untitled Session")}</h2>
      <p class="provider-name">
        ${slot.studioReference
          ? `<a href="/studio.html?providerId=${slot.providerId}">${escapeHtml(slot.providerName)}</a>`
          : escapeHtml(slot.providerName)}
      </p>
      ${sessions.length > 1 ? sessionLinks(sessions, selectedQuantity) : `
      <p class="session-time">
        ${sessionDate ? `<strong>${sessionDate}</strong>` : ""}
        ${closed ? "" : `${sessionDate ? "<br />" : ""}${slot.durationMinutes} min · ${seats}`}
      </p>
      ${bookingNote ? `<p class="session-cutoff">${bookingNote}</p>` : ""}
      ${price ? `<div class="party-price">
        <strong>${money(price.total)}</strong>
        <span>${selectedQuantity === 1 ? "per person" : `total for ${selectedQuantity} people`}</span>
      </div>
      ${price.buddy
          ? `<p class="buddy">Buddy price applied</p>`
          : slot.buddyPriceCentavos != null
            ? `<p class="buddy">${money(slot.buddyPriceCentavos)} each for 2+ people</p>`
            : ""}` : ""}
      <a
        class="button secondary"
        href="/detail.html?slotId=${slot.id}&quantity=${selectedQuantity}"
        >${actionLabel}</a
      >`}
    </div>
  </article>`;
}
export function notice(element, message, error = false) {
  element.textContent = message;
  element.className = error ? "notice error" : "notice";
  element.setAttribute("role", error ? "alert" : "status");
}
