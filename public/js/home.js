// Group assignment: Cholo. See README.md#team.
import { request, card, notice } from "./customer-common.js";

const results = document.querySelector("#featured");
const status = document.querySelector("#status");
const emptyState = document.querySelector("#empty-state");
const retry = document.querySelector("#retry");
const FEATURED_URL = "/api/slots?view=workshops&page=1&limit=3";

let generation = 0;

function extractFeaturedWorkshops(data) {
  if (!Array.isArray(data?.workshops) || typeof data.hasNextPage !== "boolean") {
    throw new Error("The featured workshops response was invalid.");
  }

  const uniqueWorkshops = [];
  const seenServices = new Set();

  for (const group of data.workshops) {
    if (
      !group ||
      !Array.isArray(group.sessions) ||
      group.sessions.length === 0 ||
      group.sessions.some((slot) => !slot || typeof slot.id !== "number")
    ) {
      throw new Error("The featured workshops response was invalid.");
    }

    const key = group.serviceId ?? group.sessions[0].serviceId;
    if (key != null && seenServices.has(key)) continue;
    if (key != null) seenServices.add(key);

    uniqueWorkshops.push(group);
    if (uniqueWorkshops.length >= 3) break;
  }

  return uniqueWorkshops;
}

async function load() {
  const current = ++generation;
  retry.disabled = true;
  retry.hidden = true;
  if (emptyState) emptyState.hidden = true;
  notice(status, "Loading workshops…");
  results.replaceChildren();

  try {
    const data = await request(FEATURED_URL);
    if (current !== generation) return;

    const workshops = extractFeaturedWorkshops(data);
    results.innerHTML = workshops
      .map(({ sessions }) => card(sessions[0], 1, { sessions }))
      .join("");

    if (!workshops.length) {
      notice(status, "No upcoming workshops are available right now.");
      if (emptyState) emptyState.hidden = false;
    } else {
      notice(status, "");
    }
  } catch (error) {
    if (current !== generation) return;
    results.replaceChildren();
    if (emptyState) emptyState.hidden = true;
    notice(
      status,
      error?.message || "Could not load workshops. Please try again.",
      true,
    );
    retry.hidden = false;
  } finally {
    if (current === generation) retry.disabled = false;
  }
}

retry.addEventListener("click", load);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") load();
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) load();
});

load();