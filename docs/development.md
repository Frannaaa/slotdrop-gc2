# Fran's next-phase development: database and session reads

Depends on the CP0 contract in PR22. This branch implements Fran's #11, #12 and #13 work; it does not merge or approve CP0.

## Run locally

    npm ci
    npm run check
    npm test
    npm run check:sql
    npm run demo

The explicit demo command creates a persistent fictional PostgreSQL-compatible PGlite database in ignored .local-data/. First use applies schema and seed; later starts preserve it. Seed times expire as documented in docs/database-checks.md. Do not start multiple demo processes against this directory.

Production uses the pg connection pool and DATABASE_URL instead of the embedded demo. Set DATABASE_URL to a new disposable PostgreSQL database, run npm run db:init once, then npm start. This setup refuses existing schema/data; it never resets a database. Hosted connectivity is not verified here.

Implemented: GET /api/slots and GET /api/slots/:id, literal search and category/area/date/people filters, Manila date boundaries, safe IDs and money, and independent cutoff/capacity/72-hour eligibility.

Validation: syntax and five HTTP/date tests passed against a fresh in-memory PostgreSQL engine, alongside eight existing SQL scenario groups. Real multi-client PostgreSQL locking and hosted deployment remain unverified. Janelle's quote/booking routes remain assigned to her.

AI assistance: Codex wrote this implementation and tests at Fran's request. Fran has not yet recorded a personal run; teammate review is pending.

## Provider offer controls
Adds POST /api/slots and PATCH /api/slots/:id for #23/#24. Creation resolves an omitted cutoff from the activity default; explicit overrides belong to that session. Edits lock the session row, reject reducing capacity below confirmed seats, require compatible buddy prices and preserve saved receipts. Cancelling a session with confirmed bookings is refused.

Validation: seven tests passed including creation/default overrides, duplicate sessions, bad inputs, booked-capacity conflicts, pause and receipt preservation. This engine checks transaction behavior but not competing network clients on hosted PostgreSQL. Janelle's booking must acquire the same session lock before inserting seats.

## Owner workspace and metrics

Run npm run demo, then open http://localhost:3000/owner.html. The local fictional database persists in .local-data/. This screen includes create/edit offers, independent booking deadlines, optional buddy rates, modeled provider proceeds, pause/resume, five metrics and saved receipts. No real bookings or payments are submitted by this screen.

GET /api/owner/catalog supports #26: returns all owner sessions, including paused/expired sessions, seeded activities with cutoff defaults, and the commission basis points. This supplements customer discovery; it does not change its eligibility rules. GET /api/bookings and GET /api/metrics implement #17/#18. The seventh screen is #9.

Validation: eight tests passed, along with syntax and eight SQL scenario groups. Browser checks created a fictional ninth session, paused a session, opened edit mode, and inspected desktop 1280x900 and phone 390x844 layouts without horizontal page overflow. No browser console errors appeared during these checks.

The UI computes a labeled preview; saved booking amounts continue to be server-owned. Shared site CSS is preserved; owner-only styling is scoped to .owner-page.

## Remaining integration

Janelle's GET quote, POST booking and GET booking-by-ID APIs are not implemented here; neither are other members' customer screens. The receipt/metric tests insert fictional receipts directly into the test database. They do not claim the full customer flow works.

All owner operations are intentionally unauthenticated in this fictional-data course demonstration. A real service needs ownership authentication and private customer access before use with real records. Hosted PostgreSQL deployment, concurrent-client locking verification, student explanation and teammate review remain pending. No grade/PR-count completion is claimed by opening these drafts.
