# SlotDrop | Challenges and Evidence

Evidence for the GC2 challenges (brief section 7). Results from the deployed site are kept apart from local and CI test runs. All sessions, seats, prices, payments and bookings are simulated, and test requests use fictional guest details.

**Deployed site:** https://slotdrop-gc2-group-zx8j.onrender.com (Render service `slotdrop-gc2-group-zx8j`, branch `main`)

## Status on 12 November 2026

| Challenge | Status | Evidence here | Still needed |
|---|---|---|---|
| [1. Break your own API](#challenge-1--break-your-own-api) | **Complete** on the deployed API | Six requests, statuses, responses, screenshots, and one first-attempt failure we fixed | Optional: the same run captured in the Postman app |
| [2. Trace one real request](#challenge-2--trace-one-real-request) | **Trace written; live capture pending** | Every hop named by file and function | One booking on the deployed site with the Network tab open, and the hand-drawn diagram. Needs Checkout (PR #43) merged. |
| [3. Overrule the AI](#challenge-3--overrule-the-ai) | **Cases listed; write-up pending** | Seven documented corrections to choose from | The group's own account of three of them |
| [4. The owner changes a rule](#challenge-4--the-owner-changes-a-rule) | **File list complete; explanation pending** | The commission rate is set in one place | The group's explanation |
| [5. Predict, then run](#challenge-5--predict-then-run) | **Individual** | | Each member's predictions and recording |
| [Stretch challenges](#stretch-challenges) | **1 complete, 4 partly done** | Deployed timings and 429 result | See the stretch table |

## Challenge 1 — Break your own API

**Result: all six cases answered as expected on the deployed API.**

| | |
|---|---|
| **Collection** | [SlotDrop-GC2-Challenge1.postman_collection.json](SlotDrop-GC2-Challenge1.postman_collection.json) |
| **Target** | The deployed site above, commit `96d4a31` |
| **When** | 8 November 2026, 07:45 UTC |
| **Run** | [GitHub Actions run 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586), Newman 6.2.1, 16 of 16 assertions passed |

### The six requests

| # | Request sent | Expected | Status and response we got | Time | Screenshot |
|---|---|---|---|---:|---|
| 1 | `POST /api/bookings` with `"quantity": 0` | 400 | **400** `INVALID_INPUT` "quantity is outside the allowed range." | 241 ms | [case 1](evidence/challenge1-deployed/01-zero-quantity.jpg) |
| 2 | `POST /api/bookings` with an extra `"total": 1` | 400, or saved with the server's total | **400** `INVALID_INPUT` "Unsupported field: total" | 254 ms | [case 2](evidence/challenge1-deployed/02-fake-total.jpg) |
| 3 | `POST /api/bookings` for 5 seats when 4 are left | 409 | **409** `SLOT_UNAVAILABLE` "Only 4 seats are left for this session." | 257 ms | [case 3](evidence/challenge1-deployed/03-more-seats-than-available.jpg) |
| 4 | `POST /api/bookings` with `"slotId": 100016` (no such session) | 404 | **404** `SLOT_NOT_FOUND` "Session not found." | 254 ms | [case 4](evidence/challenge1-deployed/04-unknown-session.jpg) |
| 5 | `POST /api/bookings` without `customerName` | 400 | **400** `INVALID_INPUT` "Provide customerName." | 245 ms | [case 5](evidence/challenge1-deployed/05-missing-customer-name.jpg) |
| 6 | `GET /api/slots?q=zzzz-no-match` | 200 with an empty list | **200** `[]` | 246 ms | [case 6](evidence/challenge1-deployed/06-search-no-matches.jpg) |

More screenshots from the same run: [the four read endpoints](evidence/challenge1-deployed/00-endpoints.jpg) and [the setup quote](evidence/challenge1-deployed/00-setup-session-and-quote.jpg).

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

The laptop used for this work could not open the Render address: the connection stalled, and Render's logs showed no request arriving. GitHub's servers reached it normally. So [.github/workflows/deployed-challenge1.yml](../.github/workflows/deployed-challenge1.yml) wakes the service, records the four read endpoints and runs the collection with Newman. The screenshots are of that run's job summary, which shows each request body, status line, response and assertion. The long responses for cases 1 and 3 are cut off at the right edge of the picture; the full text is in the table above and in the run. The full Newman output is in the run's `challenge1-deployed-evidence` artifact.

To repeat it in the Postman app: import the collection, set `baseUrl` to the deployed address, and run the folder in order.

## Challenge 2 — Trace one real request

**Status: the trace is written; the live capture is still pending.** The deployed site has no Checkout page yet. Checkout and Confirmation are in PR #43, and Browse is in PR #62 and #63.

### Every hop, by file and function

Line numbers are from `main` at `285ce61` for the server and shared code, and from PR #43 at `cabe9fa` for Checkout and Confirmation.

| Hop | File and function | What happens |
|---|---|---|
| **Button handler** | `public/js/checkout.js:95`, the form's `submit` listener | Stops if the form is busy, already navigating, not accepted, or invalid. Builds `{requestId, slotId, quantity, customerName, customerEmail, paymentMethod, expectedTotalCentavos}` with a new `crypto.randomUUID()` (line 110) and disables the button. |
| **Request** | `checkout.js:139` → `retryLimitedBooking()` in `public/js/customer-common.js:87` → `request()` at line 46 | `fetch` with JSON headers and a 15-second timeout. A 429 is retried once with the same body. Any other failure becomes an error carrying the API's `code`. |
| **Route** | `server/app.js:28` `bookingRateLimiter`, then `server/app.js:29` `bookingRouter`; `server/routes/bookings.js:7` | The limiter allows 30 booking POSTs a minute. The route calls `createBooking(db, req.body, clock)`. |
| **Validation** | `bookingRequest()` in `server/services/bookings.js:39` | Rejects unknown fields such as `total`, and checks each field's type and range. Failure → 400 `INVALID_INPUT`. |
| **Database statements** | `createBooking()` in `server/services/bookings.js:91`, one transaction | 1. Looks up the `requestId`; a retry gets the saved receipt back. 2. `SELECT id FROM slots WHERE id=$1 FOR UPDATE` (line 99) locks the session. 3. Reads the session again (line 104). 4. `checkBookable()` (`server/services/pricing.js:8`, called at line 107) refuses a closed or full session with 409. 5. `priceQuote()` (`pricing.js:22`, called at line 109) recomputes the price, tier and commission. 6. Compares with `expectedTotalCentavos`; a difference → 409 `PRICE_CHANGED` (line 111). 7. `INSERT INTO bookings …` (line 114). 8. Reads the receipt back (line 121) and commits. |
| **Response** | `server/routes/bookings.js:9`, shaped by `receiptResponse()` (`bookings.js:56`) | 201 with the saved receipt, or 200 for an identical retry. |
| **What renders** | `checkout.js:159` goes to `/confirmation.html?id=…`. `load()` in `public/js/confirmation.js:6` calls `GET /api/bookings/:id` (line 14) → `server/routes/bookings.js:11` → `findReceipt()` (`bookings.js:134`) | Confirmation (line 17) shows the booking reference, seats, price per person, saved total and payment choice, read back from PostgreSQL. |

Seats are not stored as a counter. Seats left = released seats − confirmed bookings, so saving the booking row is what makes the seats unavailable.

### A local example of the same request

This is from a local run on 7 November, **not** the deployed capture. `POST /api/bookings` returned 201, and `GET /api/bookings/917d1fa9-9a71-4a2f-873e-78c6ea4b8c9e` returned the same receipt with 200. The names and prices are from the older fictional test data.

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

### Still needed

1. Merge and deploy Checkout and Confirmation (PR #43).
2. Place one fictional booking on the deployed site with DevTools → Network open. Record the method, URL, request body, status and response of `POST /api/bookings`, and the `GET /api/bookings/:id` that follows.
3. Save the screenshots in `docs/evidence/challenge2/` and add the booking ID here.
4. Attach the hand-drawn diagram of the trip (a photo is fine).

If no session can be booked, add a future one on the Owner screen. Do not reseed the database. Since PR #59, the sample dates also move forward on restart once every sample session has started.

## Challenge 3 — Overrule the AI

**Status: the cases are listed; the group's write-up is still pending.** The brief asks for three moments, in our own words: what the AI gave us, how we noticed, and what we did instead.

### Cases we can choose from

Each of these is recorded in the repository. The tests show what went wrong and what was changed. They do not show which parts came from an AI tool, so whoever worked on each case should confirm that before writing it up.

| # | What was wrong | How it was noticed | What was done instead | Evidence |
|---|---|---|---|---|
| A | The Challenge 1 setup request fetched its quote from `localhost`, not the deployed site | The first deployed run failed 1 of 15 assertions | Split the setup into two visible requests and added a test against hidden requests | [Run 42459905436](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436); `tests/challenge1-postman.test.js` |
| B | The Windows line-ending fix covered only one of two Owner test files | After merging `main`, `tests/owner-toggle.test.js` still failed on Windows | Normalized that file too and added it to the Windows CI job | PR #58 |
| C | The health route said "ok" even with no database or tables, so Render would mark a broken service as live | An audit of the health check before deployment | Return 503 in production until the tables exist | `server/routes/health.js`, `tests/health.test.js` |
| D | Saving another field rounded a booking deadline that had not been edited | Review of how the date field was converted | Keep the original timestamp | `tests/owner-policy.test.js` |
| E | A cancelled session reopened after its deadline, and a new session used a time read before a lock wait | Requests returned 200 and 201 where 409 and 400 were expected | Check every condition before reopening, and read the time after the lock | `tests/offers.test.js` |
| F | An old price form overwrote a later pause, seat count and deadline change | Reproduced by sending the whole form in one PATCH | Send only the fields that were edited | `tests/owner-edit.test.js` |
| G | Bad URL encodings, unsupported JSON encodings and database outages all returned 500 | Three failing regression tests | Return 400, 415 and 503 with safe messages | `tests/http.test.js`, `tests/database-failures.test.js` |

### Our three moments

*To be written by the group, in our own words.*

**Moment 1**
- What the AI gave us:
- How we noticed:
- What we did instead, and why:

**Moment 2**
- What the AI gave us:
- How we noticed:
- What we did instead, and why:

**Moment 3**
- What the AI gave us:
- How we noticed:
- What we did instead, and why:

## Challenge 4 — The owner changes a rule

**The rule:** "Change the commission from 10%." Checked on `main` at `285ce61`. No rate was changed.

### Every place the commission appears

| File and line | What it does | Edit it to change the rate? |
|---|---|---|
| `server/config/business.js:1` | `COMMISSION_BASIS_POINTS = 1000` | **Yes. This is the only edit.** |
| `server/services/pricing.js:22` and `:25` | `priceQuote()` takes the rate and computes the fee for quotes and bookings | No |
| `server/services/bookings.js:109` and `:120` | Passes the rate to `priceQuote()` and saves it with the booking | No |
| `server/repositories/owner.js:3` and `:8` | Sends the rate to the Owner screen | No |
| `public/js/owner.js:87` | Previews a studio's earnings using the rate from the API | No |
| `db/schema.sql:78` | Checks that each saved fee matches its saved rate | No |

`tests/challenge4-rate.test.js` checks that the quote, the saved booking and the Owner screen all use the one setting.

### What the list shows

- **The rate is in one place.** Changing it means editing one line.
- **The fee formula is in three places.** Price × rate ÷ 10,000, rounded per seat, is computed in `pricing.js:25`, repeated in `public/js/owner.js:87` for the earnings preview, and checked as a database constraint in `db/schema.sql:78`. Changing the rate touches none of them. Changing how the fee is *rounded* would mean editing all three.
- **Old bookings keep their old rate.** Each booking saves the rate and fee it was made with, so a new rate applies only to new bookings.
- **One possible clean-up.** The Owner preview could read the fee from the quote API, which would remove the copy in the browser.

### Our explanation

*To be written by the group:* why the rate is in one place but the formula is in three, and whether the Owner preview should ask the server for the fee.

## Challenge 5 — Predict, then run

Individual work. Each member picks one function they wrote, writes three inputs and the output they predict for each, runs them, and explains any mismatch. The recording is unedited, has the member's own voice, lasts at most three minutes, and is made without AI assistance.

## Stretch challenges

Deployed measurements are from [run 42462032799, attempt 3](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42462032799), on 8 November 2026 at 08:36–08:38 UTC, against commit `96d4a31`. None of the requests created a booking: `GET /api/metrics` still showed `bookingCount: 0` afterwards.

| Stretch | Status | What is done | What is left |
|---|---|---|---|
| [Sequential or parallel](#sequential-or-parallel) | **Complete** | Selection loads two requests in parallel; timed on the deployed site | |
| [Too many requests](#too-many-requests) | **Server done; page in review** | 429 with `Retry-After` shown on the deployed API | Checkout's wait-and-retry is in PR #43 |
| [The double click](#the-double-click) | **Server done; page in review** | Retries and last-seat races are safe in tests | Show a real double click once Checkout is merged |
| [Pagination](#pagination) | **API done; page in review** | `?page=` and `?limit=` are on `main` (PR #49) | Browse uses them in PR #63 |
| [Join and compute](#join-and-compute) | **In review** | Seat utilization from two Owner routes (PR #51) | Review, merge and show it on the deployed site |

### Sequential or parallel

Selection loads the session and the price quote together with `Promise.all` (`public/js/selection.js:19`). Neither request needs the other: both use only the `slotId` and `quantity` from the address.

| How the two requests are sent | Median | Fastest | Slowest |
|---|---:|---:|---:|
| One after the other (before) | 398.0 ms | 385.6 ms | 730.8 ms |
| Together (after, the current code) | 200.2 ms | 194.3 ms | 535.5 ms |

The requests were `GET /api/slots/1` and `GET /api/pricing/quote?slotId=1&quantity=2`, 15 alternating trials after 3 warm-ups. Sending them together halved the wait, because each costs about one round trip to Singapore and the two now overlap. The times were measured from a GitHub server, not a phone browser. [Screenshot](evidence/stretch-deployed/sequential-vs-parallel.jpg).

### Too many requests

| Step | Result on the deployed API |
|---|---|
| 25 refused `POST /api/bookings` requests (quantity 0) | 25 × **400** |
| The next POST | **429** `RATE_LIMITED`, with `Retry-After: 30` |
| The same request 31 seconds later | **400** again, so the limit had reset |

The limit is 30 booking POSTs per minute for each client address (`server/middleware/booking-rate-limit.js`). The 429 arrived on attempt 26 because the Challenge 1 job in the same run had already sent 5 POSTs that minute. [Screenshot](evidence/stretch-deployed/too-many-requests-429.jpg).

**Front end.** `retryLimitedBooking()` (`public/js/customer-common.js:87`) waits for the time the server gives and resends the same request once. Checkout calls it in PR #43 (`checkout.js:139`) and shows "Booking traffic is high. Retrying this same request in … seconds…".

**Known limit.** On Render, every request reaches the app through Render's proxy, so the "per client" count is probably shared by all visitors.

### The double click

- **Same booking sent twice.** A retry with the same `requestId` returns the first receipt with 200. No second booking is saved.
- **Two customers, last seats.** The row lock in `createBooking()` lets only one of two simultaneous bookings succeed: one gets 201 and the other 409 (`tests/postgres-locking.test.js`, `tests/bookings.test.js`).
- **On the page.** Checkout in PR #43 disables the button while saving and keeps it locked while moving to Confirmation.

This was not run on the deployed site because it would create bookings. A real double click can be shown once Checkout is merged.

### Pagination

`GET /api/slots` accepts `?page=` and `?limit=` on `main` (PR #49). Paging is applied after the filters and the sort. Browse in PR #63 requests `/api/slots?page=…&limit=6` and shows Previous and Next buttons. It is in review, on top of the Browse page in PR #62.

### Join and compute

PR #51 combines `GET /api/owner/catalog` and `GET /api/bookings` on the Owner screen to show how many released seats in open sessions are booked. It needs a review and merge before it is on the deployed site.

## Earlier test records

These are older local and CI runs, kept for the record. They are **not** evidence from the deployed site.

<details>
<summary>Run log, 27 October to 8 November</summary>

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
