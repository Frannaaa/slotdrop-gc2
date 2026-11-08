# SlotDrop

Group 1 · ITMGT 45.03-YZW

SlotDrop helps people find available seats in nearby leisure sessions. Studios set their offers, booking deadlines and optional buddy prices. The sample catalog uses real studio names and sourced published facts; session dates, allocated seats, cutoffs, offers, bookings and payments are simulated. No partnership or real reservation is created.

## Architecture and functionality

The frontend uses native HTML, CSS and JavaScript to request session listings and quotes from the Express API. Express validates requests, applies booking rules and uses PostgreSQL for persistent sessions, bookings, receipts and Owner metrics. The server calculates prices, locks the session row before booking, checks remaining seats and retains receipts across restarts.

Customer-facing screens, integration status and final test evidence are tracked in the [submission checklist](docs/final-submission-checklist.md). The [system diagram](docs/system.md) explains the request and data flow.

## Deployed app

**Live URL:** https://slotdrop-gc2-group-zx8j.onrender.com (Render free web service `slotdrop-gc2-group-zx8j`, branch `main`, with a hosted PostgreSQL database). The free instance sleeps when idle, so the first request can take about a minute.

On November 8, deployed commit `96d4a31` answered `/api/health`, `/api/slots`, `/api/metrics` and `/api/bookings` with 200, and passed all six Challenge 1 cases ([run 42460049586](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42460049586)). Browse, Checkout and Confirmation are not yet merged, so the full customer flow cannot be completed on the live site yet.

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

Fresh seeds create 16 simulated sessions across eight researched offerings on the next two Philippine calendar days. Existing sessions keep their saved dates; restarting does not renew expired offers.

## PostgreSQL and deployment

The official deployment is the Render web service in [render.yaml](render.yaml), connected to a hosted PostgreSQL database (Neon). Render builds `main` with `npm ci --omit=dev` and starts it with `node tools/db-bootstrap.mjs && npm start`.

1. Create an empty PostgreSQL database and copy its connection string, including `?sslmode=require`. Store it only as the Render `DATABASE_URL` secret (or in a local .env file). Never put it in Git, PR text, comments or screenshots.
2. On each start, `tools/db-bootstrap.mjs` loads db/schema.sql and db/seed.sql only when none of the SlotDrop tables exist. If all of them exist, it changes nothing. If only some exist, it stops and the server does not start. Saved bookings are never deleted or reseeded.
3. `npm start` then applies the additive migrations in db/migrations/ and adds any missing reference-catalog records. Production startup refuses to run without `DATABASE_URL`. Render provides `PORT`; `NODE_ENV=production` is set in render.yaml. Keep database TLS verification enabled.
4. Render polls `/api/health`. In production it returns 200 only when PostgreSQL answers and the slots, services and bookings tables exist; otherwise it returns 503 without database details. Then check `/api/slots` for live sessions.
5. Run the read-only checks: `npm run check:gc2 -- https://slotdrop-gc2-group-zx8j.onrender.com` and `npm run check:demo -- https://slotdrop-gc2-group-zx8j.onrender.com`. Run [the Challenge 1 collection](docs/SlotDrop-GC2-Challenge1.postman_collection.json) in Postman (or `npx newman@6.2.1 run docs/SlotDrop-GC2-Challenge1.postman_collection.json --env-var baseUrl=https://slotdrop-gc2-group-zx8j.onrender.com`). It picks a live session first and creates no booking.
6. For the persistence proof, place one fictional booking through the public site, read it by `GET /api/bookings/:id`, restart the Render service without touching the database, and read the same receipt again. Check Owner metrics and remaining seats. Record the public URL, deployed commit and observed result in `docs/challenges.md`.

`npm run db:init` is a manual alternative for initializing a new, empty database from a trusted machine. It refuses existing tables and is not part of the Render start command. The Dockerfile serves the same app but does not run the bootstrap step.

