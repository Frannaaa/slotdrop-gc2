# GC2 deployment handoff

Use one Node service and a separate PostgreSQL database. The app serves the HTML, CSS, JavaScript and API from the same origin. Browser code never receives a database connection string.

## Build and start

The Dockerfile uses Node 22, installs production dependencies, and runs the app as the unprivileged node user. A Docker-capable Node host can build it directly. Without Docker, use npm ci --omit=dev and npm start.

Set DATABASE_URL privately in the host settings. PORT is supplied by the host or defaults to 3000. Set NODE_ENV=production. Do not copy local .env files into the image or repository. Respect the database provider's TLS requirements in its connection settings; certificate verification must remain enabled.

Initialize a NEW disposable course database once with npm run db:init using the same private DATABASE_URL. Existing tables cause refusal; this is not a migration or reset tool. Subsequent app restarts reuse the database. The local PGlite demo and .local-data directory are not the public deployment database.

## Release checks

1. Confirm the approved code is on the selected deployment branch and all checks pass.
2. Initialize the separate PostgreSQL database, then start the Node service.
3. Open /api/health for process liveness and /api/slots for an actual database-backed request. Health alone does not prove database readiness.
4. Import docs/SlotDrop-Fran.postman_collection.json, set baseUrl to the public origin, and run it against fictional data. Save the actual run and screenshots.
5. Once the team's booking endpoints are integrated, make a booking through the customer pages, restart the Node service, and read the same booking by ID. Verify owner counts and fees change once.
6. Test the booking flow on a phone outside the group, record the deployed List baseline, then submit the approved build and tag main gc2-v1.0.

The public URL and hosted database have not been provisioned in this pass. Add the actual URL and runtime/database versions to README after deployment. A passing CI service-container database is test infrastructure, not the public host.

## Scope

GC2 uses fictional customer/provider data, no login and simulated payment, as allowed by the brief. The owner screen exposes all demo records. Do not use it to collect real customers or payment details. Provider accounts, real payments, React and optimization belong to the separate Final Project.
