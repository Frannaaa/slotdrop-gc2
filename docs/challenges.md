# GC2 challenge evidence status

This file separates reproducible engineering checks from the required deployed and personal evidence. Do not mark a deployed challenge complete using only a local or CI result.

| Challenge | Prepared material | Still needed |
|---|---|---|
| 1 — Break the deployed API | Fran's Postman export covers session input errors, unknown IDs, empty search and owner edits | Team booking requests for bad quantities/totals, overselling and missing customer fields, with actual public-URL screenshots |
| 2 — Trace a real request | docs/system.md names the session-offer files/functions and planned booking handoff | Actual deployed customer booking Network record and the team's hand-drawn diagram |
| 3 — Team review record | The cutoff guidance and misleading resumption defects were reproduced and corrected; their commits/tests are available | Team's own account of three actual review decisions and supporting evidence |
| 4 — Change an owner rule | Active commission is centralized in server/config/business.js; browser reads the API value | Team's own before-change file/line inventory, explanation and reviewed PR evidence |
| 5 — Predict, then run | Production functions are available in the assigned code | Fran's unaided predictions before running, observed outputs, mismatch explanation and unedited recording |

## Engineering checks available now

- tests/offers.test.js: rejects invalid prices and changes that would reduce capacity below confirmed seats; preserves saved receipts after offer edits.
- tests/owner-policy.test.js: activity guidance updates with a preserved override; unavailable sessions do not offer misleading resumption.
- tests/postgres-locking.test.js: on real PostgreSQL, an owner edit waits behind a transaction holding the session lock, then rejects reducing capacity below the newly committed booking.
- tests/owner.test.js: metrics reconcile to confirmed saved receipts, including empty and paused-session behavior.

These checks are not a substitute for the deployed booking challenges. Booking retries, two customers competing for the final seats and customer confirmation readback must be tested after the assigned booking implementation is integrated.
