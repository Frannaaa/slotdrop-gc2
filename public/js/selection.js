
import {
  request, money, date, positive, pageParameters, notice, hasBookingTotal, practiceChoiceLabel,
} from "./customer-common.js";

const form = document.querySelector("#selection"),
quantity = document.querySelector("#quantity"),
summary = document.querySelector("#summary"),
chosenSession = document.querySelector("#chosenSession"),
status = document.querySelector("#status"),
next = document.querySelector("#continue");

let slotId, generation = 0;

async function refresh() {
  const current = ++generation;
  next.disabled = true;
  summary.textContent = "";
  notice(status, "Checking price and seats...");
  notice(chosenSession, "Loading session details...");

  let count;

  try {
    count = positive(quantity.value, 100);
  } catch (error) {
    if (current === generation) notice(status, error.message, true);
    return;
  }

  const sessionRequest = request("/api/slots/" + slotId)
    .then(slot => {
      if (current === generation) {
        notice(chosenSession, slot.serviceName + " " + (slot.startsAt === null ? practiceChoiceLabel(slot) : date(slot.startsAt)));
      }
      return { ok: true };
    })
  .catch(error => {
    if (current === generation) {
      notice(status, error.message, true);
    }
    return { ok: false, error };
  });

  const quoteRequest = request(
    "/api/pricing/quote?" +
    new URLSearchParams({ slotId, quantity: count })
  )
    .then(quote => {
      if (!hasBookingTotal(quote) || quote.slotId !== slotId || quote.quantity !== count) {
        throw new Error("Could not verify the booking price. Refresh quote to try again.");
      }

      return { ok: true, quote };
    })
     .catch(error => {
      if (current === generation) {
        notice(status, error.message, true);
      }
      return { ok: false, error };
    });

  const [sessionResult, quoteResult] = await Promise.all([
    sessionRequest,
    quoteRequest
  ]);

  if (current !== generation) return;

  if (sessionResult.ok && quoteResult.ok) {
    const quote = quoteResult.quote;

    summary.textContent =
      `${count} x ${money(quote.unitPriceCentavos)} = ${money(quote.totalPriceCentavos)}${quote.pricingType === "buddy" ? " Buddy price applied" : ""}`;

    notice(status, "");
    next.disabled = false;
  } else {
    const error = !quoteResult.ok
      ? quoteResult.error
      : sessionResult.error;

    notice(status, error.message, true);
    next.disabled = true;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!next.disabled && form.reportValidity()) {
    location.assign("/checkout.html?" + new URLSearchParams({ slotId, quantity: quantity.value }));
  }
});

quantity.addEventListener("input", refresh);
document.querySelector("#retry").addEventListener("click", refresh);

try {
  const params = pageParameters(location.search, ["slotId", "quantity"]);
  slotId = positive(params.get("slotId"));
  if (params.has("quantity")) quantity.value = positive(params.get("quantity"), 100);
  refresh();
} catch (error) {
  notice(status, error.message, true);
  quantity.disabled = true;
  document.querySelector("#retry").disabled = true;
  notice(chosenSession, "No valid session selected.", true);
}
