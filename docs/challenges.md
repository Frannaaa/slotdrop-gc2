# SlotDrop — GC2 challenges

We built SlotDrop to sell a limited number of seats in creative workshops that are already scheduled to run. For GC2, the offers, bookings and payments are simulated, but the customer flow uses our own API and a persistent PostgreSQL database. We tested the public course app on [Render](https://slotdrop-gc2-group-zx8j.onrender.com/), using fictional customer details.

This report answers Challenges 1–5 and the five optional stretch challenges. Each result is linked to the actual request, test, screenshot or code change behind it. Our longer [local and CI testing history](challenges-test-archive.md) is kept separately so it does not get confused with the deployed evidence.

## Challenge 1 — Break your own API

**We tried six requests that should not create a booking, plus an empty search. The deployed API returned the expected status in every case.**

We ran the [exported Postman collection](SlotDrop-GC2-Challenge1.postman_collection.json) against Render, first in [Postman Desktop on 10 November](evidence/challenge1-postman/health.png) and then through [deployed Newman run 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) on 8 November (**16/16 assertions passed**, target build \`96d4a31\`). The read-only setup selected a Laro Ceramics workshop with four available seats and asked the server for a two-person quote of **₱5,130**. Each negative POST used a fresh request ID and fictional customer details.

| Case | Expected | Actual response | Screenshots |
|---|---|---|---|
| Quantity \`0\` | 400 | **400 INVALID_INPUT** — quantity outside the allowed range | [Postman](evidence/challenge1-postman/01-zero-quantity.png) · [Newman](evidence/challenge1-deployed/01-zero-quantity.jpg) |
| Browser adds a fake \`"total": 1\` | 400 or server-computed price | **400 INVALID_INPUT** — unsupported field \`total\` | [Postman](evidence/challenge1-postman/02-client-total.png) · [Newman](evidence/challenge1-deployed/02-fake-total.jpg) |
| Request five seats when four remain | 409 | **409 SLOT_UNAVAILABLE** — only four seats left | [Postman](evidence/challenge1-postman/03-over-capacity.png) · [Newman](evidence/challenge1-deployed/03-more-seats-than-available.jpg) |
| Unknown session ID \`100016\` | 404 | **404 SLOT_NOT_FOUND** | [Postman](evidence/challenge1-postman/04-unknown-session.png) · [Newman](evidence/challenge1-deployed/04-unknown-session.jpg) |
| Missing \`customerName\` | 400 | **400 INVALID_INPUT** — customer name required | [Postman](evidence/challenge1-postman/05-missing-name.png) · [Newman](evidence/challenge1-deployed/05-missing-customer-name.jpg) |
| Search for \`zzzz-no-match\` | 200, empty list | **200 []** | [Postman](evidence/challenge1-postman/06-empty-search.png) · [Newman](evidence/challenge1-deployed/06-search-no-matches.jpg) |

The six negative booking/search cases did not create a booking: the run ended with \`bookingCount: 0\` and an empty bookings list. We also checked the [session selection](evidence/challenge1-postman/00a-session-setup.png), [server quote](evidence/challenge1-postman/00b-quote-setup.png) and [initial inventory](evidence/challenge1-postman/inventory.png).

**One test setup mistake was useful.** Our first [deployed Newman run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436) passed the six negative status checks but failed its setup assertion (**14/15**) because a hidden quote request used \`localhost\` instead of the deployment. It supplied an old **₱3,040** total rather than **₱5,130**. We split setup into two visible requests using the active \`{{baseUrl}}\`, removed hidden \`pm.sendRequest\` calls, checked another local port, and reran against Render (**16/16**). We discuss this again as our first Challenge 3 correction.

The server rejects client-supplied money fields. When the *accepted* total is merely out of date, it returns **409 PRICE_CHANGED** with a new quote instead. That distinction matters: customers cannot dictate the price, but they can agree to a newly computed one.

## Challenge 2 — Trace one real request

**On 15 November at 2:01 AM PHT**, we opened Chrome DevTools Network with *Preserve log* enabled and booked one simulated Bumi & Ashe mug-making seat on the public Render build [\`93d931a\`](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbs72tc9v7es73billgg). The browser was set to a 400 × 552 CSS-pixel viewport.

| Step seen in DevTools | Request | What came back |
|---|---|---|
| Checkout saved the booking | \`POST /api/bookings\` with slot **38**, quantity **1**, simulated on-site payment, generated request ID, fictional contact details and accepted total **238500 centavos** | **201 Created**; receipt totaled **₱2,385**, including a **₱238.50** platform fee |
| Confirmation loaded the receipt | \`GET /api/bookings/f6148274-8de0-4558-ada3-2a8b3dc68217\` | **200 OK**, same stored booking and prices |
| Owner read the bookings | \`GET /api/bookings\` | Matching booking reference, amount and fee |

[15 November DevTools request/response record](evidence/challenge2-final/devtools-booking-2026-11-15.json) includes the full request URL, posted JSON, status and sanitized responses. The matching confirmation/Owner evidence is also captured in the [14 November browser walkthrough](evidence/challenge2-final/browser-network.json) and [receipt](evidence/challenge2-final/confirmation.jpg) / [Owner screenshots](evidence/challenge2-final/owner.jpg), for a **different** sample booking. We keep their IDs and dates separate.

### The actual code path

These functions and line references correspond to the [15 November deployed build](https://github.com/Frannaaa/slotdrop-gc2/tree/93d931aff00363e09120c5d5c590b12b4aeeb897), rather than pretending that later edits were present in that capture.

| Hop | File / function | Why it matters |
|---|---|---|
| **1. Button** | \`public/js/checkout.js\`, submit listener (line 95) | Validates the form and accepted quote, generates a stable \`requestId\`, and disables Submit while saving |
| **2. HTTP request** | \`public/js/customer-common.js\`, \`retryLimitedBooking()\` → \`request()\` | Sends JSON to \`POST /api/bookings\`; a 429 can wait and retry the *same* request |
| **3. API route** | \`server/app.js\` → \`server/routes/bookings.js\` | Applies the booking rate limiter and passes the body to \`createBooking()\` |
| **4. Validation** | \`bookingRequest()\` in \`server/services/bookings.js\` | Rejects missing/unsupported fields or out-of-range quantities with 400 |
| **5. Database transaction** | \`createBooking()\` in \`server/services/bookings.js\`; \`transaction()\` in \`server/repositories/database.js\` | Looks up the request ID, locks the slot with \`SELECT … FOR UPDATE\`, rechecks cutoff/seats, calls \`priceQuote()\` and inserts a confirmed booking. A full slot or changed price returns 409 instead |
| **6. Saved response** | Booking route and \`receiptResponse()\` | Returns **201** for a new booking, **200** for an identical replay |
| **7. What renders** | \`public/js/confirmation.js\`, \`load()\` → \`GET /api/bookings/:id\` → \`findReceipt()\` | Fetches the saved receipt independently of the Checkout page and renders the reference, seats, price and payment choice |
| **8. Owner readback** | \`public/js/owner.js\`, \`load()\` → \`renderBookings()\` | Requests bookings/metrics from the same database and displays the saved transaction |

**Why we built it this way:** the price shown on Selection is not a reserved seat. The booking transaction locks and rechecks the slot *at save time*, so two customers cannot independently take the same last seat. Availability is calculated from released seats minus confirmed bookings. We save the accepted price and commission on the receipt, so editing an offer later does not rewrite an earlier sale.

**Hand-drawn trace:** The course also requires the group's own hand-drawn diagram of this exact request. The [system diagram](system.md) explains the architecture, but it is not a substitute for the drawing. The photo must show Checkout → validation → locked session → committed booking (201) → Confirmation GET (200) for reference \`f6148274-8de0-4558-ada3-2a8b3dc68217\`.

## Challenge 3 — Overrule the AI

We kept three examples where AI-assisted work looked plausible but a real test or teammate review showed it could mislead users or damage data. The useful part was not spotting a typo; it was checking what the code *actually did*.

### A. The Postman setup quietly used the wrong server

The [Claude-assisted collection](https://github.com/Frannaaa/slotdrop-gc2/commit/5bb731a3979dbd91bc799639d9ca747a82f51de9) hid a pricing call inside its setup script and read \`baseUrl\` from saved collection variables. During the deployed run, that value still pointed to \`localhost\`. All six invalid requests gave their expected statuses, but the setup quote was wrong: **₱3,040 instead of ₱5,130**. The [first Newman run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436) exposed the difference (**14/15 assertions**).

We replaced the hidden call with visible \`00a\` (select session) and \`00b\` (get quote) steps using the active run's host. The [fix](https://github.com/Frannaaa/slotdrop-gc2/commit/60b0bb29876ae45d0b30b45e525364d0798c6446) removed hidden \`pm.sendRequest\` use; the [deployed rerun](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) passed **16/16**. We learned that a test can pass the intended errors while using the wrong setup data. We now make the setup requests visible.

### B. The Owner editor could overwrite someone else's changes

In the [original Codex-assisted Owner editor](https://github.com/Frannaaa/slotdrop-gc2/commit/6e06dde742fcecd028bf4d41f6fdee57633c3899), every edit sent capacity, price, status and cutoff from the form, even if the owner had only changed a single price. That means an old browser tab could undo a newer change made by another user.

We reproduced it in [\`tests/owner-edit.test.js\`](../tests/owner-edit.test.js): the newer edit paused a session, set capacity to **8**, and moved the cutoff forward **15 minutes**. Then an older form changed only the price to **₱1,610**. A full-field PATCH would have restored the stale status, capacity and deadline.

Instead, we added [\`changedOfferFields()\`](../public/js/owner-policy.js), which compares the form against the snapshot originally loaded and submits **only fields that changed**. The [correction](https://github.com/Frannaaa/slotdrop-gc2/commit/f3dcfa69f6ec0c1614b6ff84fe4c698bf2757828) and regression show the new price saved while the newer pause, capacity and cutoff stayed intact. This does *not* solve two people changing the very same field; that would need version checking. The important choice was to stop a price edit from silently changing unrelated rules.

### C. A future workshop was counted as bookable after its cutoff

The [Claude-assisted catalog rollover in PR #59](https://github.com/Frannaaa/slotdrop-gc2/pull/59) originally treated \`starts_at > NOW()\` as sufficient to count a session. Kirsten's review pointed out the flaw: a class may start later even though booking already closed. That can leave Browse empty while startup thinks there's still enough inventory.

The regression introduced through [PR #71](https://github.com/Frannaaa/slotdrop-gc2/pull/71) put two sessions **30 and 40 minutes in the future**, both past their booking cutoffs. The old code returned **0** eligible new offers when the test expected **2**. The corrected rule requires a future booking cutoff, open status, a confirmed-to-run session and remaining seats. The [catalog tests](../tests/reference-catalog.test.js) passed after the change. Janelle corrected the rule; Kirsten reviewed the fix, and the [AI assistance log](../AI-USAGE.md) records the work.

The lesson across these three cases was the same: **test the business rule, not just whether the code runs.**

## Challenge 4 — The owner changes a rule

The owner's request was simple: **“Change the commission from 10% to 12%.”** We wanted one edit to change all new quotes, bookings and Owner estimates without rewriting past receipts.

### Where the rate is used

| File / line on release candidate | Role | Change needed? |
|---|---|---|
| \`server/config/business.js:1\` | Defines \`COMMISSION_BASIS_POINTS = 1000\` | **Yes — change to 1200** |
| \`server/services/pricing.js:20,22\` | Reads the configured rate and computes the quote | No |
| \`server/services/bookings.js:109,120\` | Recomputes and stores the fee/rate on the booking | No |
| \`server/repositories/owner.js:3,8\` | Supplies the rate to Owner | No |
| \`public/js/business-config.js:17\` | Shared per-seat fee calculation | No |
| \`public/js/owner.js:89\` | Uses the server rate in the Owner estimate | No |
| \`db/schema.sql:79\` | Validates saved amounts against each receipt's saved rate | No |

The [commission rule test](../tests/challenge4-rate.test.js) checks that there is only **one place to edit the business rate**. Pricing, Checkout and Owner all use that rate, and receipts save their own accepted rate/fee/payout.

For two buddy seats at **₱2,565 each**, this is what a new booking would show:

| | At 10% (deployed) | At 12% (hypothetical) |
|---|---:|---:|
| Customer total | ₱5,130 | ₱5,130 |
| SlotDrop fee | ₱513 | ₱615.60 |
| Studio payout | ₱4,617 | ₱4,514.40 |

We tested the one-line **1,000 → 1,200 basis point** change on a disposable local database, not on the public demo. The [test](../tests/challenge4-rate.test.js) passed at both rates. In a restart check using the same stored database, an older **₱1,600** booking still showed its original **₱160** fee and **₱1,440** studio payout after restart, while a new booking at 12% saved a **₱192** fee and **₱1,408** payout. The customer paid the same ₱1,600. [Reproduction baseline](https://github.com/Frannaaa/slotdrop-gc2/commit/e994ffddb1ba9635e19091eab30436b80d299489).

**Decision:** the rate belongs in server configuration, not hard-coded separately in Checkout and Owner. The deployed model remains **10%**.

## Challenge 5 — Predict, then run

This is each member's own work: show a function they wrote, predict the outputs for **three different inputs before running them**, run and compare the actual results, explain any mismatch, then change one input or line and explain the effect. The unedited screen recording must use the member's own voice, run **no longer than three minutes**, and be made **without AI assistance**.

[Group Google Drive video folder](https://drive.google.com/drive/folders/1U2MMvoRrhgov5SSZ0HdGHf51kiJ9c4Uj)

### Individual recording links

| Member | Recording |
|---|---|
| Fran (M1) | — |
| Cholo / Chonel (M2) | [CHONEL.mp4](https://drive.google.com/file/d/1Ms970zkXeCqHRqoOGZNs8MHzaGo3ivZ4/view?usp=drivesdk) |
| Janelle (M3) | [priceQuote.mov](https://drive.google.com/file/d/1pJMJDHhrfR6EWDazqLopU-RuFoPVv5Pw/view?usp=drivesdk) |
| Kaitlyn (M4) | — |
| Kat / Kaithlyn (M5) | — |
| Kirsten (M6) | [Garcia M6 video](https://drive.google.com/file/d/1LJxyMj9HbWRehO8hwoVBs4Eeh2n9MUKE/view?usp=drivesdk) |

As of **15 November**, the linked folder has recordings from Cholo, Janelle and Kirsten. The remaining three individual links are not in that folder. Before submission, the group must verify all six recordings meet the duration/content rules and can be opened by the instructor. A link alone is not proof of compliance.

## Stretch challenges — five one-point demonstrations

### Sequential or parallel

Selection needs **session details** and a **price quote**. Since one request does not depend on the other, \`public/js/selection.js\` loads them with \`Promise.all\`.

| Method | Median over 15 timed trials |
|---|---:|
| Sequential | **398.0 ms** |
| Parallel | **200.2 ms** |

In the GitHub Actions benchmark, parallel loading was roughly **198 ms faster (about 50%)** after three warm-ups. The [benchmark screenshot](evidence/stretch-deployed/sequential-vs-parallel.jpg) and [CI run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42462032799) record the comparison. A [14 November public browser capture](evidence/stretch-deployed/browser-readbacks-2026-11-14.json) also shows the requests starting **0.3 ms apart** and overlapping.

### Too many requests

In a [14 November public Checkout test](evidence/stretch-deployed/checkout-429/network.json), thirty invalid booking POSTs filled the 60-second limit without creating bookings. The next fictional booking POST returned **429 RATE_LIMITED** and \`Retry-After: 59\`. Checkout displayed the wait message, kept Submit disabled, then retried after **59,003 ms** using **the same request body and ID**. The server saved exactly **one ₱2,880** booking (201); [Confirmation](evidence/stretch-deployed/checkout-429/confirmation.jpg) and [Owner](evidence/stretch-deployed/checkout-429/owner.jpg) showed reference \`26ccfbce-9a9d-49f6-b3c1-35674477ebf5\`, and seats fell **3 → 2**.

[Waiting-state screenshot](evidence/stretch-deployed/checkout-429/waiting.jpg) · [Retry evidence](bonus-rate-limit.md).

The captured Render build limited requests by the socket address. PR #72 changes the limiter to use the client address; [integration checks](bonus-rate-limit.md) cover independent clients behind one proxy. That updated part should be verified on whichever host is finally submitted.

### The double click

We found that Checkout could briefly re-enable Submit after saving but before navigation, allowing a second click with a new request ID. [Kat's review](https://github.com/Frannaaa/slotdrop-gc2/pull/43#pullrequestreview-5817789602) led to a \`navigating\` lock that keeps the button disabled until Confirmation loads. [The browser test](../tests/checkout-browser.test.js) covers it.

The API provides another layer: an identical request ID returns the **same receipt (200)**, while conflicting reuse returns **409**. A database row lock prevents two customers from both buying the last seat; the second sees the reduced capacity and gets 409. Those cases are covered in [booking tests](../tests/bookings.test.js) and [PostgreSQL locking tests](../tests/postgres-locking.test.js).

**Deployed result:** The [14 November browser record](evidence/challenge2-final/browser-network.json) shows a Checkout double-click producing **one POST**, [one confirmation](evidence/challenge2-final/confirmation.jpg) and [one matching Owner row](evidence/challenge2-final/owner.jpg).

### Pagination

The list API supports \`?page=\` and \`?limit=\`; Browse actually uses them rather than loading the full list and slicing it in the browser ([backend PR #49](https://github.com/Frannaaa/slotdrop-gc2/pull/49), [Browse PR #63](https://github.com/Frannaaa/slotdrop-gc2/pull/63)).

In the **12 November public API check**, eight bookable sessions split cleanly into pages of three: IDs **18, 20, 22**; **24, 26, 28**; then **30, 32**. Page four returned **200 []**. Invalid page \`0\` and \`limit=1000\` returned **400 INVALID_INPUT**. The [deployed Browse screenshots](evidence/challenge2/browse-page-1.jpg) and [page two](evidence/challenge2/browse-page-2.jpg) show the normal six-card page switching to the remaining two, then Previous returning to the first page. [Network evidence](evidence/stretch-deployed/browser-readbacks-2026-11-14.json) confirms the requests.

### Join and compute

Owner combines **two real API responses**, \`GET /api/owner/catalog\` (eligible released seats) and \`GET /api/bookings\` (confirmed seats), using \`openReleaseUtilization()\` in \`public/js/owner-insights.js\`.

\`utilization = round(100 × confirmed seats ÷ released seats)\`

On the deployed build, Owner changed from [**0 of 32 seats (0%)**](evidence/challenge2/owner-utilization-before.jpg) to [**1 of 32 (3%)**](evidence/challenge2/owner-utilization-after.jpg) after a simulated booking. A separate [14 November readback](evidence/stretch-deployed/browser-readbacks-2026-11-14.json) checked **6/48 = 13%** using the two fetched responses. The [Owner regression](../tests/owner-insights.test.js) covers paused/expired sessions, cancellations, empty inventory and over-capacity values.

---

The links above lead to the evidence tied to each demonstrated build. The older test logs remain available in the [archive](challenges-test-archive.md); they are not substitutes for the deployed captures.
