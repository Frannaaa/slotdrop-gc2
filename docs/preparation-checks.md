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
