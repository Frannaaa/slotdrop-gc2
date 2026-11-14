// Group assignment: Kaitlyn. See docs/ownership-and-execution.md.
import { request, money, date, escapeHtml, pageParameters, notice } from "./customer-common.js";
const content = document.querySelector("#receipt"),
  status = document.querySelector("#status"),
  retry = document.querySelector("#retry"),
  browse = document.querySelector("#browse");
let generation = 0;
async function load() {
  const current = ++generation;
  content.replaceChildren();
  retry.hidden = true;
  browse.hidden = true;
  notice(status, "Loading your saved booking…");

  let id;
  try {
    id = pageParameters(location.search, ["id"]).get("id");
    if (!id || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))
      throw new Error("Invalid booking reference.");
  } catch {
    if (current === generation) {
      notice(status, "This booking link is missing or invalid. Browse sessions to find your booking.", true);
      browse.hidden = false;
    }
    return;
  }

  try {
    const booking = await request("/api/bookings/" + id);
    if (current !== generation) return;
    const cancelled = booking.status === "cancelled";
    content.innerHTML = `<p class="eyebrow">${escapeHtml(booking.status)}</p><h1>${cancelled ? "This booking is cancelled." : "Your demo booking is saved."}</h1><h2>${escapeHtml(booking.serviceName)}</h2><p>${escapeHtml(booking.providerName)} · ${date(booking.sessionStartsAt)}</p><dl><dt>Booking reference</dt><dd class="reference">${escapeHtml(booking.id)}</dd><dt>Seats</dt><dd>${booking.quantity}</dd><dt>Price per person</dt><dd>${money(booking.unitPriceCentavos)}</dd><dt>Saved total</dt><dd>${money(booking.totalPriceCentavos)}</dd><dt>Payment choice</dt><dd>${booking.paymentMethod === "pay_on_site" ? "Pay on site (simulated)" : "Mock card (simulated)"}</dd></dl><a class="button" href="/#featured">See featured sessions</a>`;
    notice(
      status,
      cancelled ? "This saved booking is cancelled and is not an active reservation. Payments in this course demo are simulated." : "Demo booking saved in SlotDrop. This does not reserve a real studio place or charge a payment.",
    );
  } catch (error) {
    if (current !== generation) return;

    if (error.status === 400 || error.status === 404) {
      notice(status, "No booking was found for this reference. Check the link or browse sessions.", true);
      browse.hidden = false;
    } else {
      notice(status, "Your booking receipt could not be loaded right now. Try again shortly.", true);
      retry.hidden = false;
    }
  }
}
retry.addEventListener("click", load);
load();