.env.example lists PORT, DATABASE_URL, NODE_ENV and optional TEST_DATABASE_URL with blank values. On Windows, copy it with `Copy-Item .env.example .env`; on macOS/Linux, use `cp .env.example .env`. Never commit the filled .env file.

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
| Node.js | 22 in CI/Docker; minimum 22 | Runtime for Express and build/test scripts |
| Express | 5.3.0 | API between the browser and database |
| PostgreSQL | 16 in CI | Persistent tables, constraints and transactions |
| pg | 8.23.1 | SQL queries and checked-out transaction clients |
| dotenv | 18.0.9 | Local environment settings |
| PGlite | 0.5.12, demo/tests only | Local PostgreSQL-compatible database |
| GitHub Actions | Node 22 workflow | Repeatable checks for each PR |
| Postman/Newman | v2.1 collection; Newman 6.2.1 | API checks |

`package-lock.json` pins npm dependencies. Record final hosted runtime/database versions with the deployment evidence.

## Changes since GC1

The build focuses on recurring leisure sessions and released seat allocations. Discovery covers the next 72 hours; each session has its own booking deadline. Studios control standard and optional buddy offers. The course commission is 10%.

Availability and buddy pricing are the two revenue features. The server booking path rechecks remaining seats under a session-row lock, selects stored standard/buddy prices, recomputes totals and commission, and saves a durable receipt. Paid add-ons, accounts, real payments, React and optimization are deferred.

## Design and documents

The [brand book and prototype](https://slotdrop-gc2-design-studio.frannaaa216.chatgpt.site/prototype) provide visual references. The prototype is a separate, browser-storage demonstration, not a live PostgreSQL-backed booking service. DM Sans and Space Grotesk are served locally; their licenses are in `public/fonts/`.

- [Business case and sources](docs/business.md)
- [Route contract](docs/routes.md)
- [Database schema](docs/schema.md)
- [System diagram and data flow](docs/system.md)
- [Challenges and test results](docs/challenges.md)
- [Deployed List baseline](docs/baseline.md)

The [Owner and session Postman collection](docs/SlotDrop-Fran.postman_collection.json) covers administrative API checks. The [Challenge 1 booking collection](docs/SlotDrop-GC2-Challenge1.postman_collection.json) covers six required API cases; its run records and supporting evidence belong in [challenges](docs/challenges.md).

## Release verification

Final release verification includes a reviewed `main` tagged `gc2-v1.0`, a working deployed booking and receipt, reproducible Postman evidence, accurate documentation and individual recordings. See the [submission checklist](docs/final-submission-checklist.md) for acceptance conditions and the [challenge evidence record](docs/challenges.md) for observed results.

## Released-seat discovery revision

The main customer path is Explore sessions, with time/area/party size first, optional activity filters and a saved in-app booking. Studio research is supporting information. See [product and file handoff](docs/released-seat-discovery.md), [provider questions](docs/provider-readiness.md) and the additive migration in db/migrations/. Existing populated data is upgraded at configured startup; never reseed it.

Studio research is available at `/studios.html` through `GET /api/activities`. It is separate from the database-backed booking inventory. See `docs/studio-discovery.md`.

## Sourced catalog and studio application

The reference catalog contains eight activities across five researched businesses, with sixteen simulated dated allocations. Published business facts/prices have source URLs; discounts, seats and deadlines are sample data. Startup adds records once without renaming historical providers or changing receipts. Never reseed a populated database. `/provider-apply.html` saves a pending demo application, and `/provider-application.html?id=UUID` reads back only status. It does not publish or verify ownership. See `docs/provider-onboarding.md` for the provider reference and application flow.

## Demo inventory readiness (read-only)

Sample allocations are dated for the two days following the initial database seed. They **do not roll forward** on restart and may eventually fall outside the discovery window. Expired inventory is not a database failure.

Before each deployed demo/checkpoint, with the app running, run:

```sh
npm run check:demo -- https://slotdrop-gc2-group-zx8j.onrender.com
```

Or run `npm run check:demo` against local `http://localhost:3000`. The check fetches `GET /api/slots`, reports remaining bookable demo allocations, and returns a failure exit code if none remain. It **never** creates offers, shifts existing dates, reactivates sold-out seats, modifies receipts or touches the database.

If inventory is absent or about to expire, open the **Owner course-demo screen** and create *new, future, explicitly simulated* allocations for active sample activities, with future cutoffs and the intended prices. Test Browse again. Do not rerun `db:init` on a populated database, overwrite historic bookings, silently reseed or claim real studio consent. Because the public demo has no owner login, use fictional test data only and do not expose real provider management as a production feature.

This check covers discoverable inventory only. Use the transaction smoke and browser acceptance checks for saved bookings and receipt persistence.
