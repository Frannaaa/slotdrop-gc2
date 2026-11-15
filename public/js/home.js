// Group assignment: Cholo. See README.md#team.
import { request, card, notice } from "./customer-common.js";

const results = document.querySelector("#featured"),
  status = document.querySelector("#status"),
  retry = document.querySelector("#retry");
let generation = 0;

async function load() {
  const current = ++generation;
  retry.hidden = true;
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
    if (current === generation) {
      notice(status, error.message, true);
      retry.hidden = false;
    }
  }
}

document.querySelector("#retry").addEventListener("click", load);
load();