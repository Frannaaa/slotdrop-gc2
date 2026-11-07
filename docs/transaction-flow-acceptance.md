# GC2 Criterion 1 — Transaction flow works (20 points)

**Status checked November 8, 2026.** This is an evidence checklist, not a claim of full deployed success.

### Source status

| Screen / route | Group `main` | Captain gate |
|---|---|---|
| Home | merged PR #35 | Confirm Home→Browse link resolves after Browse PR |
| Browse | **absent** from `main` | Kirsten must author and merge API-backed Browse, search/filter and empty/error states |
| Detail | merged PR #41 | Validate link from Browse |
| Selection | merged PR #41 | Validate server quote and correct quantity |
| Checkout | **PR #43 unmerged** | Kaitlyn must prevent resubmit after success, show errors, obtain real Kat review |
| Confirmation | **PR #43 unmerged** | Fetch saved receipt by ID on refresh |
| Booking POST /api/bookings and GET /api/bookings/:id | merged PR #42 | Fran can smoke-test, final public browser proof remains pending |
| Owner booking list | merged PR #29 | Confirm *same* booking ID appears from public customer journey |
| Official group public deployment | **not verified** | Must use shared Group 1 `main`; private reference-only Render app does **not** count |

The relevant rubric bands are Exemplary 20/20 (a stranger completes all six screens + Owner order on deployed link), Proficient around 16/20 (only one minor defect/thin screen), Developing around 12/20 (local-only or workaround), and Missing 0–8/20 (cannot complete). Current strict provisional assessment: **5/20**, because missing Browse and Checkout/Confirmation on group main prevent the full flow. This is a captain estimate, not the instructor's grade.

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

### Full-credit browser acceptance — actual evidence to collect

- [ ] Member-owned, validly reviewed Browse + CSS PRs and Checkout/Confirmation PR #43 merged into main, all page links actually wired.
- [ ] Final reviewed `main` deployed with persistent PostgreSQL and discoverable **future fictional** sessions. Record exact public origin, commit SHA, test timestamp and tested booking ID.
- [ ] **Independent non-member**, using a real phone without instructions, starts on Home, finds Browse, applies a filter, opens Detail, chooses quantity, sees server total on Selection, fills Checkout with fictional contact/payment, submits once, and gets Confirmation.
- [ ] Confirm the URL contains the saved receipt ID and refreshing Confirmation **GETs that receipt by ID** rather than relying on browser storage.
- [ ] Open Owner on the deployed link and show **the exact same booking ID**, matching activity, quantity, price and status. Record a screenshot with no personal/contact details.
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
