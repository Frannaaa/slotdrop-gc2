
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

class Element {
  constructor(id) {
    this.id = id;
    this.value = "1";
    this.disabled = false;
    this.textContent = "";
  }

  addEventListener(type, callback) {
    handlers.set(`${this.id}:${type}`, callback);
  }

  reportValidity() {
    return true;
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

test("Selection keeps session details visible when quote fails and allows retry", async () => {
  handlers.clear();
  elements.clear();

  const source = (await readFile(
    new URL("../public/js/selection.js", import.meta.url),
    "utf8"
  ))
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];?\s*/m, "")
    .replace(/\ntry\s*\{\s*const params = pageParameters[\s\S]*$/, "");

  let quoteCalls = 0;
  let rejectOlder;

  const context = {
    document: {
      querySelector(selector) {
        return getElement(selector.replace("#", ""));
      }
    },
    URLSearchParams,
    location: {
      search: "?slotId=1&quantity=1",
      assign() {}
    },
    request: async (path) => {
      if (path === "/api/slots/1") {
        return {
          serviceName: "Demo Session",
          startsAt: "2026-12-01T10:00:00.000Z"
        };
      }

      if (path.startsWith("/api/pricing/quote?")) {
        quoteCalls += 1;

        if (quoteCalls === 1) {
          throw new Error("Quote temporarily unavailable");
        }

        if (quoteCalls === 5) {
          return new Promise((resolve, reject) => { rejectOlder = reject; });
        }
        return {
          slotId: quoteCalls === 3 ? 999 : 1,
          quantity: 1,
          unitPriceCentavos: 1500,
          totalPriceCentavos: 1500,
          pricingType: "standard"
        };
      }

      throw new Error(`Unexpected request: ${path}`);
    },
    money: value => `₱${value}`,
    date: () => "DATE",
    positive: value => Number(value),
    pageParameters: search => new URLSearchParams(search),
    hasBookingTotal: quote => Number.isInteger(quote?.unitPriceCentavos) && Number.isInteger(quote?.totalPriceCentavos),
    notice(element, message) {
      element.textContent = message;
    }
  };

  const initialRefresh = runInNewContext(
    `${source}\nslotId = 1; quantity.value = "1"; refresh();`,
    context
  );

  await initialRefresh;

  const chosenSession = getElement("chosenSession");
  const status = getElement("status");
  const summary = getElement("summary");
  const next = getElement("continue");

  assert.match(chosenSession.textContent, /Demo Session.*DATE/);
  assert.equal(status.textContent, "Quote temporarily unavailable");
  assert.equal(summary.textContent, "");
  assert.equal(next.disabled, true);

  await handlers.get("retry:click")();

  assert.match(chosenSession.textContent, /Demo Session.*DATE/);
  assert.equal(status.textContent, "");
  assert.equal(summary.textContent, "1 x ₱1500 = ₱1500");
  assert.equal(next.disabled, false);
  assert.equal(quoteCalls, 2);

  // An apparently valid amount for the wrong session must not allow Checkout.
  await handlers.get("retry:click")();
  assert.match(status.textContent, /Could not verify the booking price/);
  assert.equal(next.disabled, true);
  assert.equal(summary.textContent, "");

  // A fresh valid quote restores the flow.
  await handlers.get("retry:click")();
  assert.equal(next.disabled, false);
  assert.equal(status.textContent, "");

  // An earlier failed request must never disable a newer successful quote.
  const older = handlers.get("retry:click")(); // quote #5 remains pending
  const newer = handlers.get("retry:click")(); // quote #6 succeeds
  await newer;
  assert.equal(next.disabled, false);
  rejectOlder(new Error("Stale quote failure"));
  await older;
  assert.equal(next.disabled, false);
  assert.equal(status.textContent, "");
  assert.equal(quoteCalls, 6);
});
