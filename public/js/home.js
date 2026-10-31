// Group assignment: Cholo. See docs/ownership-and-execution.md.
import { request, card, notice } from "./customer-common.js";

const results = document.querySelector("#featured"),
  status = document.querySelector("#status");
let generation = 0;

async function load() {
  const current = ++generation;
  notice(status, "Loading activities…");
  results.replaceChildren();
  try {
    const slots = await request("/api/slots");
    if (current !== generation) return;
    results.innerHTML = slots.slice(0, 3).map(slot => card(slot)).join("");
    notice(
      status,
      slots.length ? "" : "No sessions available right now. Check back soon.",
    );
  } catch (error) {
    if (current === generation) notice(status, error.message, true);
  }
}

document.querySelector("#retry").addEventListener("click", load);
load();