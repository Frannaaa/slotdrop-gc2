// Actual browser + disposable local database. Never touches deployed data.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fixture } from "../tests/helpers.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const f = await fixture();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
});
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const report = {
  checkedAt: new Date().toISOString(), sourceCommit: process.env.GITHUB_SHA || "local working copy",
  environment: "Actual Chromium pages and HTTP routes; disposable PGlite fixture, never deployed data",
  checks: [], pageErrors: errors,
};
const count = async () => Number((await f.db.query("SELECT COUNT(*) AS n FROM bookings")).rows[0].n);
const check = async (name, run) => {
  try { const evidence = await run(); report.checks.push({ name, status: "passed", ...(evidence || {}) }); }
  catch (error) { report.checks.push({ name, status: "failed", error: error.message }); }
};
const url = path => f.base + path;
async function selection() {
  await page.goto(url("/detail.html?slotId=1"));
  await page.locator("#continue").waitFor({ state: "visible" });
  await page.locator("#continue").click();
  await page.waitForFunction(() => !document.querySelector("#continue")?.disabled);
}
async function checkout() {
  await selection();
  await page.locator("#continue").click();
  await page.waitForFunction(() => !document.querySelector("#acceptPrice")?.disabled);
}
async function backToSelection() {
  // BFCache can restore a page without a new load event.
  try { await page.goBack({ waitUntil: "commit", timeout: 4000 }); }
  catch (error) { if (!page.url().includes("/selection.html?")) throw error; }
  assert.ok(page.url().includes("/selection.html?"), "Back should return to Selection");
  await page.waitForFunction(() => !document.querySelector("#continue")?.disabled);
}
try {
  await check("Back midway through the flow", async () => {
    await checkout(); await backToSelection();
    return { path: new URL(page.url()).pathname, bookings: await count() };
  });
  await check("Empty selection and checkout refuse without saving", async () => {
    const before = await count();
    for (const path of ["/selection.html", "/checkout.html"]) {
      await page.goto(url(path));
      await page.waitForFunction(() => {
        const e = document.querySelector("#status");
        return e?.textContent.trim() && !/checking|loading/i.test(e.textContent);
      });
      assert.ok((await page.locator("#status").textContent()).trim());
      const button = path.includes("selection") ? "#continue" : "#submit";
      assert.equal(await page.locator(button).isDisabled(), true);
    }
    assert.equal(await count(), before);
  });
  await check("Manually typed invalid quantities identify Quantity and save nothing", async () => {
    const before = await count();
    await selection();
    const details = await page.locator("#chosenSession").textContent();
    const messages = {};
    for (const value of ["0", "-3", "999999999999999999999", "abc", ""]) {
      await page.locator("#quantity").evaluate((element, text) => {
        element.value = text;
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
      await page.waitForFunction(() => /^Quantity:/.test(document.querySelector("#status").textContent));
      messages[value || "(empty)"] = await page.locator("#status").textContent();
      assert.equal(await page.locator("#chosenSession").textContent(), details);
      assert.equal(await page.locator("#continue").isDisabled(), true);
      assert.equal(await page.locator("#summary").textContent(), "");
    }
    assert.equal(await count(), before);
    return { messages };
  });
  let receiptId;
  let bookingPosts = 0;
  page.on("request", req => {
    if (req.method() === "POST" && new URL(req.url()).pathname === "/api/bookings") bookingPosts++;
  });
  await check("Rapid duplicate Confirm saves exactly one booking", async () => {
    const before = await count();
    const beforeSeats = (await (await fetch(url("/api/slots/1"))).json()).remainingSeats;
    await checkout();
    await page.locator('[name="customerName"]').fill("V2 browser fixture");
    await page.locator('[name="customerEmail"]').fill("v2-browser@example.com");
    await page.locator("#acceptPrice").check();
    await page.locator("#submit").evaluate(button => { button.click(); button.click(); button.click(); });
    await page.waitForURL(/confirmation\.html\?id=/);
    await page.locator("#receipt .reference").waitFor();
    receiptId = new URL(page.url()).searchParams.get("id");
    assert.equal(await count(), before + 1);
    assert.equal(bookingPosts, 1);
    const receipt = await (await fetch(url("/api/bookings/" + receiptId))).json();
    assert.equal(receipt.id, receiptId);
    const afterSlot = await (await fetch(url("/api/slots/1"))).json();
    assert.equal(afterSlot.remainingSeats, beforeSeats - 1);
    return { receiptId, bookingPosts };
  });
  await check("Back after a saved booking returns to usable Selection", async () => {
    await backToSelection();
    assert.doesNotMatch(await page.locator("#status").textContent(), /Saving/);
    return { path: new URL(page.url()).pathname };
  });
  await check("Confirmation refresh reads the saved ID without a new save", async () => {
    assert.ok(receiptId, "Booking must complete first");
    const before = await count();
    await page.goto(url("/confirmation.html?id=" + receiptId));
    await page.locator("#receipt .reference").waitFor();
    await page.reload();
    await page.locator("#receipt .reference").waitFor();
    assert.equal(await page.locator("#receipt .reference").textContent(), receiptId);
    assert.equal(await count(), before); assert.equal(bookingPosts, 1);
    return { receiptId, bookingPosts };
  });
  await check("Direct good and bad Detail links recover correctly", async () => {
    await page.goto(url("/detail.html?slotId=1"));
    await page.locator("#detail h1").waitFor();
    for (const id of ["99999999", "bad", ""]) {
      await page.goto(url("/detail.html?slotId=" + id));
      await page.waitForFunction(() => {
        const t = document.querySelector("#status").textContent;
        return t && !/Loading/.test(t);
      });
      assert.equal(await page.locator("#detail h1").count(), 0);
      assert.equal(await page.locator("#retry").isVisible(), true);
    }
  });
  await check("Unmatched search shows a recoverable empty state", async () => {
    await page.goto(url("/browse.html"));
    await page.locator("#search").fill("zzzz-no-workshop-v2");
    await page.waitForFunction(() => /No upcoming workshops match/.test(document.querySelector("#status").textContent));
    assert.equal(await page.locator("#results").textContent(), "");
  });
  await check("Selection, Checkout and receipt fit 320 and 390 px", async () => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ["/selection.html?slotId=1&quantity=1",
        "/checkout.html?slotId=1&quantity=1", "/confirmation.html?id=" + receiptId]) {
        await page.goto(url(path));
        await page.waitForFunction(() => !/Loading|Checking/.test(document.querySelector("#status")?.textContent || ""));
        const geometry = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth, viewport: innerWidth,
        }));
        assert.ok(geometry.page <= geometry.viewport + 1, JSON.stringify({ path, width, geometry }));
      }
    }
  });
  await check("No uncaught browser JavaScript errors", async () => assert.deepEqual(errors, []));
  const holdResponse = await fetch(url("/api/pricing/quote?slotId=1&quantity=1&holdId=00000000-0000-4000-8000-000000000001"));
  const holdBody = await holdResponse.json();
  report.uspIntegration = { status: "pending", observedStatus: holdResponse.status,
    observedMessage: holdBody.error?.message,
    required: "Kat hold creation/handoff; Kaitlyn visible countdown/expiry; Janelle validated quote and atomic conversion. Tinker passes do not establish the integrated USP." };
} finally {
  await browser.close();
  await f.close();
  await mkdir(new URL("../docs/evidence/", import.meta.url), { recursive: true });
  report.passed = report.checks.filter(x => x.status === "passed").length;
  report.failed = report.checks.filter(x => x.status === "failed").length;
  await writeFile(new URL("../docs/evidence/v2-browser.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.failed ? 1 : 0;
