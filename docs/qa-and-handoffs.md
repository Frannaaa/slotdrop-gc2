# Group 1: checks and handoffs

The complete private reference is on `g1/m1-complete-build` in `Frannaaa/reference-only-slotdrop`. The official group repository is `Frannaaa/slotdrop-gc2`. Each owner builds and submits their own assigned implementation there through reviewed PRs.

## Work order

1. Kirsten supplies shared styling while everyone prepares page layouts. Janelle reviews Fran's database/session PR #27 first.
2. After the session API is available, Cholo connects Home, Kirsten connects Browse and Kat connects Detail in parallel. Fran stages offers #28, Owner #29 and discovery/shared helpers #34 for review in that order. Studio research #32 is independent.
3. Janelle supplies pricing quote. Kat connects Selection and hands `slotId` plus `quantity` to Kaitlyn.
4. Janelle supplies booking and receipt. Kaitlyn connects Checkout and Confirmation. Fran verifies the saved booking, remaining seats and Owner figures, then deploys the approved group build.

Keep the existing targets: Oct 30 shared styles/layouts; Nov 1 first working code PR; Nov 3 proposed session/Browse handoff; Nov 4 course CP1 and proposed quote handoff; Nov 6 proposed booking/receipt handoff; Nov 7 connected flow; Nov 8 fixes/evidence; Nov 9 at 11:59 PM Philippine time final submission. Proposed/internal dates are not extra course deadlines.

## Owner-specific checks

| Owner | Code | Execute before handing off | Receiver/reviewer |
|---|---|---|---|
| Cholo, M2 | `public/index.html`, `public/js/home.js` | Fetch featured sessions through `/api/slots`; use `slots.map(slot => card(slot))` so the array index does not become the party size. Test empty results, failed load/retry and phone layout. | Customers enter Browse; Kirsten reviews. |
| Kirsten, M6 | `public/css/style.css`, `public/browse.html`, `public/js/browse.js`; supporting `public/js/studios.js` | Test valid and malformed shared links, duplicates, Back, Clear and Refresh. Find applies edited fields; Refresh reloads the applied query. Keep URL/results/group-price summary consistent. Never discard malformed URL values into broader results. | Fran for CP1 deployment; Cholo reviews. |
| Kat/Kaithlyn, M5 | `public/detail.html`, `public/js/detail.js`, `public/selection.html`, `public/js/selection.js` | Preserve session ID and party size. A failed/stale detail or quote must not leave Continue enabled. Test quantity 1/2/3, insufficient seats, closed sessions and quote recovery. | Kaitlyn receives `slotId` and `quantity` and reviews. |
| Kaitlyn, M4 | `public/checkout.html`, `public/js/checkout.js`, `public/confirmation.html`, `public/js/confirmation.js` | Verify the pending payload can be written and read back before the first POST. If storage throws or drops a write, send no booking and keep fields editable. After an uncertain POST, retain the same key/payload through reload; retry once and verify one receipt. New prices require acceptance. | Janelle supplies quote/save/readback; Kat reviews. |
| Janelle, M3 | `server/services/bookings.js`, `server/repositories/bookings.js`, `server/routes/bookings.js` | Recompute totals under the slot lock, refuse overselling, accept identical-key retries, reject conflicting keys and preserve saved receipt amounts. Check correct status codes and actual PostgreSQL concurrency. | Kat needs quote; Kaitlyn needs save/readback; Fran reviews. |
| Fran, M1 | `db/`, session/offers/Owner routes and repositories, shared customer helpers, deployment | Apply additive migration without reseeding; run the full flow, API/SQL and affected browser checks. Review actual CI, deploy the approved branch, reopen an existing receipt and confirm new bookings appear in Owner. | Janelle reviews backend changes; Fran merges after review. |

## Reference verification commands

In the complete private checkout:

```sh
npm ci
npm run check
npm test
npm run check:sql
npm run test:e2e
npm run test:recovery
npm run test:state
npm run test:screens
node tools/released-discovery-check.mjs
node tools/studio-discovery-check.mjs
```

These scripts are not all present in the official scaffold. Do not claim they ran on a teammate's branch when only the reference was tested. Run checks available on the actual branch and manually exercise its changed page/API.

The brand book is a 72-page visual reference: 14 current pages, including states/recovery, plus 58 archived pages. It is separate from the maximum two-page graded business summary. Keep real-studio source facts separate from fictional bookable sessions.

The group still supplies real reviews/contributions, the required challenge/baseline evidence and outside-group phone test. Each member supplies their own predictions and personal recording.
