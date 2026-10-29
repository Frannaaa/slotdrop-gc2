# SlotDrop

Group 1 · ITMGT 45.03-YZW

SlotDrop helps people find available seats in nearby leisure sessions. Studios set their offers, booking deadlines and optional buddy prices. GC2 uses fictional providers and simulated payments.

## Build status

This branch: **Owner workspace — PR #29**. Session/offer APIs, the branded owner dashboard, saved-booking list and five metrics.

Customer quote, booking creation and receipt-by-ID are Janelle's API tasks. The six customer screens are still being built. The complete Browse → Select → Confirm → Save flow is not ready, and the API-backed app has no public deployment yet.

Merge order: [setup #22](https://github.com/Frannaaa/slotdrop-gc2/pull/22) → [data #27](https://github.com/Frannaaa/slotdrop-gc2/pull/27) → [offers #28](https://github.com/Frannaaa/slotdrop-gc2/pull/28) → [owner #29](https://github.com/Frannaaa/slotdrop-gc2/pull/29). Retarget the next PR to main after each approved merge.

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

Fresh seeds create eight sessions on the next two Philippine calendar days. Existing sessions keep their saved dates; restarting does not renew expired offers.

## PostgreSQL and deployment

Database tools and Docker are available from PR #27.

1. Set DATABASE_URL privately in .env or the host's environment settings.
2. Run `npm run db:init` once against a new, empty course database. It refuses existing tables or data.
3. Install with `npm ci --omit=dev` and run `npm start`, or build the included Dockerfile.
4. Set NODE_ENV=production and use the host's PORT. Keep database TLS verification enabled.
5. Check /api/health for liveness and /api/slots for a database response. Health does not test the database.
6. Run Postman against the public URL. After booking integration, save a booking, restart the server and read the same receipt back.

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

Availability and buddy pricing are the two revenue features. The booking API still needs to enforce them when saving a purchase. Paid add-ons, accounts, real payments, React and optimization are deferred.

## Design and documents

The [brand book and prototype](https://slotdrop-gc2-design-studio.frannaaa216.chatgpt.site/prototype) are the visual reference. That prototype saves sample data in the browser; it is separate from this API-backed app. The owner branch serves DM Sans and Space Grotesk locally; their licenses are in public/fonts/.

- [Business case and sources](docs/business.md)
- [Route contract](docs/routes.md)
- [Database schema](docs/schema.md)
- [System diagram and data flow](docs/system.md)
- [Challenges and test results](docs/challenges.md)
- [Deployed List baseline](docs/baseline.md)

The [Postman collection](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-owner-workspace/docs/SlotDrop-Fran.postman_collection.json) is in the owner branch. Set baseUrl and serviceId before running it against fictional data. Test records are in that branch's docs/evidence/.

## Dates and remaining work

- **October 28:** finish access/assignments, verify main's protection settings, review and merge routes/schema/business draft. [Issue #1](https://github.com/Frannaaa/slotdrop-gc2/issues/1) tracks the remaining CP0 steps.
- **November 4:** deployed Browse must load database sessions through the API.
- **November 9, 11:59 PM Philippine time:** submit the deployed flow, reviewed main tagged gc2-v1.0, two-page PDF, Postman collection, diagram, business/challenge/baseline evidence and recordings.

Fran still needs approved code merges, two reviews of teammates' PRs, public deployment and integration checks. Keep meaningful code work for a second grading window after October 28. Complete the deployed group challenges, baseline and outside-group phone test, then make the personal predictions and unedited recording required by the brief.

## Released-seat discovery revision

The main customer path is Explore sessions, with time/area/party size first, optional activity filters and a saved in-app booking. Studio research is supporting information. See [product and file handoff](docs/released-seat-discovery.md), [provider questions](docs/provider-readiness.md) and the additive migration in db/migrations/. Existing populated data is upgraded at configured startup; never reseed it.
