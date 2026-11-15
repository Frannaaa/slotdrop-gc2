// Group assignment: Kaitlyn. See README.md#team.
import {
  request, retryLimitedBooking, money, date, positive, pageParameters, notice,
  hasBookingTotal, isBookingId, isBookingReceipt,
} from "./customer-common.js";

const form = document.querySelector("#checkout"),
  button = document.querySelector("#submit"),
  summary = document.querySelector("#summary"),
  chosenSession = document.querySelector("#chosenSession"),
  status = document.querySelector("#status"),
  ack = document.querySelector("#acceptPrice"),
  retry = document.querySelector("#retry");
let slotId,
  quantity,
  quote,
  pending = null,
  busy = false,
  uncertain = false,
  navigating = false,
  storageKey,
  generation = 0;

function lockDetails(locked) {
  for (const name of ["customerName", "customerEmail", "paymentMethod"])
    form.elements.namedItem(name).disabled = locked;
}

function persist() {
  try {
    const serialized = JSON.stringify(pending);
    sessionStorage.setItem(storageKey, serialized);
    return sessionStorage.getItem(storageKey) === serialized;
  } catch {
    return false;
  }
}

function clear() {
  pending = null;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {}
}

function showQuote() {
  summary.textContent = `${quantity} × ${money(quote.unitPriceCentavos)} = ${money(quote.totalPriceCentavos)}${quote.pricingType === "buddy" ? " · Buddy price applied" : ""}`;
  document.querySelector("#priceLabel").textContent =
    `I agree to the simulated booking total of ${money(quote.totalPriceCentavos)}.`;
}

function resetQuote() {
  quote = null;
  button.disabled = true;
  ack.checked = false;
  ack.disabled = true;
  summary.textContent = "";
  document.querySelector("#priceLabel").textContent = "I agree to the booking total.";
}

function matchesQuote(value) {
  return hasBookingTotal(value) && value.slotId === slotId && value.quantity === quantity;
}

function bookingRejected(error) {
  return (error.status === 400 && error.code === "INVALID_INPUT")
    || (error.status === 404 && error.code === "SLOT_NOT_FOUND")
    || (error.status === 409 && ["SLOT_UNAVAILABLE", "REQUEST_KEY_CONFLICT"].includes(error.code));
}

async function load() {
  if (busy || uncertain || navigating) return;

  const current = ++generation;
  resetQuote();
  retry.disabled = true;

  notice(status, "Checking session and price…");
  notice(chosenSession, "Loading session details…");

  try {
    const [slot, loaded] = await Promise.all([
      request("/api/slots/" + slotId),
      request(
        "/api/pricing/quote?" + new URLSearchParams({ slotId, quantity }),
      ),
    ]);

    if (current !== generation) return;
    if (!matchesQuote(loaded))
      throw new Error("Could not verify the booking price. Refresh quote to try again.");

    notice(chosenSession, slot.serviceName + " · " + date(slot.startsAt));

    quote = loaded;
    showQuote();
    ack.disabled = false;
    notice(status, "Review the total and enter fictional details.");
  } catch (error) {
    if (current !== generation) return;

    notice(chosenSession, "");
    notice(status, error.message, true);
  } finally {
    if (current === generation) retry.disabled = false;
  }
}

