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

Measured on 16 November 2026 at 8:08 AM PHT on Render commit [`3ef579d`](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbsrohu7bikc73fdfbl0). The GitHub Actions runner checked a warmed instance. The browser used 412 × 823 CSS pixels, a device scale factor of 1.75, and cache disabled for the separate Network capture. Lighthouse 13.6.0 used simulated mobile throttling.

| Measure | Reviewed release |
|---|---:|
| Lighthouse mobile Performance | 99/100 |
| Lighthouse mobile Accessibility | 100/100 |
| Lighthouse mobile Best Practices | 96/100 |
| First-load same-origin requests, cache disabled | 17 |
| First-load transfer size, cache disabled | 270,462 bytes (264.12 KiB) |
| First List API response time | 257 ms in the Network capture, HTTP 200 |
| Mobile layout shift | 0 |

Browse rendered 6 cards without horizontal overflow at 412 CSS pixels. Its first photo loaded, and Closed sessions showed 16 records. The missing default `/favicon.ico` caused the only Best Practices deduction. The first List API request took 259 ms in Lighthouse and 257 ms in the separate Network capture.

The 15 November run measured 100 Performance, 100 Accessibility and 96 Best Practices on the same deployment. Both readings show the conditions of the run, including the warmed server.

[16 November browser and Lighthouse reports](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43778545230/artifacts/14186994082) · [Machine-readable data from both runs](evidence/live-release-3ef579d.json)

## Final deployed verification — 16 November 2026

The final code build [`d3d2f13`](https://github.com/Frannaaa/slotdrop-gc2/commit/d3d2f1381c0ef8776685abf46c081130f33dd889) was reported **live** by Render. A separate GitHub-hosted [read-only verification](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43831616352) measured the deployed `/browse.html` page at about **4:30 PM PHT**.

| Measure | First Lighthouse run | Second Lighthouse run |
|---|---:|---:|
| Mobile Performance | **100/100** | **100/100** |
| Mobile Accessibility | **100/100** | **100/100** |
| Mobile Best Practices | **100/100** | **100/100** |
| First Contentful Paint | 1,001 ms | 1,013 ms |
| Largest Contentful Paint | 1,001 ms | 1,013 ms |
| Speed Index | 1,538 ms | 2,613 ms |
| Total Blocking Time | 34.5 ms | 0 ms |
| Cumulative Layout Shift | 0 | 0 |
| Grouped List API duration in Lighthouse | 254 ms | 263 ms |

The same workflow passed **16/16 read-only release checks** and confirmed that `/favicon.svg` serves HTTP 200, resolving the browser-icon failure responsible for the previous 96 Best Practices score. At **412 × 823 CSS pixels**, Browse showed six grouped workshop cards, three undated practice cards, no horizontal overflow (**412 px document and viewport widths**) and no page-level JavaScript errors. The first grouped List request and the practice List request both returned HTTP 200.

The three practice booking samples each had seats remaining (12, 20 and 17 respectively at the measurement time); these figures will change after further demo bookings. This is a warmed GitHub-runner measurement with Lighthouse 13.6.0 and simulated mobile throttling; it is **not** a new comparable cache-disabled transfer-size benchmark, and the test did not create a booking.

[Download the final browser, API and Lighthouse artifact](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43831616352/artifacts/14209445042) · [Verified workflow](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43831616352)

The separate [replacement iPhone booking and saved receipt/Owner verification](challenges.md#separate-outside-group-phone-test--16-november) now provide the live booking evidence on the deployed code: one ₱2,880 booking, a readable saved receipt and exactly one matching Owner row. The new recording does not distinctly show a manual Confirmation reload; the independent receipt GET and earlier refresh evidence establish readback. These are separate from Lighthouse, which did not create a booking.
