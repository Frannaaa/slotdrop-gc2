# Author checks, October27,2026

## Starter application
Node24.22.1, pinned npm dependencies. JavaScript syntax checks passed. Local HTTP checks passed for updated Home200, CSS200, health200 and unimplemented business API404. Health verifies the starter only.

## Previous standard-only SQL contract checks
Executed schema.sql and seed.sql in an isolated ephemeral PGlite0.5.12 engine running PostgreSQL18.6, not a hosted production database.
- Created four tables, three fictional providers, four activities and eight dated sessions.
- All eight sessions eligible within 72 hours and before cutoff immediately after seeding.
- A two-seat PHP 1,600 booking stored PHP 3,200 gross, PHP 320 fee, PHP 2,880 payout; derived remaining allocation decreased from4 to2.
- A separate one-seat booking for the same session succeeded, demonstrating removal of the obsolete unique-slot constraint.
- Duplicate request_id rejected with23505.
- Zero quantity and above-original offer rejected with23514.
- Repeat seed refused, transaction rolled back and eight sessions remained.
- Group totals/fees/payouts use BIGINT; price-times-quantity check casts before multiplying.

These checks do not establish deployed transaction locking, idempotent HTTP behavior, concurrency safety, customer consent handling or external inventory accuracy. Those API behaviors remain future implementation acceptance criteria.

## Repository controls observed
main protection inspected in browser: pull request required, approvals required, required count1, conversation resolution required, bypass disabled, force pushes and branch deletion disallowed. No direct-push test was performed.

## Scope and data
Demo providers/prices/schedules are fictional. Regular/offer prices, quantity, request keys, snapshots and metrics have consistent field definitions across contracts. Original GC1 source filenames retained; current group is1.


## Current bring-a-friend revision checks

Reran fresh four-table schema and eight-session seed on PGlite0.5.12/PostgreSQL18.6 after adding optional buddy rates and receipt snapshots.
- Session1 quantity 1: standard PHP 1,600fee PHP 160payout PHP 1,440.
- Session1 quantity 2: buddy PHP 1,520 each,total PHP 3,040fee PHP 304payout PHP 2,736.
- Session1 quantity 3: buddy total PHP 4,560fee PHP 456payout PHP 4,104.
- Session3 buddy disabled,quantity 2: normal total PHP 2,400fee PHP 240payout PHP 2,160.
- Saved buddy receipt stores normal offerPHP 1,600 and charged ratePHP 1,520pricing type and quantity; remaining released seats4->2.
- Duplicate retry key rejected23505.
- A one-seat buddy receipt rejected23514.
- Zero buddy rate and a buddy rate equal to/above the normal offer rejected23514.
- Disabling a buddy rate affects a subsequent quote calculation; prior saved receipt keeps PHP 1,520.
- Invalid new group offer and repeat seed refused; eight original sessions preserved.

These are schema and SQL contract-scenario checks, not tests of a completed pricing API. Shared service implementation remains Janelle's next-phase work. Pinned starter syntax/HTTP checks from the preceding revision remain applicable; executable starter code was not changed in this revision.


## Reproducible CP0 correction checks, October 27, 2026

This revision uses Node 24.19.0 in the local review workspace.
- npm ci: dependency installation passed.
- npm run check: starter and error middleware syntax passed.
- npm test: three HTTP regression tests passed (page/CSS/health; structured 400/404/413 errors; safe unexpected 500).
- npm run check:sql: eight SQL scenario groups passed in a fresh in-memory PGlite 0.5.12 database, including independent activity defaults and per-session cutoff overrides.
- SQL enforces positive activity defaults, a session cutoff before its start, per-seat money bounds, receipt quantity/tier consistency, per-seat fee rounding and gross/fee/payout arithmetic.
- npm audit reported zero known vulnerabilities at installation. This is a point-in-time dependency result, not a guarantee.

Earlier standard-only checks above describe earlier revisions. The current seeded cutoffs vary by activity; they no longer all use a two-hour offset. The first expires two hours after seeding, the last after 69.5 hours.

Run instructions and limits are in docs/database-checks.md. No hosted PostgreSQL, multi-client locking, completed booking HTTP API, student verification or Janelle review is claimed by these checks. Source-based business research is in docs/research.md. The inherited GC1 quotations/page anchors still need checking against the original PDFs during the student's review.
