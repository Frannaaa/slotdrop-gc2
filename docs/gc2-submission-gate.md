# GC2 submission checklist

This checklist follows the Canvas **GC 2: MVP Build** assignment. The extended submission deadline is **November 16, 2026 at 11:59 PM Philippine time**.

## Final 105-point audit — checked 15 November 2026

**Score target:** 100 group points + up to five stretch points, followed by each person's separate individual gate. This is an **evidence audit**, not a grade prediction. A passing GitHub CI run establishes automated checks, **not** independent phone usability, video compliance, a Vercel deployment, or timely checkpoint credit.

| Brief deliverable | Status on PR #72 | Required final check |
|---|---|---|
| 1. Reviewed `main` and `gc2-v1.0` tag | **Not complete.** #72 is open and has no submitted approval. The release tag was not found in GitHub. | Human independent approval; merge green PR; test reviewed `main`; tag only that accepted commit |
| 2. Deployed six-screen URL + Owner | **Earlier Render live evidence exists**; #72 final version not yet deployed. #67 added Vercel code, but no verified public Vercel URL was found in the submission README. | Choose the **actual working host** (Render or Vercel); record URL and exact SHA; redo one final booking on that host, including receipt refresh and Owner |
| 3. Maximum two-page business PDF | `docs/SlotDrop_GC2_Summary.pdf` exists on #72 | **Page count and rendered content not yet independently verified**. Open/download it and check both pages, accurate current prices, feature business outcomes and Owner metrics |
| 4. System diagram + data flow | `docs/system.md` exists, with Mermaid and hop table | Confirm paths/functions still match deployed code; **Challenge 2 additionally requires a separately hand-drawn trace** |
| 5. Route table + schema | `docs/routes.md` and `docs/schema.md` exist | Final source-to-document check after #72 merges |
| 6. Exported Postman collection | Exported `.postman_collection.json` present; six deployed-case screenshots and 16/16 Newman evidence in Challenges | Ensure the submitted host and `baseUrl` match. Rerun on Vercel if Vercel is chosen |
| 7. `business.md`, `challenges.md`, `baseline.md` | All exist on #72. Baseline was measured on Render **14 Nov**, prior to the newest Browse changes | Group must endorse business judgments; attach Challenge 2 drawing; refresh baseline on **final host/build** |
| 8. Stack, versions and why | README stack table exists | Check against `package-lock.json`, deployed Node version and actual host |
| 9. AI disclosure | `AI-USAGE.md` exists | Each author verifies their own meaningful entries and PR disclosure; no fabricated or delegated AI disclosures |
| 10. README run steps, roster, environment names, changes since GC1 | Present in README | Final host URL must agree with actual submitted deployment |
| 11. One Challenge 5 video per member | [Drive folder](https://drive.google.com/drive/folders/1U2MMvoRrhgov5SSZ0HdGHf51kiJ9c4Uj) lists **Cholo, Janelle and Kirsten** | **Fran, Kaitlyn, Kat not found in that folder**. Individually verify all six show owned function, 3 prior predictions, actual outcomes, one changed input/line, voice, unedited ≤3 minutes and instructor view access |

**Two additional final-human gates:** (a) someone **outside the group** completes the booking flow unaided on their own phone; record device, tested URL/SHA, booking ID, Owner confirmation and any defects; (b) attach a **group hand-drawn** Checkout → API → DB → Confirmation trace to Challenge 2. Neither can be inferred from CI or existing DevTools screenshots.

### Five one-point stretch challenges

| Point | Current evidence in [Challenges](challenges.md#stretch-challenges) | Final check |
|---|---|---|
| Sequential/parallel | Timing benchmark **398.0 ms → 200.2 ms median**, overlapping Selection requests | Keep exact screenshot and timing method linked |
| HTTP 429 and retry | Live 429 → wait → identical POST → saved receipt; client-address limiter changes on #72 | Verify limiter behavior on the **final host**, especially if moving from Render to Vercel |
| Double-click | Deployed browser saw **one POST and one booking**; server idempotency and row locking tested | One confirmation and one Owner row on the accepted build |
| Pagination | Server `page`/`limit`, Browse page transitions and captured network evidence | Verify current deployed list and filters |
| Join and compute | Owner combines catalog and booking routes into utilization % | Recheck both inputs and computed percentage after latest code deploy |

**Individual gate (separate from the group 100+5):** Github merged authored-code PRs checked: Fran **17**, Janelle **4**, Cholo **3**, Kirsten **3**, Kaitlyn **3**, Kat **1**. Code PR counts alone do **not** prove two historical merge windows. The last defined window ended **9 November**; many teammates' qualifying merges were after that date. Confirm window records with the instructor rather than attributing someone's code to another member or backdating merges. Under the brief, missing one of the Git or recording gate parts can reduce that individual's percentage of the group score. Everyone also needs substantive human reviews.

**Checkpoint risk:** Browse was not merged until 12 November, after the 4 November CP1 date. The extended **16 November final deadline** does not explicitly retroactively change CP1. The group should ask whether late CP1 and historical window exceptions apply, and preserve truthful timestamps.

**Drive access safety:** Metadata for the three linked recordings currently reports `anyone` **writer** access. Their owners should change link access to **Viewer** (not Editor), confirm the instructor can play each video and retain ownership. Do not change another member's sharing or replace their recording on their behalf.

## Mandatory milestones

| Date | Actual assignment requirement | Owner / handoff |
|---|---|---|
| Oct 28 CP0 | Repo, reviewed route/schema contracts and business draft | Fran + all |
| Nov 4 CP1 | **Deployed Browse** gets *database* sessions through **our own JSON API**; list shows results | Kirsten + Fran deploy |
| Nov 16, 11:59 PM PHT | All 6 customer screens; real persisted simulated booking; Owner booking list + 5 metrics; documentation, challenges and submissions | All |

Internal Nov 1 first PR and Nov 7 fully connected flow are team targets, not instructor deadlines.

## Must work on the final deployed URL

- Home → Browse with API-driven list with at least one of search, filter or sort → Detail → Selection with accurate quantity and total → Checkout form with validation and simulated payment → Confirmation **fetched by saved booking ID**. A separate reference-only prototype does **not** count.
- Server-side API recomputes booking totals; verifies available seats inside the same database transaction that saves a booking; refuses overselling; returns documented 200/201/400/404/409 codes. Booking still exists after server restart.
- PostgreSQL/real persistent database with ≥3 tables and ≥8 realistic seeded services or sessions; do not count JSON or browser storage. The checked-in schema and seed support the group deployment.
- Owner screen lists saved demo bookings and five computed metrics: booking count, modeled revenue, average booking, top-selling service, and nearly-full sessions.
- Both revenue features, availability and buddy/tier pricing, must be **enforced by the server and persisted**. Database columns and UI previews alone do not satisfy the rubric.
- Every fetch-backed screen should handle loading, no results/unknown record, failure and recovery; work on phone width without dead buttons or Console errors.
- Git: Issue → member's branch → PR → substantive teammate review → Captain merges. Each member needs three authored code PRs merged, two substantive reviews, and contributions across two grading windows. Each author records their AI assistance.
- docs/business.md must show GC1 traceability, funnel, ≥5 enforced rules, calculations/conclusions for the 2 revenue features and decisions supported by the 5 metrics. Final business PDF is at most two pages.

## What the captain submits

| # | Deliverable | Location |
|---|---|---|
| 1 | Group repository and `gc2-v1.0` tag on reviewed `main` | GitHub and submission |
| 2 | Working [public booking URL](https://slotdrop-gc2-group-zx8j.onrender.com/) | Submission and [README](../README.md#deployed-course-demo) |
| 3 | [Two-page business summary](SlotDrop_GC2_Summary.pdf) | Upload the PDF to the submission |
| 4 | [System diagram and booking data flow](system.md) | `docs/` |
| 5 | [Route table](routes.md) and [database schema](schema.md) | `docs/` |
| 6 | [Exported Postman collection](SlotDrop-GC2-Challenge1.postman_collection.json) | `docs/` |
| 7 | [Business case](business.md), [Challenges](challenges.md) and [measured Browse baseline](baseline.md) | `docs/` |
| 8 | [Stack versions and rationale](../README.md#stack) | README |
| 9 | [AI assistance record](../AI-USAGE.md) | Repository root and matching PR disclosures |
| 10 | [Run and environment setup](../README.md#run-locally), [roster and ownership](../README.md#team), [changes since GC1](../README.md#changes-since-gc1) | README |
| 11 | Each member’s unedited, voiced Challenge 5 recording, at most three minutes | [Drive folder](https://drive.google.com/drive/folders/1U2MMvoRrhgov5SSZ0HdGHf51kiJ9c4Uj) and [per-member video links/status](challenges.md#individual-recording-links). Three files linked; remaining links and instructor access need verification |

## Not required in GC2

Login/accounts, real payment, third-party API integration, React, scalability and optimization are **explicitly deferred** to the Final Project. Do not make missing authentication a GC2 grading blocker. Maintain demo-only data, no committed secrets, and no false claims about the real studios referenced in research.

## Fast read-only checks

Run against the **actual group deployment** once it exists:

```sh
npm run check:gc2 -- https://YOUR-GROUP-DEPLOYMENT
```

The 15 read-only checks cover `/api/health`, the seven required pages, bookable inventory, list and detail APIs, a quantity-one quote, receipt lookup, the Owner booking list and the five metrics. It never sends POST/PATCH or fabricates data. In production, the Render `/api/health` endpoint also checks whether PostgreSQL is reachable and returns HTTP 503 if it cannot run the database probe; local demo health remains available without an external database. It does not prove that checkout/receipt saving works. Separately, CI runs a **disposable PostgreSQL production-container test** that creates a quote and simulated booking through the real APIs, restarts the container, rereads the saved receipt, safely replays the same request ID, and checks seats and Owner metrics. That automated API check does not replace the team's actual deployed browser walkthrough or phone test.

Owner displays an inventory warning when no sessions are discoverable or when every available offer closes within 24 hours. Refresh the catalog to check availability after someone books. Scheduled samples still close at their own cutoff. Browse preserves the latest closed offers for viewing and includes two undated practice offers with capacity for grading. Use Owner to adjust practice capacity, resume a paused practice offer with seats available, or release future dated inventory. Startup keeps past sessions and saved receipts.

## Transaction and release evidence

1. Use a new disposable sample customer and a currently available session; inspect Network while booking, ensuring all prices match the server quote.
2. Verify one saved booking ID, GET /api/bookings/:id returns its original amount and quantity, GET /api/bookings and GET /api/metrics reflect that booking, and remaining seats drop by exactly the booked quantity.
3. Repeat an identical retry key to verify one booking only; send an outdated total, invalid quantity, missing details, unknown ID, more-than-available quantity and empty search. Save deployed Postman response screenshots and actual status codes for Challenge 1.
4. Link the PostgreSQL-backed CI restart proof. Have someone outside the group complete the public booking flow on their own phone without guidance. Keep the separately hand-drawn request trace and the live browser request evidence together in Challenges.
5. Capture the final baseline: Lighthouse mobile Performance/Accessibility/Best Practices, Network count/bytes, actual List API latency, and three honest weaknesses. Challenge 3 requires the team's own reasoning about 3 corrected AI/design issues; Challenge 4 requires the owner's one-place rule change/refactor. Individual Challenge 5 must be authored and recorded unaided.

## Do not conflate prototype, supporting research and final app

The private reference/demo and `/studios.html` are supporting artifacts. The graded Browse must read `/api/slots` from the group's deployed database; Checkout must save via Janelle's transactional API; Confirmation must read that saved receipt. Real studio names/prices are sourced public references only. Dates, slots, discounts, payments and bookings are classroom simulations.

## Final checks on the group deployment

- [Render course demo](https://slotdrop-gc2-group-zx8j.onrender.com/) serves the merged customer and Owner pages. Run the read-only readiness checks against the exact URL listed in the submission.
- After [PR #72](https://github.com/Frannaaa/slotdrop-gc2/pull/72) ships, verify both practice offers, expired-offer labels, workshop images and one complete booking on the reviewed build. Refresh the [public mobile baseline](baseline.md) for that release.
- [Challenge 2](challenges.md#challenge-2--trace-one-real-request) has the live Chrome capture. Attach the group’s hand-drawn trace for booking `f6148274-8de0-4558-ada3-2a8b3dc68217`. Have someone outside the group complete the flow unaided on their phone. Check that their reference appears in Owner and record the date, device, reference and result. Verify that all six individual recording links open for the instructor.
- Verify the final PR reviews and CI before tagging `main` as `gc2-v1.0`. Verify protection settings and instructor access in GitHub.

## Checkpoint and individual evidence

Record each member’s authored merges, substantive reviews and individual recording. [PR #62](https://github.com/Frannaaa/slotdrop-gc2/pull/62) records the Browse integration.
