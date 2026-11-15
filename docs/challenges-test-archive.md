# Earlier SlotDrop test records (archive)

This is the historical local and CI testing record moved out of the main [Challenges report](challenges.md) for readability. These runs remain dated and **must not be presented as final deployed evidence**. The final rubric answers and their deployed captures remain in `challenges.md`.

## Historical local and CI runs

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
