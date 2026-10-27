# SlotDrop: Empty slot, better price.

Group 1, ITMGT45.03-YZW. Last-minute provider-controlled deals on seats in recurring local leisure sessions. Primary planning audience: young professionals; students secondary. Initial demo is fictional QC-area activity inventory, not a real partner network.

Customer flow: Browse -> choose session/quantity -> confirm -> saved booking/receipt. Six customer screens plus owner dashboard/offer manager.

## Development branch
Fran's database connection, persistent local demo, session read APIs and locked provider offer controls are implemented on this branch. Run npm run demo, then open /api/slots. See docs/development.md. This work depends on the unmerged CP0 contract.

## CP0 baseline status

Implemented: modular Express app, static starter and JSON health route.
Prepared for review: route/schema contracts, eight dated synthetic sessions, first business tables, task ownership and workflow.
Not implemented: business APIs, connected PostgreSQL, full UI, real payments or partner synchronization.
PR22: https://github.com/Frannaaa/slotdrop-gc2/pull/22
GC2 revenue features: allocated-seat availability and provider-approved bring-a-friend tiered pricing. See docs/revenue-features.md. Paid activity add-ons are deferred to the Final Project.

## Roster and ownership

| Member | GitHub | Member number | Build ownership |
|---|---|---|---|
| Fran | Frannaaa | 1 | Architecture, schema/seed, slots and offer APIs, owner dashboard/metrics, integration/deployment |
| Cholo | chukwunyeluukgabrielokolo-cmyk | 2 | Home, featured sessions, own loading/empty/error/mobile states |
| Janelle | janellereonal | 3 | Quote/pricing, capacity-safe booking/retry transaction, confirmation read API |
| Kaitlyn | sonatiina | 4 | Booking form and confirmation frontend, retries and price-change messages |
| Kaithlyn | kattgrass | 5 | Detail and quantity/selection summary frontend |
| Kirsten | 13kilograms | 6 | Shared visual foundation, Browse filters and API integration |

Fran authors CP0. Janelle is the independent reviewer of record; Fran merges after real comment/approval and resolved concerns. Each member authors and understands their own feature work. Kirsten sets common styles; every frontend owner implements their own screens.

## Stack and reason

| Tool | Reason |
|---|---|
| HTML/CSS/plain JavaScript | Fetch/DOM workflow now; future React migration |
| Node.js22+ and Express | Own server between browser/database; one language |
| PostgreSQL | Persistent entities, constraints and transactions |
| pg | Parameterized SQL and one-client transactions |
| dotenv | Local environment config |
| Git/GitHub | Assigned Issues, protected main and reviewed PRs |
| Postman/DevTools | API checks and Network/Console traces |
| Public Node host and PostgreSQL host | To be selected before CP1; same-origin frontend/API deployment |

Dependencies are pinned in package-lock.json. Current authored runtime checks used Node24.22.1. Record actual deployed runtime/database versions before final submission.

## Local run

    npm ci
    Copy-Item .env.example .env
    npm run check
    npm test
    npm run check:sql
    npm start

Open http://localhost:3000 and /api/health. Stop Ctrl+C. Empty PORT defaults3000; DATABASE_URL stays empty for CP0. macOS/Linux: cp .env.example .env. Never commit .env or node_modules.

## Environment names
PORT, DATABASE_URL. Values only in local .env/host settings. .env.example has empty values.

## Changes since GC1 and initial scaffold

Recurring activity sessions replace a salon/spa-only demo. Multiple allocated seats replace one-person capacity. Provider-set normal and optional bring-a-friend prices replace global time-based tiers. Model commission is 10%, not12%; listing window72 hours, not48h. Provider offer controls share the owner screen. Payment/login/integration remain deferred. Dates/prices/commission are saved per booking; no guaranteed external-calendar availability is claimed.

## Review
The MVP choices and source-based rationale are in docs/business.md and docs/research.md. Each session has its own booking cutoff. Complete the team's verification before submission.

## Reading order
START_HERE.md; docs/business.md; docs/routes.md; docs/schema.md; docs/architecture.md; docs/cp0-readiness.md; docs/review-checklist.md.

## Deadlines
CP0 October28; CP1 November4; final November9,2026 at11:59PM Philippine time. November9 is Monday despite the brief's inconsistent Wednesday label.
