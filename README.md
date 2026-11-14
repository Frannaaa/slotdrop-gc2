# SlotDrop

Group 1 · ITMGT 45.03-YZW

SlotDrop helps people find available seats in nearby leisure sessions. Studios set their offers, booking deadlines and optional buddy prices. The sample catalog uses real studio names and sourced published facts; session dates, allocated seats, cutoffs, offers, bookings and payments are simulated. No partnership or real reservation is created.

## Deployed course demo

[Open SlotDrop on Render](https://slotdrop-gc2-group-zx8j.onrender.com/). Start on Home and follow Browse, Detail, Selection, Checkout and Confirmation. The [Owner workspace](https://slotdrop-gc2-group-zx8j.onrender.com/owner.html) lists saved demo bookings and five metrics. Render deploys reviewed `main` to the course service in Singapore after checks pass. [Deployment history](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbr7meojo6nc73eq1920) identifies the build used for the baseline. Use fictional details and simulated payment. [Challenge evidence](docs/challenges.md) records the live walkthrough and remaining verification.

## Run locally

Use Node 22 or later.

```powershell
npm ci
npm run check
npm test
npm run check:sql
npm run demo
```

Open http://localhost:3000/api/slots and http://localhost:3000/owner.html. The demo stores its PGlite database in ignored .local-data/. Restarting keeps the records.

Fresh seeds create 16 simulated sessions across eight researched offerings on the next two Philippine calendar days. Startup can add future sample allocations for active reference activities when their existing inventory is no longer bookable. It preserves existing rows and saved receipts.

## PostgreSQL and deployment

Database tools and Docker are available from PR #27.

1. Set DATABASE_URL privately in .env or the host's environment settings.
2. Run `npm run db:init` **once** against a new, empty course database. It must not be rerun on a populated database and must not target the reference-only project's database.
3. Install with `npm ci --omit=dev` and run `npm start`, or build the included Dockerfile.
4. Set NODE_ENV=production and use the host's PORT. Keep database TLS verification enabled.
5. Check `/api/health` and `/api/slots`. In production, health probes PostgreSQL *and* the required booking tables; local demo health is deliberately lightweight.
6. Run Postman against the public URL. [Production-container CI](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43354906742) verifies receipt readback across a PostgreSQL-backed server restart.

.env.example lists PORT, DATABASE_URL and NODE_ENV with blank values. On Windows, copy it with `Copy-Item .env.example .env`; on macOS/Linux, use `cp .env.example .env`. Never commit the filled .env file.

TEST_DATABASE_URL is an optional test-shell variable for real PostgreSQL tests. Without it, local tests use PGlite and skip the PostgreSQL lock test.

## Team

| Member | GitHub | Number | Owns |
|---|---|---|---|
| Fran | Frannaaa | 1 | Architecture, database, session/offer APIs, owner dashboard/metrics, integration and deployment |
| Cholo | chukwunyeluukgabrielokolo-cmyk | 2 | Home and featured sessions |
| Janelle | janellereonal | 3 | Pricing quote, booking/retries and receipt API |
| Kaitlyn | sonatiina | 4 | Booking form and confirmation frontend |
| Kaithlyn | kattgrass | 5 | Detail and selection frontend |
| Kirsten | 13kilograms | 6 | Shared styling and Browse |

[Issues](https://github.com/Frannaaa/slotdrop-gc2/issues) track the work. [CONTRIBUTING.md](CONTRIBUTING.md) covers branches, reviews and each member's Git requirements.

## Stack

| Tool | Version | Why |
|---|---|---|
| HTML, CSS and JavaScript | GC2 frontend | Fetch JSON and render each page; prepare for the later React upgrade |
| Node.js | 22 configured for Render, CI and Docker | JavaScript server |
| Express | 5.3.0 | API between the browser and database |
| PostgreSQL | 16 in CI | Persistent tables, constraints and transactions |
| pg | 8.23.1 | SQL queries and checked-out transaction clients |
| dotenv | 18.0.9 | Local environment settings |
| PGlite | 0.5.12, demo/tests only | Local PostgreSQL-compatible database |
| GitHub Actions | Node 22 workflow | Repeatable checks for each PR |
| Postman/Newman | v2.1 collection, Newman 6.2.1 in the deployed challenge run | API checks |

`package-lock.json` pins application dependencies. The deployed host is Render and the persistent database is Neon PostgreSQL. The versions above identify the verified CI stack.

## Changes since GC1

The build focuses on recurring leisure sessions and released seat allocations. Discovery covers the next 72 hours; each session has its own booking deadline. Studios control standard and optional buddy offers. The course commission is 10%.

Availability and buddy pricing are the two revenue features. The merged booking API enforces both availability and buddy pricing under a database transaction, with persisted receipt snapshots and stable request-ID retries. Paid add-ons, accounts, real payments, React and optimization are deferred.

## Design and documents

The [brand book and prototype](https://slotdrop-gc2-design-studio.frannaaa216.chatgpt.site/prototype) are the visual reference. That prototype saves sample data in the browser; it is separate from this API-backed app. The app serves DM Sans and Space Grotesk locally; their licenses are in public/fonts/.

- [Business case and sources](docs/business.md)
- [Route contract](docs/routes.md)
- [Database schema](docs/schema.md)
- [System diagram and data flow](docs/system.md)
- [Challenges and test results](docs/challenges.md)
- [Deployed List baseline](docs/baseline.md)

Use the [Challenge 1 Postman collection](docs/SlotDrop-GC2-Challenge1.postman_collection.json) for the six required cases and the [Owner and session collection](docs/SlotDrop-Fran.postman_collection.json) for additional checks. Point `baseUrl` at the group deployment and use fictional data.

## Submission checklist

See the [GC2 submission gate](docs/gc2-submission-gate.md) and [two-page business summary](docs/SlotDrop_GC2_Summary.pdf). The extended submission deadline is **November 16, 2026 at 11:59 PM Philippine time**.

## Released-seat discovery revision

The main customer path is Home → Browse → Detail → Selection → Checkout → Confirmation. Browse supports search, category filters and pagination. Selection sets the party size. Studio research is supporting information. See [product and file handoff](docs/released-seat-discovery.md), [provider questions](docs/provider-readiness.md) and the additive migration in db/migrations/. Existing populated data is upgraded at configured startup; never reseed it.

Studio research is available at `/studios.html` through `GET /api/activities`. It is separate from the database-backed booking inventory. See `docs/studio-discovery.md`.

## Sourced catalog and studio application

Fran's additional reference-catalog work supplies eight activities at five real businesses, with sixteen explicitly simulated dated allocations. Published business facts/prices have source URLs; discounts, seats and deadlines are sample data. Startup adds records once without renaming historical providers or changing receipts. Never reseed a populated database. `/provider-apply.html` saves a pending demo application, and `/provider-application.html?id=UUID` reads back only status. It does not publish or verify ownership. These supporting pages follow the shared styling; see `docs/provider-onboarding.md`.

## Pre-checkpoint demo inventory check (read-only)

Sample allocations expire at their booking deadlines. Startup can add future sample allocations for active reference activities when existing allocations are no longer bookable. It does not rewrite historic sessions or bookings.

Before each deployed demo/checkpoint, with the app running, run:

```sh
npm run check:demo -- https://YOUR-APP-HOST
```

Or run `npm run check:demo` against local `http://localhost:3000`. The check fetches `GET /api/slots`, reports remaining bookable demo allocations, and returns a failure exit code if none remain. It **never** creates offers, shifts existing dates, reactivates sold-out seats, modifies receipts or touches the database.

If inventory is absent or about to expire, open the **Owner course-demo screen** and create *new, future, explicitly simulated* allocations for active sample activities, with future cutoffs and the intended prices. Test Browse again. Do not rerun `db:init` on a populated database, overwrite historic bookings, silently reseed or claim real studio consent. Because the public demo has no owner login, use fictional test data only and do not expose real provider management as a production feature.

This check tests availability only. It does **not** prove that Detail, Selection, Checkout, Confirmation, PostgreSQL persistence or customer booking are integrated. Use the [transaction acceptance checklist](docs/transaction-flow-acceptance.md) for those checks.
