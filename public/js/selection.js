import { request, money, date, positive, pageParameters, notice } from "./customer-common.js";

const form = document.querySelector("#selection"),
quantity = document.querySelector("#quantity"),
summary = document.querySelector("#summary"),
status = document.querySelector("#status"),
next = document.querySelector("#continue");

let slotId, generation = 0;

async function refresh() {
  const current = ++generation;
  next.disabled = true;
  summary.textContent = "";
  notice(status, "Checking price and seats...");
  notice(document.querySelector("#chosenSession"), "Loading session details...");
  try {
    const count = positive(quantity.value, 100);
    const [slot, quote] = await Promise.all([
      request("/api/slots/" + slotId),
      request("/api/pricing/quote?" + new URLSearchParams({ slotId, quantity: count }))
    ]);
    if (current !== generation) return;
    notice(document.querySelector("#chosenSession"), slot.serviceName + " " + date(slot.startsAt));
    summary.textContent = `${count} x ${money(quote.unitPriceCentavos)} = ${money(quote.totalPriceCentavos)}${quote.pricingType === "buddy" ? " Buddy price applied" : ""}`;
    notice(status, "");
    next.disabled = false;
  } catch (error) {
    if (current === generation) {
      notice(status, error.message, true);
      notice(document.querySelector("#chosenSession"), error.message, true);
    }
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
  notice(document.querySelector("#chosenSession"), "No valid session selected.", true);
}