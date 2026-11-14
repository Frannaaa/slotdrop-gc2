// Group assignment: Kirsten. Captain integration: consume Fran's #49
// server-side discovery pagination, with filtering applied before LIMIT/OFFSET.
import { request, card, notice } from "./customer-common.js";

const results = document.querySelector("#results");
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const pagination = document.querySelector("#pagination");
const retry = document.querySelector("#retry");
const categoryButtons = [...document.querySelectorAll("[data-category]")];

const ITEMS_PER_PAGE = 6;
let category = "all";
let currentPage = 1;
let slots = [];
let hasNextPage = false;
let generation = 0;
let searchTimer = null;

function pageUrl(page) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(ITEMS_PER_PAGE),
  });
  const query = search.value.trim();
  if (query) params.set("q", query);
  if (sort.value !== "soonest") params.set("sort", sort.value);
  if (category !== "all") params.set("category", category);
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
  results.innerHTML = slots.map((slot) => card(slot)).join("");
  renderPagination();
  if (!slots.length) {
    notice(status, search.value.trim() || category !== "all"
      ? "No sessions match those filters. Try another search or category."
      : "No sessions are available right now. Check back soon.");
    return;
  }
  const first = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  notice(status, `Showing sessions ${first}–${first + slots.length - 1} · page ${currentPage}.`);
}

async function load(page = 1) {
  const current = ++generation;
  results.setAttribute("aria-busy", "true");
  results.replaceChildren();
  pagination.replaceChildren();
  retry.disabled = true;
  notice(status, "Loading sessions…");

  try {
    // Filters and LIMIT/OFFSET are handled by GET /api/slots on the server.
    const items = await request(pageUrl(page));
    if (current !== generation) return;
    if (!Array.isArray(items)) throw new Error("The sessions response was not a list.");
    if (items.length === 0 && page > 1) {
      // Inventory may change between clicks. Don't strand the customer on an empty page.
      return load(page - 1);
    }

    currentPage = page;
    slots = items;
    hasNextPage = false;
    results.setAttribute("aria-busy", "false");
    render();

    let more = false;
    if (items.length === ITEMS_PER_PAGE) {
      // The API returns an array, not total-count metadata. A small lookahead
      // prevents a fake Next button when the last page has exactly six items.
      try {
        const nextItems = await request(pageUrl(page + 1));
        if (!Array.isArray(nextItems)) throw new Error("The sessions response was not a list.");
        more = nextItems.length > 0;
      } catch {
        // Keep the loaded page usable. Next can retry the unavailable page.
        more = true;
      }
      if (current !== generation) return;
    }

    hasNextPage = more;
    renderPagination();
  } catch (error) {
    if (current !== generation) return;
    slots = [];
    results.setAttribute("aria-busy", "false");
    hasNextPage = false;
    notice(status, error.message || "Could not load sessions. Please try again.", true);
  } finally {
    if (current === generation) retry.disabled = false;
  }
}

function resetSearchPage() {
  clearTimeout(searchTimer);
  // Invalidate any older in-flight responses immediately.
  generation++;
  results.setAttribute("aria-busy", "true");
  results.replaceChildren();
  pagination.replaceChildren();
  notice(status, "Searching sessions…");
  searchTimer = setTimeout(() => load(1), 180);
}

search.addEventListener("input", resetSearchPage);
sort.addEventListener("change", () => {
  clearTimeout(searchTimer);
  load(1);
});
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    clearTimeout(searchTimer);
    category = button.dataset.category;
    categoryButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    load(1);
  });
});
retry.addEventListener("click", () => load(currentPage));
load(1);
