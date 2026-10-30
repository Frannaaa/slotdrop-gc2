# Studio references and applications

Fran owns this extension. It supports supplier discovery; it does not replace the six customer screens or the two revenue features.

## Decision and competitor references

ClassPass asks a business to submit its information, then builds a profile after onboarding: https://classpass.com/partners/how-it-works . Klook separates merchant registration from review and access to its merchant tools: https://merchant.klook.com/introduction . Checked 30 October 2026. SlotDrop adopts an application-before-publication sequence. Competitors' approval times and commercial results are not SlotDrop promises.

## User flow

1. Customers can open a studio reference from a sample session card. The page identifies it as independent and unclaimed, shows source links and separates published facts from simulated availability.
2. “For studios” opens the application. A reference-page link prefills business details; an unlisted studio can enter its own details. Collect studio name, public HTTPS URL, location, controlled activity choices, sample contact name/email, representative role, authorization attestation and the course notice. No bank information or identity documents.
3. Validate before saving. Save one stable retry key and payload in sessionStorage before the first POST. If storage is unavailable, send nothing. If a response is lost, lock the original details and retry the same request, including after reload.
4. The database stores a pending application. Redirect to its opaque status URL. Reload fetches the record; public responses contain no contact data or retry key.
5. The demo stops at pending review. Real representation verification, private review tools, accounts, approved profile setup and publication are later work. No public route approves an application or grants control of a researched business.

An authorization checkbox records an attestation; it is not proof. A new application does not modify the provider table. An approved status, if entered later by an authorized operator, still means setup is needed; it must not announce a published page automatically.

## Where it lives

| Layer | Files |
|---|---|
| Source-backed catalog | public/data/real-studio-demo.json; server/repositories/reference-catalog.js; tools/generate-reference-seed.mjs |
| Additive persistence | db/migrations/002_studio_references.sql; 003_provider_applications.sql; db/schema.sql |
| JSON routes | server/routes/providers.js; server/app.js |
| Profile, form and status | public/studio.html; provider-apply.html; provider-application.html; matching public/js files; public/css/providers.css |
| Checks | tests/providers.test.js; tests/reference-catalog.test.js; tools/provider-ux.mjs |

Current reference activities: Laro mug/wheel, Bumi mug/free-form, AMT handbuilding/wheel, Sip & Gogh Century Mall painting, Tahanan exploratory wheel. Core Pilates remains research-only because its exact timetable and class duration have not been verified. A published weekly pattern is not a confirmed seat. Sample standard offers are 90% of the published reference price; enabled buddy offers are 95% of that standard rate. These are classroom model values, not studio-approved discounts. All sample allocated capacities and booking lead times are invented for the simulation and labelled accordingly.

Existing synthetic provider names and their receipts are never changed into real-company transactions. Known old fixture services are retired from new customer discovery; historical records remain. Startup creates first allocations once and never shifts dates or replenishes sold seats. Create new future offers through Owner when samples expire.

## Verification

API checks cover validation, rejected ownership/status fields, concurrent exact retries, conflicting key reuse, contact privacy, repeated migrations and preservation of old receipts. Browser checks cover all five profiles, the real-reference booking path, prefill, form validation, status reload, lost save response/reload/retry, blocked storage, invalid links, outage recovery and 320px layout. Evidence in docs/evidence/browser/provider-ux.json uses disposable local data, not real studio reservations or verified applicants.
