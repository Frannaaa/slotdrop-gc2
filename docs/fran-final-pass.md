# Fran's GC2 final handoff

Scope: GC2 due November 9, 2026, 11:59 PM Philippine time. React, real payments and accounts are outside this phase.

## Technical work prepared for review

- #11: PostgreSQL pool, fresh-database initialization, schema/seed and a persistent local demo.
- #12/#13: session discovery and detail with safe IDs, parameterized SQL, date/area/category/people filters, independent session cutoffs and derived seat counts.
- #23/#24: create/edit offers, optional buddy rates, activity-default cutoffs, booked-seat protection, pause and valid resumption.
- #9/#17/#18/#26: responsive owner workspace, complete demo inventory, saved receipts and five database-backed metrics.
- Repeatable local checks and GitHub Actions with PostgreSQL 16, including a competing-connection row-lock check.
- Postman export, system/data-flow document, deployment instructions and version/setup notes.

Review order: CP0 #22 → session data #27 → offer controls #28 → owner workspace #29. Retarget the next dependent PR after each reviewed merge. Do not merge a draft as evidence of a teammate review.

## Evidence and release steps still required

| Item | Why it remains |
|---|---|
| Teammate review, comments and approved merges | Required for every piece of work; current drafts do not satisfy this by themselves |
| Hosted deployment with PostgreSQL | Needs the actual host/database and public URL; CI is test infrastructure |
| Customer booking integration | Quote/create/read-by-ID and customer screens belong to the assigned teammates |
| Deployed Postman and Network evidence | The brief requires requests against the deployed app, not only local tests |
| Lighthouse/Network baseline on deployed List | Requires the team's deployed List implementation |
| Three merged code PRs and two genuine reviews by Fran | Open drafts and automated checks are not approvals or reviews given |
| Merges in two grading windows | All work cannot be represented as merged in a future window today |
| Challenge 5 and personal recording | Fran supplies three predictions before running, then an unedited voice recording without assistance, as required by the brief |
| Group PDF, final tag and submission | Complete only after the integrated build and evidence are verified |

## Current corrections

The cutoff hint now follows the selected activity while preserving a manual session override. Closed/full/started sessions no longer look bookable merely because their stored status is open. A paused session cannot be resumed with an expired cutoff, no available allocation, or an inactive activity. The fee setting comes from server/config/business.js through the catalog response; the browser no longer keeps a duplicate 10% default.

## Policy edit location

The active commission setting is COMMISSION_BASIS_POINTS in server/config/business.js. The owner preview reads it from the API. Existing receipt commission snapshots are historical facts and must not be rewritten when that setting changes. Test fixtures may intentionally contain old rates; they are examples, not another active configuration.

This is a technical handoff and status record. It does not claim completion of the team's submission or Fran's personal gate.
