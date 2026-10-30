// Group assignment: Fran. See docs/ownership-and-execution.md.
import { DISCOVERY_HOURS } from './business-config.js';
export const money = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value / 100,
  );
export const date = (value) =>
  new Intl.DateTimeFormat("en-PH", {
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
    throw new Error(max === Number.MAX_SAFE_INTEGER
      ? "Open a valid session link."
      : `Choose a whole number from 1 to ${max}.`);
  return Number(value);
}
export function pageParameters(search, allowed) {
  const params = new URLSearchParams(search), seen = new Set();
  for (const [key, value] of params) {
    if (!allowed.includes(key) || seen.has(key) || value === "")
      throw new Error("Open a valid link with each field appearing once.");
    seen.add(key);
  }
  return params;
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
      error.quote = data?.quote;
      error.status = response.status;
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
export function available(slot, quantity = 1) {
  const now = Date.now(),
    start = Date.parse(slot.startsAt);
  return (
    slot.serviceActive &&
    slot.status === "open" &&
    slot.runsAsScheduled &&
    slot.remainingSeats >= quantity &&
    Date.parse(slot.bookingClosesAt) > now &&
    start > now &&
    start < now + DISCOVERY_HOURS * 3600000
  );
}
export function previewPrice(slot, quantity=1) {
 const buddy=quantity>=2&&slot.buddyPriceCentavos!==null;
 const unit=buddy?slot.buddyPriceCentavos:slot.offerPriceCentavos;
 return {buddy,unit,total:unit*quantity};
}
export const activityLabel = type => ({pottery:'Pottery',painting:'Canvas painting',pilates:'Pilates',dance:'Dance',other:'Activity'}[type]||'Activity');
export const inclusionLabel = key => ({materials:'Materials included',painting:'Painting included',firing:'Firing included',equipment:'Equipment included'}[key]||key);
export const comparisonLabel = slot => !slot.studioReference ? 'Regular price'
 : slot.originalPriceCentavos === slot.studioReference.publishedPriceCentavos ? 'Published reference price' : 'Demo base price';
export function studioEvidence(slot) {
 const reference=slot.studioReference;if(!reference)return '';
 let source;
 try { source=new URL(reference.sourceUrl);if(source.protocol!=='https:')return ''; }catch{return '';}
 return `<p class="reference">Real studio reference · <a href="${escapeHtml(source.href)}" target="_blank" rel="noopener noreferrer">Published details ↗</a>${reference.priceSourceUrl?` · <a href="${escapeHtml(reference.priceSourceUrl)}" target="_blank" rel="noopener noreferrer">Price source ↗</a>`:""} · checked ${escapeHtml(reference.checkedAt)}</p><p class="reference">Sample session, seats, cutoff and offers. This demo does not reserve a place with the studio.</p>`;
}
export function card(slot, quantity = 1) {
 const selectedQuantity=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=100?quantity:1;
 const price=previewPrice(slot,selectedQuantity);
 const traits=[slot.beginnerFriendly?'Beginner-friendly':'',...(slot.inclusions||[]).map(inclusionLabel)].filter(Boolean);
 return `<article class="activity-card"><div class="card-art ${slot.category==='active'?'active':''}" aria-hidden="true">${escapeHtml(activityLabel(slot.activityType))}</div><div class="card-body"><p class="eyebrow">${escapeHtml(slot.area)} · ${escapeHtml(slot.city)}</p><h2>${escapeHtml(slot.serviceName)}</h2><p class="provider-name">${slot.studioReference?`<a href="/studio.html?providerId=${slot.providerId}">${escapeHtml(slot.providerName)}</a>`:escapeHtml(slot.providerName)}</p><p class="session-time"><strong>${date(slot.startsAt)}</strong><br>${slot.durationMinutes} minutes · ${slot.remainingSeats} seats left</p><p class="session-cutoff">Book before ${date(slot.bookingClosesAt)}</p><div class="session-traits">${traits.map(trait=>`<span>${escapeHtml(trait)}</span>`).join('')}</div><div class="party-price"><strong>${money(price.total)}</strong><span>total for ${selectedQuantity} ${selectedQuantity===1?'person':'people'}</span></div><p>${money(price.unit)} / person${price.buddy?' · Buddy price applied':''}<br><small>${comparisonLabel(slot)} ${money(slot.originalPriceCentavos)} / person</small>${slot.buddyPriceCentavos!==null&&!price.buddy?`<br><span class="buddy">${money(slot.buddyPriceCentavos)} each when 2+ book together</span>`:''}</p>${studioEvidence(slot)}<p class="reference">Price preview. Rechecked before saving.</p><a class="button secondary" href="/detail.html?slotId=${slot.id}&quantity=${selectedQuantity}">View session ↗</a></div></article>`;
}
export function notice(element, message, error = false) {
  element.textContent = message;
  element.className = error ? "notice error" : "notice";
  element.setAttribute("role", error ? "alert" : "status");
}
