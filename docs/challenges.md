# Challenges and test evidence

## 1. Break the API

The [Postman collection in the owner branch](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-owner-workspace/docs/SlotDrop-Fran.postman_collection.json) in the owner branch covers session validation, unknown IDs, empty search and owner edits. A local Newman 6.2.1 run completed 21 requests and 26 assertions with no failures.

The required deployed booking checks are still pending: invalid quantity, a wrong browser total, insufficient seats, unknown ID, missing required details and an empty search. Record the expected and actual status, response screenshot and any fix for each request.

## 2. Trace one request

[system.md](system.md) names the offer-management files and functions and shows the architecture. The group still needs a Network-tab record and hand-drawn diagram for an actual customer booking on the deployed site.

## 3. Review corrections

These defects were found in the assisted implementation and corrected:

| Problem | How it was identified | Correction |
|---|---|---|
| Cutoff guidance still showed the previous activity's default | Manual browser check: override a cutoff, then change activities | Update the guidance while preserving the session override |
| Resume sales returned success after the booking cutoff | A request returned 200/open, but the session stayed out of discovery | Return 409 when a paused session is not bookable; show the actual sales state |
| Saving another field rounded an unchanged cutoff to the minute | Review of datetime-local serialization | Preserve the original timestamp when the deadline was not edited |

Regression tests are in tests/owner-policy.test.js and tests/offers.test.js in the development branches. The team still needs to review these explanations and add its own account of the decisions.

## 4. Change an owner rule

The active commission is COMMISSION_BASIS_POINTS in server/config/business.js. The owner preview reads it through the catalog API; it has no separate 10% fallback.

Saved receipt rates are historical values and stay unchanged. Test fixtures may also contain fixed rates for specific examples. Before completing this challenge, record the exact file/line inventory and explain the difference between active configuration, saved data, examples and test expectations.

## 5. Predict, then run

Not completed. Each member supplies three predictions before running a chosen function, records the actual outputs and explains any mismatch. Fran's unedited voice recording, at most three minutes, must be made without assistance as required by the brief.

## Completed automated checks

The following results are from the owner development build, not every earlier branch.

[PostgreSQL CI run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/40527821450), commit 6401b8d5d83fbcf4b949c736372c428016b066b2:

- Node 22 and PostgreSQL 16: 12 tests passed, none failed or skipped.
- Eight SQL scenario groups and syntax checks passed.
- A capacity edit waited behind a transaction holding the session lock, then rejected shrinking below the newly committed seats.
- The production Docker image built and started. A saved session and a directly inserted fictional receipt fixture remained after restarting the Node container. Owner seat counts and metrics still matched.

This checks storage and owner readback. The receipt fixture was not created through a customer booking page.

The owner branch also contains the compact records in docs/evidence/fran-api-local.json and docs/evidence/fran-production-ci.json. These are local/CI results; public-URL challenge screenshots, the full customer flow and the deployed baseline remain pending.