ack.addEventListener("change", () => {
  button.disabled = busy || navigating || !quote || !ack.checked;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (
    busy ||
    navigating ||
    !quote ||
    !ack.checked ||
    !form.reportValidity()
  ) return;

  if (!pending) {
    const data = new FormData(form);

    pending = {
      requestId: crypto.randomUUID(),
      slotId,
      quantity,
      customerName: String(data.get("customerName")).trim(),
      customerEmail: String(data.get("customerEmail")).trim(),
      paymentMethod: data.get("paymentMethod"),
      expectedTotalCentavos: quote.totalPriceCentavos,
    };

    if (!persist()) {
      pending = null;
      notice(
        status,
        "Your browser could not save the booking retry details. Allow site storage, then try again. No booking was sent.",
        true,
      );
      return;
    }
  }

  busy = true;
  button.disabled = true;
  ack.disabled = true;
  retry.disabled = true;
  lockDetails(true);

  notice(status, "Saving your booking…");

  try {
    const receipt = await retryLimitedBooking("/api/bookings", {
      method: "POST",
      // Persisted before send: 429 retry reuses this exact request ID and body.
      body: JSON.stringify(pending),
    }, {
      maxRetries: 1,
      onWait(seconds) {
        notice(status, `Booking traffic is high. Retrying this same request in ${seconds} seconds…`);
      },
    });

    if (!isBookingReceipt(receipt)
      || receipt.slotId !== slotId
      || receipt.quantity !== quantity
      || receipt.totalPriceCentavos !== pending.expectedTotalCentavos
      || receipt.paymentMethod !== pending.paymentMethod) {
      throw new Error("Invalid booking response.");
    }

    // Keep the retry request until confirmation navigation starts.
    location.assign("/confirmation.html?id=" + encodeURIComponent(receipt.id));
    navigating = true;
    clear();
  } catch (error) {
    if (error.status === 409 && error.code === "PRICE_CHANGED") {
      clear();
      uncertain = false;
      resetQuote();
      if (matchesQuote(error.quote)) {
        quote = error.quote;
        showQuote();
        notice(status, "The price changed. Review and accept the new total before submitting again.", true);
      } else {
        notice(status, "The price changed. Refresh quote to see the current total.", true);
      }
    } else if (bookingRejected(error) || (!uncertain && error.status === 429 && error.code === "RATE_LIMITED")) {
      clear();
      uncertain = false;
      if (["SLOT_UNAVAILABLE", "SLOT_NOT_FOUND"].includes(error.code)) resetQuote();
      notice(status, error.message, true);
    } else {
      uncertain = true;

      notice(
        status,
        error.status === 429
          ? "Booking traffic is high. Wait a moment, then use Retry booking to check your original request."
          : "Could not confirm the result. Your details are locked so Retry booking sends the same request safely.",
        true,
      );
    }
  } finally {
    busy = false;

    // Never unlock checkout after a successful booking.
    if (!navigating) {
      lockDetails(uncertain);
      ack.disabled = uncertain || !quote;
      retry.disabled = uncertain;

      button.textContent = uncertain
        ? "Retry booking"
        : "Confirm simulated booking";

      button.disabled = !quote || !ack.checked;
    }
  }
});

retry.addEventListener("click", load);

try {
  const params = pageParameters(location.search, ["slotId", "quantity"]);

  slotId = positive(params.get("slotId"));
  quantity = positive(params.get("quantity"), 100);
  storageKey = `slotdrop-pending-${slotId}-${quantity}`;

  let saved;

  try {
    saved = JSON.parse(sessionStorage.getItem(storageKey));
  } catch {}

  if (validPending(saved)) {
    pending = saved;
    uncertain = true;

    quote = {
      unitPriceCentavos: saved.expectedTotalCentavos / quantity,
      totalPriceCentavos: saved.expectedTotalCentavos,
    };

    for (const name of ["customerName", "customerEmail", "paymentMethod"])
      form.elements.namedItem(name).value = saved[name];

    showQuote();
    lockDetails(true);

    ack.checked = true;
    ack.disabled = true;
    retry.disabled = true;
    button.disabled = false;
    button.textContent = "Retry booking";

    notice(
      status,
      "An earlier request needs confirmation. Retry uses the same request ID.",
    );

    request("/api/slots/" + slotId)
      .then((slot) => {
        notice(chosenSession, slot.serviceName + " · " + date(slot.startsAt));
      })
      .catch((error) =>
        notice(chosenSession, error.message, true),
      );
  } else {
    clear();
    load();
  }
} catch (error) {
  notice(status, error.message, true);
  button.disabled = true;
  ack.disabled = true;
  retry.disabled = true;

  notice(chosenSession, "");
}

function validPending(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.slotId === slotId &&
    value.quantity === quantity &&
    isBookingId(value.requestId) &&
    typeof value.customerName === "string" &&
    value.customerName.trim().length >= 1 &&
    value.customerName.length <= 100 &&
    typeof value.customerEmail === "string" &&
    value.customerEmail.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.customerEmail) &&
    !value.customerName.includes("\u0000") &&
    !value.customerEmail.includes("\u0000") &&
    ["mock_card", "pay_on_site"].includes(value.paymentMethod) &&
    Number.isSafeInteger(value.expectedTotalCentavos) &&
    value.expectedTotalCentavos > 0 &&
    value.expectedTotalCentavos % quantity === 0 &&
    value.expectedTotalCentavos / quantity <= 100000000
  );
}
