# SlotDrop

Group 1 · ITMGT 45.03-YZW

SlotDrop helps people find provider-released seats in nearby leisure sessions, with optional bring-a-friend pricing. GC2 uses fictional providers/customers and simulated payments.

## Current development status

Fran's database connection, session list/detail APIs, offer creation/editing, saved-booking list, metrics and owner workspace are implemented in the development PRs. Janelle's customer quote, booking-create and confirmation-by-ID routes and the other customer screens remain team integration work.

Review order: [CP0 #22](https://github.com/Frannaaa/slotdrop-gc2/pull/22) → [data #27](https://github.com/Frannaaa/slotdrop-gc2/pull/27) → [offers #28](https://github.com/Frannaaa/slotdrop-gc2/pull/28) → [owner #29](https://github.com/Frannaaa/slotdrop-gc2/pull/29). Retarget each dependent PR after its approved predecessor merges.

Public deployment URL: pending. GitHub stores the code; it is not the Node/API host.

## Run the complete local owner workspace

    npm ci
    npm run check
    npm test
    npm run check:sql
    npm run demo

Open http://localhost:3000/owner.html. The explicit demo command uses a persistent PostgreSQL-compatible PGlite database in ignored .local-data/. Restarting the server preserves its records. Fresh seed inventory uses Philippine daytime/evening sessions on the next two calendar days. Existing records keep their saved times; restart does not silently retime them.

For external PostgreSQL, set DATABASE_URL privately, run npm run db:init once against a NEW disposable course database, then npm start. Initialization refuses existing schema/data. The Dockerfile packages the production Node service without demo/test dependencies. See [deployment instructions](docs/deployment.md).

PORT defaults to 3000. DATABASE_URL and PORT are listed with empty values in .env.example. Never commit .env, node_modules or .local-data. TEST_DATABASE_URL is used only by the isolated test workflow, not by the browser.

## Roster and ownership

| Member | GitHub | Number | Ownership |
|---|---|---|---|
| Fran | Frannaaa | 1 | Architecture, schema/seed, session and offer APIs, owner dashboard/metrics, integration/deployment |
| Cholo | chukwunyeluukgabrielokolo-cmyk | 2 | Home and featured sessions |
| Janelle | janellereonal | 3 | Quote/pricing, capacity-safe booking/retries, confirmation read API |
| Kaitlyn | sonatiina | 4 | Booking form and confirmation frontend |
| Kaithlyn | kattgrass | 5 | Detail and selection-summary frontend |
| Kirsten | 13kilograms | 6 | Shared visual foundation and Browse integration |

Janelle reviews Fran's CP0 work. Every author checks and explains their own changes; a teammate runs the branch, comments and approves before the captain merges.

## Stack and versions

| Tool | Version/status | Reason |
|---|---|---|
| HTML/CSS/plain JavaScript | GC2 frontend | Fetch → transform → render; React upgrade comes later |
| Node.js | 22 in CI/production image; local checks on 24.19.0 | Shared JavaScript runtime |
| Express | 5.3.0 | Own JSON API between browser and database |
| PostgreSQL | 16 verified in CI; public host pending | Persistent tables, constraints and transactions |
| pg | 8.23.1 | Parameterized SQL and checked-out transaction clients |
| dotenv | 18.0.9 | Local environment configuration |
| PGlite | 0.5.12, demo/test only | Explicit local PostgreSQL-compatible workflow |
| Git/GitHub Actions | Reviewed PR workflow and automated checks | Traceable collaboration and reproducible tests |
| Postman/Newman | v2.1 export; verified with Newman 6.2.1 | API requests and assertions |

package-lock.json pins dependencies. Record the public host's actual runtime/database versions after deployment.

## Business rules and changes since GC1

- Recurring leisure sessions replace a salon/spa-only demo.
- Capacity is the provider's released allocation, not the whole venue.
- Each activity has a cutoff default; each dated session saves its own independent deadline.
- Discovery is strictly within 72 hours and before that session's cutoff.
- Providers set normal offers and optional lower buddy rates for 2+ seats in one booking.
- Model commission is 10%, deducted from the accepted price with no customer surcharge. The active setting is server/config/business.js; saved receipts retain their historical rate.
- Availability and buddy pricing are the two GC2 revenue features. Paid add-ons, React, accounts and real payments belong to the separate Final Project.
- Prices, providers and schedules are fictional; no partnership, actual payment or guaranteed demand is claimed.

## Verification and handoff

[Fran's final-pass checklist](docs/fran-final-pass.md) · [verification record](docs/final-verification.md) · [system/data flow](docs/system.md) · [route table](docs/routes.md) · [schema](docs/schema.md) · [business](docs/business.md) · [research](docs/research.md)

Import docs/SlotDrop-Fran.postman_collection.json and set baseUrl. Its local run passed 21 requests and 26 assertions. The required deployed challenge screenshots and deployed List baseline are still separate evidence.

GC2 deadlines: CP0 October 28; CP1 November 4; final November 9, 2026 at 11:59 PM Philippine time. The final main tag is gc2-v1.0 after reviewed integration and verification.

