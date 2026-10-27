# SlotDrop: Empty slot, better price.

A last-minute discounted appointment marketplace. GC2 flow: Browse -> Select -> Confirm -> Save, with simulated payment and a demo owner dashboard.

## Current CP0 status

Implemented: static starter page and JSON health route. Planned: business routes, live database connection, seven screens, pricing and bookings. The schema/seed SQL is a design contract, not evidence of a running database.

Group 1, ITMGT 45.03-YZW. Confirmed by Fran on October 27, 2026. Existing member numbers are retained below.

## Roster and proposed feature ownership

| Member | GitHub | Member number | Ownership |
|---|---|---|---|
| Fran | Frannaaa | 1 | Architecture, schema/seed, slots APIs, owner dashboard/metrics, integration/deployment |
| Cholo | chukwunyeluukgabrielokolo-cmyk | 2 | Homepage, featured slots, own page responsiveness |
| Janelle | janellereonal | 3 | Pricing/quote, booking transaction and confirmation read API |
| Kaitlyn | sonatiina | 4 | Checkout and confirmation frontend |
| Kaithlyn | kattgrass | 5 | Detail and selection summary frontend |
| Kirsten | 13kilograms | 6 | Visual direction, shared CSS, Browse frontend and filters |

Fran authors CP0. Janelle (janellereonal) reviews independently. Fran merges after human approval and resolved comments. Kirsten establishes shared visual styles; each frontend owner implements their own pages. These build assignments need team confirmation.

## Stack and reason

| Tool | Reason |
|---|---|
| Plain HTML/CSS/JavaScript | Fetch/DOM workflow, separate presentation, future React migration |
| Node.js 22+ | Same language on client and server |
| Express | Own JSON API between browser and database |
| PostgreSQL, hosting to be selected | Persistent entities, constraints and transactions |
| pg | Parameterized SQL and one-client transactions in next phase |
| dotenv | Local environment configuration |
| Git/GitHub | Issues, protected main, branches and reviewed PRs |
| Postman, DevTools | API status checks, Network tracing and Console debugging |
| Public Node host, to be selected | Serve static frontend and API from one origin |

Exact npm dependency versions are pinned in package-lock.json. Record actual deployed Node/PostgreSQL and host versions before final submission. No deployment is needed at CP0.

## Local run

1. Install Node.js 22+ and Git.
2. Run npm ci.
3. Windows PowerShell: Copy-Item .env.example .env
4. Run npm run check, then npm start.
5. Open http://localhost:3000 and http://localhost:3000/api/health.
6. Stop with Ctrl+C.

On macOS/Linux, use cp .env.example .env. Empty PORT defaults to 3000. DATABASE_URL remains empty until real database setup.

## Environment variable names

PORT and DATABASE_URL. Store real values in .env or host settings. Never commit values in .env.example.

## Contracts

See docs/routes.md, docs/schema.md, db/schema.sql and docs/architecture.md. Contract changes need a Contract change: Issue and reviewed PR.

## Changes since GC1

Login, real payments, external calendar sync and sponsored placements are deferred. Inventory is organized by entity instead of duplicated by role. The 12% commission, segment narrowing, 48-hour window and discount tiers are proposals for the team's decision, not facts already established by GC1. Do not promise availability synchronized with providers' other calendars.

## Checkpoints

CP0 October 28; CP1 November 4; final November 9, 2026 at 11:59 PM Philippine time. November 9 is Monday; the brief's Wednesday label is inconsistent with that date.

## Demo data

All provider names and bookings are synthetic. Do not collect real customer data in an unauthenticated owner dashboard. See START_HERE.md for publication and human review.
