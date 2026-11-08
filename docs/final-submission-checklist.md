# SlotDrop GC2 — final submission evidence gate

**Owner:** Group 1 captain and all members  
**Deadline:** November 9, 2026, 11:59 PM Asia/Manila  
**Status checked:** November 8, 2026, before final integration  
**Grading source:** Canvas GC 2: MVP Build; the instructor's current rubric takes precedence over this checklist.

**Do not mark an item complete because it works in a private prototype, a local test, an unmerged branch, or an older commit.** Link the public deployment, exact tested commit, dated evidence and actual author/reviewer where applicable. Use fictional details only; sessions and payments are classroom simulations.

## Eleven required submission items

| # | Item / exact evidence | Current repo state, November 8 | Complete only when |
|---|---|---|---|
| 1 | Public Group 1 repository, reviewed `main`, tag `gc2-v1.0` | Repo: https://github.com/Frannaaa/slotdrop-gc2 ; tag **not verified** | All approved changes merged, checks run against final `main`, and the matching commit tagged |
| 2 | Public deployed URL with all six customer screens and Owner | Live at https://slotdrop-gc2-group-zx8j.onrender.com on `96d4a31`: the four read APIs return 200 and the six Challenge 1 cases pass ([run 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586)). Browse, Checkout and Confirmation are absent from current `main` | Outside-group user completes Home → Browse → Detail → Selection → Checkout → Confirmation on phone; Owner shows that same saved booking |
| 3 | PDF, maximum two pages, actual product/business/revenue economics | `docs/SlotDrop_GC2_Summary.pdf` is prepared in open PR #37, not `main` | Group verifies content and two-page limit; PR approved/merged; file/link included in submission |
| 4 | System diagram and short booking data-flow explanation | `docs/system.md` exists. Merged server booking flow is documented; public Network trace still needed | Diagram and explanation match the final commit; Challenge 2 also has a real Network screenshot and separately hand-drawn request-path diagram |
| 5 | Route table and database schema | `docs/routes.md`, `docs/schema.md` and SQL are in `main` | Reconcile every final route, filters, input, output, response/status, and migration with code after last merge |
| 6 | Exported Postman collection in `docs/` | Owner API collection in `main`; six-case booking collection in open PR #37. Its read-only requests 00a and 00b pick a live session and quote; it passed 16/16 assertions on the deployment in run 42460049586. Postman-app screenshots are still to be taken | Merge/import actual Challenge 1 collection, set public baseUrl/future bookable slot, run all six on public API, save actual response screenshots |
| 7 | `business.md`, `challenges.md`, `baseline.md` | Present but business/challenge updates in open PR #37; baseline presently unmeasured | Group authors approve reasoning; public challenge evidence completed; Lighthouse/Network baseline recorded, including three actual weaknesses |
| 8 | Stack versions and rationale in README | CI/local versions already listed; public runtime version unverified | Recheck actual deployed Node/Postgres versions and rationale, not just CI versions |
| 9 | `AI-USAGE.md` | Present in `main` with assistance records | Each member records meaningful assistance; PR assistance lines and final file agree, including later integration work |
| 10 | README run steps, roster/ownership, env variable names, Changes since GC1 | Present, but its original build-status statements were outdated | README reflects final merged app and real deployed URL, no passwords or DB URL |
| 11 | One unedited, voiced, ≤3-minute recording **per member** | **Not verified** | Every member independently predicts 3 inputs before running their own function, records outputs, changes one input/line, explains result, and supplies their own recording |

**Submission channel:** Canvas says "to be announced." Captain must use the channel actually announced; do not invent it.

## Merge and deployment blockers (November 8)

