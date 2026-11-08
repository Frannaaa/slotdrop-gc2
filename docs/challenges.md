# SlotDrop | Challenges and test evidence [case 1](evidence/challenge1-deployed/01-zero-quantity.jpg) | [case 2](evidence/challenge1-deployed/02-fake-total.jpg) | [case 3](evidence/challenge1-deployed/03-more-seats-than-available.jpg) | [case 4](evidence/challenge1-deployed/04-unknown-session.jpg) | [case 5](evidence/challenge1-deployed/05-missing-customer-name.jpg) | [case 6](evidence/challenge1-deployed/06-search-no-matches.jpg) |

This record separates repeatable test results from the evidence required on the final deployed group application. Actual request/response captures and group-authored explanations are retained with dates, while earlier integration notes are kept in [historical handoffs](ownership-and-execution.md).

**Latest automated verification (November 8):** [PR #37 GitHub Actions run 42455580176](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42455580176) passed **104 of 104 tests**, including the exported six-case Postman request contract and response assertions. This proves the tested code in CI, **not** that the six cases have been captured in Postman against the public Render URL. Challenge 1 deployed screenshots, Challenge 2 Network/hand-drawn evidence, Challenge 3 group-authored provenance, Challenge 4 group interpretation and all Challenge 5 individual recordings remain separate requirements.

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

| # | Request sent to the deployed API | Expected | Actual status and response | Time | Screenshot |
|---|---|---|---|---:|---|
| 1 | `POST /api/bookings` with `"quantity": 0` | 400 | **400** `INVALID_INPUT` "quantity is outside the allowed range." | 241 ms |
| 2 | `POST /api/bookings` with an extra `"total": 1` | 400, or saved with the server total | **400** `INVALID_INPUT` "Unsupported field: total" | 254 ms |
| 3 | `POST /api/bookings` for 5 seats when 4 are left | 409 | **409** `SLOT_UNAVAILABLE` "Only 4 seats are left for this session." | 257 ms |
| 4 | `POST /api/bookings` with `"slotId": 100016` (no such session) | 404 | **404** `SLOT_NOT_FOUND` "Session not found." | 254 ms |
| 5 | `POST /api/bookings` without `customerName` | 400 | **400** `INVALID_INPUT` "Provide customerName." | 245 ms |
| 6 | `GET /api/slots?q=zzzz-no-match` | 200 and an empty list | **200** `[]` | 246 ms |

Screenshots of the same run: [the four read endpoints](evidence/challenge1-deployed/00-endpoints.jpg) and [the setup quote](evidence/challenge1-deployed/00-setup-session-and-quote.jpg). They were captured from the run's GitHub job summary, which shows the request body, status line, response JSON and assertions for each case. Long one-line responses for cases 1 and 3 are cut off at the right edge of the picture; the full text is in the table above and in the run.

Every POST also carried a fresh `requestId`, fictional guest details (`GC2 QA`, `qa@example.com`), `paymentMethod: "mock_card"` and the server's `expectedTotalCentavos`; only the listed field changed.

Case 2: the server rejects any field it does not expect, so a browser cannot even send its own total. A *different* case, a stale `expectedTotalCentavos`, returns `409 PRICE_CHANGED` with a fresh quote; that is the "ask again when the price changes" rule, not this test.

**First-attempt failure, found and fixed.** The [first deployed run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42459905436) passed all six cases but failed 1 of 15 assertions: the setup request fetched its quote from `localhost`, the collection's default URL, instead of the deployment, because it read `baseUrl` from the collection variables rather than the value supplied for the run. The six cases still answered correctly because their failure conditions do not depend on the total, but they sent a stale `expectedTotalCentavos` of `304000`. The earlier local run had missed this because both URLs were `localhost:3000`. The fix split the setup into two visible requests (00a session, 00b quote) and added a test that the collection contains no hidden `pm.sendRequest` calls; it was rechecked locally on a different port before the passing deployed rerun.

**How this was run.** The laptop used for this work could not open the Render URL (its connection stalled during the TLS handshake, and Render's logs showed no incoming requests), while GitHub's network reached it normally. [.github/workflows/deployed-challenge1.yml](../.github/workflows/deployed-challenge1.yml) therefore wakes the service, records the four read endpoints and runs the collection. The run's `challenge1-deployed-evidence` artifact holds the full Newman JSON. To rerun it in the Postman app, import the collection, set `baseUrl` to the URL above and run the folder in order.

## 2. Trace a real request

[system.md](system.md) explains the booking architecture. Capture one complete deployed booking in DevTools Network: method, URL, body, status and response. Name each handler, validator and database statement, and attach the required hand-drawn diagram.

## 3. Debugging record

| Problem | How it was found | Fix and coverage |
|---|---|---|
| Saving another field rounded an unchanged booking deadline | Review of datetime-local serialization | Preserve the original timestamp; tests/owner-policy.test.js |
| A cancelled session reopened after its cutoff; a create request used the time from before a lock wait | HTTP requests returned 200 and 201 instead of 409 and 400 | Check all reopening prerequisites and sample time after the lock; tests/offers.test.js |
| An old price form undid a later pause, capacity and deadline change | Reproduced the full-field PATCH overwrite | Send only edited fields; tests/owner-edit.test.js |
| Invalid URL encodings, unsupported JSON encodings and database outages all returned 500 | Three failing regression cases | Return safe 400, 415 and 503 errors; HTTP and database-failure tests |

The team still needs its own explanation of three corrections for Challenge 3. These notes record what was observed and changed; they are not a teammate review.

## 4. Change an owner rule

Current commission inventory, rechecked November 8 on `main` (`96d4a31`) without changing the rate:

| File/line | Role | Edit to change the active rate? |
|---|---|---|
| server/config/business.js:1 | COMMISSION_BASIS_POINTS = 1000 | Yes |
| server/repositories/owner.js:3 and :8 | Import and return the setting | No |
| public/js/owner.js:87 | Preview provider proceeds using the rate from the API | No |

The **rate** lives in one place. The **fee formula** (price × rate ÷ 10,000, rounded per seat) appears three times: server/services/pricing.js:25 computes it for quotes and bookings, public/js/owner.js:87 repeats it only to preview a studio's earnings before an offer is saved, and db/schema.sql:78 checks it as a constraint on every saved receipt. Changing the rate edits none of them. Changing the *rounding rule* would mean editing all three; the owner preview could later read the fee from the quote API to remove the browser copy.

Saved receipt rates are historical. SQL checks each saved rate and its arithmetic; it does not set the active commission. Test fixtures and worked examples use fixed rates for specific cases. The current booking service reads the shared commission setting. `tests/challenge4-rate.test.js` checks the active value in the quote, stored receipt and Owner catalog.

## 5. Predict, then run

Pending individual work. Each member writes three predictions before running a chosen function, records the actual outputs and explains mismatches. The unedited voice recording must be at most three minutes and made without assistance.

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
