# Deployed List baseline

## Render measurement on 13 November 2026 (PHT)

Browse URL: https://slotdrop-gc2-group-zx8j.onrender.com/browse.html. The repository’s main commit at measurement time was `a0e6d7b`; the running deployment commit was not independently identified.

| Measure | Result |
|---|---|
| List request | `GET /api/slots?page=1&limit=6` |
| HTTP status | 200 on all three requests |
| Time to first byte | 6,562 ms, 6,703 ms, 6,586 ms. Median 6,586 ms. |
| Downloaded response body | 12,016 bytes per request |
| Lighthouse mobile Performance, Accessibility, Best Practices | Pending. PageSpeed Insights returned a quota error. |
| Full page request count and transferred bytes | Pending cache-disabled browser Network capture. |

Three sequential curl requests from the review environment. The latency includes the client’s network path and intermediary overhead. The bytes describe one API response body.

## Weaknesses for the team to validate

- Browse waits for another List request when a page contains six sessions. If that lookahead fails, it hides the already-loaded cards. PR #77 addresses the failed-lookahead case.
- Browse currently exposes search and category controls. PR #77 adds the sort control backed by the existing API.
- Catalog replenishment runs on startup. PR #71 now uses bookability to decide when to replenish, but an instance that stays up can still run short between restarts.

Capture the mobile Lighthouse scores and cache-disabled Network totals from the final public Browse URL. Confirm the weaknesses against that release before submission.
