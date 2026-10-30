import {
  cutoffGuidance,
  sessionDate,
  suggestedCutoff,
  cutoffRequestValue,
  changedOfferFields,
  salesState,
  preferredServiceId,
  demoInventoryStatus,
} from "./owner-policy.js";
import { api } from "./api.js";
const $ = (id) => document.getElementById(id);
const form = $("offer-form");
const money = (centavos) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    centavos / 100,
  );
const time = (value) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const localTime = (value) =>
  new Date(new Date(value).getTime() + 8 * 3600000).toISOString().slice(0, 16);
let catalog = { services: [], slots: [], commissionBasisPoints: null, discoveryHours: null },
  editing = null,
  manualCutoff = false,
  busy = false;
let loaded = false;
let editingCutoff = null;
let editingSnapshot = null;
let salesViews = [];
function element(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
}
function message(id, text, error = false) {
  $(id).textContent = text;
  $(id).classList.toggle("error", error);
}
function setBusy(value) {
  busy = value;
  $("offer-fields").disabled = value;
  $("reset").disabled = value;
  $("refresh").disabled = value;
  $("sessions").inert = value;
  $("save").disabled = value || !loaded ||
    (editing === null && !catalog.services.some(service => service.active));
  refreshSalesStates();
}
function cents(value, optional = false) {
  const text = value.trim();
  if (optional && text === "") return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    throw new Error("Enter prices in pesos with up to two decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result <= 0 || result > 100000000)
    throw new Error("Each price must be between ₱0.01 and ₱1,000,000.");
  return result;
}
function field(name) {
  return form.elements.namedItem(name);
}
function preview() {
  try {
    if (!Number.isInteger(catalog.commissionBasisPoints)) {
      $("net-preview").textContent =
        "Load the workspace to estimate earnings per seat.";
      return;
    }
    const standard = cents(field("offerPriceCentavos").value),
      buddy = cents(field("buddyPriceCentavos").value, true);
    const net = (price) =>
      price - Math.round((price * catalog.commissionBasisPoints) / 10000);
    $("net-preview").textContent =
      `Estimated earnings after the ${catalog.commissionBasisPoints / 100}% fee: ${money(net(standard))} per seat.` +
      (buddy === null
        ? " Buddy pricing disabled."
        : ` With buddy pricing: ${money(net(buddy))} per seat for a booking of 2+.`) +
      " Before materials and other costs. Payments are simulated.";
  } catch {
    $("net-preview").textContent =
      "Enter valid offer prices to estimate earnings per seat.";
  }
}
function defaultCutoff() {
  const service = catalog.services.find(
    (item) => item.id === Number($("service").value),
  );
  if (!service) return;
  $("cutoff-hint").textContent = cutoffGuidance(
    service.defaultBookingCutoffMinutes,
    manualCutoff || editing !== null,
  );
  if (editing || manualCutoff) return;
  $("cutoff").value = "";
  if (!$("starts").value) return;
  try {
    $("cutoff").value = localTime(suggestedCutoff(
      $("starts").value, service.defaultBookingCutoffMinutes,
    ));
  } catch (error) {
    $("cutoff-hint").textContent = error.message;
  }
}
function reset() {
  editingCutoff = null;
  editingSnapshot = null;
  editing = null;
  manualCutoff = false;
  form.reset();
  // form.reset() can reselect a retired fixture after the catalog migration.
  $("service").value = preferredServiceId(catalog.services, $("service").value);
  $("editor-title").textContent = "Create a session";
  $("save").textContent = "Save demo session offer";
  $("status-field").hidden = true;
  for (const name of ["serviceId", "startsAt", "originalPriceCentavos"])
    field(name).disabled = false;
  field("runsAsScheduled").disabled = false;
  $("starts").value = localTime(new Date(Date.now() + 24 * 3600000));
  defaultCutoff();
  preview();
  message("form-message", "");
  setBusy(false);
}
function edit(slot) {
  if (busy || Date.parse(slot.startsAt) <= Date.now()) return;
  reset();
  editingSnapshot = { ...slot };
  editingCutoff = slot.bookingClosesAt;
  editing = slot.id;
  manualCutoff = true;
  $("editor-title").textContent = "Edit session #" + slot.id;
  $("save").textContent = "Save session changes";
  $("status-field").hidden = false;
  $("service").value = String(slot.serviceId);
  $("starts").value = localTime(slot.startsAt);
  $("cutoff").value = localTime(slot.bookingClosesAt);
  field("capacity").value = slot.capacity;
  field("originalPriceCentavos").value = (
    slot.originalPriceCentavos / 100
  ).toFixed(2);
  field("offerPriceCentavos").value = (slot.offerPriceCentavos / 100).toFixed(
    2,
  );
  field("buddyPriceCentavos").value =
    slot.buddyPriceCentavos === null
      ? ""
      : (slot.buddyPriceCentavos / 100).toFixed(2);
  field("status").value = slot.status;
  field("runsAsScheduled").checked = slot.runsAsScheduled;
  for (const name of [
    "serviceId",
    "startsAt",
    "originalPriceCentavos",
    "runsAsScheduled",
  ])
    field(name).disabled = true;
  $("cutoff-hint").textContent =
    "This deadline belongs to this session. An elapsed deadline closes new bookings.";
  preview();
  $("editor-title").scrollIntoView({ behavior: "smooth", block: "start" });
  $("cutoff").focus({ preventScroll: true });
  setBusy(false);
}
function renderMetrics(metrics) {
  $("metrics").replaceChildren();
  for (const [label, value, note] of [
    [
      "Confirmed bookings",
      String(metrics.bookingCount),
      "Transactions, not seats",
    ],
    [
      "Modeled platform revenue",
      money(metrics.platformRevenueCentavos),
      "Simulated commission from saved bookings",
    ],
    [
      "Average booking",
      money(metrics.averageOrderValueCentavos),
      "Whole booking value",
    ],
    [
      "Top activity",
      metrics.topSellingService?.serviceName || "No bookings",
      metrics.topSellingService
        ? metrics.topSellingService.seatsSold + " seats booked"
        : "Confirmed seats",
    ],
    [
      "Almost-full sessions",
      String(metrics.nearlyFullSessionCount),
      "1–25% of allocation left; excludes sold out",
    ],
  ]) {
    const card = element("article", undefined, "metric");
    card.append(
      element("p", label),
      element("strong", value),
      element("small", note),
    );
    $("metrics").append(card);
  }
}
function refreshDemoReadiness(now = Date.now()) {
  const info = demoInventoryStatus(catalog.slots, catalog.services, now, catalog.discoveryHours);
  const warning = $("inventory-warning");
  if (warning.textContent !== info.message) warning.textContent = info.message;
  warning.dataset.state = info.state;
}
function refreshSalesStates() {
  if (!loaded) return;
  const now = Date.now();
  refreshDemoReadiness(now);
  for (const { slot, tag, help, toggle, editButton } of salesViews) {
    const state = salesState(slot, now, catalog.discoveryHours);
    tag.textContent = state.label;
    help.textContent = state.help || "";
    help.hidden = !state.help;
    const started = Date.parse(slot.startsAt) <= now;
    if (editButton) editButton.disabled = busy || started;
    if (toggle) toggle.disabled = busy || started || (slot.status === "paused" && !state.canResume);
  }
}
function renderSessions() {
  salesViews = [];
  $("sessions").replaceChildren();
  $("session-count").textContent = catalog.slots.length + " sessions";
  if (!catalog.slots.length) {
    $("sessions").textContent = "No sessions yet. Create your first offer.";
    return;
  }
  for (const slot of catalog.slots) {
    const state = salesState({
      ...slot,
      serviceActive: catalog.services.find(
        (service) => service.id === slot.serviceId,
      )?.active,
    }, Date.now(), catalog.discoveryHours);
    const card = element("article", undefined, "session"),
      heading = element("h3", slot.serviceName),
      tag = element("span", state.label, "tag");
    tag.dataset.state = slot.status;
    heading.append(tag);
    card.append(
      heading,
      element("p", slot.providerName + " · " + slot.area),
      element("p", time(slot.startsAt)),
      element("p", "Bookings close " + time(slot.bookingClosesAt)),
    );
    card.append(
      element(
        "p",
        `${slot.remainingSeats} of ${slot.capacity} released seats left`,
      ),
      element("p", "Regular " + money(slot.originalPriceCentavos) + " / seat", "regular-price"),
      element("p", money(slot.offerPriceCentavos) + " / seat", "price"),
    );
    if (slot.buddyPriceCentavos !== null)
      card.append(
        element(
          "p",
          money(slot.buddyPriceCentavos) + " / seat for a booking of 2+",
          "buddy-rate",
        ),
      );
    const help = element("p", state.help || "", "hint");
    help.hidden = !state.help;
    card.append(help);
    const view = { slot: {
      ...slot,
      serviceActive: catalog.services.find(service => service.id === slot.serviceId)?.active,
    }, tag, help, toggle: null };
    salesViews.push(view);
    const actions = element("div", undefined, "actions"),
      editButton = element("button", "Edit offer");
    view.editButton = editButton;
    editButton.disabled = Date.parse(slot.startsAt) <= Date.now();
    editButton.type = "button";
    editButton.addEventListener("click", () => edit(slot));
    actions.append(editButton);
    if (slot.status !== "cancelled") {
      const toggle = element(
        "button",
        slot.status === "paused" ? "Resume sales" : "Pause sales",
      );
      toggle.type = "button";
      view.toggle = toggle;
      if (Date.parse(slot.startsAt) <= Date.now() || (slot.status === "paused" && !state.canResume)) toggle.disabled = true;
      toggle.addEventListener("click", async () => {
        if (busy) return;
        setBusy(true);
        toggle.disabled = true;
        try {
          await api("/api/slots/" + slot.id, {
            method: "PATCH",
            body: JSON.stringify({
              status: slot.status === "paused" ? "open" : "paused",
            }),
          });
          setBusy(false);
          await load();
        } catch (error) {
          message("page-message", error.message, true);
        } finally {
          setBusy(false);
          refreshSalesStates();
        }
      });
      actions.append(toggle);
    }
    card.append(actions);
    $("sessions").append(card);
  }
}
function renderBookings(rows) {
  $("bookings").replaceChildren();
  if (!rows.length) {
    $("bookings").textContent = "No saved bookings yet.";
    return;
  }
  const wrap = element("div", undefined, "table-wrap"),
    table = element("table"),
    head = element("thead"),
    header = element("tr");
  wrap.tabIndex = 0;
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", "Saved bookings; scroll horizontally for all amounts");
  for (const title of [
    "Booking / activity",
    "Session",
    "Seats",
    "Rate",
    "Total",
    "Platform fee",
    "Provider proceeds",
    "Status",
  ])
    header.append(element("th", title));
  head.append(header);
  table.append(head);
  const body = element("tbody");
  for (const row of rows) {
    const tr = element("tr");
    for (const value of [
      row.id + " · " + row.serviceName,
      time(row.sessionStartsAt),
      String(row.quantity),
      row.pricingType + " · " + money(row.unitPriceCentavos),
      money(row.totalPriceCentavos),
      money(row.platformFeeCentavos),
      money(row.providerPayoutCentavos),
      row.status,
    ])
      tr.append(element("td", value));
    body.append(tr);
  }
  table.append(body);
  wrap.append(table);
  $("bookings").append(wrap);
}
async function load() {
  if (busy) return;
  loaded = false;
  setBusy(true);
  message("page-message", "Loading your workspace…");
  try {
    const [next, metrics, bookings] = await Promise.all([
      api("/api/owner/catalog"),
      api("/api/metrics"),
      api("/api/bookings"),
    ]);
    catalog = next;
    const selected = $("service").value;
    $("service").replaceChildren();
    for (const service of catalog.services) {
      const option = element(
        "option",
        service.providerName + " · " + service.name,
      );
      option.value = service.id;
      option.disabled = !service.active;
      $("service").append(option);
    }
    $("service").value = preferredServiceId(catalog.services, selected, editing);
    renderMetrics(metrics);
    renderSessions();
    renderBookings(bookings);
    refreshDemoReadiness();
    // Keep an existing unsaved deadline when refreshing the Owner catalog.
    // On first load the deadline is blank and must use the active activity default.
    if (!$("cutoff").value) defaultCutoff();
    preview();
    loaded = true;
    message("page-message", "");
  } catch (error) {
    salesViews = [];
    $("inventory-warning").textContent = "";
    message("page-message", error.message, true);
    $("metrics").replaceChildren();
    $("sessions").textContent =
      "Sessions could not be loaded. Use Refresh data to retry.";
    $("bookings").textContent = "Bookings could not be loaded.";
  } finally {
    setBusy(false);
  }
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !loaded) return;
  try {
    let body = {
      capacity: Number(field("capacity").value),
      offerPriceCentavos: cents(field("offerPriceCentavos").value),
      buddyPriceCentavos: cents(field("buddyPriceCentavos").value, true),
      bookingClosesAt: cutoffRequestValue($("cutoff").value, editingCutoff),
    };
    if (editing) {
      body.status = field("status").value;
      body = changedOfferFields(body, editingSnapshot);
      if (!Object.keys(body).length) {
        message("form-message", "No changes to save.");
        return;
      }
    }
    else
      Object.assign(body, {
        serviceId: Number($("service").value),
        startsAt: sessionDate($("starts").value).toISOString(),
        originalPriceCentavos: cents(field("originalPriceCentavos").value),
        runsAsScheduled: field("runsAsScheduled").checked,
      });
    setBusy(true);
    message("form-message", "Saving…");
    await api(editing ? "/api/slots/" + editing : "/api/slots", {
      method: editing ? "PATCH" : "POST",
      body: JSON.stringify(body),
    });
    setBusy(false);
    reset();
    await load();
    message("form-message", "Session saved.");
  } catch (error) {
    message("form-message", error.message, true);
  } finally {
    setBusy(false);
  }
});
$("service").addEventListener("change", defaultCutoff);
$("starts").addEventListener("input", defaultCutoff);
$("cutoff").addEventListener("input", () => {
  manualCutoff = true;
  defaultCutoff();
});
form.addEventListener("input", preview);
$("reset").addEventListener("click", () => {
  if (!busy) reset();
});
$("refresh").addEventListener("click", load);
// Update existing labels and buttons without replacing cards or clearing drafts.
setInterval(() => {
  if (!document.hidden) refreshSalesStates();
}, 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshSalesStates();
});
reset();
load();
