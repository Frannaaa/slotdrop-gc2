# SlotDrop

Group 1 · ITMGT 45.03-YZW

SlotDrop helps people near Katipunan find and book released workshop seats. Studios set their own allocation, booking cutoff and optional buddy price. The course demo uses sourced studio details and simulates all offers, bookings and payments.

## Deployed course demo

[Open SlotDrop on Render](https://slotdrop-gc2-group-zx8j.onrender.com/) · [Owner workspace](https://slotdrop-gc2-group-zx8j.onrender.com/owner.html)

Start at Home and follow Browse, Detail, Selection, Checkout and Confirmation. Use fictional guest details. The Owner workspace shows the saved booking and five metrics. Render may take a moment to start after it has been idle.

For grading after the scheduled dates pass, choose a practice session to complete a booking. Open **Closed sessions** at the bottom of Browse to look up dated sessions whose booking cutoff has passed.

## GC2 submission

| What to open | Files |
|---|---|
| Architecture and request flow | [System diagram and booking data flow](docs/system.md) |
| API and database | [Route table](docs/routes.md) · [Schema](docs/schema.md) |
| Business case | [GC1 traceability, funnel and revenue features](docs/business.md) · [Improved post-feedback GC1 proposal](docs/reference/gc1-revised-business-proposal.md) · [Two-page PDF](docs/SlotDrop_GC2_Summary.pdf) |
| Challenges and stretch evidence | [Challenge 1–5 and five stretches](docs/challenges.md) · [Postman collection](docs/SlotDrop-GC2-Challenge1.postman_collection.json) · [Individual recording links](docs/challenges.md#individual-recording-links) |
| Measured Browse baseline | [Mobile Lighthouse, requests, transfer size and API time](docs/baseline.md) |
| Release and collaboration | [Submission checklist](docs/gc2-submission-gate.md) · [AI disclosure](AI-USAGE.md) |

The app is organized into [browser pages](public/), [Express routes and services](server/), [database schema and migrations](db/), [tests](tests/) and [release checks](tools/).

## Run locally

Fran's Final foundation adds server-enforced seat holds while preserving the current booking journey. The countdown and hold-to-booking conversion are still teammate integration work. See [changes since GC2](docs/changes-since-gc2.md), the [hold API and handoff](docs/routes.md#seat-holds-and-teammate-handoff), and [actual local API captures](docs/refusals.md). The published `gc2-v1.0` tag is unchanged.

The [three-page report draft](docs/SlotDrop_Final_Report_Draft.pdf) contains the six required sections, numerical decision, written Owner analytics claim, diagram and versions. Its [editable HTML](docs/SlotDrop_Final_Report_Draft.html) is generated with `node tools/build-final-report.mjs` after the recorded rehearsal. It is explicitly a draft until teammate integration and release checks pass.

`npm run check:final` rehearses the API flow in a disposable local database and writes [the current integration status](docs/evidence/final-readiness.json). It verifies the five Owner figures and deliberately returns a nonzero exit while hold-aware quote/save is missing. Passing it does not substitute for the browser and unaided-user checks.

Before presenting on Windows, run `pwsh -File tools/prepare-presentation.ps1 -OpenCode` from the project directory. It checks/starts the local backup, attempts a live warm-up, opens app/Owner and optionally VS Code source files. Use `-NoBrowser` for checks only. If local networking is restricted, run `npm run demo` in your own terminal and verify the displayed address before the defense. The helper stops only a server it started if startup verification fails.

Use Node 22 or later.

```sh
npm ci
npm run demo
```

Open [Home](http://localhost:3000/) or [Owner](http://localhost:3000/owner.html). The demo keeps its PGlite data in `.local-data/`. Run `npm run check`, `npm test` and `npm run check:sql` to check code, API behavior and schema constraints.

## PostgreSQL and deployment

For a new PostgreSQL course database, set `DATABASE_URL`, `NODE_ENV=production` and `PORT` through the host environment or a local `.env`. Copy [`.env.example`](.env.example) for the variable names. Keep the filled file out of Git and leave database TLS verification enabled. `TEST_DATABASE_URL` optionally points the test suite at a disposable PostgreSQL test database.

Run `npm run db:init` only for a new, empty course database. Start with `npm start` or the [Dockerfile](Dockerfile). Render uses the [startup configuration](render.yaml) to initialize an empty database or apply upgrades to an existing database. Verify `/api/health` and run `npm run check:gc2 -- https://slotdrop-gc2-group-zx8j.onrender.com` against the public demo.

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
| HTML, CSS and JavaScript | Current frontend | Fetch JSON and render each page; no framework is required for the Final |
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

The broader last-minute appointment concept became a workshop booking MVP for GC2. Dated offers appear within 72 hours of their start and close at their own deadlines. Browse groups available dates by workshop and keeps recently closed dates in an archive. Three undated sample bookings appear in a separate section so the instructor can book after the dated samples close while seats remain.

The two revenue features are released-seat availability and buddy prices. The server checks seats and the accepted price before saving. SlotDrop models a 10% commission, and Confirmation reads the saved receipt by ID. The course demo defers accounts, real payments and paid placements.

The [business research appendix](docs/reference/business-research-appendix.md) contains the studio sources, workshop photo credits and pilot assumptions.
