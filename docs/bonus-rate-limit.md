# Optional +1 stretch: booking HTTP 429 + safe client wait/retry

**Status:** the limiter and shared helper are merged through [PR #56](https://github.com/Frannaaa/slotdrop-gc2/pull/56). [PR #43](https://github.com/Frannaaa/slotdrop-gc2/pull/43) wired the helper into Checkout.

## Backend contract — Group 1 server

Only `POST /api/bookings` counts toward a single-process, fixed 60-second demo limit of 30 attempts per socket IP. Other routes, including GET saved receipts and Owner, are unaffected. Failed/invalid booking attempts count so abuse cannot evade limits. The limiter does not trust user-controlled `X-Forwarded-For`.

On excess attempts:
- HTTP **429 Too Many Requests**
- `Retry-After: N` response header, integer seconds until current window resets
- JSON `{ "error": { "code": "RATE_LIMITED", "message": "...", "retryAfterSeconds": N } }`

Caveats: This is a classroom-grade **single-process** limiter, not a multi-host distributed gate. Users behind one reverse proxy/NAT may share a counter; testers should avoid flooding the group demo. New web processes clear counters. No guest names, contact details or request bodies are logged by this middleware.

## Fran-owned shared browser support

`public/js/customer-common.js` exports **`retryLimitedBooking(path, options, {maxRetries,onWait})`**. It waits only for explicit 429, resends the **same pre-serialized POST body and requestId**, and retries at most once by default. It never automatically retries 400, 409, a timeout, or an uncertain network error. The caller must keep the UI disabled during wait and report progress.

## Verification

- The public API returned 429 with `Retry-After: 30` and resumed normal responses after the window.
- The disposable local browser run showed the Checkout waiting state, sent the same body and request ID after about five seconds, received 201 and displayed one saved receipt.
- The deployed Checkout wait and whether visitors receive separate counters behind Render’s proxy remain unverified.

See the [request records and screenshots](challenges.md#too-many-requests).
