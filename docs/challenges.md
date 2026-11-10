# SlotDrop | Challenges and test evidence

This record separates repeatable test results from the evidence required on the final deployed group application. Actual request/response captures and group-authored explanations are retained with dates, while earlier integration notes are kept in [historical handoffs](ownership-and-execution.md).

**Verified evidence (November 8):** [PR #37's automated CI run 42455580176](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42455580176) passed **104/104 source tests**. Separately, [deployed Challenge 1 run 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) verified **16/16 assertions** against the official public Render API; the linked screenshots below show its GitHub Actions summary. These are **not Postman-app screenshots**. Real browser Challenge 2 Network/hand-drawn evidence, group-authored Challenge 3/4 interpretation and all independent Challenge 5 recordings remain to be completed.


## Challenge 1–4 evidence at a glance

| Challenge | Evidence in this document | Remaining submission check |
| --- | --- | --- |
| 1. API validation | Six Postman Desktop case screenshots, setup captures and a separate deployed Newman run. | Confirm the evidence points to the deployment being submitted. Rerun against that URL if it changed. |
| 2. Trace a booking | Source trace from Checkout through the database to Confirmation. | Capture the actual save and receipt readback in DevTools Network on the final deployment. Match the booking reference to Owner and attach the group's hand-drawn trace. |
| 3. Overrule the AI | Three cases connect the original assistance to the check that revealed the problem and the fix that followed. | Have the contributors verify the attribution and check that it agrees with the PRs and `AI-USAGE.md`. |
| 4. Change a rule | The commission setting, worked 10% vs. 12% example, and automated checks for quote, receipt and Owner behavior. | The 10% and 12% local runs passed. Link final-commit CI when available. The production change remains hypothetical. |

## Earlier Owner/API checks (October 27–28)

These results cover Fran's owner build. They do not complete the deployed customer-booking challenges.

| Check | Result | Record |
|---|---|---|
| Node 22 + PostgreSQL 16 | 20 tests passed; no failures or skips | [CI, commit 35ebe839](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/40556533287) |
| Local syntax and tests | Passed; 19 tests passed, one PostgreSQL-only test skipped | Local PGlite run, October 28 |
| SQL constraints and seed | Eight scenario groups passed | tools/check-sql.mjs |
| Production container | Build, database initialization and restart persistence passed | Same CI run |
| Postman, October 27 | 21 requests and 26 assertions passed | [Recorded local run](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-owner-workspace/docs/evidence/fran-api-local.json) |
| Postman, October 28 | 21 requests and 27 assertions passed; serviceId override used activity 4 and its 30-minute cutoff | [Repository review record](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-owner-workspace/docs/evidence/repository-review-2026-10-28.json) |
| Owner browser checks | Phone/desktop layout, save, pause, unchanged form and outage recovery passed | Disposable fictional database, October 28 |

The restart test creates a session through the API and inserts a fictional receipt fixture directly. Both survive the Node-container restart; owner seats and metrics still match. It does not test the unimplemented customer booking endpoint.

The [Postman collection](SlotDrop-Fran.postman_collection.json) covers the implemented APIs. The recorded October 27 result belongs to that version of the collection.

## 1. Break the deployed booking API

**Deployed result: all six cases answered as expected.** The [Challenge 1 collection](SlotDrop-GC2-Challenge1.postman_collection.json) ran with Newman 6.2.1 from GitHub Actions against the official deployment, `https://slotdrop-gc2-group-zx8j.onrender.com` (Render service `slotdrop-gc2-group-zx8j`, deployed commit `96d4a31`), on 2026-11-08 at 07:45 UTC. [Run 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) shows every request body, status and response in its job summary; 16/16 assertions passed.

Requests 00a and 00b are read-only setup. 00a picked session 1 (Laro Ceramics, Mug-making + painting, 4 of 4 seats left) and 00b fetched the server's two-seat buddy quote, ₱5,130.00 (`513000` centavos). None of the requests creates a booking: `GET /api/metrics` showed `bookingCount: 0` and `GET /api/bookings` returned `[]` in the same run.

| # | Request sent to the deployed API | Expected | Actual status and response | Time | GitHub Actions capture | Postman Desktop |
|---|---|---|---|---:|---|---|
| 1 | `POST /api/bookings` with `"quantity": 0` | 400 | **400** `INVALID_INPUT` "quantity is outside the allowed range." | 241 ms | [View capture](evidence/challenge1-deployed/01-zero-quantity.jpg) | [Screenshot](evidence/challenge1-postman/01-zero-quantity.png) |
| 2 | `POST /api/bookings` with an extra `"total": 1` | 400, or saved with the server total | **400** `INVALID_INPUT` "Unsupported field: total" | 254 ms | [View capture](evidence/challenge1-deployed/02-fake-total.jpg) | [Screenshot](evidence/challenge1-postman/02-client-total.png) |
| 3 | `POST /api/bookings` for 5 seats when 4 are left | 409 | **409** `SLOT_UNAVAILABLE` "Only 4 seats are left for this session." | 257 ms | [View capture](evidence/challenge1-deployed/03-more-seats-than-available.jpg) | [Screenshot](evidence/challenge1-postman/03-over-capacity.png) |
| 4 | `POST /api/bookings` with `"slotId": 100016` (no such session) | 404 | **404** `SLOT_NOT_FOUND` "Session not found." | 254 ms | [View capture](evidence/challenge1-deployed/04-unknown-session.jpg) | [Screenshot](evidence/challenge1-postman/04-unknown-session.png) |
| 5 | `POST /api/bookings` without `customerName` | 400 | **400** `INVALID_INPUT` "Provide customerName." | 245 ms | [View capture](evidence/challenge1-deployed/05-missing-customer-name.jpg) | [Screenshot](evidence/challenge1-postman/05-missing-name.png) |
| 6 | `GET /api/slots?q=zzzz-no-match` | 200 and an empty list | **200** `[]` | 246 ms | [View capture](evidence/challenge1-deployed/06-search-no-matches.jpg) | [Screenshot](evidence/challenge1-postman/06-empty-search.png) |

**Postman Desktop evidence (November 10).** The last column shows the six requests and responses from the desktop session. The case screenshots display `{{baseUrl}}`; the [health check](evidence/challenge1-postman/health.png) shows the full Render URL. Also see [inventory](evidence/challenge1-postman/inventory.png), [session setup](evidence/challenge1-postman/00a-session-setup.png), and [quote setup](evidence/challenge1-postman/00b-quote-setup.png). The timings in the table are from the November 8 Newman run.

Screenshots of the November 8 Newman run: [the four read endpoints](evidence/challenge1-deployed/00-endpoints.jpg) and [the setup quote](evidence/challenge1-deployed/00-setup-session-and-quote.jpg). They were captured from the run's GitHub job summary, which shows the request body, status line, response JSON and assertions for each case. Long one-line responses for cases 1 and 3 are cut off at the right edge of the picture; the full text is in the table above and in the run.

Every POST also carried a fresh `requestId`, fictional guest details (`GC2 QA`, `qa@example.com`), `paymentMethod: "mock_card"` and the server's `expectedTotalCentavos`; only the listed field changed.

Case 2: the server rejects any field it does not expect, so a browser cannot even send its own total. A *different* case, a stale `expectedTotalCentavos`, returns `409 PRICE_CHANGED` with a fresh quote; that is the "ask again when the price changes" rule, not this test.

**First-attempt failure, found and fixed.** The [first deployed run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436) passed all six cases but failed 1 of 15 assertions: the setup request fetched its quote from `localhost`, the collection's default URL, instead of the deployment, because it read `baseUrl` from the collection variables rather than the value supplied for the run. The six cases still answered correctly because their failure conditions do not depend on the total, but they sent a stale `expectedTotalCentavos` of `304000`. The earlier local run had missed this because both URLs were `localhost:3000`. The fix split the setup into two visible requests (00a session, 00b quote) and added a test that the collection contains no hidden `pm.sendRequest` calls; it was rechecked locally on a different port before the passing deployed rerun.

**How this was run.** The laptop used for this work could not open the Render URL (its connection stalled during the TLS handshake, and Render's logs showed no incoming requests), while GitHub's network reached it normally. [.github/workflows/deployed-challenge1.yml](../.github/workflows/deployed-challenge1.yml) therefore wakes the service, records the four read endpoints and runs the collection. The run's `challenge1-deployed-evidence` artifact holds the full Newman JSON. To rerun it in the Postman app, import the collection, set `baseUrl` to the URL above and run the folder in order.

## 2. Trace one real booking request

**Observed local transaction.** The November 8 local run recorded a booking POST returning **201**, followed by a **200** receipt readback for `917d1fa9-9a71-4a2f-873e-78c6ea4b8c9e`. The integration checks below also record a two-seat reduction, one Owner entry, and receipt readback after restarting the local server. This gives us a baseline for what to look for in the final browser trace. The live DevTools capture and hand-drawn trace are still pending.

### Source-backed transaction path

**What the code is designed to do:** The public Checkout submits a fictional booking. Express validates it, PostgreSQL locks the selected session row, the server recalculates price and availability, and a saved receipt is returned. Confirmation then makes a **separate GET by booking ID**, rather than displaying unsaved checkout data.

**What has actually been tested:** The booking API, receipt readback, remaining-seat calculation, Owner updates and persistence across a container restart passed in disposable automated PostgreSQL tests. These are **not** a recorded DevTools Network trace of a completed booking from the final public customer UI. At this documentation update, the updated Checkout/Confirmation is still **PR #43**, not deployed on `main`. The group must obtain the real Network capture after approved customer pages merge.

| Hop | Exact code and function | Why it exists |
| --- | --- | --- |
| 1. Customer action | `public/js/checkout.js` (Kaitlyn's PR #43), `form.addEventListener("submit", ...)` near line 94 on head `3c857e3` | Validates form and acknowledged quote; preserves a UUID request key, locks Submit and collects fictional guest/payment details |
| 2. HTTP request | `public/js/checkout.js` `request("/api/bookings", {method:"POST", ...})` near line 138 → `request()` in `public/js/customer-common.js` | Sends JSON to the Group 1 Express API, not directly to PostgreSQL |
| 3. Express routing | `server/app.js` applies `bookingRateLimiter` and `bookingRouter`; `server/routes/bookings.js:7–9` | Validates the HTTP method and passes the JSON body to `createBooking()` |
| 4. Input validation | `bookingRequest()` in `server/services/bookings.js:39` and `server/lib/validation.js` | Restricts allowed fields; rejects invalid quantities, missing required data and an extra browser-supplied `total` with 400 |
| 5. Atomic database write | `createBooking()` in `server/services/bookings.js:91–131` | Checks for replay of `requestId`, executes `SELECT id FROM slots WHERE id=$1 FOR UPDATE` (line 99), rechecks capacity/cutoff, computes the accepted tier/fee with `priceQuote()` (line 109), compares price acknowledgement, inserts one saved booking (line 114), and commits |
| 6. POST result | `server/routes/bookings.js:8–9` and `receiptResponse()` | Returns 201 for a newly saved receipt or 200 for the same valid request ID replay; error responses do not create another booking |
| 7. Confirmation navigation | `public/js/checkout.js` lines 146–154 on PR #43 | Keeps the form disabled after success and navigates to `/confirmation.html?id=<saved-id>` |
| 8. Receipt GET and render | `public/js/confirmation.js:6–23` on PR #43 → `GET /api/bookings/:id` → `server/routes/bookings.js:11` → `findReceipt()` in `server/services/bookings.js:134` | Loads the **persisted** receipt with the booking reference, session, quantity and money snapshot; refresh should retrieve the same booking |
| 9. Independent Owner check | `GET /api/bookings` + `GET /api/metrics`; `public/js/owner.js` `load()` | Owner reads confirmed persisted bookings, five metrics and the resulting available seats independently of the customer's page |

**Why the ordering matters:** Displaying a quote does not reserve a seat. Booking requires locking the session row and rechecking inventory and the agreed total *inside* the same database transaction; otherwise two simultaneous customers could both be told the last seat is available. The booking ID and price snapshots persist in PostgreSQL, so a Confirmation refresh can read saved results even if an offer is edited later. The public receipt omits private contact details and the request key.

**My explanation of the design:** I separate a displayed price estimate from the actual act of booking. The browser can request a quote, but it cannot decide whether a seat still exists or send its own authoritative price. On submission, the backend validates the payload, locks the selected session and recomputes both availability and price before writing a row. This is important because two customers could see the same last seat before either checks out. The lock means their writes are handled in sequence, and the later request must recheck remaining inventory before saving. An identical network retry uses the same `requestId`, so a successful but delayed response does not become a second booking. Only after the server commits do we have a real booking ID. I treat the new `201` response, the later `GET` receipt, and the independent Owner records as different checks of the same saved transaction, rather than treating a confirmation message as proof. All payments and guest details used for our class are simulated.

### Required live Network proof — not yet claimed

After #43 and Browse/CSS are reviewed, merged and deployed, use **fictional** guest details and record all of the following on the actual public Group 1 host:

1. DevTools → Network → **Preserve log**; complete Home → Browse → Detail → Selection → Checkout. Capture the request method `POST`, full `/api/bookings` URL, JSON body (redact any contact), **201** response status and actual response booking ID. Record the deployment URL, tested SHA, date/time and fictional session ID.
2. Confirm the subsequent `GET /api/bookings/<actual-ID>` **200**, its stored response, and Confirmation's rendered ID, quantity, price and simulated payment choice. Refresh Confirmation and verify the same saved receipt.
3. Check Owner `GET /api/bookings`, `GET /api/metrics` and `GET /api/slots/<slot-id>` after booking: same ID, booking count +1 and remaining seats reduced by the booked **quantity**. Verify again after a service restart/redeploy without resetting Neon.
4. The group draws **by hand** the button → browser request → route → validation/service → SQL lock/INSERT/commit → JSON response → Confirmation GET → UI sequence; photograph it and link the image here. A text/Mermaid source diagram elsewhere in the repository does not substitute for the required hand drawing.

**Evidence status:** Source trace prepared; public browser Network captures, a real booking/Owner screenshot, tested release SHA and the group's hand-drawn image are **pending**.

## 3. Overrule the AI: three documented implementation decisions

We used AI to help implement and review SlotDrop, but I did not assume that generated code was automatically ready for production. These are three decisions where I compared the original AI-assisted implementation against the actual system behavior, identified what was insufficient, and changed the approach. The original source, regression and correction are linked for each case. The first is a deployment-test error; the other two concern application correctness.

### A. Claude-assisted Postman setup sent a quote request to localhost

**What AI gave us.** The Claude-co-authored collection combined session selection and a hidden pricing request inside a Postman test script:

```js
pm.sendRequest(
  pm.collectionVariables.get("baseUrl") +
    "/api/pricing/quote?slotId=" + slot.id + "&quantity=2",
  (error, response) => { /* store expectedTotalCentavos */ }
);
```

This appears in the [original AI-co-authored implementation, commit 5bb731a](https://github.com/Frannaaa/slotdrop-gc2/commit/5bb731a3979dbd91bc799639d9ca747a82f51de9), whose message includes `Co-Authored-By: Claude Opus 5.5`. It looked convenient because one setup request populated all six cases, but it read the collection's default `baseUrl` (`http://localhost:3000`) instead of the deployed run's environment URL.

**How I checked it.** In the [first official deployed Newman run 42459905436](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436), the six negative cases returned their expected statuses but the setup failed one assertion: **14/15 passed**. The total stayed at **304000 centavos** instead of the deployed session quote of **513000 centavos**. Local testing had not exposed the bug because the default host was also localhost.

**What I changed and why.** We split setup into two normal, visible requests, `00a GET /api/slots?people=2` and `00b GET /api/pricing/quote?slotId=…&quantity=2`, each using the same active `{{baseUrl}}` as the rest of the collection. We also checked the collection for hidden `pm.sendRequest` calls and tested on a different local port. The [correction commit 60b0bb2](https://github.com/Frannaaa/slotdrop-gc2/commit/60b0bb29876ae45d0b30b45e525364d0798c6446) shows the before/after, and [deployed rerun 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) passed **16/16 assertions**. My takeaway is that test success does not prove we tested the intended environment unless every request is clearly pointed at the same host.

### B. ChatGPT's early health-check scaffold was not enough for production

**What AI gave us.** In my **October 27, 2026 ChatGPT discussion**, the assistant proposed this minimal Express health route as part of the starter backend:

```js
app.get('/api/health', (req, res) =>
  res.status(200).json({ status: 'ok' })
);
```

The assistant explicitly warned that this HTTP-only check **did not yet prove the database worked**. A later starter implementation returned `{status: 'ok', app: 'SlotDrop'}`, still without checking PostgreSQL. The [historical health.js source at commit 0193e98](https://github.com/Frannaaa/slotdrop-gc2/blob/0193e9810f838030dc126b57ed9466111d39c617/server/routes/health.js) preserves the same design. It was appropriate for checking a CP0 Express scaffold, but not for declaring our persisted booking service ready.

**How I checked it.** The endpoint had no database operation, so a running Node server could return **200 OK** even when booking data was inaccessible. This is a **demonstrated test scenario**, not a claim that a real production outage occurred. In [tests/health.test.js](../tests/health.test.js), the production route is exercised with both an unreachable database and a reachable database missing required tables. Those cases must return **503**, and the outage response must not reveal SQL errors or credentials. [Test commit a9f1168](https://github.com/Frannaaa/slotdrop-gc2/commit/a9f1168e7dcd37f6df4891f8ea005ccd1ca1a771) shows the initial failure-path cases; [PR #45](https://github.com/Frannaaa/slotdrop-gc2/pull/45) includes the subsequent table-readiness fix.

**What I changed and why.** We kept the simple health behavior for local demo mode but made production health query PostgreSQL for the required `slots`, `services` and `bookings` tables. A failed check now returns `503 {status:'unavailable', app:'SlotDrop'}` without exposing internal error details. The [current production health route](../server/routes/health.js) contains this logic. My reasoning was that the real success condition is the ability to serve bookings, not merely the ability to answer HTTP requests. The original AI answer identified its own limitation; the decision we overruled was treating that initial scaffold as sufficient for deployment.

### C. Codex's original Owner editor sent fields the user had not changed

**What AI gave us.** The [original Owner dashboard implementation, commit 6e06dde](https://github.com/Frannaaa/slotdrop-gc2/commit/6e06dde742fcecd028bf4d41f6fdee57633c3899), explicitly states in its then-existing `AI-USAGE.md` that **Codex implemented the Owner workspace**. That commit's `public/js/owner.js` builds the following full-field payload before every edit:

```js
const body = {
  capacity: Number(field('capacity').value),
  offerPriceCentavos: cents(field('offerPriceCentavos').value),
  buddyPriceCentavos: cents(field('buddyPriceCentavos').value, true),
  bookingClosesAt: new Date($('cutoff').value + '+08:00').toISOString()
};
if (editing) body.status = field('status').value;
await api(editing ? '/api/slots/' + editing : '/api/slots', {
  method: editing ? 'PATCH' : 'POST',
  body: JSON.stringify(body)
});
```

The code was valid syntactically, but the edit request included capacity, status and booking deadline even when the owner only changed the price.

**How I checked it.** In the reproducible [tests/owner-edit.test.js](../tests/owner-edit.test.js) scenario, a newer edit first pauses a session, changes capacity to **8**, and moves the deadline forward **15 minutes**. An older form then changes only the price to **161000 centavos (₱1,610)**. The original all-fields PATCH could overwrite those newer values with the older tab's stale data.

**What I changed and why.** The corrected [`changedOfferFields()` helper](../public/js/owner-policy.js) compares the edit against the original loaded snapshot and submits only changed fields. The [Owner save handler](../public/js/owner.js) uses it before PATCH. The regression verifies the price becomes **₱1,610** while the new pause, capacity **8** and updated deadline remain intact. Our dated **October 28 AI-assistance record** explicitly describes this Owner-edit correction as ChatGPT/Codex-assisted and records the reproduced overwrite and HTTP checks. My reasoning is that an edit should express what the owner meant to change; resending cached values is not a harmless shortcut in a multi-user system. This correction does not solve two people changing the *same* field simultaneously, which would require version checks.

**Evidence summary:** The original Postman code and Claude co-authorship are preserved in commit `5bb731a`; the October 27 ChatGPT starter suggestion is supported by the contemporaneous discussion and original `health.js` implementation; the original Codex Owner code and its assistance credit are both preserved in commit `6e06dde`. Each correction has an actual regression/test outcome or deployed rerun. No error logs, AI quotations or production failures were invented for this report.

## 4. Change an owner rule — commission rate

**Owner's hypothetical instruction:** "Change SlotDrop's commission rate on new bookings from 10% to 12%." **No production rate change was made for this challenge.**

### Which line must change?

| Path and code | Current role | Edit for the rate change? |
| --- | --- | --- |
| `server/config/business.js:1` — `COMMISSION_BASIS_POINTS = 1000` | **Single authoritative setting**. 1,000 basis points = 10%; a hypothetical 12% would be 1,200 | **YES — the only active-rate edit** |
| `server/services/pricing.js:2,22–39` — `priceQuote()` | Imports that setting, computes `Math.round(unitPrice * rate / 10000)` **per seat**, total fee and provider proceeds; quote and save share this function | No |
| `server/services/bookings.js:2,91–120` — `createBooking()` | Imports current setting, obtains the fresh quote after the row lock and saves `commission_basis_points` with each booking | No |
| `server/repositories/owner.js:3,8` — `ownerCatalog()` | Exposes the active rate to the Owner UI | No |
| `public/js/owner.js:79–92` — offer preview | Uses the API-provided rate to preview studio proceeds; does not define the current rate itself | No |
| `db/schema.sql` — stored booking constraint | Validates each stored receipt's snapshot arithmetic; does not dictate the commission percentage for new bookings | No |

**What the server would calculate:** For an example buddy booking of **two seats at ₱2,565 each** (₱5,130 booking total), the current 10% fee is **₱256.50 per seat**, or **₱513 total**, with **₱4,617** in provider proceeds. At a hypothetical 12%, the platform fee would become **₱307.80 per seat**, or **₱615.60 total**, leaving **₱4,514.40** in provider proceeds. The customer's booking total stays ₱5,130 because this scenario changes the platform commission, **not** the displayed session price. This is a calculation from the code's formula, not a measured revenue outcome.

**Why the one-place rule works:** The business *rate* comes from one server constant. Price quotes, accepted booking snapshots and the Owner display consume that constant rather than maintain their own hardcoded 10% values. Already-saved receipts preserve their historical rate and monetary snapshots; changing the active rate should not rewrite existing customer bookings.

**Important distinction:** The *fee rounding formula* is represented in more than one layer: `server/services/pricing.js` makes the authoritative server calculation, `public/js/owner.js` makes an advance **preview**, and `db/schema.sql` enforces a stored-data integrity condition. This is different from having three independently editable *commission rates*. If the owner instead requested a new rounding method, more than one place would require refactoring/testing; it is **not** necessary to change those three for the percentage-only request. Using an authoritative server quote in the Owner preview would remove duplicated browser math, but adds an asynchronous read and error-handling burden.

**One-line change tested locally.** On November 10, `node --test tests/challenge4-rate.test.js` passed at **1,000 basis points** and passed again in a disposable copy after changing only `COMMISSION_BASIS_POINTS` to **1,200**. Both runs exercised the Owner catalog, server quote and saved receipt. Each checked that a later offer-price edit left its existing receipt unchanged. The runs used separate databases, so they do not test reading a 10% receipt after restarting at 12% on the same database. The deployed commission remains unchanged. [Test source](../tests/challenge4-rate.test.js) · [Tested code baseline](https://github.com/Frannaaa/slotdrop-gc2/commit/e994ffddb1ba9635e19091eab30436b80d299489)

**My business reasoning and recommendation:** I chose the commission percentage as the rule to audit because it directly changes what SlotDrop earns per booking and what the studio takes home, without changing the customer-facing ticket price in this example. Moving from 10% to 12% on two ₱2,565 buddy seats adds ₱102.60 to the platform's fee and removes the same amount from the provider payout. That is a financial trade-off, not free incremental revenue: a higher take rate could weaken provider willingness to list sessions, so I would not recommend the increase based on arithmetic alone. Technically, the active percentage already has a single source of truth, so I should change `COMMISSION_BASIS_POINTS` from `1000` to `1200` only in the hypothetical change, then re-run the quote/receipt/Owner tests before any real release. I would preserve old receipts at their stored 10% snapshot, because rewriting agreed historical economics would make financial records unreliable. The rate itself is centralized; the fee formula is deliberately repeated across authoritative server calculation, browser preview and SQL validation. If our next rule change affected *rounding* instead of the *rate*, I would have the Owner preview consume an authoritative server quote rather than maintaining separate business math, while retaining the database constraint as an integrity check. This costs an additional API call and requires a loading/error state, but it reduces the risk of the Owner preview disagreeing with saved bookings.

## 5. Predict, then run

Pending individual work. Each member writes three predictions before running a chosen function, records the actual outputs and explains mismatches. The unedited voice recording must be at most three minutes and made without assistance.

## Stretch challenges — deployed evidence

All measured against https://slotdrop-gc2-group-zx8j.onrender.com (commit `96d4a31`) from GitHub Actions on 2026-11-08 at 08:36–08:38 UTC, [run 42462032799, attempt 3](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42462032799). None of these requests creates a booking; `GET /api/metrics` still showed `bookingCount: 0` afterwards.

### Sequential or parallel — complete

Selection loads the session and the quote with `Promise.all` (`public/js/selection.js:19`). The two requests do not depend on each other: both need only `slotId` and `quantity` from the URL.

| Mode | Median | Fastest | Slowest |
|---|---:|---:|---:|
| Sequential (before) | 398.0 ms | 385.6 ms | 730.8 ms |
| Parallel (after, current code) | 200.2 ms | 194.3 ms | 535.5 ms |

`GET /api/slots/1` and `GET /api/pricing/quote?slotId=1&quantity=2`, 15 alternating trials after 3 warm-ups. Parallel halved the wait, because each request costs roughly one round trip to Singapore and the two now overlap. These times are measured from a GitHub server, not a phone browser. [Screenshot](evidence/stretch-deployed/sequential-vs-parallel.jpg).

### Too many requests — server side complete, front end still open

| Step | Result |
|---|---|
| Refused `POST /api/bookings` (quantity 0) | 25 × **400** |
| Next POST | **429** `RATE_LIMITED`, `Retry-After: 30`, `retryAfterSeconds: 30` |
| Same request after waiting 31 s | **400** again: the limit had reset |

The 429 came on attempt 26, not 31, because the Challenge 1 job in the same run had already sent 5 POSTs that minute: the limit is 30 booking POSTs per minute per client address (`server/middleware/booking-rate-limit.js`). [Screenshot](evidence/stretch-deployed/too-many-requests-429.jpg).

Still open: the brief also asks the front end to wait and retry. `retryLimitedBooking()` exists in `public/js/customer-common.js:87`, but Kaitlyn's Checkout (#43) does not call it yet. Known limitation: on Render every request reaches Node from Render's proxy, so the "per client" key is most likely shared by all visitors.

### Double click — server side shown in tests, browser still open

The server is safe: an identical retry (same `requestId`) returns the first receipt with 200, and the row lock in `createBooking()` lets only one of two simultaneous last-seat bookings succeed (201 and 409, `tests/postgres-locking.test.js`, `tests/bookings.test.js`). Not run on the live site because it would create bookings. Checkout (#43) disables the button while saving; showing a real double click needs the merged Checkout page.

### Pagination — not earned yet

The API side is ready in #49 (`?page=&limit=`, not yet merged). Browse (#62) loads the whole list, and #63 adds a React `pagination.js` at the repository root that no page loads and that does not call `?page=`. Browse needs to request `/api/slots?page=…&limit=…` and show page controls.

### Join and compute — not earned yet

#51 joins `GET /api/owner/catalog` with `GET /api/bookings` to show open-seat utilization on the Owner screen. It needs a review and merge before it is on the live site.

## Further checks

- The owner layout follows the October 28 brand book: paper/ink/blue/lime, local fonts and 48-pixel action buttons. It stayed within the page at 320, 390, 768 and 1280-pixel viewport settings.
- Simulating a database outage disabled saving; Refresh restored data and controls. A later buddy-rate edit preserved the original receipt and metrics.
- The repository review found failing checks on the earlier data/offer branches: syntax scanning assumed public/js existed, and CI tried to run the later owner restart script. Syntax scanning now starts at public/, and Docker/restart steps run only when their files exist.
- GC1 text/page references were checked against the original proposal and feedback on October 28. Provider interviews, public booking challenges, the deployed baseline and group phone test remain open.

## October 28 follow-up fixes

- Detail responses now include serviceActive, so a direct session link can explain an inactive activity. Discovery continues to exclude it.
- Null characters in q and area now return 400 INVALID_INPUT before SQL. Both new HTTP cases failed before the correction.
- Owner sales labels and Resume buttons update every second while the tab is visible and immediately when it becomes visible again. Existing cards, keyboard focus and unsaved deadlines are retained.
- The remaining awkward headings and cutoff hint were shortened. The original GC1 text/page references were checked against the proposal and feedback.

Local checks after these fixes:

| Branch / PR | Tests passed | Skipped | Syntax | SQL groups |
|---|---:|---:|---|---:|
| Setup / #22 | 5 | 0 | Passed | 8 |
| Session data / #27 | 10 | 0 | Passed | 8 |
| Offer controls / #28 | 14 | 1 | Passed | 8 |
| Owner workspace / #29 | 22 | 1 | Passed | 8 |

The skipped case requires real PostgreSQL. These local runs used Node 24.22.1 and PGlite; the new commit's PostgreSQL/container results must come from its CI run. The clock regression exercises the page script with a controlled clock and lightweight DOM fixture; it is not a new full browser walkthrough. Customer booking integration and public deployment remain open.

## Timeout and adversarial checks

Normalized timestamps must stay within UTC years 0001-9999. A date crossing into year 10000 previously returned 500 in the PGlite demo; it now returns 400 before SQL. Boundary and ordinary timezone conversions are covered by tests/http.test.js.

Local checks for this branch: syntax passed, 29 tests passed, 1 PostgreSQL-only tests skipped, and all eight SQL groups passed (Node 24.22.1/PGlite).

Tests also send invalid/oversized edits, including compressed payloads, and verify unchanged inventory and receipts. Six simultaneous duplicate creates produce one new session; conflicting capacity, cancellation and price edits preserve confirmed seats and receipt amounts. Real PostgreSQL execution is left to this commit's CI run.

Workspace requests now abort after 15 seconds, including response-body reads. Refresh and editing recover after failure without clearing drafts. A timed-out save is never automatically retried: it may have completed, so the owner is asked to refresh and check first. Controlled-time tests cover stalled reads/bodies/writes, timer cleanup and recovery. This is not a new full browser walkthrough.

## November 7 integration check

Tested a disposable local build assembled from Fran's #45, Kat's #41 and Kaitlyn's #43. The six available page routes responded successfully. Browse returned 404. Syntax, 95 tests and eight SQL scenario groups passed. One PostgreSQL-only test was skipped in the local PGlite run.

The running app returned a quote for two seats, saved a booking with HTTP 201 and returned the same receipt with HTTP 200 on an identical retry. Availability fell by two seats, Owner listed the booking once, and the saved receipt was readable after restarting the local server.

This run covers HTTP and persistence. Browser interaction, deployed challenge screenshots, the phone test and the Browse baseline are still pending. Checkout still needs to prevent a second submission during navigation to Confirmation.

## November 8 local challenge evidence

These requests ran against the assembled local Express app using the disposable PGlite test fixture. The official deployment, Postman screenshots, browser Network recording and hand-drawn diagram remain pending.

### 1. Six API cases

Import [the Challenge 1 Postman collection](SlotDrop-GC2-Challenge1.postman_collection.json). Set `baseUrl` to the official group URL and run the collection in order. Request 00 reads that deployment's sessions and quote and fills the slot, quantity, unknown-ID and total variables, so nothing needs editing by hand. Then run all six requests and capture the request, status and response in Postman. The collection requests and assertions were verified with the local HTTP harness.

The POST cases used the same valid fictional booking body except for the listed change and a fresh request ID. The fixture's session 1 had four seats. No code change was needed after this run.

| Request | Expected | Actual response |
|---|---:|---|
| POST /api/bookings with quantity 0 | 400 | 400 INVALID_INPUT, quantity outside allowed range |
| POST /api/bookings with an additional total of 1 | 400 or saved server total | 400 INVALID_INPUT, unsupported field total |
| POST /api/bookings for five seats | 409 | 409 SLOT_UNAVAILABLE, four seats left |
| POST /api/bookings with slotId 999 | 404 | 404 SLOT_NOT_FOUND |
| POST /api/bookings without customerName | 400 | 400 INVALID_INPUT, provide customerName |
| GET /api/slots?q=zzzz-no-match | 200 and empty list | 200, [] |

### 2. Booking request and code path

A local HTTP POST to /api/bookings returned 201. The persisted receipt read back with 200 at GET /api/bookings/917d1fa9-9a71-4a2f-873e-78c6ea4b8c9e. This is a local request plus a source trace of the browser path for the eventual deployed walkthrough.

```json
{
  "slotId": 1,
  "quantity": 2,
  "customerName": "GC2 QA",
  "customerEmail": "qa@example.com",
  "paymentMethod": "mock_card",
  "expectedTotalCentavos": 304000,
  "requestId": "2e7012ac-0510-49e6-ba6b-9174d7d8c5f3"
}
```

```json
{
  "id": "917d1fa9-9a71-4a2f-873e-78c6ea4b8c9e",
  "slotId": 1,
  "quantity": 2,
  "paymentMethod": "mock_card",
  "status": "confirmed",
  "serviceName": "Beginner Mug Handbuilding",
  "providerName": "Demo Clay Corner",
  "sessionStartsAt": "2026-11-09T02:00:00.000Z",
  "originalUnitPriceCentavos": 200000,
  "offerUnitPriceCentavos": 160000,
  "unitPriceCentavos": 152000,
  "pricingType": "buddy",
  "commissionBasisPoints": 1000,
  "totalPriceCentavos": 304000,
  "platformFeeCentavos": 30400,
  "providerPayoutCentavos": 273600,
  "createdAt": "2026-11-07T16:17:52.806Z"
}
```

1. public/js/checkout.js:74 handles submit and builds the payload. At line 101 it calls request() in public/js/customer-common.js:46.
2. server/app.js:28 applies bookingRateLimiter and server/app.js:29 mounts bookingRouter. server/routes/bookings.js:7 calls createBooking with the JSON body.
3. server/services/bookings.js:39 validates with bookingRequest. createBooking at line 91 checks the request key, locks the slot with SELECT FOR UPDATE at line 99, and calls priceQuote at line 109 to recompute the price and enforce availability. The INSERT at line 114 saves the receipt snapshot within the transaction.
4. receiptResponse in server/services/bookings.js:56 shapes the saved receipt and the route returns JSON. Checkout navigates with its ID at line 106.
5. public/js/confirmation.js:6 runs load(), GETs the receipt at line 14 via server/routes/bookings.js:11 and findReceipt in server/services/bookings.js:134, then renders the saved quantities and prices at line 17.

### 3. Group review prompts

The existing debugging table gives the group concrete cases to discuss: rounded deadlines, stale edits overwriting newer values and infrastructure failures returning generic errors. For each chosen case, the group should confirm which AI output it actually used, explain the failure or review that exposed it, and describe the decision to replace it. The local tests establish the observed behavior and correction.

### 4. Verified single edit for the commission rate

For a new active commission rate, edit server/config/business.js:1 only. No rate was changed during this check. server/services/pricing.js:22 defaults to that value. server/services/bookings.js:109 and :120 use it to calculate and persist new bookings. server/repositories/owner.js:8 exposes the setting and public/js/owner.js:87 uses the API value for its preview. Existing receipts keep the rate saved at booking time.

### Stretch evidence

- Double click / last seats. An identical retry returned 200 with the same receipt ID. With exactly two seats remaining, two simultaneous two-seat bookings with distinct keys returned 201 and 409. This demonstrates the API race case. The separate Checkout navigation window still needs its UI fix.
- Sequential or parallel. The Owner screen uses Promise.all at public/js/owner.js:400. A local HTTP harness measured two independent requests used there, GET /api/metrics and GET /api/bookings. After warmup, 15 alternating trials per mode gave a 8.37 ms sequential median and a 7.21 ms parallel median. This measures the two requests through response JSON on local loopback, not deployed browser render time.
- Pagination, 429 with frontend wait/retry, and two-route computed value remain open.

Challenge 5 is each member's own prediction, experiment and unedited recording.


## November 8 — independently reproducible Fran-owned checks

[**GitHub Actions run 42428732562**](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42428732562) for PR #37: **86 tests passed, zero failed** on the checked-out branch in CI, including three new specifically named rubric checks. This establishes test behavior in a disposable test environment; **it does not claim Postman screenshots, browser Network captures, a hand-drawn diagram, or completion of the deployed group challenges**.

| Criterion and repeatable code | Observed / proved in isolated CI | Still requires true group evidence |
| --- | --- | --- |
| Challenge 1 — `tests/challenge1-postman.test.js` and exported `docs/SlotDrop-GC2-Challenge1.postman_collection.json` | Actually sent the **six exact exported Postman collection requests** through the Express HTTP test fixture; verified 400, 400, 409, 404, 400, 200/[] plus error bodies; rejected calls left zero saved bookings and four available seats | Import/run the collection **in Postman against the actual public Group 1 deployment**, attach request/status/body screenshots and actual deployed commit/date. These CI requests did not run inside Postman |
| Challenge 2 — source trace and `tools/check-transaction-smoke.mjs` in PR #45 | Local API POST saved a booking and GET read it by ID; source code identifies browser `customer-common.request()` → Express booking route → `createBooking()` → PostgreSQL row lock, SQL insert and receipt → Confirmation's GET | Capture one real **deployed browser** Network request/response and the group's **hand-drawn** front-end→server→DB trace; then compare it to source. Do not label a code-derived diagram as a member's hand drawing |
| Challenge 3 — observed defect candidates from `tests/owner-policy.test.js`, `tests/owner-edit.test.js`, `tests/database-failures.test.js` | Actual regressions cover truncated untouched booking deadlines, stale PATCH overwriting later Owner edits, and DB outage classification as safe 503 rather than exposing 500 internals | Each responsible group member confirms whether AI-assisted output was involved and **personally** writes: original expectation, observed failure, diagnosis, fix and real before/after evidence. Code tests do not establish AI provenance or substitute for the student's reasoning |
| Challenge 4 — `tests/challenge4-rate.test.js` and `server/config/business.js` | Checked **one active source** for `COMMISSION_BASIS_POINTS`; server quote/save and Owner catalog use it; confirmed receipt snapshots are unchanged by later offer price edits. **No commission rate was changed** | Group verifies and explains all read/write sites, hypothetical fee impact and why past receipts do not reprice; include a real cited PR/CI, not a claim that a rule-change migration was performed |

### Actual code path for Challenge 2 (source-derived, not a Network screenshot)

1. Kaitlyn's **unmerged** Checkout `public/js/checkout.js` builds a request with `slotId`, `quantity`, fictional guest details, `expectedTotalCentavos` and stable `requestId`, then calls `request()` in `public/js/customer-common.js`.
2. The group's merged Express `server/app.js` mounts `bookingRouter()`. `server/routes/bookings.js` calls `createBooking()` from `server/services/bookings.js`.
3. `bookingRequest()` rejects unknown or malformed fields. `createBooking()` checks the retry key, locks the session row with `SELECT ... FOR UPDATE`, rechecks eligibility and confirmed seats, and calls shared `priceQuote()` to recompute the amount/fee.
4. The SQL `INSERT INTO bookings ... RETURNING id` persists snapshot price/tier/commission/quantity. The server returns JSON with HTTP **201** for a new booking or **200** for the same accepted retry. There is no five-minute seat hold.
5. Confirmation `public/js/confirmation.js` (also **unmerged** PR #43) reads `GET /api/bookings/:id`, which uses `findReceipt()` to retrieve the saved PostgreSQL row. Owner fetches `GET /api/bookings` and `GET /api/metrics`.

### Optional bonus status — no unearned points claimed

- **Double-click/last-seat:** existing booking locking/idempotent retry tests pass in CI; browser Checkout #43 still has a post-success second-submission window that the page author must fix and demonstrate. Local backend proof ≠ full +1.
- **Pagination:** Fran-owned opt-in bounded `page`/`limit` API + PostgreSQL tests in [PR #49](https://github.com/Frannaaa/slotdrop-gc2/pull/49), passing CI. Kirsten's actual Browse must consume it on the official deployment.
- **HTTP 429 with safe wait/retry:** Fran-owned [PR #56](https://github.com/Frannaaa/slotdrop-gc2/pull/56) now implements a booking-only HTTP 429/Retry-After server middleware and shared same-requestId browser wait/retry helper; [isolated CI run 42429460881](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42429460881) passed **85/85** tests. **Kaitlyn's actual Checkout still does not call that helper**; it needs a valid current-head review, public 429/UI retry/one-receipt screenshots and merge before +1.
- **Join and compute:** Fran-owned [PR #51](https://github.com/Frannaaa/slotdrop-gc2/pull/51) implements Owner released-seat utilization joining catalog and saved bookings, with passing unit tests. Must be validly reviewed/merged and demonstrated publicly.
- **Sequential vs parallel:** [PR #53](https://github.com/Frannaaa/slotdrop-gc2/pull/53) uses real Selection detail/quote GETs. [Local CI run 42394996195](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42394996195) measured median **5.47ms sequential vs 4.59ms parallel** across seven alternating rounds after warm-up, an observed **0.88ms difference**. Public Browser Network trace and group interpretation are missing; no guaranteed speedup is claimed.

**Evidence provenance:** All generated sessions, seat limits, rates, payments and bookings are fictional. No real business partnership, demand or studio consent is implied. The four challenges require group-authored interpretation; maintain original failure/correction chronology without fabricating screenshots or an earlier checkpoint.

### Newman replay and deployed screenshot checklist

Newman 6.2.3 ran the exported collection against the local disposable PGlite fixture at commit `b1cf5c0`. All 6 requests and 12 assertions passed. [The run record](evidence/challenge1-newman-local-2026-11-08.json) contains each actual request body, status, response body and assertion result.

For the submitted Challenge 1 evidence, run the collection again in Postman against the official group URL. Request 00 sets the slot variables from that deployment's inventory. If it reports no session with two seats, create a future simulated offer on the Owner screen first; do not reseed. Record the deployed commit and date. None of the seven requests creates a booking. Capture six screenshots showing the method and URL, request Body (or search Params), HTTP status, and response JSON. Use fictional guest details. Save the screenshots under `docs/evidence/` and link each case from the table above. Keep this local Newman record labelled as local evidence.

### Additional Newman runs

[Local Newman evidence](evidence/owner-and-bonus-newman-local-2026-11-08.json) records three independent runs on disposable PGlite databases. The exported Owner and session collection passed 21 requests and 28 assertions. Pagination on #49 passed 4 requests and 6 assertions, including distinct pages and invalid bounds. The booking limiter on #56 passed 7 requests and 12 assertions. It returned 429 with Retry-After, then accepted the same request after the test clock advanced. Replaying it returned the original receipt and Owner listed one booking. This covers the server API. Browse pagination, Checkout wait/retry and screenshot evidence still need the deployed group flow.
