# SlotDrop | Challenges and Evidence

Evidence for the GC2 challenges (brief section 7). Results from the deployed site are kept apart from local and CI test runs. All sessions, seats, prices, payments and bookings are simulated, and test requests use fictional guest details.

**Deployed site:** https://slotdrop-gc2-group-zx8j.onrender.com (Render service `slotdrop-gc2-group-zx8j`, branch `main`)

## Evidence status

| Challenge | Status | Evidence here | Still needed |
|---|---|---|---|
| [1. Break your own API](#challenge-1--break-your-own-api) | **Complete** on the deployed API | Six Postman Desktop case screenshots, setup captures and a separate deployed Newman run | Rerun if the submission URL changes |
| [2. Trace one real request](#challenge-2--trace-one-real-request) | **Public booking and browser requests captured** | One Checkout POST 201, Confirmation GET 200 and the matching Owner row | Attach the group’s hand-drawn diagram |
| [3. Overrule the AI](#challenge-3--overrule-the-ai) | **Two clear corrections and one readiness example** | Fran’s cases and Janelle’s source cross-check | Confirm that the health scaffold was considered for production, or replace it with a team-verified AI correction |
| [4. The owner changes a rule](#challenge-4--the-owner-changes-a-rule) | **Explanation and local verification recorded** | One setting, the fee calculation, and a 10% to 12% restart check | [Passing main CI at `8bdcfcb`](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43354906742). Update if the final release commit changes. |
| [5. Predict, then run](#challenge-5--predict-then-run) | **Individual** | | Each member's predictions and recording |
| [Stretch challenges](#stretch-challenges) | **See individual evidence below** | Timings, double-click result, Browse pagination and Owner utilization | Deployed Checkout 429 wait/retry remains unverified |

## Challenge 1 — Break your own API

**Result: all six cases answered as expected on the deployed API.**

| | |
|---|---|
| **Collection** | [SlotDrop-GC2-Challenge1.postman_collection.json](SlotDrop-GC2-Challenge1.postman_collection.json) |
| **Target** | The deployed site above, commit `96d4a31` |
| **When** | 8 November 2026, 07:45 UTC |
| **Run** | [GitHub Actions run 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586), Newman 6.2.1, 16 of 16 assertions passed |

### The six requests

| # | Request sent | Expected | Status and response we got | Newman time | Newman screenshot | Postman Desktop |
|---|---|---|---|---:|---|---|
| 1 | `POST /api/bookings` with `"quantity": 0` | 400 | **400** `INVALID_INPUT` "quantity is outside the allowed range." | 241 ms | [case 1](evidence/challenge1-deployed/01-zero-quantity.jpg) | [Case 1](evidence/challenge1-postman/01-zero-quantity.png) |
| 2 | `POST /api/bookings` with an extra `"total": 1` | 400, or saved with the server's total | **400** `INVALID_INPUT` "Unsupported field: total" | 254 ms | [case 2](evidence/challenge1-deployed/02-fake-total.jpg) | [Case 2](evidence/challenge1-postman/02-client-total.png) |
| 3 | `POST /api/bookings` for 5 seats when 4 are left | 409 | **409** `SLOT_UNAVAILABLE` "Only 4 seats are left for this session." | 257 ms | [case 3](evidence/challenge1-deployed/03-more-seats-than-available.jpg) | [Case 3](evidence/challenge1-postman/03-over-capacity.png) |
| 4 | `POST /api/bookings` with `"slotId": 100016` (no such session) | 404 | **404** `SLOT_NOT_FOUND` "Session not found." | 254 ms | [case 4](evidence/challenge1-deployed/04-unknown-session.jpg) | [Case 4](evidence/challenge1-postman/04-unknown-session.png) |
| 5 | `POST /api/bookings` without `customerName` | 400 | **400** `INVALID_INPUT` "Provide customerName." | 245 ms | [case 5](evidence/challenge1-deployed/05-missing-customer-name.jpg) | [Case 5](evidence/challenge1-postman/05-missing-name.png) |
| 6 | `GET /api/slots?q=zzzz-no-match` | 200 with an empty list | **200** `[]` | 246 ms | [case 6](evidence/challenge1-deployed/06-search-no-matches.jpg) | [Case 6](evidence/challenge1-postman/06-empty-search.png) |

More screenshots from the Newman run: [the four read endpoints](evidence/challenge1-deployed/00-endpoints.jpg) and [the setup quote](evidence/challenge1-deployed/00-setup-session-and-quote.jpg).

### How the requests were built

- Two read-only setup requests run first. **00a** picked session 1 (Laro Ceramics, mug-making + painting, 4 of 4 seats left). **00b** fetched the server's price for two seats: ₱5,130.00 (`513000` centavos).
- Each POST sent a new `requestId`, fictional guest details (`GC2 QA`, `qa@example.com`), `paymentMethod: "mock_card"` and the server's `expectedTotalCentavos`. Only the field named in the table was changed.
- No booking was created. In the same run, `GET /api/metrics` showed `bookingCount: 0` and `GET /api/bookings` returned `[]`.

### Note on case 2

The server rejects any field it does not expect, so the browser cannot send its own total at all. A different situation, an out-of-date `expectedTotalCentavos`, returns `409 PRICE_CHANGED` with a fresh quote. That is the "ask again when the price changes" rule, not this test.

### What failed the first time, and what we changed

| | |
|---|---|
| **What happened** | The [first deployed run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436) failed 1 of 15 assertions. The six cases answered correctly, but the setup request fetched its quote from `localhost` instead of the deployed site. |
| **Why** | The setup script read `baseUrl` from the collection's saved variables, not from the value given for the run. So the six cases sent an out-of-date `expectedTotalCentavos` of `304000`. They still passed because none of them depends on the total. |
| **Why we missed it locally** | In the local run, both addresses were `localhost:3000`, so the mistake had no effect. |
| **What we changed** | Split the setup into two visible requests (00a session, 00b quote), and added a test that the collection has no hidden `pm.sendRequest` calls. We rechecked on a different local port, then reran on the deployed site and passed 16 of 16. |

### How this was run

**Postman Desktop, 10 November.** We ran all six cases against the Render URL above. All 12 case assertions passed. The case screenshots show the request and response, with the host represented by `{{baseUrl}}`. The [health check](evidence/challenge1-postman/health.png) shows the full deployed URL. The [session setup](evidence/challenge1-postman/00a-session-setup.png), [quote setup](evidence/challenge1-postman/00b-quote-setup.png) and [inventory capture](evidence/challenge1-postman/inventory.png) show the session and quote used for the run.

**Newman on GitHub Actions, 8 November.** The laptop could not reach Render during that earlier attempt. The [deployed workflow](../.github/workflows/deployed-challenge1.yml) reached the service from GitHub and produced the job-summary screenshots. The complete responses are in the workflow's `challenge1-deployed-evidence` artifact.

To repeat the Desktop run, import the collection, set `baseUrl` to the submitted deployment URL, and run the folder in order.

## Challenge 2 — Trace one real request

**Public browser run, 14 November at 6:07 PM PHT.** Chromium at 390 × 844 followed Home → Browse → Detail → Selection → Checkout → Confirmation, then opened Owner. One Checkout double-click sent **one booking POST**, saved one fictional standard seat for **₱2,700**, and produced reference `7d4843e1-a85a-4b6c-bc4e-f0ef4017909d`. Confirmation and exactly one Owner row show that reference. The browser reported no Console errors during this run.

| Browser step | Method and URL | Request | Result |
|---|---|---|---|
| Checkout | `POST /api/bookings` | Slot 34, quantity 1, fictional contact fields, simulated on-site payment, accepted total `270000` centavos and a generated request ID | **201** with the saved receipt. Fee ₱270. |
| Confirmation | `GET /api/bookings/7d4843e1-a85a-4b6c-bc4e-f0ef4017909d` | Booking ID in the URL | **200**, with the same receipt JSON as the POST |
| Owner | `GET /api/bookings`, `GET /api/owner/catalog`, `GET /api/metrics` | Read-only | One matching row. The browser also requested both source routes for utilization. |

[Browser Network capture with full URLs, request body and both responses](evidence/challenge2-final/browser-network.json) · [Confirmation](evidence/challenge2-final/confirmation.jpg) · [Owner row](evidence/challenge2-final/owner.jpg)

The browser hook forwarded the actual Checkout POST to Render and recorded the response before returning it to Checkout, so navigation could not discard the response body. The Confirmation GET was observed during normal browser navigation. [Render deployment record](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbr7meojo6nc73eq1920) identifies `8bdcfcb` as the deployed build. This run used automatic phone-width emulation.

**Earlier live booking, 12 November at 21:41 PHT.** One double-click on Checkout using fictional details produced a saved one-seat booking for ₱2,700. The reference `84bba718-430e-4dca-9676-9764a36bf018` appears in [Confirmation](evidence/challenge2/confirmation.jpg) and in one [Owner booking row](evidence/challenge2/owner-booking.jpg). A separate read-only `GET /api/bookings/:id` returned HTTP 200 and the same saved receipt. [HTTP receipt record](evidence/challenge2/receipt-get.json). The Checkout POST request/response and Confirmation GET were not recorded in a browser Network panel during this run.

### Every hop, by file and function

Line numbers below refer to the traced [deployment commit `8bdcfcb`](https://github.com/Frannaaa/slotdrop-gc2/tree/8bdcfcbd3e24b58e70bdac48effb017146112fcb).

| Hop | File and function | What happens |
|---|---|---|
| **Button handler** | `public/js/checkout.js:95`, the form's `submit` listener | Stops if the form is busy, already navigating, not accepted, or invalid. Builds `{requestId, slotId, quantity, customerName, customerEmail, paymentMethod, expectedTotalCentavos}` with a new `crypto.randomUUID()` (line 110) and disables the button. |
| **Request** | `checkout.js:139` → `retryLimitedBooking()` in `public/js/customer-common.js:87` → `request()` at line 46 | `fetch` with JSON headers and a 15-second timeout. A 429 is retried once with the same body. Any other failure becomes an error carrying the API's `code`. |
| **Route** | `server/app.js:28` `bookingRateLimiter`, then `server/app.js:29` `bookingRouter`; `server/routes/bookings.js:7` | The limiter allows 30 booking POSTs a minute. The route calls `createBooking(db, req.body, clock)`. |
| **Validation** | `bookingRequest()` in `server/services/bookings.js:39` | Rejects unknown fields such as `total`, and checks each field's type and range. Failure → 400 `INVALID_INPUT`. |
| **Database statements** | `createBooking()` in `server/services/bookings.js:91`, one transaction | 1. Looks up the `requestId`; a retry gets the saved receipt back. 2. `SELECT id FROM slots WHERE id=$1 FOR UPDATE` (line 99) locks the session. 3. Reads the session again (line 104). 4. `checkBookable()` (`server/services/pricing.js:8`, called at line 107) refuses a closed or full session with 409. 5. `priceQuote()` (`pricing.js:22`, called at line 109) recomputes the price, tier and commission. 6. Compares with `expectedTotalCentavos`; a difference → 409 `PRICE_CHANGED` (line 111). 7. `INSERT INTO bookings …` (line 114). 8. Reads the receipt back (line 121) and commits. |
| **Response** | `server/routes/bookings.js:9`, shaped by `receiptResponse()` (`bookings.js:56`) | 201 with the saved receipt, or 200 for an identical retry. |
| **What renders** | `checkout.js:153` sets `navigating`, which keeps Submit disabled, and line 159 goes to `/confirmation.html?id=…`. `load()` in `public/js/confirmation.js:6` calls `GET /api/bookings/:id` (line 14) → `server/routes/bookings.js:11` → `findReceipt()` (`bookings.js:134`) | Confirmation (line 17) shows the booking reference, seats, price per person, saved total and payment choice, read back from PostgreSQL. |

An independent check follows the trip: `load()` in `public/js/owner.js` reads `GET /api/bookings` and `GET /api/metrics`, so the Owner screen shows the saved booking and the five numbers without relying on the customer's page.

Seats are not stored as a counter. Seats left = released seats − confirmed bookings, so saving the booking row is what makes the seats unavailable.

### Why the request is built this way

**Why the order matters.** Showing a quote does not reserve a seat. Booking locks the session row and rechecks the seats and the agreed total inside the same database transaction. Otherwise two customers could both be told the last seat is free. The booking ID and the saved prices stay in PostgreSQL, so refreshing Confirmation reads the saved result even if the offer is edited later. The public receipt leaves out private contact details and the request key.

### Hand-drawn trace

Attach a photo of the group’s hand-drawn request path for booking `7d4843e1-a85a-4b6c-bc4e-f0ef4017909d`. Use the actual hops above, from Checkout’s submit handler through the row lock and saved receipt to the Confirmation fetch and render. [System architecture](system.md) is the separate repository diagram.

## Challenge 3 — Overrule the AI

These three cases came from Fran’s implementation work. Janelle cross-checked the Challenge 3 and 4 file references and commission calculations against the code on November 11. Each case links the original work, the check that exposed a problem or limitation, and the correction. The Checkout walkthrough also reproduced a preselected price agreement and a disabled quote refresh. Those changes first appeared alongside Kaitlyn’s Gemini disclosure in [commit cabe9fa](https://github.com/Frannaaa/slotdrop-gc2/commit/cabe9faa449e228c1b005393ea1468f8bc3b676d). The commit only establishes that the code and disclosure were submitted together. Kaitlyn can confirm whether this is a stronger third case and what assistance was involved.

| | What the AI gave us | How we noticed | What we did instead |
|---|---|---|---|
| **A** | Claude: a Postman setup script with a hidden `pm.sendRequest` | The first deployed run failed 1 of 15 assertions | Two visible setup requests; the rerun passed 16 of 16 |
| **B** | ChatGPT: a health route that answers "ok" without touching the database | The route had no database call, so tests with an unreachable database and with missing tables had to return 503 | Production health checks the three tables it needs, and answers 503 without them |
| **C** | Codex: an Owner edit that sent every field, changed or not | A test in which an older form overwrote a newer pause, seat count and deadline | Send only the fields that were edited |

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

**How we verified it.** In the [first official deployed Newman run 42459905436](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436), the six negative cases returned their expected statuses but the setup failed one assertion: **14/15 passed**. The total stayed at **304000 centavos** instead of the deployed session quote of **513000 centavos**. Local testing had not exposed the bug because the default host was also localhost.

**What changed and why.** We split setup into two normal, visible requests, `00a GET /api/slots?people=2` and `00b GET /api/pricing/quote?slotId=…&quantity=2`, each using the same active `{{baseUrl}}` as the rest of the collection. We also checked the collection for hidden `pm.sendRequest` calls and tested on a different local port. The [correction commit 60b0bb2](https://github.com/Frannaaa/slotdrop-gc2/commit/60b0bb29876ae45d0b30b45e525364d0798c6446) shows the before/after, and [deployed rerun 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) passed **16/16 assertions**. We now use visible setup requests so the test output makes it clear which host supplied the quote.

### B. ChatGPT's early health-check scaffold was not enough for production

**What AI gave us.** In Fran’s **October 27, 2026 ChatGPT discussion**, the assistant proposed this minimal Express health route as part of the starter backend:

```js
app.get('/api/health', (req, res) =>
  res.status(200).json({ status: 'ok' })
);
```

The assistant explicitly warned that this HTTP-only check **did not yet prove the database worked**. A later starter implementation returned `{status: 'ok', app: 'SlotDrop'}`, still without checking PostgreSQL. The [historical health.js source at commit 0193e98](https://github.com/Frannaaa/slotdrop-gc2/blob/0193e9810f838030dc126b57ed9466111d39c617/server/routes/health.js) preserves the same design. It was appropriate for checking a CP0 Express scaffold, but not for declaring our persisted booking service ready.

**How we verified it.** The endpoint had no database operation, so a running Node server could return **200 OK** even when booking data was inaccessible. This is a **demonstrated test scenario**, not a claim that a real production outage occurred. In [tests/health.test.js](../tests/health.test.js), the production route is exercised with both an unreachable database and a reachable database missing required tables. Those cases must return **503**, and the outage response must not reveal SQL errors or credentials. [Test commit a9f1168](https://github.com/Frannaaa/slotdrop-gc2/commit/a9f1168e7dcd37f6df4891f8ea005ccd1ca1a771) shows the initial failure-path cases; [PR #45](https://github.com/Frannaaa/slotdrop-gc2/pull/45) includes the subsequent table-readiness fix.

**What changed and why.** We kept the simple health behavior for local demo mode but made production health query PostgreSQL for the required `slots`, `services` and `bookings` tables. A failed check now returns `503 {status:'unavailable', app:'SlotDrop'}` without exposing internal error details. The [current production health route](../server/routes/health.js) contains this logic. The production check tests whether the service can reach the tables it needs to serve bookings. The scaffold addressed local HTTP liveness and its limitation was explicit. The later decision was to keep that behavior locally and require database readiness for deployment. This example depends on the team confirming that the starter behavior was considered for production.

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

**How we verified it.** In the reproducible [tests/owner-edit.test.js](../tests/owner-edit.test.js) scenario, a newer edit first pauses a session, changes capacity to **8**, and moves the deadline forward **15 minutes**. An older form then changes only the price to **161000 centavos (₱1,610)**. The original all-fields PATCH could overwrite those newer values with the older tab's stale data.

**What changed and why.** The corrected [`changedOfferFields()` helper](../public/js/owner-policy.js) compares the edit against the original loaded snapshot and submits only changed fields. The [Owner save handler](../public/js/owner.js) uses it before PATCH. The regression verifies the price becomes **₱1,610** while the new pause, capacity **8** and updated deadline remain intact. The fix is [commit f3dcfa6](https://github.com/Frannaaa/slotdrop-gc2/commit/f3dcfa69f6ec0c1614b6ff84fe4c698bf2757828). The [AI-assistance record saved with that commit](https://github.com/Frannaaa/slotdrop-gc2/blob/f3dcfa69f6ec0c1614b6ff84fe4c698bf2757828/AI-USAGE.md), dated October 28, describes this Owner-edit correction as ChatGPT/Codex-assisted and records the reproduced overwrite and the HTTP checks. Sending only changed fields preserves unrelated updates made while an older form is open. This correction does not solve two people changing the *same* field simultaneously, which would require version checks.

**Evidence summary:** The original Postman code and Claude co-authorship are preserved in commit `5bb731a`; the October 27 ChatGPT starter suggestion is supported by the contemporaneous discussion and original `health.js` implementation; the original Codex Owner code and its assistance credit are both preserved in commit `6e06dde`. Each correction has a regression test or a deployed rerun behind it. Every code excerpt, status and result above comes from the linked commits, runs and tests.

## Challenge 4 — The owner changes a rule

**The rule:** "Change the commission from 10%." **Answer: one line.** Checked on `main` at `8bdcfcb`. No rate was changed on the deployed site.

### Every place the commission appears

| File and line | What it does | Edit it to change the rate? |
|---|---|---|
| `server/config/business.js:1` | `COMMISSION_BASIS_POINTS = 1000` | **Yes. This is the only edit.** |
| `server/services/pricing.js:22` and `:25` | `priceQuote()` takes the rate and computes the fee for quotes and bookings | No |
| `server/services/bookings.js:109` and `:120` | Passes the rate to `priceQuote()` and saves it with the booking | No |
| `server/repositories/owner.js:3` and `:8` | Sends the rate to the Owner screen | No |
| `public/js/owner.js:88` | Previews a studio's earnings using the rate from the API | No |
| `db/schema.sql:78` | Checks that each saved fee matches its saved rate | No |

`tests/challenge4-rate.test.js` (merged in PR #37) checks that only the config file defines the rate, and that the quote, the saved booking and the Owner screen all use it.

### Why the answer is one place

- **One rate.** The business rate comes from one server constant. Quotes, saved bookings and the Owner screen read `COMMISSION_BASIS_POINTS`. None of them keeps its own 10%.
- **One formula, used for three jobs.** Price × rate ÷ 10,000, rounded per seat, appears in three layers. `server/services/pricing.js:25` computes the amount to save. `public/js/owner.js:87` previews a studio's proceeds before an edit is saved. `db/schema.sql:78` checks each stored fee against the rate stored with it. These are not three rates that can be edited separately, and changing the percentage touches none of them. Changing how the fee is *rounded* would mean checking all three.
- **Old bookings keep their old rate.** Each receipt saves the rate, fee and payout it was made with. Changing the active rate does not rewrite existing bookings.
- **A possible clean-up.** The Owner preview could ask the server for a quote, which would remove the copy of the formula in the browser. It would also add a network request with its own loading and error states.

Because the answer was already one place, there was no refactor to make and no refactor PR to show.

### What 12% would change

An example buddy booking of two seats at ₱2,565 each:

| Rate | Fee per seat | SlotDrop's fee | Studio receives | Customer pays |
|---|---:|---:|---:|---:|
| 10% (now) | ₱256.50 | ₱513.00 | ₱4,617.00 | ₱5,130.00 |
| 12% (example) | ₱307.80 | ₱615.60 | ₱4,514.40 | ₱5,130.00 |

The customer's total stays at ₱5,130 because this changes the platform's commission, not the session price. This is a calculation from the code's formula, not a measured revenue result.

### How we checked it without changing the deployed rate

**One-line change, 10 November.** `node --test tests/challenge4-rate.test.js` passed at **1,000 basis points**, and passed again in a disposable copy after changing only `COMMISSION_BASIS_POINTS` to **1,200**. Both runs exercised the Owner catalog, the server quote and a saved receipt, and each checked that a later offer-price edit left the existing receipt unchanged. The two runs used separate databases. [Test source](../tests/challenge4-rate.test.js) · [Tested code baseline](https://github.com/Frannaaa/slotdrop-gc2/commit/e994ffddb1ba9635e19091eab30436b80d299489)

**Same database across a restart, 10 November.** A follow-up used a disposable on-disk PGlite database and the same application code. At 10%, a fictional ₱1,600 booking saved with HTTP 201, a ₱160 fee and a ₱1,440 payout. After stopping the server, changing only the rate to 12% and reopening the same database, the old receipt returned HTTP 200 and matched its original JSON exactly. A new booking at the same customer price saved with HTTP 201, a ₱192 fee and a ₱1,408 payout, and the server quote and Owner catalog agreed with the new rate. This verifies the receipt behavior locally. The deployed commission is still 10%.

## Challenge 5 — Predict, then run

Individual work. Each member picks one function they wrote, writes three inputs and the output they predict for each, runs them, and explains any mismatch. The screen recording is unedited, has the member's own voice, lasts at most three minutes, and is made without AI assistance. Show the function, the three predictions and actual runs, then change one input or one line and explain the result.

## Stretch challenges

| Stretch | Status | Shown on the deployed site | What is left |
|---|---|---|---|
| [Sequential or parallel](#sequential-or-parallel) | **Complete** | Load time before and after | |
| [Too many requests](#too-many-requests) | **Deployed API and local Checkout verified** | Render returned 429 with `Retry-After`. A separate browser run verified the wait and retry against the local API. | Deployed Checkout wait and retry and visitor isolation remain unverified |
| [The double click](#the-double-click) | **Verified on live double-click** | One browser POST, one confirmed receipt and one Owner row | |
| [Pagination](#pagination) | **Demonstrated on deployed Browse** | Previous and Next switched between sessions 1–6 and 7–8 | |
| [Join and compute](#join-and-compute) | **Verified on the deployed Owner page** | 0 of 32 to 1 of 32 booked seats, with both source requests observed in the later walkthrough | |

**Where the deployed results come from.** Timings and the 429 result: [run 42462032799, attempt 3](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42462032799), 8 November 2026, 08:36–08:38 UTC, commit `96d4a31`. Paged list responses: read-only requests on 12 November 2026 at 07:59 UTC, after Browse (PR #62) was deployed. None of these requests created a booking: `GET /api/metrics` showed `bookingCount: 0` on both dates.

### Sequential or parallel

Selection loads the session and the price quote together with `Promise.all` (`public/js/selection.js:19`). Neither request needs the other: both use only the `slotId` and `quantity` from the address.

| How the two requests are sent | Median | Fastest | Slowest |
|---|---:|---:|---:|
| One after the other (before) | 398.0 ms | 385.6 ms | 730.8 ms |
| Together (after, the current code) | 200.2 ms | 194.3 ms | 535.5 ms |

The requests were `GET /api/slots/1` and `GET /api/pricing/quote?slotId=1&quantity=2`, 15 alternating trials after 3 warm-ups. Sending them together halved the wait, because each costs about one round trip to Singapore and the two now overlap. The times were measured from a GitHub server, not a phone browser. [Screenshot](evidence/stretch-deployed/sequential-vs-parallel.jpg).

### Too many requests

**The limit.** 30 booking POSTs per minute for each client address (`server/middleware/booking-rate-limit.js`). Reading a receipt and the Owner list are not limited.

**On the deployed API.**

| Step | Result |
|---|---|
| 25 refused `POST /api/bookings` requests (quantity 0) | 25 × **400** |
| The next POST | **429** `RATE_LIMITED`, with `Retry-After: 30` |
| The same request 31 seconds later | **400** again, so the limit had reset |

The 429 arrived on attempt 26 because the Challenge 1 job in the same run had already sent 5 POSTs that minute. [Screenshot](evidence/stretch-deployed/too-many-requests-429.jpg).

**The front end waits and retries.** `retryLimitedBooking()` (`public/js/customer-common.js:87`, on `main`) waits for the time the server gives and resends the same body once, with the same `requestId`, so a retry cannot become a second booking. It retries only a 429, never a 400, a 409 or a lost connection. `tests/booking-rate-limit.test.js` covers both halves. Checkout calls the helper in PR #43 (`checkout.js:139`) and shows "Booking traffic is high. Retrying this same request in … seconds…" (line 146).

**Local browser proof, 14 November.** A disposable local app with a five-second limit window returned 429 with `Retry-After: 5` to Checkout. While Submit was disabled, the page showed the retry message. After 5,031 ms, Checkout resent the identical body and request ID, received 201 and rendered the single saved receipt. [Waiting state](evidence/challenge2-final/checkout-retry-local.jpg) · [Request and timing record](evidence/challenge2-final/checkout-retry-local.json).

**Scope of the API result.** The current key is the socket peer address. The deployed run establishes throttling for the test traffic. It does not establish separate limits for different visitors behind Render’s proxy.

### The double click

**What could go wrong.** One customer sends the same booking twice, or two customers ask for the last seats at the same moment.

**What we found.** A [source audit of Checkout on 7 November](https://github.com/Frannaaa/slotdrop-gc2/pull/43#pullrequestreview-5813793124) found a gap. After a booking was saved, the page re-enabled Submit before the browser had moved to Confirmation. A second click in that moment would have carried a new `requestId`, and the server would have saved it as a second booking. [Kat's review on 8 November](https://github.com/Frannaaa/slotdrop-gc2/pull/43#pullrequestreview-5817789602) asked for the fix and a regression test.

**How it was made safe.**

| Layer | Protection | Evidence |
|---|---|---|
| The page | Checkout disables Submit while saving. A `navigating` flag keeps it disabled until Confirmation loads (`checkout.js:153` in PR #43, [commit 980dab5](https://github.com/Frannaaa/slotdrop-gc2/commit/980dab57523bc7f86f0f20e487d68ab3233eb21d)). | `tests/checkout-browser.test.js`: "successful checkout stays locked while confirmation navigation is pending". [Kirsten's review on 11 November](https://github.com/Frannaaa/slotdrop-gc2/pull/43#pullrequestreview-5859831151) confirmed the guard. |
| The same booking sent twice | Each booking carries one `requestId`. `createBooking()` returns the saved receipt with 200 for an identical retry, and 409 when a key is reused with different details. | `tests/bookings.test.js`: "an identical retry returns the same booking with 200, even after the session closes" and "concurrent identical retries create exactly one booking" |
| Two customers, last seats | `SELECT … FOR UPDATE` locks the session row (`server/services/bookings.js:99`), so the second booking sees the seats already taken. One gets 201 and the other 409. | `tests/bookings.test.js`: "concurrent bookings for the last seats never oversell". `tests/postgres-locking.test.js` shows the same row lock holding back an Owner seat edit on PostgreSQL in CI. |

**Live result, 12 November.** A browser double-click on Confirm simulated booking led to [one confirmation](evidence/challenge2/confirmation.jpg) and [one matching saved row](evidence/challenge2/owner-booking.jpg). The [14 November browser run](#challenge-2--trace-one-real-request) established that the double-click sent exactly one booking POST.

### Pagination

**The route.** `GET /api/slots` accepts `?page=` and `?limit=` on `main` (PR #49). Paging is applied after the filters and the sort.

**On the deployed API, 12 November.** The deployed catalog had 8 bookable sessions.

| Request | Status | Sessions returned (by id) |
|---|---|---|
| `GET /api/slots` | 200 | 18, 20, 22, 24, 26, 28, 30, 32 |
| `GET /api/slots?page=1&limit=3` | 200 | 18, 20, 22 |
| `GET /api/slots?page=2&limit=3` | 200 | 24, 26, 28 |
| `GET /api/slots?page=3&limit=3` | 200 | 30, 32 |
| `GET /api/slots?page=4&limit=3` | 200 | none (`[]`) |
| `GET /api/slots?category=creative&page=1&limit=2` | 200 | 18, 20 |
| `GET /api/slots?page=0&limit=3` | 400 | `INVALID_INPUT` "page is outside the allowed range." |
| `GET /api/slots?page=1&limit=1000` | 400 | `INVALID_INPUT` "limit is outside the allowed range." |

The three pages together return each session once, in the same order as the full list. A page past the end is an empty list with 200, not an error.

**Live result, 12 November.** After PR #63 merged, [Browse page 1](evidence/challenge2/browse-page-1.jpg) showed sessions 1–6. Next displayed [page 2](evidence/challenge2/browse-page-2.jpg), sessions 7–8. Previous returned to page 1. The [14 November browser capture](evidence/challenge2-final/browser-network.json) also records the page 2 and return-to-page 1 requests.

### Join and compute

PR #51 adds one line to the Owner screen, computed in the browser from two routes the page already loads.

| Route | What it contributes |
|---|---|
| `GET /api/owner/catalog` | Each session's released seats, status, start time and booking deadline |
| `GET /api/bookings` | Each saved booking's session, number of seats and status |

`openReleaseUtilization()` in `public/js/owner-insights.js` keeps the sessions that can still be booked, adds up their released seats, adds up the confirmed seats booked in those same sessions, and shows:

> *N* of *M* released demo seats booked (*P*%) across *K* currently eligible sessions.

P = round(100 × N ÷ M). Neither route returns this figure alone. With no eligible session the page says so and does not show 0%. If bookings exceed the released seats it shows no percentage.

`tests/owner-insights.test.js` covers a 3-of-10-seat example, cancelled bookings, paused and out-of-window sessions, empty inventory, and the over-capacity case Kirsten asked for in review. [Kirsten approved the PR on 12 November](https://github.com/Frannaaa/slotdrop-gc2/pull/51#pullrequestreview-5869740111).

**Live result, 12 November.** Across eight eligible sessions, Owner showed [0 of 32 seats booked (0%)](evidence/challenge2/owner-utilization-before.jpg) before the booking and [1 of 32 seats booked (3%)](evidence/challenge2/owner-utilization-after.jpg) after it. This is utilization of released fictional seats. The [14 November browser run](evidence/challenge2-final/browser-network.json) observed both source requests while opening Owner.

## Earlier test records

<details>
<summary>Archived local booking payload and response</summary>

This is from a local run on 7 November, **not** the deployed capture. A second local run on 11 November, with Chrome DevTools open on a local build of all six screens, showed the booking POST return 201 and the receipt GET return 200 for booking `ae9ed892-67c7-4603-9244-17f186f637bc`, with the same reference on Confirmation and Owner (recorded in the submission checklist in PR #47). `POST /api/bookings` returned 201, and `GET /api/bookings/917d1fa9-9a71-4a2f-873e-78c6ea4b8c9e` returned the same receipt with 200. The names and prices are from the older fictional test data.

Request body:

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

Response (201):

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

</details>

These are older local and CI runs, kept for the record. They are **not** evidence from the deployed site.

<details>
<summary>Run log, 27 October to 12 November</summary>

| Date | What was checked | Result | Record |
|---|---|---|---|
| 27 Oct | Owner and session collection in Postman, local | 21 requests, 26 assertions passed | [fran-api-local.json](evidence/fran-api-local.json) |
| 28 Oct | Same collection, using activity 4 and its 30-minute deadline | 21 requests, 27 assertions passed | [repository-review-2026-10-28.json](evidence/repository-review-2026-10-28.json) |
| 28 Oct | Node 22 + PostgreSQL 16 in CI; production container build, database setup and restart | 20 tests passed | [CI run 40556533287](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/40556533287) |
| 28 Oct | Local syntax and tests (PGlite) | 19 passed, 1 PostgreSQL-only test skipped | Local run |
| 28 Oct | SQL constraints and seed | 8 scenario groups passed | `tools/check-sql.mjs` |
| 28 Oct | Owner screen in the browser: phone and desktop layout, save, pause, unchanged form, outage recovery | Passed | Disposable fictional database |
| 7 Nov | Local build of #45, #41 and #43 together | 95 tests and 8 SQL groups passed, 1 skipped. Browse returned 404. | See "7 November integration check" below |
| 8 Nov | Selection timing in CI (PR #53) | Median 5.47 ms one after the other, 4.59 ms together, 7 rounds | [CI run 42394996195](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42394996195) |
| 8 Nov | Challenge tests in CI (PR #37) | 86 tests passed | [CI run 42428732562](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42428732562) |
| 8 Nov | Booking limiter in CI (PR #56) | 85 of 85 tests passed | [CI run 42429460881](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42429460881) |
| 8 Nov | Challenge 1 collection with Newman 6.2.3, local, commit `b1cf5c0` | 6 requests, 12 assertions passed | [challenge1-newman-local-2026-11-08.json](evidence/challenge1-newman-local-2026-11-08.json) |
| 8 Nov | Owner collection, pagination (#49) and limiter (#56) with Newman, local | 21 requests / 28 assertions; 4 / 6; 7 / 12, all passed | [owner-and-bonus-newman-local-2026-11-08.json](evidence/owner-and-bonus-newman-local-2026-11-08.json) |
| 8 Nov | Full suite in CI (PR #37) | 104 of 104 tests passed | [CI run 42455580176](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42455580176) |
| 12 Nov | Deployed site after Browse was merged: health, Browse page, Owner page and paged list, read-only | `/api/health` 200; Browse showed "8 sessions found." with a clean Console; `/checkout.html` 404; `bookingCount` 0 | [Pagination](#pagination) |

The [Owner and session Postman collection](SlotDrop-Fran.postman_collection.json) covers the Owner and session APIs.

</details>

<details>
<summary>27–28 October: Owner and API checks</summary>

- The restart test creates a session through the API and inserts a fictional receipt directly. Both survive a restart of the Node container, and the Owner seats and numbers still match. At that time the customer booking route did not exist yet.
- The Owner layout follows the 28 October brand book: paper, ink, blue and lime colors, local fonts and 48-pixel action buttons. It stayed within the page at 320, 390, 768 and 1280 pixels wide.
- Simulating a database outage disabled saving. Refresh restored the data and controls. A later buddy-price edit left the original receipt and numbers unchanged.
- The repository review found failing checks on the earlier data and offer branches: the syntax scan assumed `public/js` existed, and CI tried to run a restart script from a later branch. The scan now starts at `public/`, and the Docker and restart steps run only when their files exist.
- GC1 quotes and page references were checked against the original proposal and feedback.

**Follow-up fixes on 28 October**

- Detail responses now include `serviceActive`, so a direct link can explain an inactive activity. Discovery still hides it.
- Null characters in `q` and `area` now return 400 `INVALID_INPUT` before any SQL runs. Both new tests failed before the fix.
- Owner sales labels and Resume buttons update every second while the tab is visible, and at once when it becomes visible again. Existing cards, keyboard focus and unsaved deadlines are kept.

| Branch / PR | Tests passed | Skipped | Syntax | SQL groups |
|---|---:|---:|---|---:|
| Setup / #22 | 5 | 0 | Passed | 8 |
| Session data / #27 | 10 | 0 | Passed | 8 |
| Offer controls / #28 | 14 | 1 | Passed | 8 |
| Owner workspace / #29 | 22 | 1 | Passed | 8 |

The skipped test needs real PostgreSQL. These local runs used Node 24.22.1 and PGlite. The clock test runs the page script with a controlled clock and a lightweight page fixture; it is not a full browser walkthrough.

</details>

<details>
<summary>Timeout and adversarial checks</summary>

- Timestamps must stay within years 0001–9999 (UTC). A date crossing into year 10000 used to return 500 in the PGlite demo; it now returns 400 before any SQL runs. Boundary and timezone conversions are covered by `tests/http.test.js`.
- Tests send invalid and oversized edits, including compressed bodies, and confirm that seats and receipts are unchanged.
- Six identical create requests sent at once produce one new session. Conflicting seat, cancellation and price edits keep confirmed seats and receipt amounts intact.
- Owner requests stop after 15 seconds, including while reading a response. Refresh and editing recover after a failure without clearing drafts.
- A save that timed out is never retried automatically, because it may have completed. The owner is asked to refresh and check first.
- Local result for that branch: syntax passed, 29 tests passed, 1 PostgreSQL-only test skipped, all 8 SQL groups passed (Node 24.22.1, PGlite).

</details>

<details>
<summary>7 November integration check</summary>

A disposable local build combined Fran's #45, Kat's #41 and Kaitlyn's #43.

- The six page routes available at the time responded. Browse returned 404.
- Syntax, 95 tests and 8 SQL groups passed. One PostgreSQL-only test was skipped.
- The app returned a quote for two seats, saved a booking with 201, and returned the same receipt with 200 on an identical retry.
- Seats left fell by two, the Owner screen listed the booking once, and the receipt was still readable after restarting the local server.

This covered the API and saved data, not the pages in a browser.

</details>
