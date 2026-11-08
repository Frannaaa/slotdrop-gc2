// Group assignment: Kirsten. See docs/ownership-and-execution.md.
import { request, card, notice } from "./customer-common.js";

const results = document.querySelector("#results");
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const pagination = document.querySelector("#pagination");
const categoryButtons = [...document.querySelectorAll("[data-category]")];

const ITEMS_PER_PAGE = 6;
let slots = [];
let category = "all";
let currentPage = 1;
let generation = 0;
let loading = true;
let loadError = null;

function getFilteredSlots() {
  const query = search.value.trim().toLocaleLowerCase();
  return slots.filter((slot) => {
    const matchesCategory = category === "all" || slot.category === category;
    const searchable = [slot.serviceName, slot.providerName, slot.area, slot.city]
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLocaleLowerCase();
    return matchesCategory && searchable.includes(query);
  });
}

function renderPagination(totalPages) {
  pagination.replaceChildren();
  if (totalPages <= 1) return;

  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "button secondary";
  previous.textContent = "Previous";
  previous.disabled = currentPage === 1;
  previous.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      render();
    }
  });

  const pageLabel = document.createElement("span");
  pageLabel.className = "pagination-label";
  pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;
  pageLabel.setAttribute("aria-live", "polite");

  const next = document.createElement("button");
  next.type = "button";
  next.className = "button secondary";
  next.textContent = "Next";
  next.disabled = currentPage >= totalPages;
  next.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      render();
    }
  });

  pagination.append(previous, pageLabel, next);
}

function render() {
  if (loading) return;
  if (loadError) {
    pagination.replaceChildren();
    notice(status, loadError.message || "Could not load sessions. Please try again.", true);
    return;
  }

  const filtered = getFilteredSlots();
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  currentPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleSlots = filtered.slice(start, start + ITEMS_PER_PAGE);

  results.innerHTML = visibleSlots.map((slot) => card(slot)).join("");
  renderPagination(totalPages);

  if (!filtered.length) {
    notice(status, slots.length
      ? "No sessions match those filters. Try another search or category."
      : "No sessions are available right now. Check back soon.");
  } else {
    const first = start + 1;
    const last = Math.min(start + ITEMS_PER_PAGE, filtered.length);
    notice(status, `Showing ${first}–${last} of ${filtered.length} ${filtered.length === 1 ? "session" : "sessions"}.`);
  }
}

async function load() {
  const current = ++generation;
  loading = true;
  loadError = null;
  currentPage = 1;
  results.replaceChildren();
  pagination.replaceChildren();
  notice(status, "Loading sessions…");
  try {
    const data = await request("/api/slots");
    if (current !== generation) return;
    if (!Array.isArray(data)) throw new Error("The sessions response was not a list.");
    slots = data;
    loading = false;
    render();
  } catch (error) {
    if (current !== generation) return;
    slots = [];
    loading = false;
    loadError = error;
    results.replaceChildren();
    render();
  }
}

search.addEventListener("input", () => {
  currentPage = 1;
  render();
});
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    category = button.dataset.category;
    currentPage = 1;
    categoryButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    render();
  });
});

document.querySelector("#retry").addEventListener("click", load);
load();
