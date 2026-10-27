# SlotDrop

Group 1 · ITMGT 45.03-YZW

SlotDrop helps people find available seats in nearby leisure sessions, with provider-set offers and optional bring-a-friend pricing. GC2 uses fictional data and simulated payments.

## Current build

Session discovery/detail, the PostgreSQL connection and local database tools are implemented here. Offer controls and the owner workspace are in PRs #28–29. Customer quote, booking creation and receipt-by-ID are still assigned to Janelle. The remaining customer screens are also under development. The full Browse → Select → Confirm → Save flow is not complete.

Public URL: not deployed yet.

Review order: [CP0 #22](https://github.com/Frannaaa/slotdrop-gc2/pull/22) → [data #27](https://github.com/Frannaaa/slotdrop-gc2/pull/27) → [offers #28](https://github.com/Frannaaa/slotdrop-gc2/pull/28) → [owner #29](https://github.com/Frannaaa/slotdrop-gc2/pull/29). After a reviewed merge, retarget the next PR to main.

## Run locally

Node 22 or later is required.

```powershell
npm ci
npm run check
npm test
npm run check:sql
npm run demo
```

Open http://localhost:3000/api/slots. Open the owner workspace after checking out the owner branch. The explicit demo command stores its PGlite database in ignored .local-data/. Restarting preserves its records.

Fresh seeds use daytime/evening sessions on the next two Philippine calendar days. Existing rows keep their saved times; restarting does not refresh expired offers.

## PostgreSQL and deployment

The database tools and Dockerfile are available from PR #27 onward.

1. Put DATABASE_URL in a local .env or the host's private environment settings.
2. Use a NEW disposable course database and run `npm run db:init` once. Existing tables/data cause refusal; it does not reset or migrate them.
3. Run `npm start`. Without Docker, production installation is `npm ci --omit=dev`; a Docker-capable host can use the included Dockerfile.
4. Set NODE_ENV=production. PORT comes from the host or defaults to 3000. Keep the database provider's TLS verification enabled.
5. Check /api/health for process liveness and /api/slots for a database-backed response. Health alone does not check the database.
6. Run the Postman collection against the public URL after deployment. Once booking integration is complete, save a booking, restart the Node service and read the same receipt back.

GitHub stores the source; it does not host this Node API. The local .local-data directory is not the public deployment database.

.env.example lists PORT and DATABASE_URL with empty values. Never commit .env, credentials, node_modules or local data. TEST_DATABASE_URL is used only for isolated tests. On macOS/Linux, use `cp .env.example .env` when a local environment file is needed.

## Members

| Member | GitHub | Number | Ownership |
|---|---|---|---|
| Fran | Frannaaa | 1 | Architecture, database, session/offer APIs, owner dashboard/metrics, integration/deployment |
| Cholo | chukwunyeluukgabrielokolo-cmyk | 2 | Home and featured sessions |
| Janelle | janellereonal | 3 | Quote/pricing, booking/retries and confirmation read API |
| Kaitlyn | sonatiina | 4 | Booking form and confirmation frontend |
| Kaithlyn | kattgrass | 5 | Detail and selection-summary frontend |
| Kirsten | 13kilograms | 6 | Shared styling and Browse integration |

See [CONTRIBUTING.md](CONTRIBUTING.md) for branches, reviews and merge rules. Current tasks and assignees are in [Issues](https://github.com/Frannaaa/slotdrop-gc2/issues).

## Stack

| Tool | Version | Reason |
|---|---|---|
| HTML/CSS/plain JavaScript | GC2 frontend | Fetch JSON, transform it and render each page |
| Node.js | 22 in CI/image; local checks on 24.19.0 | JavaScript server |
| Express | 5.3.0 | Own API between browser and database |
| PostgreSQL | 16 verified in CI; public host pending | Persistent tables, constraints and transactions |
| pg | 8.23.1 | Parameterized SQL and transaction clients |
| dotenv | 18.0.9 | Local environment settings |
| PGlite | 0.5.12, demo/test only | Local PostgreSQL-compatible database |
| Git/GitHub Actions | Reviewed PRs and CI | Task history and repeatable checks |
| Postman/Newman | v2.1 export; tested with Newman 6.2.1 | API checks |

package-lock.json pins dependencies. Add the actual public runtime/database versions after deployment.

## Changes since GC1

The build focuses on recurring leisure sessions and multi-seat allocations. Providers control standard and optional buddy offers; the model commission is 10%. Discovery covers the next 72 hours, with a separate deadline for each session.

Availability and buddy pricing are the two proposed revenue features. The booking service still needs to enforce them at purchase. Paid add-ons, accounts, real payments, React and optimization belong to the separate Final Project.

## Documents

- [Business case, worked examples and sources](docs/business.md)
- [Route contract](docs/routes.md)
- [Database schema](docs/schema.md)
- [System diagram and data flow](docs/system.md)
- [Challenges and test evidence](docs/challenges.md)
- [Deployed List baseline](docs/baseline.md)
- [Assistance log](AI-USAGE.md)

The Postman export and compact test records are in the owner branch (#29).
The verified owner build passed 12 PostgreSQL tests, eight SQL scenario groups, a production-container restart check and 21 Postman requests with 26 assertions. See docs/challenges.md for the run link and scope.

## Checkpoints and submission

- **October 28:** collaborators/access, protected main, contribution/PR files, environment example, README, assigned Issues, reviewed and merged routes/schema and first business draft.
- **November 4:** deployed Browse loads database items through the API.
- **November 9, 2026, 11:59 PM Philippine time:** integrated deployed flow, reviewed main tagged `gc2-v1.0`, two-page PDF, Postman export, system diagram, business/challenge/baseline evidence and individual recordings.

Each member also needs three merged code PRs, two real reviews and merges in two grading windows. The group must complete the deployed challenges and phone test. Personal predictions and recordings are not completed by the automated checks.

## Fran's remaining work — checked October 28

**Today (CP0):**

- Get the assigned teammate's real review on PR #22, resolve comments and merge the approved route/schema/business draft into main. They are still only on branches.
- Finish collaborator access and assign #4, #10, #14, #15, #16, #20 and #21 in GitHub. Current checks report read access for janellereonal, 13kilograms and knee-rel; accepted collaborator access still needs confirmation.
- Verify main's required PR, one-approval and no-force-push settings. The API confirms protection is enabled but has not exposed the full settings.
- Check the inherited GC1 quotes/page references against the original PDF, then use the announced checkpoint submission channel.

**Before the November 9 final:**

- Review and merge the three feature PRs (#27–29), and give two genuine reviews of teammates' PRs with specific comments. No code PR is merged yet.
- Have meaningful code merged in a second grading window after October 28; merging everything today would not meet that requirement.
- Connect the public Node host and PostgreSQL database; integrate the customer screens and Janelle's quote/booking/readback routes. The repo link is not a deployed API URL.
- Verify the complete public booking flow, saved owner figures and persistence across a server restart. Complete the deployed Postman challenges, request trace and hand-drawn diagram with the group.
- Complete the commission-rule file/line inventory, deployed List baseline and outside-group phone test. Prepare the final two-page PDF, update the deployed URL/versions and tag the reviewed main build gc2-v1.0.
- Make your own Challenge 5 predictions before running the function and record the unedited voice explanation (maximum three minutes) without assistance. This cannot be replaced by automated tests.

