
import { request, money, date, positive, pageParameters, notice } from "./customer-common.js";

const form = document.querySelector("#selection"),
quantity = document.querySelector("#quantity"),
summary = document.querySelector("#summary"),
status = document.querySelector("#status"),
next = document.querySelector("#continue"),
chosenSession = document.querySelector("#chosenSession");

let slotId, generation = 0;

async function refresh() {
  const current = ++generation;
  next.disabled = true;
  summary.textContent = "";
  notice(status, "");
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
        notice(chosenSession, slot.serviceName + " " + date(slot.startsAt));
      }
      return { ok: true };
    })
    .catch(error => {
      if (current === generation) {
        notice(chosenSession, error.message, true);
      }
      return { ok: false, error };
    });

  const quoteRequest = request(
    "/api/pricing/quote?" +
    new URLSearchParams({ slotId, quantity: count })
  )
    .then(quote => {
      if (current === generation) {
        summary.textContent =
          `${count} x ${money(quote.unitPriceCentavos)} = ${money(quote.totalPriceCentavos)}${quote.pricingType === "buddy" ? " Buddy price applied" : ""}`;
      }
      return { ok: true };
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
    notice(status, "");
    next.disabled = false;
  } else {
    if (!quoteResult.ok) {
      notice(status, quoteResult.error.message, true);
    } else if (!sessionResult.ok) {
      notice(status, sessionResult.error.message, true);
    }
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
