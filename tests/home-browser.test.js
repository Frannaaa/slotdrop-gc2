import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { card, notice } from "../public/js/customer-common.js";

class Element {
  constructor(id) {
    this.id = id;
    this.disabled = false;
    this.hidden = false;
    this.textContent = "";
    this.innerHTML = "";
    this.className = "";
    this.attributes = new Map();
    this.children = [];
  }

  addEventListener(type, callback) {
    handlers.set(`${this.id}:${type}`, callback);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  replaceChildren(...nodes) {
    this.children = nodes;
    this.innerHTML = "";
  }
}

const handlers = new Map();
const elements = new Map();

function getElement(id) {
  if (!elements.has(id)) {
    elements.set(id, new Element(id));
  }
  return elements.get(id);
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function makeSlot(overrides = {}) {
  return {
    id: 101,
    serviceId: 1,
    providerId: 10,
    serviceName: "Wheel Throwing Basics",
    providerName: "Laro Ceramics",
    area: "Makati",
    city: "Metro Manila",
    startsAt: "2026-12-05T10:00:00.000Z",
    bookingClosesAt: "2026-12-05T08:00:00.000Z",
    durationMinutes: 120,
    remainingSeats: 3,
    originalPriceCentavos: 180000,
    buddyPriceCentavos: 160000,
    serviceActive: true,
    status: "open",
    runsAsScheduled: true,
    studioReference: null,
    ...overrides,
  };
}

async function createHomeHarness(requestImpl) {
  handlers.clear();
  elements.clear();

  const source = (
    await readFile(new URL("../public/js/home.js", import.meta.url), "utf8")
  ).replace(/^import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];\s*/m, "");

  const doc = {
    visibilityState: "visible",
    querySelector(selector) {
      return getElement(selector.replace("#", ""));
    },
    addEventListener(type, callback) {
      handlers.set(`document:${type}`, callback);
    },
  };

  const win = {
    addEventListener(type, callback) {
      handlers.set(`window:${type}`, callback);
    },
  };

  const context = {
    document: doc,
    window: win,
    request: requestImpl,
    card,
    notice,
  };

  runInNewContext(source, context);
  await flush();

  return { doc, win };
}

test("Home renders distinct grouped workshops without duplicating or padding", async () => {
  const requestedUrls = [];
  await createHomeHarness(async (path) => {
    requestedUrls.push(path);
    return {
      workshops: [
        {
          serviceId: 1,
          sessions: [
            makeSlot({ id: 101, serviceId: 1, serviceName: "Wheel Throwing", startsAt: "2026-12-05T10:00:00.000Z", remainingSeats: 2 }),
            makeSlot({ id: 102, serviceId: 1, serviceName: "Wheel Throwing", startsAt: "2026-12-06T10:00:00.000Z", remainingSeats: 4 }),
          ],
        },
        {
          serviceId: 2,
          sessions: [
            makeSlot({ id: 201, serviceId: 2, serviceName: "Tufting Studio", startsAt: "2026-12-05T14:00:00.000Z", remainingSeats: 1 }),
          ],
        },
      ],
      hasNextPage: false,
    };
  });

  assert.deepEqual(requestedUrls, ["/api/slots?view=workshops&page=1&limit=3"]);

  const featured = getElement("featured");
  const status = getElement("status");
  const emptyState = getElement("empty-state");
  const retry = getElement("retry");

  const cards = featured.innerHTML.match(/<article class="activity-card card">/g) || [];
  assert.equal(cards.length, 2, "Two available workshops should not be padded to three");
  assert.match(featured.innerHTML, /\/detail\.html\?slotId=101&quantity=1/);
  assert.match(featured.innerHTML, /\/detail\.html\?slotId=201&quantity=1/);
  assert.match(featured.innerHTML, /2 seats left/);
  assert.match(featured.innerHTML, /1 seat left/);
  assert.equal(status.textContent, "");
  assert.equal(emptyState.hidden, true);
  assert.equal(retry.hidden, true);
});

test("Home caps output at three distinct workshops even if extra groups are returned", async () => {
  await createHomeHarness(async () => ({
    workshops: [
      { serviceId: 1, sessions: [makeSlot({ id: 11, serviceId: 1, serviceName: "Workshop One" })] },
      { serviceId: 2, sessions: [makeSlot({ id: 22, serviceId: 2, serviceName: "Workshop Two" })] },
      { serviceId: 3, sessions: [makeSlot({ id: 33, serviceId: 3, serviceName: "Workshop Three" })] },
      { serviceId: 4, sessions: [makeSlot({ id: 44, serviceId: 4, serviceName: "Workshop Four" })] },
    ],
    hasNextPage: true,
  }));

  const featured = getElement("featured");
  const cards = featured.innerHTML.match(/<article class="activity-card card">/g) || [];
  assert.equal(cards.length, 3);
  assert.doesNotMatch(featured.innerHTML, /Workshop Four/);
});

test("Home refreshes on visible tab and pageshow BFCache restore after holds, bookings, and expiry", async () => {
  let call = 0;
  const { doc } = await createHomeHarness(async () => {
    call += 1;
    if (call === 1) {
      return {
        workshops: [
          {
            serviceId: 1,
            sessions: [
              makeSlot({ id: 101, serviceId: 1, startsAt: "2026-12-05T10:00:00.000Z", remainingSeats: 1 }),
              makeSlot({ id: 102, serviceId: 1, startsAt: "2026-12-06T10:00:00.000Z", remainingSeats: 3 }),
            ],
          },
        ],
        hasNextPage: false,
      };
    }
    if (call === 2) {
      return {
        workshops: [
          {
            serviceId: 1,
            sessions: [
              makeSlot({ id: 102, serviceId: 1, startsAt: "2026-12-06T10:00:00.000Z", remainingSeats: 3 }),
            ],
          },
        ],
        hasNextPage: false,
      };
    }
    return {
      workshops: [
        {
          serviceId: 1,
          sessions: [
            makeSlot({ id: 101, serviceId: 1, startsAt: "2026-12-05T10:00:00.000Z", remainingSeats: 1 }),
            makeSlot({ id: 102, serviceId: 1, startsAt: "2026-12-06T10:00:00.000Z", remainingSeats: 3 }),
          ],
        },
      ],
      hasNextPage: false,
    };
  });

  const featured = getElement("featured");
  assert.match(featured.innerHTML, /slotId=101/);
  assert.match(featured.innerHTML, /slotId=102/);

  doc.visibilityState = "hidden";
  handlers.get("document:visibilitychange")();
  await flush();
  assert.equal(call, 1);

  doc.visibilityState = "visible";
  handlers.get("document:visibilitychange")();
  await flush();
  assert.equal(call, 2);
  assert.doesNotMatch(featured.innerHTML, /slotId=101/);
  assert.match(featured.innerHTML, /slotId=102/);

  handlers.get("window:pageshow")({ persisted: false });
  await flush();
  assert.equal(call, 2);

  handlers.get("window:pageshow")({ persisted: true });
  await flush();
  assert.equal(call, 3);
  assert.match(featured.innerHTML, /slotId=101/);
});

test("Home handles empty, malformed, failed, and retried requests distinctly", async () => {
  let attempt = 0;
  await createHomeHarness(async () => {
    attempt += 1;
    if (attempt === 1) {
      return { workshops: [], hasNextPage: false };
    }
    if (attempt === 2) {
      return { invalidShape: true };
    }
    if (attempt === 3) {
      throw new Error("Network connection lost");
    }
    return {
      workshops: [
        { serviceId: 5, sessions: [makeSlot({ id: 505, serviceId: 5, serviceName: "Recovered Pottery" })] },
      ],
      hasNextPage: false,
    };
  });

  const status = getElement("status");
  const emptyState = getElement("empty-state");
  const retry = getElement("retry");
  const featured = getElement("featured");

  assert.equal(status.textContent, "No upcoming workshops are available right now.");
  assert.equal(status.getAttribute("role"), "status");
  assert.equal(emptyState.hidden, false);
  assert.equal(retry.hidden, true);

  await handlers.get("retry:click")();
  assert.equal(status.textContent, "The featured workshops response was invalid.");
  assert.equal(status.getAttribute("role"), "alert");
  assert.equal(emptyState.hidden, true);
  assert.equal(retry.hidden, false);

  await handlers.get("retry:click")();
  assert.equal(status.textContent, "Network connection lost");
  assert.equal(status.getAttribute("role"), "alert");
  assert.equal(emptyState.hidden, true);
  assert.equal(retry.hidden, false);

  await handlers.get("retry:click")();
  assert.equal(status.textContent, "");
  assert.equal(emptyState.hidden, true);
  assert.equal(retry.hidden, true);
  assert.match(featured.innerHTML, /Recovered Pottery/);
});

test("Home ignores late older responses so stale availability cannot overwrite newer results", async () => {
  let resolveStale;
  let call = 0;

  await createHomeHarness(async () => {
    call += 1;
    if (call === 1) {
      return new Promise((resolve) => {
        resolveStale = resolve;
      });
    }
    return {
      workshops: [
        { serviceId: 9, sessions: [makeSlot({ id: 909, serviceId: 9, serviceName: "Fresh Workshop" })] },
      ],
      hasNextPage: false,
    };
  });

  const status = getElement("status");
  const featured = getElement("featured");
  assert.equal(status.textContent, "Loading workshops…");

  const newerLoad = handlers.get("retry:click")();
  await newerLoad;
  assert.match(featured.innerHTML, /Fresh Workshop/);

  resolveStale({
    workshops: [
      { serviceId: 1, sessions: [makeSlot({ id: 101, serviceId: 1, serviceName: "Stale Workshop" })] },
    ],
    hasNextPage: false,
  });
  await flush();

  assert.match(featured.innerHTML, /Fresh Workshop/);
  assert.doesNotMatch(featured.innerHTML, /Stale Workshop/);
});

test("Home HTML retains Browse and practice booking navigation links", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /href="\/browse\.html"/);
  assert.match(html, /href="\/browse\.html#practice-sessions"/);
});
