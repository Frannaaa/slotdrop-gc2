# Changes since GC2

Our upgrade is a server-enforced 10-minute seat hold, chosen under step 1, improved by a visible countdown and hold-to-booking persistence.

This is the declared final target. Fran's backend foundation is merged and deployed. The countdown, hold-aware accepted quote and atomic booking conversion remain assigned teammate work and must pass integration before the upgrade is claimed complete.

## Implemented by Fran

- Additive `006_seat_holds.sql` migration and fresh schema preserve existing sessions and receipts.
- Create, read and release APIs persist hold IDs, stable retry keys, quantities and expiry. The server uses the earlier of ten minutes and the booking cutoff. Expired retries do not renew the reservation.
- One slot query counts confirmed seats and active holds for discovery, Detail, ordinary quotes/bookings, Owner and low-stock metrics. Holds contribute no confirmed orders or revenue. Owner cannot shrink capacity below reservations.
- Tests cover expiry, retries, cutoffs, undated grading sessions, migrations and database reopen. A real PostgreSQL booking/hold race runs in CI; it is skipped locally without `TEST_DATABASE_URL`.
- Actual local HTTP captures and saved receipt/Owner readback are in [refusals](refusals.md). The accepted-total 409 behavior is explicitly distinguished from the brief's generic 201 example.
- The ten-minute health-ping workflow is on main. Recurring execution still needs verification; Fran also opens the app before presenting and keeps the local fallback ready.
- The Windows presentation helper prepares the local backup and source tabs. A repeatable Final API rehearsal verifies Owner analytics, records the missing conversion dependency and feeds a three-page project report with the required sections, diagram, versions and written bonus claim.

## Files

`db/schema.sql`, `db/migrations/006_seat_holds.sql`; `server/repositories/{migrations,slots,holds,owner}.js`; `server/services/{holds,bookings,pricing,offers}.js`; `server/routes/{holds,slots,owner,health}.js`; `server/{app.js,lib/validation.js}`; hold/health tests and `tests/helpers.js`; `tools/{check-sql,capture-final-api-evidence}.mjs`; `.github/workflows/keep-awake.yml`; README, route/schema/system documentation, refusal captures and AI-USAGE.

Small booking/pricing edits in this branch connect the shared availability rule and UUID validator. Pricing policy, hold conversion and client behavior remain with their assigned owners.

Release tooling also adds `tools/check-final-readiness.mjs`, `tools/build-final-report.mjs`, `tools/prepare-presentation.ps1`, `docs/evidence/final-readiness.json` and `tools/report-template.html` and `docs/SlotDrop_Final_Report.{html,pdf}`. The existing health workflow now checks public pages/APIs on PR/manual runs; its scheduled runs still request health only.

## Final acceptance still required

Integrate the teammate work, run the uninterrupted browser journey and valid/expired outcomes, verify the five Owner figures, refresh release evidence and the 2-4 page report, and rehearse the confirmed presentation length. The brief lists both 10+5 and 15+5 minutes; confirm class timing. Claim Owner analytics in writing. Tag reviewed, tested and verified `main` as `final-v1.0` only after those checks pass.


[Final requirements audit](final-submission-audit.md) separates required submission items, existing GC2 evidence, team-plan decisions and wording that needs instructor confirmation. The feedback-response file and final-v1.0 are still pending.
