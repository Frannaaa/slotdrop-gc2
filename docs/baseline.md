# Deployed List baseline

Measured on 14 November 2026 at 5:16 PM Philippine time on the [deployed Browse page](https://slotdrop-gc2-group-zx8j.onrender.com/browse.html). Render’s [deployment record](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbr7meojo6nc73eq1920) confirms that commit `8bdcfcb` was live from 13 November at 10:52 AM PHT.

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
- The document request took about 8.55 seconds in the separate Network capture. The 259 ms figure measures the separate List API request in the Lighthouse trace.

Use this dated public measurement as the comparison point. [PR #72](https://github.com/Frannaaa/slotdrop-gc2/pull/72) changes Browse’s render timing and adds workshop photos. The [reviewed release measurement](#reviewed-release-measurement) below records the follow-up.

## Three weaknesses to check in the Final Project

1. In the measured build, Browse waited for a second List API request on full pages before rendering the first set of results. PR #72 displays the current results first and still uses the second request to decide whether to show Next.
2. First load can be slow. The document took about 8.55 seconds in this capture, and Lighthouse reported an 11.2-second Speed Index. During a separate 15 November browser check, Render displayed its wake-up screen before Home loaded.
3. The layout shifts as the page settles. Mobile Lighthouse reported a cumulative layout shift of 0.086. Reserving room for the results may help.

## Reviewed release measurement

Measured on 15 November 2026 at 22:59 PHT on Render commit [`3ef579d`](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbsrohu7bikc73fdfbl0). A GitHub Actions runner checked a warmed instance. The browser used 412 × 823 CSS pixels, device scale factor 1.75, and cache disabled for the separate Network capture. Lighthouse 13.6.0 used simulated mobile throttling.

| Measure | Reviewed release |
|---|---:|
| Lighthouse mobile Performance | 100/100 |
| Lighthouse mobile Accessibility | 100/100 |
| Lighthouse mobile Best Practices | 96/100 |
| First-load same-origin requests, cache disabled | 16 |
| First-load transfer size, cache disabled | 228,691 bytes (223.33 KiB) |
| First List API response time | 248 ms in Lighthouse, HTTP 200 |
| Mobile layout shift | 0.0002 |

Browse rendered 6 cards without horizontal overflow at 412 CSS pixels. The first workshop photo loaded. The Closed sessions section loaded 16 records.

[Measurement data](evidence/live-release-3ef579d.json) · [Mobile screenshot and Lighthouse report](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43727217983/artifacts/14167315733)