- [x] PR #45 (cleanup), #57 (Render configuration) and #56 (429 limiter) were merged into `main` on November 8 after approvals. The Render service itself still has to be connected and verified publicly.
- [ ] Fran's open PRs, in the suggested merge order: #58 line endings → #61 assistance table → the deployment bootstrap test PR (`g1/m1-deploy-readiness`) → #49 pagination → #37 business case and Challenge 1 collection → #47 this checklist and README → #53 Selection timings → #51 utilization (retarget from the merged `g1/m1-code-readability` branch to `main` first). Each needs a teammate review.
- [ ] PR #43: https://github.com/Frannaaa/slotdrop-gc2/pull/43 — Checkout/Confirmation; earlier purported approval explicitly said wrong PR. Require valid tested review and fix any post-success resubmission window.
- [ ] PR #37: https://github.com/Frannaaa/slotdrop-gc2/pull/37 — business/PDF/six-case Postman collection/evidence; require Kat's review and group's business reasoning.
- [ ] Kirsten: publish reviewed Browse and shared CSS contributions. `css_styling` exists but had no PR at the audit; `/browse.html` is missing from current `main`.
- [ ] Deploy the **group's final server and persistent PostgreSQL**, not the static prototype. Store `DATABASE_URL` only in private host environment.
- [ ] Create new future, fictional open offers through Owner if /api/slots is empty; **do not** reseed an existing database or alter historical bookings.

## Public verification matrix

Write the public origin, deployed commit, clock time, tester, request/response screenshot or link for **each** observed result. These are tasks, not assertions that they passed:

- [ ] `npm run check:gc2 -- https://PUBLIC-HOST` — read-only page/API check from repo; then manually complete real save/receipt/Owner verification.
- [ ] Browser phone widths (at least narrow 320–390px); Home → Browse filters → Detail → Selection quantity/quote → Checkout validation and simulated payment → Confirmation. Confirm loading, empty, recoverable error states, keyboard, links, no broken assets, clean Console.
- [ ] Record a newly created booking ID and its POST 201, then GET /api/bookings/:id 200, GET /api/bookings and GET /api/metrics. Remaining seats must fall by the booked quantity and booking count increase by **one transaction**, not number of seats.
- [ ] After service **restart** against the same persistent database, read the same receipt; prices and counts must remain stable.
- [ ] Run deployed Postman Challenge 1: quantity zero → 400; wrong client total/extra total field → 400 or server-derived save; over-capacity → 409; unknown id → 404; missing field → 400; no-match search → 200 and `[]`. For each record expected, **actual**, URL, request and screenshot.
- [ ] Challenge 2: actual deployed booking Network capture (method, URL, request body, status and response), precise browser → route → service → SQL → receipt → render function/file trace, plus group-drawn diagram/photo.
- [ ] Challenge 3: choose three real AI/design mistakes from your own code and individually explain how noticed, correction and evidence. AI may polish wording, not provide the group's reasoning.
- [ ] Challenge 4: identify each actual location for changing one booking/commission rule **without making the change**; refactor to one active setting if needed, with reviewed PR.
- [ ] Baseline: Lighthouse mobile Performance, Accessibility, Best Practices; first-load requests, transfer bytes, list-API response time with cache disabled; three weaknesses in the group's own words.
- [ ] Independent non-member completes public booking on their own phone without guidance; record date, device, failure(s), fix(es), retest and booking ID (no personal/contact details in repo).
- [ ] Every member personally satisfies 3 merged **code** PRs, 2 substantive reviews, two of the three historical merge windows, and the individual recording. Historical windows cannot be manufactured or backdated; tell instructor before deadline about qualifying circumstances.

## Optional bonus (up to +5, one point per evidenced challenge)

- [ ] Two-click / last-seat concurrency: demonstrate safe result; test the actual customer submit path as well as backend locking/idempotency.
- [ ] Pagination: `page` and `limit` accepted by list API and **used on Browse**.
- [ ] Too many requests: booking route emits 429, client waits and retries safely using original retry key.
- [ ] Join and compute: a customer screen combines two separate route responses and displays a derived value (e.g. savings).
- [ ] Sequential vs parallel: measure two independent requests before/after parallel load, note environment and milliseconds.

## Final captain gate

1. Do not force-push, weaken main protection, misstate teammate authorship, or merge without a qualifying human review.
2. On final `main`: run `npm ci`, `npm run check`, `npm test`, `npm run check:sql`, relevant browser and PostgreSQL CI; record commit hash.
3. Verify `README`, route/schema, PDF, Postman, `business.md`, `challenges.md`, `baseline.md`, `AI-USAGE.md` all match that commit; collect all six individual recordings.
4. Tag only the reviewed, demonstrated final `main` as `gc2-v1.0`; include that tag, actual public URL and PDF in the announced submission channel before 11:59 PM on November 9.
