# Challenges and test evidence

## 1. Break the API

The [Postman collection](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-owner-workspace/docs/SlotDrop-Fran.postman_collection.json) in the owner branch covers session validation, unknown IDs, empty search and owner edits. A local Newman 6.2.1 run completed 21 requests and 26 assertions with no failures.

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

Current owner-build inventory, checked October 28 without changing the rate:

| File/line | Role | Edit to change the active rate? |
|---|---|---|
| server/config/business.js:1 | COMMISSION_BASIS_POINTS = 1000 | Yes — the single active setting |
| server/repositories/owner.js:3 and :8 | Import and return that setting in the catalog | No |
| public/js/owner.js:86–88 | Read the API rate for the per-seat proceeds preview | No |

Saved receipt rates are historical values and stay unchanged. SQL validates each saved rate and its arithmetic; it does not set the active commission. Fixed test inputs and worked examples describe specific rates rather than another live setting. There is no duplicate owner-preview fallback to refactor. After Janelle's booking service is integrated, check that it imports the same active setting and update this inventory before completing the group challenge.

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

## October 28 bug review

Two new HTTP regression tests failed before the fix: an expired cancelled session reopened with 200 instead of 409, and creation accepted a deadline that passed during a simulated database-lock wait (201 instead of 400). Reopening now checks paused and cancelled inventory, including whether the session is confirmed to run. Creation and reopening read the clock after acquiring the lock.

The owner form and inventory actions are locked while requests are pending. Offers outside the server-configured discovery horizon show “Not listed yet.” A disposable browser check confirmed pause, editing, a server price-validation error and a successful retry. No saved user demo records were changed.

After these fixes, local syntax checks passed; 14 tests passed with zero failures and the PostgreSQL-only concurrency test skipped. All eight SQL scenario groups passed. npm audit --omit=dev reported zero known production dependency vulnerabilities. These results do not complete the public booking challenges or the team's own reasoning and recording requirements.

The updated code at commit 2f4e384eb52c284d5481e31843b2a8ff03f27be3 also passed [PostgreSQL and production-container CI](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/40543382241): syntax, SQL scenarios, PostgreSQL HTTP/locking tests, Docker build/initialization and restart persistence. The compact review record is [fran-review-2026-10-28.json](https://github.com/Frannaaa/slotdrop-gc2/blob/g1/m1-owner-workspace/docs/evidence/fran-review-2026-10-28.json).

### Second edge-case pass

Three added regression tests failed before correction because malformed encoded path parameters, unsupported JSON encodings and an unreachable PostgreSQL server all returned 500. They now return structured 400, 415 and 503 responses respectively. Reads and transactions both handle connection failures without exposing connection details. A failed rollback discards its connection and preserves the original error.

After correction, the owner build passed local syntax checks, 17 tests and all eight SQL scenario groups. The real-PostgreSQL concurrency test was skipped locally because TEST_DATABASE_URL was not configured. These checks supplement the earlier results and do not establish deployed customer-booking behavior.

### Stale owner editor

A further check reproduced an unintended overwrite: open the editor, pause that session and change its allocation elsewhere, then save a price from the old form. The previous full-field PATCH returned 200 but reopened the session and restored its old allocation. The editor now sends only fields changed from the values originally loaded. A price-only save preserves a later pause, capacity or deadline change. An unchanged form shows “No changes to save.”

The new HTTP regression covers the stale editor payload. A disposable browser check also confirmed that a price draft stays intact through a pause, saves the new price while leaving sales paused, and handles an unchanged form without an error. No browser console warnings or errors were recorded. Additional metric checks passed for multiple bookings, tied top activities, cancellation, sold-out sessions and inactive activities. Local syntax checks and 19 tests passed; the PostgreSQL-only lock test remained skipped locally. These changes are in the owner PR.

### Brand-reference pass

The owner workspace now follows the supplied October 28 brand book and [prototype](https://slotdrop-gc2-design-studio.frannaaa216.chatgpt.site/prototype): paper/ink/blue/lime, the open-bracket mark, DM Sans, Space Grotesk, readable form labels and 48-pixel buttons. Fonts are served locally with their licenses. Saved bookings appear before the offer controls; optional buddy rates and regular per-seat prices are labeled separately.

Desktop and phone browser checks confirmed loaded fonts, no page-level horizontal overflow at the phone viewport and 48-pixel visible action buttons. A saved offer edit succeeded while the existing receipt and metrics retained their original amounts. No console warnings or errors were recorded. Local syntax checks and 19 tests passed, with the PostgreSQL-only concurrency test skipped locally. The reference prototype's browser-only storage and fixed clock were not copied into the API-backed app; session cutoffs remain editable under the current contract.
