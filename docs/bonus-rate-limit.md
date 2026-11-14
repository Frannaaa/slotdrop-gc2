# Optional +1 stretch: booking HTTP 429 + safe client wait/retry

**Status:** the limiter and shared helper are merged through [PR #56](https://github.com/Frannaaa/slotdrop-gc2/pull/56). [PR #43](https://github.com/Frannaaa/slotdrop-gc2/pull/43) wired the helper into Checkout.

## Backend contract — Group 1 server

Only `POST /api/bookings` counts toward the fixed 60-second limit of 30 attempts per client IP. Invalid booking attempts count. Receipt and Owner reads continue normally.

On Render the limiter reads the first client IP set by Render’s public ingress. Other runtimes use the socket address. A missing or invalid ingress address falls back to the socket. The limiter uses this address only for the booking counter, so it leaves Express’s other proxy settings alone. The public course service uses one Render Free instance. [Render client IP guidance](https://render.com/articles/how-render-handles-ddos-attacks#reading-the-true-client-ip) · [Render ingress header behavior](https://feedback.render.com/features/p/send-the-correct-x-forwarded-for) · [Render Free networking](https://render.com/docs/free)

On excess attempts:
- HTTP **429 Too Many Requests**
- `Retry-After: N` response header, integer seconds until current window resets
- JSON `{ "error": { "code": "RATE_LIMITED", "message": "...", "retryAfterSeconds": N } }`

The counters are in memory and reset when the process restarts. Clients sharing a public IP share its counter. The limiter does not log contact details or request bodies.

## Fran-owned shared browser support

`public/js/customer-common.js` exports **`retryLimitedBooking(path, options, {maxRetries,onWait})`**. It waits only for explicit 429, resends the **same pre-serialized POST body and requestId**, and retries at most once by default. It never automatically retries 400, 409, a timeout, or an uncertain network error. The caller must keep the UI disabled during wait and report progress.

## Verification

- Public Checkout on `8bdcfcb` returned 429 with `Retry-After: 59`, waited 59,003 ms, and resent an identical body to save one booking. Confirmation, Owner and the seat count matched.
- The public run verifies the retry behavior on the older socket-address build. The integration test uses two Render ingress addresses to verify separate counters and tests the fallback for an invalid forwarded address. The direct-socket test also checks that forwarded headers do not alter the counter on a direct deployment.

See the [request records and screenshots](challenges.md#too-many-requests).
