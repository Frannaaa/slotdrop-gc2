import {
  request, money, date, positive, pageParameters, escapeHtml,
  available, closedSessionLabel, notice, inclusionLabel, activityLabel,
  comparisonLabel, safeHttpsUrl, previewPrice
} from "./customer-common.js";

const content = document.querySelector("#detail");
const status = document.querySelector("#status");
const retry = document.querySelector("#retry");
let slot = null;
let generation = 0;
let quantity = 1;

function renderDetail(slot,id,quantity){
  const practice=slot.startsAt===null;
  const quote=previewPrice(slot,quantity);
  const photo=slot.studioReference?.photo;
  const photoPage=safeHttpsUrl(photo?.page);
  const photoKey=slot.studioReference?.key;
  const hasPhoto=Boolean(photoPage && /^[a-z-]+$/.test(photoKey||"") && typeof photo.alt==="string" && typeof photo.credit==="string");
  const photoMarkup=hasPhoto
    ? `<img src="/images/workshops/${photoKey}.webp" width="720" height="405" alt="${escapeHtml(photo.alt)}" fetchpriority="high">`
    : `<div class="detail-fallback" aria-label="${escapeHtml(activityLabel(slot.activityType))} workshop">${escapeHtml(activityLabel(slot.activityType))}</div>`;
  const credit=hasPhoto?`<figcaption><a href="${escapeHtml(photoPage)}" target="_blank" rel="noopener noreferrer">Photo: ${escapeHtml(photo.credit)} ↗</a></figcaption>`:"";
  const traits=[slot.beginnerFriendly?"Beginner-friendly":"",...(slot.inclusions||[]).map(inclusionLabel)].filter(Boolean);
  const title=slot.serviceName||"Workshop";
  const studioUrl="/studio.html?providerId="+encodeURIComponent(String(slot.providerId));
  const source=safeHttpsUrl(slot.studioReference?.sourceUrl);
  const priceSource=safeHttpsUrl(slot.studioReference?.priceSourceUrl);
  const sourceLink=source?`<p><a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Studio workshop details ↗</a></p>`:"";
  const priceLink=priceSource?`<p><a href="${escapeHtml(priceSource)}" target="_blank" rel="noopener noreferrer">Published price source ↗</a></p>`:"";
  const displayQuantity=quantity===1?"per person":`per person · ${quantity} selected`;
  const discount=slot.originalPriceCentavos>0?Math.round(100*(slot.originalPriceCentavos-quote.unit)/slot.originalPriceCentavos):0;
  const inclusions=traits.length?`<div class="detail-highlights">${traits.map(value=>`<span>${escapeHtml(value)}</span>`).join("")}</div>`:"";
  const technique=slot.technique?slot.technique.replace(/-/g," "):"";
  const preparation=slot.preparationNote?`<section class="detail-section"><h2>Before you go</h2><p>${escapeHtml(slot.preparationNote)}</p></section>`:"";
  const scheduleNote=practice
    ? "Demo exception: Kept open for grading; regular offers appear within 72 hours of a session and close at their booking cutoff."
    : "This session is part of a simulated booking flow, not verified studio availability.";
  const cutoff=practice?"No cutoff for grading":date(slot.bookingClosesAt);
  const sourceSection=sourceLink||priceLink?`<p>Studio research sources:</p>${sourceLink}${priceLink}`:"";
  const buddy=slot.buddyPriceCentavos!==null
    ? `<div class="booking-buddy"><strong>${quote.buddy?"Buddy price applied":"Bring a friend, pay less"}</strong><span>${money(slot.buddyPriceCentavos)} each for 2+ people</span></div>`:"";
  return `<div class="detail-heading">
      <p class="detail-eyebrow">${escapeHtml(activityLabel(slot.activityType))} · ${escapeHtml(slot.area)}, ${escapeHtml(slot.city)}</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="detail-subhead">Hosted by <a href="${studioUrl}">${escapeHtml(slot.providerName)}</a>
        ${slot.beginnerFriendly?`<span aria-hidden="true">·</span><span>Beginner-friendly</span>`:""}</div>
    </div>
    <div class="detail-shell">
      <figure class="detail-image">${photoMarkup}${credit}</figure>
      <div class="detail-primary">
        ${inclusions}
        <section class="detail-section">
          <h2>Session details</h2>
          <div class="detail-facts">
            <div class="detail-fact"><span class="fact-icon" aria-hidden="true">◷</span><span><small>Duration</small><strong>${escapeHtml(String(slot.durationMinutes))} minutes</strong></span></div>
            <div class="detail-fact"><span class="fact-icon" aria-hidden="true">⌖</span><span><small>Location</small><strong>${escapeHtml(slot.area)}, ${escapeHtml(slot.city)}</strong></span></div>
            ${technique?`<div class="detail-fact"><span class="fact-icon" aria-hidden="true">✦</span><span><small>Technique</small><strong>${escapeHtml(technique)}</strong></span></div>`:""}
          </div>
        </section>
        ${preparation}
        <details class="detail-disclosures"><summary>Booking notes and studio sources</summary>
          <p>${escapeHtml(scheduleNote)}</p>
          <p>${escapeHtml(slot.cancellationNote||"Demo booking only. No real reservation or payment is made.")}</p>
          ${sourceSection}
        </details>
      </div>
      <aside class="detail-booking" id="offer" aria-label="Booking and pricing">
        <p class="booking-eyebrow">Your session</p>
        <p class="booking-date"><span aria-hidden="true">▣</span>${practice?"Practice booking":escapeHtml(date(slot.startsAt))}</p>
        <div class="booking-price-block">
          <p class="booking-price">${money(quote.unit)}</p>
          <p class="booking-per">${escapeHtml(displayQuantity)}</p>
          <p class="booking-original"><span>${escapeHtml(comparisonLabel(slot))}: <s>${money(slot.originalPriceCentavos)}</s></span>
            ${discount>0?`<span class="booking-saving">${discount}% off</span>`:""}</p>
          ${quantity>1?`<p class="booking-per">Total for ${quantity}: ${money(quote.total)}</p>`:""}
        </div>
        ${buddy}
        <div class="booking-availability"><span>Availability</span><strong>${escapeHtml(String(slot.remainingSeats))} ${slot.remainingSeats===1?"seat":"seats"} left</strong></div>
        <div class="booking-availability"><span>Book before</span><strong class="muted">${escapeHtml(cutoff)}</strong></div>
        <a id="continue" class="button" href="/selection.html?slotId=${id}&quantity=${quantity}">Choose seats ↗</a>
        <p id="unavailable-message" class="booking-micro" hidden></p>
        <p class="booking-micro">Course demo · No real payment is collected</p>
      </aside>
    </div>`;
}

