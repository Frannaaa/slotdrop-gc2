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
export function card(slot, quantity = 1, { closed = false } = {}) {
  const selectedQuantity =
    Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= 100
      ? quantity
      : 1;
  const price = closed ? null : previewPrice(slot, selectedQuantity);
  const practice = slot.startsAt === null;
  const photo = slot.studioReference?.photo;
  const photoPage = safeHttpsUrl(photo?.page);
  const photoKey = slot.studioReference?.key;
  const hasPhoto = photoPage && typeof photoKey === "string"
    && /^[a-z-]+$/.test(photoKey) && typeof photo.alt === "string"
    && typeof photo.credit === "string";
  const traits = [
    slot.beginnerFriendly ? "Beginner-friendly" : "",
    ...(slot.inclusions || []).map(inclusionLabel),
  ].filter(Boolean);
  return /* HTML */ `<article class="activity-card card">
    ${hasPhoto
      ? `<figure class="card-photo">
          <img src="/images/workshops/${photoKey}.webp" alt="${escapeHtml(photo.alt)}" width="720" height="405" loading="lazy" decoding="async">
          <figcaption><a href="${escapeHtml(photoPage)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml("Photo source: " + photo.credit)}">Photo source ↗</a></figcaption>
        </figure>`
      : `<div class="card-art ${slot.category === "active" ? "active" : ""}" aria-hidden="true">${escapeHtml(activityLabel(slot.activityType))}</div>`}
    <div class="card-body">
      <p class="eyebrow">${escapeHtml(slot.area)} · ${escapeHtml(slot.city)}</p>
      <h2>${escapeHtml(slot.serviceName || slot.title || "Untitled Session")}</h2>
      <p class="provider-name">
        ${slot.studioReference
          ? `<a href="/studio.html?providerId=${slot.providerId}">${escapeHtml(slot.providerName)}</a>`
          : escapeHtml(slot.providerName)}
      </p>
      <p class="session-time">
        <strong>${date(slot.startsAt)}</strong>
        <br />${slot.durationMinutes} minutes${closed ? "" : ` · ${slot.remainingSeats} seats left`}
      </p>
      ${closed
        ? `<p class="session-cutoff closed">${closedSessionLabel(slot) || "Booking closed"}</p>`
        : practice
          ? `<p class="session-cutoff">Demo exception: Kept open for grading; regular offers appear within 72 hours of the session and close at their booking cutoff.</p>`
          : ""}
      <div class="session-traits">
        ${traits.slice(0, 2).map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}${traits.length > 2 ? `<span>+${traits.length - 2} more</span>` : ""}
      </div>
      ${price ? `<div class="party-price">
        <strong>${money(price.total)}</strong>
        <span
          >total for ${selectedQuantity}
          ${selectedQuantity === 1 ? "person" : "people"}</span
        >
      </div>
      <p class="card-compare">${comparisonLabel(slot)}: ${money(slot.originalPriceCentavos)} / person</p>
      ${slot.buddyPriceCentavos !== null && !price.buddy
          ? `<p class="buddy">Bring a friend · ${money(slot.buddyPriceCentavos)} each for 2+</p>`
          : price.buddy ? `<p class="buddy">Buddy price applied</p>` : ""}` : ""}
      <a
        class="button secondary"
        href="/detail.html?slotId=${slot.id}&quantity=${selectedQuantity}"
        >View workshop ↗</a
      >
    </div>
  </article>`;
}
export function notice(element, message, error = false) {
  element.textContent = message;
  element.className = error ? "notice error" : "notice";
  element.setAttribute("role", error ? "alert" : "status");
}
