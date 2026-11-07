# SlotDrop

Group 1 · ITMGT 45.03-YZW

SlotDrop helps people find available seats in nearby leisure sessions. Studios set their offers, booking deadlines and optional buddy prices. The sample catalog uses real studio names and sourced published facts; session dates, allocated seats, cutoffs, offers, bookings and payments are simulated. No partnership or real reservation is created.

## Build status (checked November 8, 2026)

**Implemented on current main:** database-backed discovery, session offer creation/editing, quote calculation, booking create and receipt readback APIs, saved-booking list, Owner metrics, Home, Detail, Selection, and researched supporting studio profiles/applications. The booking API was merged in PR #42; quote API in #40; Home #35; Detail/Selection #41.

**Not yet complete on main:** Browse and its search/filter UI; Checkout and Confirmation (submitted in PR #43, awaiting a valid peer approval); final shared CSS (Kirsten's `css_styling` branch has not been merged). Local combined-page checks do not establish a public complete customer flow.

**Open related work:** [#37 business/PDF/Challenge 1 collection](https://github.com/Frannaaa/slotdrop-gc2/pull/37), [#43 Checkout/Confirmation](https://github.com/Frannaaa/slotdrop-gc2/pull/43), [#45 startup/release checks](https://github.com/Frannaaa/slotdrop-gc2/pull/45), and [the eleven-item submission gate](docs/final-submission-checklist.md). Until the final hosted group build is independently checked, **do not claim a deployed complete flow**.

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

Database tools and Docker are available from PR #27.

1. Set DATABASE_URL privately in .env or the host's environment settings.
2. Run `npm run db:init` once against a new, empty course database. It refuses existing tables or data.
3. Install with `npm ci --omit=dev` and run `npm start`, or build the included Dockerfile.
4. Set NODE_ENV=production and use the host's PORT. Keep database TLS verification enabled.
5. Check /api/health for liveness and /api/slots for a database response. Health does not test the database.
6. Run Postman against the **final public API**, create a new fictional booking through `POST /api/bookings`, read it by `GET /api/bookings/:id`, restart the service without resetting PostgreSQL, and read that same receipt again. Verify Owner/metrics and remaining seats. No such public flow has yet been verified in this README.

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
| Node.js | 22 in CI/Docker; local checks on 24.19.0 | JavaScript server |
| Express | 5.3.0 | API between the browser and database |
| PostgreSQL | 16 in CI | Persistent tables, constraints and transactions |
| pg | 8.23.1 | SQL queries and checked-out transaction clients |
| dotenv | 18.0.9 | Local environment settings |
| PGlite | 0.5.12, demo/tests only | Local PostgreSQL-compatible database |
| GitHub Actions | Node 22 workflow | Repeatable checks for each PR |
| Postman/Newman | v2.1 collection; Newman 6.2.1 | API checks |

package-lock.json pins dependencies. Add the actual public runtime/database versions after deployment.

## Changes since GC1

The build focuses on recurring leisure sessions and released seat allocations. Discovery covers the next 72 hours; each session has its own booking deadline. Studios control standard and optional buddy offers. The course commission is 10%.

Availability and buddy pricing are the two revenue features. The merged server booking path now rechecks remaining seats under a session-row lock, selects stored standard/buddy prices, recomputes the total and commission, and saves a durable receipt. The unmerged customer Checkout/Confirmation pages still need to expose that path in the final public build. Paid add-ons, accounts, real payments, React and optimization are deferred.

## Design and documents

The [brand book and prototype](https://slotdrop-gc2-design-studio.frannaaa216.chatgpt.site/prototype) are the visual reference. That prototype saves sample data in the browser; it is separate from this API-backed app. The owner branch serves DM Sans and Space Grotesk locally; their licenses are in public/fonts/.

- [Business case and sources](docs/business.md)
- [Route contract](docs/routes.md)
- [Database schema](docs/schema.md)
- [System diagram and data flow](docs/system.md)
- [Challenges and test results](docs/challenges.md)
- [Deployed List baseline](docs/baseline.md)

The existing [Owner/session Postman collection](docs/SlotDrop-Fran.postman_collection.json) is in main. The separate [six-case booking Challenge 1 collection](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-business-case/docs/SlotDrop-GC2-Challenge1.postman_collection.json) is currently in PR #37 and must be merged and rerun on the **actual public API** with dated screenshots. A passing local test is not a substitute.

## Dates and remaining work

- **October 28 CP0:** repo, contracts and first business draft (historical evidence; do not backdate).
- **November 4 CP1:** public deployed Browse backed by the group's database API was required (independent deployed evidence not yet confirmed).
- **November 9, 11:59 PM Philippine time:** submit the final reviewed `main` tagged `gc2-v1.0`, actual public full-flow link, ≤2-page business PDF, exported booking Postman collection, system/data flow, business/challenges/baseline and each member's unaided recording. Submission channel remains unannounced in the supplied brief.

Use [the 11-item final submission and evidence checklist](docs/final-submission-checklist.md). This tracks the valid Git approvals and authorship gates, deployed transaction/restart test, six public Postman cases, Challenges 2–4, Lighthouse/Network baseline, outside-group phone test and all six recordings. Do not mark a proof complete until it was actually obtained.

## Released-seat discovery revision

The main customer path is Explore sessions, with time/area/party size first, optional activity filters and a saved in-app booking. Studio research is supporting information. See [product and file handoff](docs/released-seat-discovery.md), [provider questions](docs/provider-readiness.md) and the additive migration in db/migrations/. Existing populated data is upgraded at configured startup; never reseed it.

Studio research is available at `/studios.html` through `GET /api/activities`. It is separate from the database-backed booking inventory. See `docs/studio-discovery.md`.

## Sourced catalog and studio application

Fran's additional reference-catalog work supplies eight activities at five real businesses, with sixteen explicitly simulated dated allocations. Published business facts/prices have source URLs; discounts, seats and deadlines are sample data. Startup adds records once without renaming historical providers or changing receipts. Never reseed a populated database. `/provider-apply.html` saves a pending demo application, and `/provider-application.html?id=UUID` reads back only status. It does not publish or verify ownership. These supporting pages follow the shared styling; see `docs/provider-onboarding.md`.

## Pre-checkpoint demo inventory check (read-only)

**Important for November 4, 7 and 9:** The sample allocations start only on the two days after the database is first seeded. They **do not roll forward** when the server restarts. An unchanged demo database first seeded on October 30 will therefore have no bookable sample sessions by November 4. This is expected expiry, not a database failure.

Before each deployed demo/checkpoint, with the app running, run:

```sh
npm run check:demo -- https://YOUR-APP-HOST
```

Or run `npm run check:demo` against local `http://localhost:3000`. The check fetches `GET /api/slots`, reports remaining bookable demo allocations, and returns a failure exit code if none remain. It **never** creates offers, shifts existing dates, reactivates sold-out seats, modifies receipts or touches the database.

If inventory is absent or about to expire, open the **Owner course-demo screen** and create *new, future, explicitly simulated* allocations for active sample activities, with future cutoffs and the intended prices. Test Browse again. Do not rerun `db:init` on a populated database, overwrite historic bookings, silently reseed or claim real studio consent. Because the public demo has no owner login, use fictional test data only and do not expose real provider management as a production feature.

This check tests availability only. It does **not** prove that Detail, Selection, Checkout, Confirmation, PostgreSQL persistence or customer booking are integrated. Run those separately once teammates' PRs merge.
