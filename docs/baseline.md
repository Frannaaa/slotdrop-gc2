# Deployed List baseline

Measured on 14 November 2026 at 5:16 PM Philippine time on the [deployed Browse page](https://slotdrop-gc2-group-zx8j.onrender.com/browse.html). GitHub `main` was `8bdcfcb` when checked. The exact deployed commit was not independently verified.

| Measure | Result |
|---|---:|
| Lighthouse mobile Performance | 89/100 |
| Lighthouse mobile Accessibility | 100/100 |
| Lighthouse mobile Best Practices | 100/100 |
| First-load requests, cache disabled | 9 |
| First-load transfer size, cache disabled | 17,057 bytes (16.66 KiB) |
| List API response time, `GET /api/slots?page=1&limit=6` | 259 ms in the Lighthouse Network trace, HTTP 200 |

[Measurement evidence](evidence/browse-baseline-2026-11-14.json) includes the three scores, emulation settings, and individual request timings and sizes.

## How we measured it

- **Lighthouse 13.6.0**, using its default mobile simulated throttling and 412 × 823 CSS-pixel emulation. Lighthouse reported no runtime errors or warnings. The List API timing is rounded from the observed request start to response completion in its Network trace.
- **Chromium 153.0.8010.0**, separate first-load Network capture with the cache explicitly disabled. Totals include the page, its assets and both List API requests. Transfer sizes come from Chromium's Network events and include the encoded bytes it recorded.
- The document request took about 8.55 seconds in the separate Network capture. The previous day's curl sample had a median List API time to first byte of 6.59 seconds. Those runs used different clients and conditions, so the 259 ms observation should be treated as a point-in-time baseline.

## Three weaknesses to check in the Final Project

1. Browse makes a second List API request on a full page just to see whether Next should appear. That adds a round trip before the current results render.
2. First load can be slow. The document took about 8.55 seconds in this capture, and Lighthouse reported an 11.2-second Speed Index.
3. The layout shifts as the page settles. Mobile Lighthouse reported a cumulative layout shift of 0.086. Reserving room for the results may help.
