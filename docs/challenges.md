# SlotDrop GC2 challenges

We ran the API and browser tests below on [SlotDrop’s Render demo](https://slotdrop-gc2-group-zx8j.onrender.com/) using fictional guest details. Express handled the requests, and PostgreSQL saved the successful bookings.

<a name="challenge-1--break-your-own-api"></a>

## Challenge 1. Break your own API

Five cases tried to save an invalid booking. The sixth searched for an activity that doesn’t exist.

We used the [Postman collection](SlotDrop-GC2-Challenge1.postman_collection.json) on Render. The [8 November Newman run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) passed **16/16 assertions**. We repeated the cases in [Postman Desktop on 10 November](evidence/challenge1-postman/health.png). Both runs started by finding a Laro Ceramics session with four seats left and asking for a two-person quote of **₱5,130**.

| What we tried | Expected | What the server returned | Evidence |
|---|---|---|---|
| Book `0` seats | 400 | **400 INVALID_INPUT**, invalid quantity | [Postman](evidence/challenge1-postman/01-zero-quantity.png) · [Newman](evidence/challenge1-deployed/01-zero-quantity.jpg) |
| Send a fake `"total": 1` | 400 or server-recomputed total | **400 INVALID_INPUT**, unsupported field | [Postman](evidence/challenge1-postman/02-client-total.png) · [Newman](evidence/challenge1-deployed/02-fake-total.jpg) |
| Book 5 seats when only 4 remain | 409 | **409 SLOT_UNAVAILABLE** | [Postman](evidence/challenge1-postman/03-over-capacity.png) · [Newman](evidence/challenge1-deployed/03-more-seats-than-available.jpg) |
| Use nonexistent `slotId: 100016` | 404 | **404 SLOT_NOT_FOUND** | [Postman](evidence/challenge1-postman/04-unknown-session.png) · [Newman](evidence/challenge1-deployed/04-unknown-session.jpg) |
| Omit `customerName` | 400 | **400 INVALID_INPUT**, missing name | [Postman](evidence/challenge1-postman/05-missing-name.png) · [Newman](evidence/challenge1-deployed/05-missing-customer-name.jpg) |
| Search `zzzz-no-match` | 200, empty list | **200 []** | [Postman](evidence/challenge1-postman/06-empty-search.png) · [Newman](evidence/challenge1-deployed/06-search-no-matches.jpg) |

Each POST had its own request ID and fictional guest details. After the tests, `GET /api/bookings` returned `[]` and Owner showed `bookingCount: 0`. [Setup session](evidence/challenge1-postman/00a-session-setup.png) · [Price quote](evidence/challenge1-postman/00b-quote-setup.png) · [Inventory](evidence/challenge1-postman/inventory.png)

The first Newman run caught a setup error involving `localhost`. We explain what we changed in [Challenge 3](#challenge-3-overrule-the-ai).

The two price errors mean different things. An unsupported `total` field gets **400 INVALID_INPUT**. An outdated accepted amount gets **409 PRICE_CHANGED** and a fresh quote.

<a name="challenge-2--trace-one-real-request"></a>

## Challenge 2. Trace one real request

On **15 November at 2:01 AM PHT**, we opened Chrome DevTools at 400 × 552 and followed a booking on Render build [`93d931a`](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbs72tc9v7es73billgg). We booked **one Bumi & Ashe mug-making seat for ₱2,385**.

| What happened | Actual request | Result |
|---|---|---|
| Checkout sent the booking | `POST /api/bookings` for slot **38**, quantity **1**, `expectedTotalCentavos: 238500`, a request ID, fictional guest details and simulated pay-on-site | **201 Created**, with a **₱2,385** total and **₱238.50** platform fee |
| Confirmation fetched the saved record | `GET /api/bookings/f6148274-8de0-4558-ada3-2a8b3dc68217` | **200 OK**, same booking and saved prices |
| Owner read the bookings | `GET /api/bookings` | Same reference, amount and fee in the bookings list |

The [15 November Network record](evidence/challenge2-final/devtools-booking-2026-11-15.json) has the request body, statuses and sanitized responses. The [14 November browser record](evidence/challenge2-final/browser-network.json) shows a separate booking with its own [Confirmation](evidence/challenge2-final/confirmation.jpg) and [Owner](evidence/challenge2-final/owner.jpg) screenshots.

### From Checkout to PostgreSQL

The table follows the code in the [build we traced on 15 November](https://github.com/Frannaaa/slotdrop-gc2/tree/93d931aff00363e09120c5d5c590b12b4aeeb897).

| Step | File and function | What it did |
|---|---|---|
| Checkout | `public/js/checkout.js`, submit handler | Checked the form and accepted quote, created a `requestId` and disabled Submit |
| Browser request | `retryLimitedBooking()` and `request()` in `public/js/customer-common.js` | Sent the POST. A 429 retry would send the same body and request ID. |
| **API route** | `server/app.js` → `server/routes/bookings.js` | Applied the limiter and handed the request to `createBooking()` |
| **Validation** | `bookingRequest()` in `server/services/bookings.js` | Checked the fields, types, payment choice and quantity |
| Save | `createBooking()` in `server/services/bookings.js` and `transaction()` in `server/repositories/database.js` | Checked the request ID, locked the slot with `SELECT … FOR UPDATE`, checked seats and cutoff, recalculated the total, then inserted and committed the booking |
| POST response | Booking route and `receiptResponse()` | Returned **201** with the saved receipt. An identical replay returns **200** with the same receipt. |
| **Confirmation GET and render** | `load()` in `public/js/confirmation.js` → booking GET route → `findReceipt()` in `server/services/bookings.js` | `load()` sends the GET by ID, then renders the saved reference, seat count, total and payment choice. |
| **Owner readback** | `public/js/owner.js` → `server/routes/owner.js` → `listBookings()` in `server/repositories/owner.js` | Read the saved booking independently from the database |

The slot lock matters most when two customers ask for the last seat. Each save checks availability while it holds the lock. The receipt keeps the accepted price on the booking row so Confirmation can load it again by ID.

[Our four-page hand-drawn trace](https://drive.google.com/file/d/1sD5XV-f596rkS2WaccFFvecWElqiZHw-/view?usp=drivesdk) follows the same booking for slot **38**, quantity **1**. Pages 1 and 2 trace the Checkout POST through the PostgreSQL transaction and `201` response. Page 3 follows the separate receipt GET. Page 4 shows Owner reading the saved booking.

The [system diagram](system.md) covers the full app.

<a name="challenge-3--overrule-the-ai"></a>

## Challenge 3. Overrule the AI

### 1. Postman quoted the wrong server

A [Claude-assisted script](https://github.com/Frannaaa/slotdrop-gc2/commit/5bb731a3979dbd91bc799639d9ca747a82f51de9) read the collection’s saved host, which was still `localhost`. It fetched a **₱3,040** quote while the session on Render cost **₱5,130**.

The setup assertion was the one that failed in the [14/15 Newman run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436). We made session lookup and quote two visible requests and switched both to the active `{{baseUrl}}`. The [fix](https://github.com/Frannaaa/slotdrop-gc2/commit/60b0bb29876ae45d0b30b45e525364d0798c6446) passed [16/16 on Render](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586).

### 2. Saving a price could undo another edit

The [Codex-assisted editor](https://github.com/Frannaaa/slotdrop-gc2/commit/6e06dde742fcecd028bf4d41f6fdee57633c3899) sent every field in the form on Save. A tab opened earlier could overwrite a pause or capacity change made in another tab.

In the [test](../tests/owner-edit.test.js), we paused the workshop, set capacity to **8** and moved the cutoff by **15 minutes**. Then an old form saved a price of **₱1,610**. We used [`changedOfferFields()`](../public/js/owner-policy.js) to send only fields edited in that tab. After the [fix](https://github.com/Frannaaa/slotdrop-gc2/commit/f3dcfa69f6ec0c1614b6ff84fe4c698bf2757828), the price changed and the newer pause, capacity and cutoff stayed in place. Two people editing the same field would still need version handling.

### 3. A session could start later and already be closed

The [Claude-assisted catalog change in #59](https://github.com/Frannaaa/slotdrop-gc2/pull/59) counted any future start as available. Kirsten pointed out that a class can start later in the day even after bookings have closed.

In [#71](https://github.com/Frannaaa/slotdrop-gc2/pull/71), two classes started **30 and 40 minutes later** with both cutoffs already past. The old logic added **0** sessions when we expected **2**. Janelle changed it to check the cutoff, sales status, whether the class was going ahead and remaining seats. Kirsten reviewed the fix, and the [catalog tests](../tests/reference-catalog.test.js) passed.

<a name="challenge-4--the-owner-changes-a-rule"></a>

## Challenge 4. The owner changes a rule

We tried raising the modeled commission from **10% to 12%**. `COMMISSION_BASIS_POINTS` is the only setting we had to edit for new bookings.

### Files involved

| File / line on the release candidate | What it does | Edit for the new rate? |
|---|---|---|
| `server/config/business.js:1` | Defines `COMMISSION_BASIS_POINTS = 1000` | **Yes**, change `1000` to `1200` |
| `server/services/pricing.js:20,22` | Quotes the booking using the configured rate | No |
| `server/services/bookings.js:109,120` | Recomputes and saves the fee and rate | No |
| `server/repositories/owner.js:3,8` | Makes the rate available to Owner | No |
| `public/js/business-config.js:18` | Rounds the per-seat commission for server quotes and Owner previews | No |
| `public/js/owner.js:90` | Uses the same rounding function to preview studio payout | No |
| `db/schema.sql:79` | Checks recorded fee against the rate saved on each receipt | No |

The [rate test](../tests/challenge4-rate.test.js) checks that Quote, Booking and Owner share the configured rate. Each booking also stores the rate used when it was saved.

Two buddy seats at ₱2,565 each give these totals.

| | 10% commission | 12% commission |
|---|---:|---:|
| Customer pays | **₱5,130** | **₱5,130** |
| SlotDrop gets | ₱513 | ₱615.60 |
| Studio receives | ₱4,617 | ₱4,514.40 |

We tested **1000 → 1200** in a disposable database and restarted the app against the same database. The earlier ₱1,600 booking kept its **₱160** fee and **₱1,440** payout. A new booking recorded **₱192** and **₱1,408**. [Tested baseline](https://github.com/Frannaaa/slotdrop-gc2/commit/e994ffddb1ba9635e19091eab30436b80d299489)

The live demo uses 10%.

<a name="challenge-5--predict-then-run"></a>

## Challenge 5. Predict, then run

Each member picks one function they wrote and writes down what it will return for **three inputs** before running it. The recording shows the results and explains any differences, then changes one input or line and explains the new result. Use your own voice in one unedited recording of at most **three minutes**.

[Group video folder](https://drive.google.com/drive/folders/1U2MMvoRrhgov5SSZ0HdGHf51kiJ9c4Uj)

### Individual recording links

| Member | Video |
|---|---|
| Fran (M1) | [Fran's recording](https://drive.google.com/file/d/1KTSKMzq5AE3XBpkbri-EG_aSafvdQr0s/view?usp=drivesdk) |
| Cholo / Chonel (M2) | [Chonel's recording](https://drive.google.com/file/d/1Ms970zkXeCqHRqoOGZNs8MHzaGo3ivZ4/view?usp=drivesdk) |
| Janelle (M3) | [Janelle's `priceQuote` recording](https://drive.google.com/file/d/1pJMJDHhrfR6EWDazqLopU-RuFoPVv5Pw/view?usp=drivesdk) |
| Kaitlyn (M4) | Pending upload |
| Kat / Kaithlyn (M5) | Pending upload |
| Kirsten (M6) | [Kirsten's recording](https://drive.google.com/file/d/1LJxyMj9HbWRehO8hwoVBs4Eeh2n9MUKE/view?usp=drivesdk) |

## Stretch challenges

### Sequential or parallel

Selection needs the session details and the quote. Either request can start first, so `public/js/selection.js` starts both with `Promise.all`.

| Load method | Median of 15 trials |
|---|---:|
| Sequential | **398.0 ms** |
| Parallel | **200.2 ms** |

Parallel loading saved about **198 ms (50%)** in the [benchmark](evidence/stretch-deployed/sequential-vs-parallel.jpg) ([CI run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42462032799)). In a [14 November browser capture](evidence/stretch-deployed/browser-readbacks-2026-11-14.json), the requests started **0.3 ms apart** and overlapped.

### Too many requests

We sent **30 invalid booking POSTs** from one browser in a minute. The next request got **429 RATE_LIMITED** with `Retry-After: 59`. Checkout kept Submit disabled, showed the wait and retried the same body and request ID after **59,003 ms**.

The retry returned **201** for one **₱2,880** booking and seats went from **3 to 2**. [Confirmation](evidence/stretch-deployed/checkout-429/confirmation.jpg) and [Owner](evidence/stretch-deployed/checkout-429/owner.jpg) showed the same reference, `26ccfbce-9a9d-49f6-b3c1-35674477ebf5`. [Network record](evidence/stretch-deployed/checkout-429/network.json) · [Waiting screen](evidence/stretch-deployed/checkout-429/waiting.jpg)

The traced Render build counted requests by socket address. PR #72 uses the client address on Render. The [integration tests](../tests/booking-rate-limit.test.js) cover clients behind the same proxy.

On the reviewed Render release, the browser received a simulated `429` with a 5-second wait. Checkout stayed locked, then sent the identical request after 5,008 ms. Render returned `200` for the existing practice booking. Confirmation reloaded receipt `1267ec9f-e9a4-4395-9c84-0f8f4f74c69b` and Owner showed the same ₱2,700.00 total and one matching row. [Release verification](evidence/live-release-3ef579d.json) · [Checkout, receipt and Owner screenshots](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43727564732/artifacts/14167311156)

### The double click

[Kat’s review on #43](https://github.com/Frannaaa/slotdrop-gc2/pull/43#pullrequestreview-5817789602) caught Submit turning back on between Save and Confirmation. We lock the form through navigation and cover that path in the [browser test](../tests/checkout-browser.test.js).

The server returns the same receipt with **200** for an identical retry and **409** if the same ID comes with different details. The slot lock also protects the last seat when two people book at once. [Booking tests](../tests/bookings.test.js) · [PostgreSQL locking test](../tests/postgres-locking.test.js)

In the [14 November deployed browser run](evidence/challenge2-final/browser-network.json), a double-click produced **one POST**, [one Confirmation receipt](evidence/challenge2-final/confirmation.jpg) and [one Owner booking row](evidence/challenge2-final/owner.jpg).

### Pagination

Browse sends `page` and `limit` to `GET /api/slots`. The server filters first, then returns the requested page. Browse shows the results while it checks for a next page. [Backend #49](https://github.com/Frannaaa/slotdrop-gc2/pull/49) · [Browse #63](https://github.com/Frannaaa/slotdrop-gc2/pull/63)

With eight deployed sessions and `limit=3`, page 1 returned **18, 20, 22**, page 2 returned **24, 26, 28**, and page 3 returned **30, 32**. Page 4 returned `200 []`. Both `page=0` and `limit=1000` got **400 INVALID_INPUT**. In Browse, [page 1](evidence/challenge2/browse-page-1.jpg) showed six cards, [page 2](evidence/challenge2/browse-page-2.jpg) showed two, and Previous returned to page 1. [Network capture](evidence/stretch-deployed/browser-readbacks-2026-11-14.json)

### Join and compute

Owner gets released seats from `GET /api/owner/catalog` and bookings from `GET /api/bookings`. `openReleaseUtilization()` matches confirmed bookings to sessions that are currently eligible.

`utilization % = round(100 × confirmed seats / released seats)`

One booking moved the deployed metric from [**0/32 (0%)**](evidence/challenge2/owner-utilization-before.jpg) to [**1/32 (3%)**](evidence/challenge2/owner-utilization-after.jpg). A separate [14 November capture](evidence/stretch-deployed/browser-readbacks-2026-11-14.json) showed **6/48 (13%)**. The [calculation tests](../tests/owner-insights.test.js) cover cancelled bookings, ineligible sessions and invalid totals. The [Owner clock test](../tests/owner-clock.test.js) checks that the displayed figure updates when a cutoff passes.
