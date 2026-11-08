# Optional +1 stretch: booking HTTP 429 + safe client wait/retry

**Status:** Fran-owned backend/shared-helper support in a PR, not yet merged, and **not yet wired by Kaitlyn's assigned Checkout page**. This is **not a claimed bonus point**.

## Backend contract — Group 1 server

Only `POST /api/bookings` counts toward a single-process, fixed 60-second demo limit of 30 attempts per socket IP. Other routes, including GET saved receipts and Owner, are unaffected. Failed/invalid booking attempts count so abuse cannot evade limits. The limiter does not trust user-controlled `X-Forwarded-For`.

On excess attempts:
- HTTP **429 Too Many Requests**
- `Retry-After: N` response header, integer seconds until current window resets
- JSON `{ "error": { "code": "RATE_LIMITED", "message": "...", "retryAfterSeconds": N } }`

Caveats: This is a classroom-grade **single-process** limiter, not a multi-host distributed gate. Users behind one reverse proxy/NAT may share a counter; testers should avoid flooding the group demo. New web processes clear counters. No guest names, contact details or request bodies are logged by this middleware.

## Fran-owned shared browser support

`public/js/customer-common.js` exports **`retryLimitedBooking(path, options, {maxRetries,onWait})`**. It waits only for explicit 429, resends the **same pre-serialized POST body and requestId**, and retries at most once by default. It never automatically retries 400, 409, a timeout, or an uncertain network error. The caller must keep the UI disabled during wait and report progress.

### Kaitlyn-owned integration still needed in PR #43

- Import the helper in Checkout, construct the request body **once**, retaining the same requestId through an uncertain save.
- Use `retryLimitedBooking('/api/bookings', {method:'POST',body:JSON.stringify(payload)}, {onWait(seconds){ /* show wait text, keep Submit disabled */ }})` for accepted submission.
- Keep Submit disabled after **successful** save until Confirmation navigation. The existing post-success re-enable bug in #43 remains a separate issue.
- Show a clear terminal error after one 429 retry fails. Do not silently reissue a booking with a new requestId.
- Independently verify keyboard/mouse repeat submissions, wait text, 429/Retry-After and one saved receipt/Owner row.

### Tests and public evidence

`tests/booking-rate-limit.test.js` exercises valid/error requests, per-IP 429, spoofed `X-Forwarded-For`, unthrottled Owner reads, reset after a fake 10-second clock, exact-idempotent retry, and browser helper wait without sleeping. Actual latest-head CI results must be inspected before claiming pass.

To earn +1, on the **official deployed Group 1 URL** attach a screenshot of the real Network/Postman 429 + Retry-After, the browser waiting/retry, the subsequent success and proof of **one** saved booking. The isolated CI test and private reference app do **not** fulfill this evidence gate.
