# GC2 submission gate — teacher brief, not production scope

This checklist follows the Canvas **GC 2: MVP Build** assignment as of October 30, 2026. It is a coordination aid; the teacher's original brief is authoritative. Current Fran branches are not the same as merged group main.

## Mandatory milestones

| Date | Actual assignment requirement | Owner / handoff |
|---|---|---|
| Oct 28 CP0 | Repo, reviewed route/schema contracts and business draft | Fran + all |
| Nov 4 CP1 | **Deployed Browse** gets *database* sessions through **our own JSON API**; list shows results | Kirsten + Fran deploy |
| Nov 9 11:59 PM PHT | All 6 customer screens; real persisted simulated booking; Owner booking list + 5 metrics; documentation, challenges and submissions | All |

Internal Nov 1 first PR and Nov 7 fully connected flow are team targets, not instructor deadlines.

## Must work on the final deployed URL

- Home → Browse with API-driven list + filter/sort → Detail → Selection with accurate quantity and total → Checkout form with validation and simulated payment → Confirmation **fetched by saved booking ID**. A separate reference-only prototype does **not** count.
- Server-side API recomputes booking totals; verifies available seats inside the same database transaction that saves a booking; refuses overselling; returns documented 200/201/400/404/409 codes. Booking still exists after server restart.
- PostgreSQL/real persistent database with ≥3 tables and ≥8 realistic seeded services or sessions; do not count JSON or browser storage. Fran's branch has a real schema and initial seed, but the published deployment must be checked.
- Owner screen lists saved demo bookings and five computed metrics: booking count, modeled revenue, average booking, top-selling service, and nearly-full sessions.
- Both revenue features, availability and buddy/tier pricing, must be **enforced by the server and persisted**. Database columns and UI previews alone do not satisfy the rubric.
- Every fetch-backed screen should handle loading, no results/unknown record, failure and recovery; work on phone width without dead buttons or Console errors.
- Git: Issue → member's branch/code → PR → **real human review** → Captain merges. Each member needs 3 merged code PRs and 2 substantive reviews in 2 of 3 grading windows. AI usage must be disclosed; no teammate's code should be attributed to another.
- docs/business.md must show GC1 traceability, funnel, ≥5 enforced rules, calculations/conclusions for the 2 revenue features and decisions supported by the 5 metrics. Final business PDF is at most two pages.
- Submission: main tagged `gc2-v1.0`, deployed URL, system/data-flow diagram, route/schema docs, Postman collection, business/challenges/baseline, stack/versions, AI-USAGE.md and each member's own unedited ≤3-minute Challenge 5 recording. Outside-group phone test required.

## Not required in GC2

Login/accounts, real payment, third-party API integration, React, scalability and optimization are **explicitly deferred** to the Final Project. Do not make missing authentication a GC2 grading blocker. Maintain demo-only data, no committed secrets, and no false claims about the real studios referenced in research.

## Fast read-only checks

Run against the **actual group deployment** once it exists:

```sh
npm run check:gc2 -- https://YOUR-GROUP-DEPLOYMENT
```

This checks that the 7 required page URLs, session list, a quantity-1 quote (if inventory exists), Owner bookings API, metrics API and nonempty discoverable sample inventory respond. It never sends POST/PATCH or fabricates data. It deliberately fails on the current incomplete group build; this is useful evidence of dependencies, **not** a failing CI gate. It does not prove that checkout/receipt saving works.

For each checkpoint also run the dedicated `check:demo` availability monitor on the branch where it is installed. Initial sample sessions expire after two days. Create **new future demo offers through Owner** without reseeding historic rows and without representing real businesses as partners. This operational maintenance is not a teacher requirement, but an empty Browse violates CP1.

## Real transactional proof (manual, only after teammate implementations merge)

1. Use a new disposable sample customer and a currently available session; inspect Network while booking, ensuring all prices match the server quote.
2. Verify one saved booking ID, GET /api/bookings/:id returns its original amount and quantity, GET /api/bookings and GET /api/metrics reflect that booking, and remaining seats drop by exactly the booked quantity.
3. Repeat an identical retry key to verify one booking only; send an outdated total, invalid quantity, missing details, unknown ID, more-than-available quantity and empty search. Save deployed Postman response screenshots and actual status codes for Challenge 1.
4. Restart the server without resetting PostgreSQL, then retrieve the same receipt. Test at phone width with someone outside the group. Record a real Network trace and an independently drawn data-flow diagram.
5. Capture the final baseline: Lighthouse mobile Performance/Accessibility/Best Practices, Network count/bytes, actual List API latency, and three honest weaknesses. Challenge 3 requires the team's own reasoning about 3 corrected AI/design issues; Challenge 4 requires the owner's one-place rule change/refactor. Individual Challenge 5 must be authored and recorded unaided.

## Do not conflate prototype, supporting research and final app

The private reference/demo and `/studios.html` are supporting artifacts. The graded Browse must read `/api/slots` from the group's deployed database; Checkout must save via Janelle's transactional API; Confirmation must read that saved receipt. Real studio names/prices are sourced public references only. Dates, slots, discounts, payments and bookings are classroom simulations.

## As of Oct 30 — integration blockers

- #22, #27, #28, #30 merged.
- #36 shared browser helper needs Janelle's **new approval** after requested fixes. A mistaken previous approval explicitly does not count.
- #29 Owner has one recorded teammate approval, but commits after that review require recheck. #34 is stacked on it; #32 and #39 are supporting stacked PRs. Respect branch dependencies and CI.
- #35 Home is Chonel's code with Kirsten review pending. CSS/Browse belongs to Kirsten; Detail/Selection to Kat; Checkout/Confirmation to Kaitlyn; quote/save/receipt and server-side pricing to Janelle.
- Public customer flow and deployed group URL remain unverified. Do not mark them done because the private reference or isolated branch tests pass.
