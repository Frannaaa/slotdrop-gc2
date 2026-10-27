# Challenges and test results

## Current results

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

The [Postman collection](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-owner-workspace/docs/SlotDrop-Fran.postman_collection.json) covers the implemented APIs. The recorded October 27 result belongs to that version of the collection.

## 1. Break the deployed booking API

Pending booking integration and public deployment. For each required case, save the request, expected status, actual response screenshot and any fix:

- Quantity 0 or -3: 400.
- Browser-supplied wrong total: 400 or a saved server-computed total.
- Too many seats: 409.
- Unknown item/session: 404.
- Missing required details: 400.
- Search with no matches: 200 and an empty array.

Local session validation tests are useful checks, but these screenshots must come from the deployed booking API.

## 2. Trace a real request

[system.md](system.md) maps the implemented offer-management code. After customer booking integration, capture one complete deployed booking in Network: method, URL, body, status and response. Name each handler, validator and database statement, and attach the required hand-drawn diagram.

## 3. Debugging record

| Problem | How it was found | Fix and coverage |
|---|---|---|
| Saving another field rounded an unchanged booking deadline | Review of datetime-local serialization | Preserve the original timestamp; tests/owner-policy.test.js |
| A cancelled session reopened after its cutoff; a create request used the time from before a lock wait | HTTP requests returned 200 and 201 instead of 409 and 400 | Check all reopening prerequisites and sample time after the lock; tests/offers.test.js |
| An old price form undid a later pause, capacity and deadline change | Reproduced the full-field PATCH overwrite | Send only edited fields; tests/owner-edit.test.js |
| Invalid URL encodings, unsupported JSON encodings and database outages all returned 500 | Three failing regression cases | Return safe 400, 415 and 503 errors; HTTP and database-failure tests |

The team still needs its own explanation of three corrections for Challenge 3. These notes record what was observed and changed; they are not a teammate review.

## 4. Change an owner rule

Current commission inventory, checked October 28 without changing the rate:

| File/line | Role | Edit to change the active rate? |
|---|---|---|
| server/config/business.js:1 | COMMISSION_BASIS_POINTS = 1000 | Yes |
| server/repositories/owner.js:3 and :8 | Import and return the setting | No |
| public/js/owner.js:88–90 | Preview provider proceeds using the API rate | No |

Saved receipt rates are historical. SQL checks each saved rate and its arithmetic; it does not set the active commission. Test fixtures and worked examples use fixed rates for specific cases. After the booking service is integrated, verify that it imports the same setting and update this inventory.

## 5. Predict, then run

Pending individual work. Each member writes three predictions before running a chosen function, records the actual outputs and explains mismatches. The unedited voice recording must be at most three minutes and made without assistance.

## Further checks

- The owner layout follows the October 28 brand book: paper/ink/blue/lime, local fonts and 48-pixel action buttons. It stayed within the page at 320, 390, 768 and 1280-pixel viewport settings.
- Simulating a database outage disabled saving; Refresh restored data and controls. A later buddy-rate edit preserved the original receipt and metrics.
- The repository review found failing checks on the earlier data/offer branches: syntax scanning assumed public/js existed, and CI tried to run the later owner restart script. Syntax scanning now starts at public/, and Docker/restart steps run only when their files exist.
- Original GC1 source checks, the public booking challenges, deployed baseline and group phone test remain open.