function sync(){
  if(!slot)return;
  const link=document.querySelector("#continue");
  if(!link)return;
  const open=available(slot,quantity);
  const closed=slot.serviceActive&&slot.status==="open"&&slot.runsAsScheduled?closedSessionLabel(slot):"";
  const smallerGroup = !open && available(slot);
  const reason = smallerGroup
    ? `Only ${slot.remainingSeats} ${slot.remainingSeats === 1 ? "seat is" : "seats are"} left.`
    : `${closed || "This session is unavailable"}.`;
  const nextStep = smallerGroup ? "Choose a smaller group in Browse." : "Browse for another session.";
  const message = open ? "" : `${reason} ${nextStep}`;
  link.hidden = !open;
  const unavailable = document.querySelector("#unavailable-message");
  if (unavailable) {
    unavailable.hidden = open;
    if (!open && unavailable.textContent !== reason) unavailable.textContent = reason;
  }
  if (status.textContent !== message) notice(status, message, !open);
}

async function load(){
  const current=++generation;
  slot=null;
  content.replaceChildren();
  retry.hidden=true;
  try{
    const params=pageParameters(location.search,["slotId","quantity"]);
    const id=positive(params.get("slotId"));
    quantity=params.has("quantity")?positive(params.get("quantity"),100):1;
    notice(status,"Loading workshop…");
    const loaded=await request("/api/slots/"+id);
    if(current!==generation)return;
    slot=loaded;
    content.innerHTML=renderDetail(slot,id,quantity);
    sync();
  }catch(error){
    if(current!==generation)return;
    notice(status,error.message,true);
    retry.hidden=false;
  }
}

retry.addEventListener("click", load);
setInterval(sync, 1000);
load();
