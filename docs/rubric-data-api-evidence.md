# GC2 Rubric 2 — Data and API correctness (20 points) + M1 Git gate

**Captain source audit:** November 8, 2026 (Asia/Manila). This report preserves the original PR #45 test run. The [public booking trace](challenges.md#challenge-2--trace-one-real-request) and [PR #72 CI](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43584032537) add current browser and PostgreSQL evidence.

## Rubric: what has been observed

| Exemplary condition | Real code/tests | Outcome |
|---|---|---|
| Real DB behind team's own routes | `server/app.js` routes → services → `server/repositories/database.js`, SQL schema and five tables. `TEST_DATABASE_URL` in CI runs tests with PostgreSQL 16; production Docker+Postgres test uses `DATABASE_URL`. | **Passed in CI and exercised in the public browser booking** |
| Each route returns correct status codes | `tests/rubric-data-api.test.js` checks 23 GET/list/quote/unknown/invalid/fallback route cases, plus POST/PATCH validation and status paths. Existing dedicated `tests/*.test.js` cover additional owner, provider, pricing and booking cases. | **Passed; no wrong status found in tested cases**. This is not proof of all theoretical inputs |
| Server validates and recomputes totals | `server/services/pricing.js` and `server/services/bookings.js` share authoritative pricing; reject browser-supplied price fields (400) and mismatched acknowledged amount (409 PRICE_CHANGED); verify standard/buddy, per-seat fee and total snapshots. | **Passed with real PostgreSQL CI** |
| Stock/slots change exactly once | POST /api/bookings locks session row, checks free seats, saves booking and recomputes remaining seats from confirmed bookings; identical retry returns same receipt 200. | **Passed**: 4 → 2 for two seats, sold-out returns 409; one-seat smoke 4 → 3 |
| Confirmation reads by ID | `GET /api/bookings/:id` loads saved DB receipt by UUID (200), malformed ID (400), missing ID (404). The merged `public/js/confirmation.js` calls this API by URL ID. | **Passed in CI and the public browser trace** |
| Survives restart | `tools/check-release.mjs` creates API offer, quotes/saves a real SQL booking in a production Docker container backed by PostgreSQL 16; restarts that container and checks same receipt, replay, seat count, Owner metrics. | **Passed in disposable production-container CI**; official hosted service restart remains unverified |

### Verified CI run (implementation commit)

[**GC2 checks CI run 42397754778**](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42397754778), implementation commit `38b2d0de64618d8ef04b19466be6657a55c491d8` on PR #45, finished successfully:

- **98 tests passed, 0 failed** with PostgreSQL test database.
- `npm run check`, `npm run check:sql`, and dedicated **Fran/M1 cross-route data/API matrix** passed.
- `tools/check-transaction-smoke.mjs` **local disposable PGlite** API booking gave 201 POST, 200 receipt GET, 200 exact-key retry; one seat 4 → 3; Owner booking count 0 → 1 with the exact saved ID once.
- **Real PostgreSQL 16 + production Docker container**: new quote/booking saved before container restart, identical receipt found after restart, retry remained idempotent, Owner and seat counts persisted. This is not a restart of a hosted Render instance.
- Git history filename audit found **190 distinct reachable historical object paths** without common tracked `.env`, `node_modules`, local database, private-key or credential filenames. A second scan inspected **746 distinct reachable historical text blobs** (zero oversized skipped) and found no common high-confidence private-key headers or GitHub, AWS, OpenAI and Slack token signatures. Both checks are safe (they never output secret values) and **neither guarantees arbitrary credentials are absent**.

### Representative actual HTTP status cases

| API operation | Expected / observed |
|---|---|
| GET /api/health; /api/slots; /api/slots/1; /api/pricing/quote?slotId=1&quantity=2; /api/bookings; /api/metrics | 200 |
| POST /api/slots with valid offer | 201 |
| POST /api/bookings with valid authoritative quote | 201 |
| Identical booking POST requestId replay | 200, exact same receipt |
| Invalid query/quantity, unknown request body fields, browser-injected money, missing guest field | 400 INVALID_INPUT |
| Unknown session on GET/detail/quote/booking | 404 SLOT_NOT_FOUND |
| Unknown receipt UUID | 404 BOOKING_NOT_FOUND |
| Stale acknowledged amount | 409 PRICE_CHANGED, fresh server quote, no booking inserted |
| Too many seats / paused or closed session | 409 SLOT_UNAVAILABLE |
| Same requestId with different booking details | 409 REQUEST_KEY_CONFLICT |
| Generic unsupported API route | 404 ROUTE_NOT_IMPLEMENTED |

All statuses above are exercised in the specialized rubric test or existing tests; do not treat them as screenshots from the public group deployment.

## Fran (M1) individual Git minimums — confirmed records

- **Three merged code PRs:** more than required, including [#22](https://github.com/Frannaaa/slotdrop-gc2/pull/22) (code + setup), [#27](https://github.com/Frannaaa/slotdrop-gc2/pull/27) (SQL discovery), [#28](https://github.com/Frannaaa/slotdrop-gc2/pull/28) (offer API), [#29](https://github.com/Frannaaa/slotdrop-gc2/pull/29) (Owner API/UX), [#34](https://github.com/Frannaaa/slotdrop-gc2/pull/34) (discovery filters/migration), [#36](https://github.com/Frannaaa/slotdrop-gc2/pull/36) (customer helper), and [#39](https://github.com/Frannaaa/slotdrop-gc2/pull/39) (sourced catalog). Documentation-only [#30](https://github.com/Frannaaa/slotdrop-gc2/pull/30) is **excluded** from the code count.
- **Two substantive reviews:** Fran's actual commented [approval of Janelle's quote PR #40](https://github.com/Frannaaa/slotdrop-gc2/pull/40) and [approval of Janelle's booking PR #42](https://github.com/Frannaaa/slotdrop-gc2/pull/42), both with described testing and concrete integration findings.
- **Two historical merged-work windows:** October 14–28 — #22 merged October 28. October 29–November 4 — #27/#28 merged October 30, #29/#34 merged November 2, #39 merged November 3. **No newly merged window 3 is required for Fran** to meet the 2-of-3 minimum.
- **Group protected-main:** no direct push was performed during this audit; previous #45 merge was blocked by the required eligible approval. GitHub's branch-protection rule must remain intact.
- **Main tag:** Apply `gc2-v1.0` to the reviewed release commit.

## Release verification

The public booking and receipt readback are documented in [Challenges](challenges.md#challenge-2--trace-one-real-request). Production-container restart evidence uses a disposable PostgreSQL database. The final host, tag and outside-group phone walkthrough are tracked in the [submission checklist](gc2-submission-gate.md).
