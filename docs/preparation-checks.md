# Author checks, October27,2026

## Starter application
Node24.22.1, pinned npm dependencies. JavaScript syntax checks passed. Local HTTP checks passed for updated Home200, CSS200, health200 and unimplemented business API404. Health verifies the starter only.

## SQL contract
Executed schema.sql and seed.sql in an isolated ephemeral PGlite0.5.12 engine running PostgreSQL18.6, not a hosted production database.
- Created four tables, three fictional providers, four activities and eight dated sessions.
- All eight sessions eligible within72h and before cutoff immediately after seeding.
- A two-seat PHP1600 booking stored PHP3200 gross, PHP320 fee, PHP2880 payout; derived remaining allocation decreased from4 to2.
- A separate one-seat booking for the same session succeeded, demonstrating removal of the obsolete unique-slot constraint.
- Duplicate request_id rejected with23505.
- Zero quantity and above-original offer rejected with23514.
- Repeat seed refused, transaction rolled back and eight sessions remained.
- Group totals/fees/payouts use BIGINT; price-times-quantity check casts before multiplying.

These checks do not establish deployed transaction locking, idempotent HTTP behavior, concurrency safety, customer consent handling or external inventory accuracy. Those API behaviors remain future implementation acceptance criteria.

## Repository controls observed
main protection inspected in browser: pull request required, approvals required, required count1, conversation resolution required, bypass disabled, force pushes and branch deletion disallowed. No direct-push test was performed.

## Scope and data
Demo providers/prices/schedules are fictional. Regular/offer prices, quantity, request keys, snapshots and metrics have consistent field definitions across contracts. Original GC1 source filenames retained; current group is1. Human reviewer and partner/instructor approvals are not fabricated.
