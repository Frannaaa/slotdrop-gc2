# GC2 Criterion 1 — Transaction flow works (20 points)

**Status checked 13 November 2026 (PHT).** Home (#35, #68), Browse (#62, #63), Detail and Selection (#41), Checkout and Confirmation (#43), booking and receipt APIs (#42), and the Owner workspace (#29, #51) are merged.

The live Render walkthrough on 12 November produced a Confirmation receipt and one matching Owner row. The separate receipt readback returned 200. See [the deployed evidence](challenges.md#challenge-2--trace-one-real-request). Browser Network capture and the outside-group phone test remain pending.

### Fran-owned automated acceptance check

The script `tools/check-transaction-smoke.mjs` verifies **API only** with a *disposable test database* by default. It selects an eligible fictional session, uses the server quote, posts one fictional one-seat booking (201), GETs the saved receipt, finds its ID in Owner's booking list, checks remaining seats/booking count, and replays the identical retry key (200, same receipt and no duplicate). It writes nothing to production in this mode.

```sh
npm ci
npm run check:transaction
```

CI runs this command on PR #45 after tests. The actual log and commit hash must be checked before claiming a pass.

Only after the **official group** server is ready, explicitly allow one fictional booking write (it remains in persistent course-demo data):

```sh
npm run check:gc2 -- https://ACTUAL-GROUP-HOST
npm run check:transaction -- https://ACTUAL-GROUP-HOST --confirm-fictional-write
```

Do **not** use the private reference-only Render URL as the final group URL, do not use real emails, and do not rerun against a full session without creating fresh future offers through Owner. A successful API smoke **does not** prove the six-screen browser path or independent stranger test.

### Verified disposable CI smoke — November 8, 2026 (PHT)

On [CI run 42396545013](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42396545013), head `e666f800b8b478621149ab4f65bbb284d5471af8`, the new **local disposable** Node HTTP test passed. The logs show:

| Observation | Actual outcome |
|---|---|
| POST /api/bookings | **201**, fictional one-seat receipt created |
| GET /api/bookings/:id | **200**, same saved receipt |
| Repeat same request ID and payload | **200**, same receipt, no duplicate |
| Owner GET /api/bookings | Exact new receipt ID appears once |
| Available seats | **4 → 3** |
| Owner booking count | **0 → 1** |

The test fixture used a PGlite database and local `127.0.0.1` HTTP app. This verifies the *backend-to-Owner chain* in isolation; it **does not** verify an official Group 1 deployment, any of the missing browser screens, independent phone use, or the required PostgreSQL restart of that public deployment. The CI also separately reported successful Node/PostgreSQL tests and production-container restart checks.

### Full-credit browser acceptance — actual evidence to collect

- [x] Reviewed Browse, shared CSS and Checkout/Confirmation are merged. The deployed browser walkthrough reached Confirmation from Browse.
- [ ] Final reviewed `main` deployed with persistent PostgreSQL and discoverable **future fictional** sessions. Record exact public origin, commit SHA, test timestamp and tested booking ID.
- [ ] **Independent non-member**, using a real phone without instructions, starts on Home, finds Browse, applies a filter, opens Detail, chooses quantity, sees server total on Selection, fills Checkout with fictional contact/payment, submits once, and gets Confirmation.
- [ ] Confirm the URL contains the saved receipt ID and refreshing Confirmation **GETs that receipt by ID** rather than relying on browser storage.
- [x] The 12 November deployed capture shows the same booking ID in Confirmation and Owner, with no real customer details.
- [ ] Confirm the number of available seats dropped by the correct quantity; duplicate clicks must not produce two bookings; one clear success state.
- [ ] Test 320–390px width, error recovery and all forward/back links; note any defect and retest after fix.
- [ ] Put independent tester's date/device, observed success/failures, non-sensitive screenshots and the exact deployed commit in `docs/challenges.md` or `docs/evidence/`; use real observations, not reconstructed results.

### Who owns what

- **Fran (M1):** merged core owner and server integration, readiness/smoke tool, correct deployment setup and final actual owner order evidence; **do not silently author teammates' screen code under their names**.
- **Kirsten (M6):** shared CSS and Browse, filters/phone states.
- **Kat (M5):** Detail/Selection and valid peer review of #43.
- **Kaitlyn (M4):** Checkout and Confirmation, no post-success resubmit.
- **Janelle (M3):** quote/save/receipt implementation and correctness.
- **Cholo (M2):** Home and link to Browse.

Related: [Issue #46 captain master checklist](https://github.com/Frannaaa/slotdrop-gc2/issues/46), [#43 Checkout/Confirmation](https://github.com/Frannaaa/slotdrop-gc2/pull/43), [#45 release readiness](https://github.com/Frannaaa/slotdrop-gc2/pull/45), [#55 transaction smoke](https://github.com/Frannaaa/slotdrop-gc2/issues/55).
