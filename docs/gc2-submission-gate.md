# GC2 submission checklist

This checklist follows the Canvas **GC 2: MVP Build** assignment. The extended submission deadline is **November 16, 2026 at 11:59 PM Philippine time**.

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
| 11 | Each member’s unedited, voiced Challenge 5 recording, at most three minutes | Six accessible links in the submission |

## Not required in GC2

Login/accounts, real payment, third-party API integration, React, scalability and optimization are **explicitly deferred** to the Final Project. Do not make missing authentication a GC2 grading blocker. Maintain demo-only data, no committed secrets, and no false claims about the real studios referenced in research.

## Fast read-only checks

Run against the **actual group deployment** once it exists:

```sh
npm run check:gc2 -- https://YOUR-GROUP-DEPLOYMENT
```

This checks the seven required page URLs, session list/detail APIs, a quantity-1 quote (if inventory exists), the receipt-by-ID lookup route, Owner booking list, metrics API and nonempty discoverable sample inventory. It never sends POST/PATCH or fabricates data. In production, the Render `/api/health` endpoint also checks whether PostgreSQL is reachable and returns HTTP 503 if it cannot run the database probe; local demo health remains available without an external database. It does not prove that checkout/receipt saving works. Separately, CI runs a **disposable PostgreSQL production-container test** that creates a quote and simulated booking through the real APIs, restarts the container, rereads the saved receipt, safely replays the same request ID, and checks seats and Owner metrics. That automated API check does not replace the team's actual deployed browser walkthrough or phone test.

Owner now displays an inventory-readiness warning above its metrics when no sessions are discoverable or when every available offer closes within 24 hours; it never changes database rows. This warning uses the last loaded Owner catalog, so refresh after other people book. For each checkpoint also run the dedicated `check:demo` availability monitor on the branch where it is installed. Initial sample sessions expire after two days. Create **new future demo offers through Owner** without reseeding historic rows and without representing real businesses as partners. This operational maintenance is not a teacher requirement, but an empty Browse violates CP1.

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
- Review the [challenge evidence](challenges.md) and [measured public baseline](baseline.md). Attach the group’s hand-drawn trace to Challenge 2. Have an outside-group tester complete the flow unaided on their phone and check that the same reference appears in Owner. Record the date, device, reference and result. Verify that all six individual recording links open for the instructor.
- Verify the final PR reviews and CI before tagging `main` as `gc2-v1.0`. Verify protection settings and instructor access in GitHub.

## Checkpoint and individual evidence

Record each member’s authored merges, substantive reviews and individual recording. [PR #62](https://github.com/Frannaaa/slotdrop-gc2/pull/62) records the Browse integration.
