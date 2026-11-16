// Group assignment: Kirsten. Captain integration: consume Fran's #49
// server-side discovery pagination, with filtering applied before LIMIT/OFFSET.
import { request, card, notice } from "./customer-common.js";

const results = document.querySelector("#results");
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const when = document.querySelector("#when");
const people = document.querySelector("#people");
const sort = document.querySelector("#sort");
const pagination = document.querySelector("#pagination");
const retry = document.querySelector("#retry");
const practiceResults = document.querySelector("#practice-results");
const practiceStatus = document.querySelector("#practice-status");
const practiceRetry = document.querySelector("#practice-retry");
const closedSessions = document.querySelector("#closed-sessions");
const closedResults = document.querySelector("#closed-results");
const closedStatus = document.querySelector("#closed-status");
const closedRetry = document.querySelector("#closed-retry");
const activityButtons = [...document.querySelectorAll("[data-activity]")];

const ITEMS_PER_PAGE = 6;
let activity = "all";
let currentPage = 1;
let requestedPage = 1;
let workshops = [];
let hasNextPage = false;
let generation = 0;
let searchTimer = null;
let loadingClosedSessions = false;

function pageUrl(page) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(ITEMS_PER_PAGE),
    view: "workshops",
  });
  const query = search.value.trim();
  if (query) params.set("q", query);
  if (activity !== "all") params.set("type", activity);
  if (when?.value) params.set("when", when.value);
  if (sort?.value && sort.value !== "soonest") params.set("sort", sort.value);
  if (people?.value && people.value !== "1") params.set("people", people.value);
  return "/api/slots?" + params;
}

function renderPagination() {
  pagination.replaceChildren();
  if (currentPage === 1 && !hasNextPage) return;

  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "button secondary";
  previous.textContent = "Previous";
  previous.disabled = currentPage <= 1;
  previous.addEventListener("click", () => {
    if (currentPage > 1) load(currentPage - 1);
  });

  const label = document.createElement("span");
  label.className = "pagination-label";
  label.textContent = `Page ${currentPage}`;
  label.setAttribute("aria-live", "polite");

  const next = document.createElement("button");
  next.type = "button";
  next.className = "button secondary";
  next.textContent = "Next";
  next.disabled = !hasNextPage;
  next.addEventListener("click", () => {
    if (hasNextPage) load(currentPage + 1);
  });
  pagination.append(previous, label, next);
}

function render() {
  const groupSize = Number(people?.value || 1);
  results.innerHTML = workshops.map(({ sessions }) =>
    card(sessions[0], groupSize, { sessions })
  ).join("");
  renderPagination();
  if (!workshops.length) {
    notice(status, search.value.trim() || when.value || people.value !== "1" || activity !== "all"
      ? "No upcoming workshops match those filters."
      : "No upcoming workshops are available right now.");
    return;
  }
  const first = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  notice(status, `Showing workshops ${first}–${first + workshops.length - 1} · page ${currentPage}.`);
}

async function load(page = 1) {
  requestedPage = page;
  const current = ++generation;
  results.replaceChildren();
  pagination.replaceChildren();
  retry.disabled = true;
  retry.hidden = true;
  notice(status, "Loading workshops…");

  try {
    // The server filters dates, groups workshops and applies the page limit.
    const data = await request(pageUrl(page));
    if (current !== generation) return;
    if (!Array.isArray(data?.workshops) || typeof data.hasNextPage !== "boolean") {
      throw new Error("The workshop page response was invalid.");
    }
    const items = data.workshops;
    if (items.length === 0 && page > 1) {
      // Inventory may change between clicks. Don't strand the customer on an empty page.
      return load(page - 1);
    }

    currentPage = page;
    workshops = items;
    hasNextPage = data.hasNextPage;
    render();
  } catch (error) {
    if (current !== generation) return;
    workshops = [];
    hasNextPage = false;
    notice(status, error.message || "Could not load workshops. Please try again.", true);
    retry.hidden = false;
  } finally {
    if (current === generation) retry.disabled = false;
  }
}

async function loadPractice() {
  if (practiceRetry.disabled) return;
  practiceRetry.disabled = true;
  practiceRetry.hidden = true;
  practiceResults.replaceChildren();
  notice(practiceStatus, "Loading practice bookings…");
  try {
    const items = await request("/api/slots?view=practice");
    if (!Array.isArray(items)) throw new Error("The practice response was not a list.");
    practiceResults.innerHTML = items.map(slot => card(slot, 1, { compact: true })).join("");
    notice(practiceStatus, items.length ? "" : "No practice spots are available right now.");
  } catch {
    notice(practiceStatus, "Could not load practice bookings. Please try again.", true);
    practiceRetry.hidden = false;
  } finally {
    practiceRetry.disabled = false;
  }
}

async function loadClosedSessions() {
  if (loadingClosedSessions) return;
  loadingClosedSessions = true;
  closedRetry.hidden = true;
  closedResults.replaceChildren();
  notice(closedStatus, "Loading recently closed sessions…");
  try {
    const items = await request("/api/slots?view=closed&limit=16");
    if (!Array.isArray(items)) throw new Error("The workshops response was not a list.");
    closedResults.innerHTML = items.map(slot => card(slot, 1, { closed: true })).join("");
    notice(closedStatus, items.length ? "" : "No closed sessions yet.");
  } catch {
    notice(closedStatus, "Could not load recently closed sessions. Please try again.", true);
    closedRetry.hidden = false;
  } finally {
    loadingClosedSessions = false;
  }
}

function resetSearchPage() {
  clearTimeout(searchTimer);
  // Invalidate any older in-flight responses immediately.
  generation++;
  results.replaceChildren();
  pagination.replaceChildren();
  notice(status, "Searching workshops…");
  searchTimer = setTimeout(() => load(1), 180);
}

search.addEventListener("input", resetSearchPage);
for (const control of [when, people, sort]) {
  control?.addEventListener("change", () => {
    clearTimeout(searchTimer);
    load(1);
  });
}
activityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    clearTimeout(searchTimer);
    activity = button.dataset.activity;
    activityButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    load(1);
  });
});
retry.addEventListener("click", () => load(requestedPage));
practiceRetry.addEventListener("click", loadPractice);
closedSessions.addEventListener("toggle", () => {
  if (closedSessions.open) loadClosedSessions();
});
closedRetry.addEventListener("click", loadClosedSessions);
load(1);
loadPractice();
