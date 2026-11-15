# SlotDrop GC2 challenges

For these challenges, we tested what actually happens when someone books a workshop through SlotDrop. The workshops and payments are for the course demo, but the requests go through our Express API and the bookings are saved in PostgreSQL.

Our deployed tests used [the Render demo](https://slotdrop-gc2-group-zx8j.onrender.com/) and fictional customer details. We've linked the screenshots, test runs and code changes alongside each answer.

## Challenge 1 — Break your own API

We sent five invalid booking requests and one search that shouldn't find anything. We wanted to see whether the server would reject bad inputs without creating bookings, rather than trusting whatever the browser sent.

We used the [Postman collection](SlotDrop-GC2-Challenge1.postman_collection.json) on the deployed API. The [8 November Newman run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586) passed **16/16 assertions**, and we repeated the cases in [Postman Desktop on 10 November](evidence/challenge1-postman/health.png). For setup, we selected a Laro Ceramics session with four seats left and asked the server for the correct two-person quote of **₱5,130**.

| What we tried | Expected | What the server returned | Evidence |
|---|---|---|---|
| Book `0` seats | 400 | **400 INVALID_INPUT**, invalid quantity | [Postman](evidence/challenge1-postman/01-zero-quantity.png) · [Newman](evidence/challenge1-deployed/01-zero-quantity.jpg) |
| Send a fake `"total": 1` | 400 or server-recomputed total | **400 INVALID_INPUT**, unsupported field | [Postman](evidence/challenge1-postman/02-client-total.png) · [Newman](evidence/challenge1-deployed/02-fake-total.jpg) |
| Book 5 seats when only 4 remain | 409 | **409 SLOT_UNAVAILABLE** | [Postman](evidence/challenge1-postman/03-over-capacity.png) · [Newman](evidence/challenge1-deployed/03-more-seats-than-available.jpg) |
| Use nonexistent `slotId: 100016` | 404 | **404 SLOT_NOT_FOUND** | [Postman](evidence/challenge1-postman/04-unknown-session.png) · [Newman](evidence/challenge1-deployed/04-unknown-session.jpg) |
| Omit `customerName` | 400 | **400 INVALID_INPUT**, missing name | [Postman](evidence/challenge1-postman/05-missing-name.png) · [Newman](evidence/challenge1-deployed/05-missing-customer-name.jpg) |
| Search `zzzz-no-match` | 200, empty list | **200 []** | [Postman](evidence/challenge1-postman/06-empty-search.png) · [Newman](evidence/challenge1-deployed/06-search-no-matches.jpg) |

Each POST used a fresh request ID and fictional customer details. At the end, the bookings API returned an empty list and Owner showed `bookingCount: 0`: these negative tests hadn't accidentally sold seats. We also kept the [setup session](evidence/challenge1-postman/00a-session-setup.png), [price quote](evidence/challenge1-postman/00b-quote-setup.png) and [inventory](evidence/challenge1-postman/inventory.png) captures.

Our first deployed run actually found a mistake in the **test collection**: its setup fetched a price from `localhost` instead of Render, so it used **₱3,040** rather than **₱5,130**. The six negative cases still returned the right statuses, but the setup assertion failed ([14/15](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436)). We made the session lookup and quote two visible requests that share the active `{{baseUrl}}`, then [reran the collection successfully](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586). That fix is also our first Challenge 3 example.

One distinction mattered: the server rejects an invented client `total` outright, while an old accepted quote gets **409 PRICE_CHANGED** with a new server quote. Neither lets the browser decide the selling price.

## Challenge 2 — Trace one real request

We followed a booking in Chrome DevTools on **15 November at 2:01 AM PHT**, using the public Render build [`93d931a`](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbs72tc9v7es73billgg) at a 400 × 552 viewport. The customer booked **one Bumi & Ashe mug-making seat for ₱2,385**.

| What happened | Actual request | Result |
|---|---|---|
| Checkout sent the booking | `POST /api/bookings`: slot **38**, quantity **1**, `expectedTotalCentavos: 238500`, a request ID, fictional contact details and simulated pay-on-site | **201 Created**; saved total **₱2,385**, platform fee **₱238.50** |
| Confirmation fetched the saved record | `GET /api/bookings/f6148274-8de0-4558-ada3-2a8b3dc68217` | **200 OK**, same booking and saved prices |
| Owner read the bookings | `GET /api/bookings` | Same reference, amount and fee in the bookings list |

The [15 November Network record](evidence/challenge2-final/devtools-booking-2026-11-15.json) includes the full URL, request body, HTTP statuses and sanitized responses. We also have a [14 November full-browser capture](evidence/challenge2-final/browser-network.json) with a [Confirmation screenshot](evidence/challenge2-final/confirmation.jpg) and [Owner screenshot](evidence/challenge2-final/owner.jpg); those belong to **a different booking**, so we haven't presented them as screenshots of the 15 November receipt.

### How that booking travelled through our code

The paths below describe the [actual build used in the 15 November trace](https://github.com/Frannaaa/slotdrop-gc2/tree/93d931aff00363e09120c5d5c590b12b4aeeb897).

| Step | File and function | What it did |
|---|---|---|
| **Checkout button** | `public/js/checkout.js`, submit handler | Checked the form and quote, made a stable `requestId` and disabled another submit |
| **Browser request** | `public/js/customer-common.js`, `retryLimitedBooking()` and `request()` | Sent the JSON POST; a 429 retry would reuse the same request |
| **API route** | `server/app.js` → `server/routes/bookings.js` | Applied the limiter and handed the request to `createBooking()` |
| **Validation** | `bookingRequest()` in `server/services/bookings.js` | Checked the fields, types, payment choice and quantity |
| **Save** | `createBooking()` in `server/services/bookings.js`, using `transaction()` in `server/repositories/database.js` | Checked the request ID, locked the slot using `SELECT … FOR UPDATE`, rechecked seats/cutoff, recomputed `priceQuote()`, checked the accepted total, then inserted and committed the booking |
| **POST response** | Booking route, `receiptResponse()` | Returned **201** and the saved receipt; the same request sent again would return **200** with that receipt |
| **Confirmation GET** | `public/js/confirmation.js` → booking GET route → `findReceipt()` in `server/services/bookings.js` | Fetched the saved record by ID and displayed the reference, quantity, total and payment choice |
| **Owner readback** | `public/js/owner.js` → `server/routes/owner.js` → `listBookings()` in `server/repositories/owner.js` | Read the saved booking independently from the database |

The important part is that **showing a quote doesn't reserve a seat**. We lock and recheck the slot when saving, and the accepted prices stay on the booking row. That's why two people cannot both book the same last seat, and why reopening Confirmation doesn't depend on Checkout keeping its data in the browser.

**Hand-drawn request trace:** The brief asks us to draw this same journey ourselves, in addition to the typed [system diagram](system.md). The diagram should follow the recorded booking `f6148274-8de0-4558-ada3-2a8b3dc68217` from Checkout POST → validation → slot lock/price check → database insert and commit → **201** response → Confirmation GET → **200** receipt. Add the group’s photo to this section.

## Challenge 3 — Overrule the AI

Three pieces of AI-assisted work needed a second look. In each case the code seemed reasonable until a test or teammate review exposed the problem.

### 1. Our Postman test was asking the wrong server for a price

A [Claude-assisted setup script](https://github.com/Frannaaa/slotdrop-gc2/commit/5bb731a3979dbd91bc799639d9ca747a82f51de9) hid a quote request that read the collection's saved host. On the deployed run, the saved host was still `localhost`. It gave us a **₱3,040** quote for a session that Render priced at **₱5,130**.

We caught it when the setup assertion failed in [Newman (14/15)](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436). Instead of patching the expected number, we changed the test design: separate visible session and quote requests, both using the active run's host. The [fix](https://github.com/Frannaaa/slotdrop-gc2/commit/60b0bb29876ae45d0b30b45e525364d0798c6446) passed [16/16 on Render](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586). The six invalid requests had looked fine before that; the setup data had not been.

### 2. Editing one Owner field could undo someone else's changes

The [first Codex-assisted Owner editor](https://github.com/Frannaaa/slotdrop-gc2/commit/6e06dde742fcecd028bf4d41f6fdee57633c3899) submitted **every** form field during an edit, even if the owner had only changed the price. We realized an old browser tab could accidentally undo a newer pause or capacity change.

We reproduced that in [`tests/owner-edit.test.js`](../tests/owner-edit.test.js): one edit paused the workshop, set capacity to **8** and moved the cutoff forward **15 minutes**; a stale form then tried to update only the price to **₱1,610**. We changed the PATCH to send only the fields that differ from the form's original snapshot, using [`changedOfferFields()`](../public/js/owner-policy.js). The [regression and fix](https://github.com/Frannaaa/slotdrop-gc2/commit/f3dcfa69f6ec0c1614b6ff84fe4c698bf2757828) kept the new price **without** undoing the pause, capacity or cutoff. Edits to the *same* field still need version handling in a later release.

### 3. A future session could already be closed for booking

The [Claude-assisted catalog change in #59](https://github.com/Frannaaa/slotdrop-gc2/pull/59) counted sessions with a future start time as available. Kirsten pointed out that a future start doesn't guarantee an open booking window. A class can begin later today while its booking cutoff has already passed.

For the [#71 regression](https://github.com/Frannaaa/slotdrop-gc2/pull/71), we used two sessions starting **30 and 40 minutes later**, with both booking cutoffs already over. The old rollover logic added **0** new sessions where the test expected **2**. Janelle changed the rule to check the cutoff, open status, confirmation that the class would run and remaining seats; Kirsten reviewed it, and the [catalog tests](../tests/reference-catalog.test.js) passed. This kept Browse from being treated as stocked when the displayed sessions were no longer bookable.

These weren't cosmetic changes. They affected the truth of our tests, the safety of Owner edits and whether a customer could actually book a listed workshop.

## Challenge 4 — The owner changes a rule

We chose a rule that affects both sides of a booking: **what if SlotDrop's commission changes from 10% to 12%?** We shouldn't have to change the rate separately in Checkout, the database and the Owner dashboard.

### Files involved

| File / line on the release candidate | What it does | Edit for the new rate? |
|---|---|---|
| `server/config/business.js:1` | Defines `COMMISSION_BASIS_POINTS = 1000` | **Yes**, change `1000` to `1200` |
| `server/services/pricing.js:20,22` | Quotes the booking using the configured rate | No |
| `server/services/bookings.js:109,120` | Recomputes and saves the fee and rate | No |
| `server/repositories/owner.js:3,8` | Makes the rate available to Owner | No |
| `public/js/business-config.js:18` | Rounds the per-seat commission for server quotes and Owner previews | No |
| `public/js/owner.js:89` | Calculates the Owner payout preview | No |
| `db/schema.sql:79` | Checks recorded fee against the rate saved on each receipt | No |

The [rate test](../tests/challenge4-rate.test.js) checks that the active rate is defined in one place. Quotes, saved bookings and Owner estimates use that value; receipts also preserve the rate that applied at the time.

For **two buddy seats at ₱2,565 each**:

| | 10% commission | 12% commission |
|---|---:|---:|
| Customer pays | **₱5,130** | **₱5,130** |
| SlotDrop gets | ₱513 | ₱615.60 |
| Studio receives | ₱4,617 | ₱4,514.40 |

We tried the single-line **1000 → 1200** change in a disposable local test database, not on the live demo. [Both rate tests passed](../tests/challenge4-rate.test.js). More importantly, we restarted the app against the **same** stored database: an older ₱1,600 booking still had its **₱160** fee and **₱1,440** payout, while a new booking at 12% recorded a **₱192** fee and **₱1,408** payout. [Tested baseline](https://github.com/Frannaaa/slotdrop-gc2/commit/e994ffddb1ba9635e19091eab30436b80d299489).

So our answer is **one configuration line for new bookings**, with past receipts left alone. The deployed demo still uses **10%**.

## Challenge 5 — Predict, then run

Each of us records our own function, predicts the outputs for **three inputs before running the function**, shows what actually happens, and explains any differences. We also change an input or line and explain the new result. The assignment requires **our own voice, an unedited recording of at most three minutes, and no AI assistance during the recording**.

[Group video folder](https://drive.google.com/drive/folders/1U2MMvoRrhgov5SSZ0HdGHf51kiJ9c4Uj)

### Individual recording links

| Member | Video |
|---|---|
| Fran (M1) | Link to be added |
| Cholo / Chonel (M2) | [Chonel's recording](https://drive.google.com/file/d/1Ms970zkXeCqHRqoOGZNs8MHzaGo3ivZ4/view?usp=drivesdk) |
| Janelle (M3) | [Janelle's `priceQuote` recording](https://drive.google.com/file/d/1pJMJDHhrfR6EWDazqLopU-RuFoPVv5Pw/view?usp=drivesdk) |
| Kaitlyn (M4) | Link to be added |
| Kat / Kaithlyn (M5) | Link to be added |
| Kirsten (M6) | [Kirsten's recording](https://drive.google.com/file/d/1LJxyMj9HbWRehO8hwoVBs4Eeh2n9MUKE/view?usp=drivesdk) |

These are the three files in the supplied folder as of **15 November**. We still need the other individual links and a check that all six recordings open for our instructor and meet the assignment's content and time limit.

## Stretch challenges

We also tested the five optional behaviors worth **one bonus point each**.

### Sequential or parallel

Selection needs the session details and a quote, and neither depends on the other response. We changed it to use `Promise.all` in `public/js/selection.js`.

| Load method | Median of 15 trials |
|---|---:|
| Sequential | **398.0 ms** |
| Parallel | **200.2 ms** |

That saved about **198 ms (50%)** in the [timing benchmark](evidence/stretch-deployed/sequential-vs-parallel.jpg) ([CI run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42462032799)). A [public browser check on 14 November](evidence/stretch-deployed/browser-readbacks-2026-11-14.json) also showed the two requests starting **0.3 ms apart** and running at the same time.

### Too many requests

We deliberately sent **30 invalid booking POSTs** from one browser in a minute. The next submission returned **429 RATE_LIMITED** and `Retry-After: 59`. Checkout displayed the wait, kept Submit disabled and retried the **same request ID and body** after **59,003 ms**.

The retried POST returned **201**, creating **one ₱2,880 booking**; [Confirmation](evidence/stretch-deployed/checkout-429/confirmation.jpg) and [Owner](evidence/stretch-deployed/checkout-429/owner.jpg) both showed `26ccfbce-9a9d-49f6-b3c1-35674477ebf5`, and seats fell from **3 to 2**. Here's the [Network record](evidence/stretch-deployed/checkout-429/network.json) and [waiting-screen screenshot](evidence/stretch-deployed/checkout-429/waiting.jpg).

The captured Render build counted requests by socket address. PR #72 updates this to use the client address; [integration tests](../tests/booking-rate-limit.test.js) cover clients behind the same proxy, while that newer behavior still needs a check on the final deployed host.

### The double click

We caught a short gap where Checkout re-enabled Submit after saving but before moving to Confirmation. A second click there could have sent a different request ID. [Kat's review on #43](https://github.com/Frannaaa/slotdrop-gc2/pull/43#pullrequestreview-5817789602) led to a `navigating` lock that keeps Submit disabled, with a [browser regression](../tests/checkout-browser.test.js).

The server also treats identical request IDs as retries (same receipt, **200**) and rejects conflicting reuse (**409**). PostgreSQL row locking prevents two customers from purchasing the same final seat. We test both cases in [booking tests](../tests/bookings.test.js) and [PostgreSQL locking tests](../tests/postgres-locking.test.js).

In the [14 November deployed browser run](evidence/challenge2-final/browser-network.json), a double-click produced **one POST**, [one Confirmation receipt](evidence/challenge2-final/confirmation.jpg) and [one Owner booking row](evidence/challenge2-final/owner.jpg).

### Pagination

Browse calls `GET /api/slots?page=…&limit=…` so the server filters and pages sessions before returning them. The release shows the current page before checking whether another page exists ([backend #49](https://github.com/Frannaaa/slotdrop-gc2/pull/49), [Browse #63](https://github.com/Frannaaa/slotdrop-gc2/pull/63)).

With eight deployed sessions, `limit=3` returned **18, 20, 22** on page 1; **24, 26, 28** on page 2; **30, 32** on page 3; and an empty list with **200** on page 4. Invalid `page=0` and `limit=1000` returned **400 INVALID_INPUT**. In the actual six-card UI, [page 1](evidence/challenge2/browse-page-1.jpg) displayed six sessions, [page 2](evidence/challenge2/browse-page-2.jpg) displayed the remaining two, and Previous returned to page 1 ([Network capture](evidence/stretch-deployed/browser-readbacks-2026-11-14.json)).

### Join and compute

Owner fetches **released-seat inventory** from `GET /api/owner/catalog` and **confirmed bookings** from `GET /api/bookings`. `openReleaseUtilization()` in `public/js/owner-insights.js` joins them by session and calculates:

`utilization % = round(100 × confirmed seats / released seats)`

On the deployed site, the metric changed from [**0/32 seats (0%)**](evidence/challenge2/owner-utilization-before.jpg) to [**1/32 (3%)**](evidence/challenge2/owner-utilization-after.jpg) after a booking. A separate [14 November response capture](evidence/stretch-deployed/browser-readbacks-2026-11-14.json) checked the displayed **6/48 = 13%**. The [unit tests](../tests/owner-insights.test.js) cover cancelled bookings, paused or expired sessions and invalid totals.

---
