// Group assignment: Kirsten. See docs/ownership-and-execution.md.
import { request, card, notice } from "./customer-common.js";

const results = document.querySelector("#results");
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const categoryButtons = [...document.querySelectorAll("[data-category]")];

let slots = [];
let category = "all";
let generation = 0;

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = slots.filter((slot) => {
    const matchesCategory = category === "all" || slot.category === category;
    // The discovery API returns serviceName, not title.
    const searchable = [slot.serviceName, slot.providerName, slot.area, slot.city]
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLocaleLowerCase();
    return matchesCategory && searchable.includes(query);
  });

  results.innerHTML = filtered.map((slot) => card(slot)).join("");
  if (!filtered.length) {
    notice(status, slots.length
      ? "No sessions match those filters. Try another search or category."
      : "No sessions are available right now. Check back soon.");
  } else {
    notice(status, `${filtered.length} ${filtered.length === 1 ? "session" : "sessions"} found.`);
  }
}

async function load() {
  const current = ++generation;
  results.replaceChildren();
  notice(status, "Loading sessions…");
  try {
    const data = await request("/api/slots");
    if (current !== generation) return;
    if (!Array.isArray(data)) throw new Error("The sessions response was not a list.");
    slots = data;
    render();
  } catch (error) {
    if (current !== generation) return;
    slots = [];
    results.replaceChildren();
    notice(status, error.message || "Could not load sessions. Please try again.", true);
  }
}

search.addEventListener("input", render);
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    category = button.dataset.category;
    categoryButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    render();
  });
});

document.querySelector("#retry").addEventListener("click", load);
load();
