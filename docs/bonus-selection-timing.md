# Optional stretch +1 — Sequential vs parallel Selection requests

**Status:** Timing harness prepared; wait for actual measured outputs, valid reviewer, merged code, and public browser evidence. Do not invent a speedup.

The **Selection screen** (`public/js/selection.js`) loads two independent JSON requests:
- `GET /api/slots/:id` — session detail
- `GET /api/pricing/quote?slotId=:id&quantity=:n` — authoritative party price

Its current code uses `Promise.all`, so these independent fetches begin in parallel. The helper `tools/benchmark-selection-requests.mjs` makes the **same two HTTP GETs** first sequentially, then in parallel for seven alternating rounds, with one warm-up. It prints observed median milliseconds and actual endpoints as JSON. It **does not** create bookings.

## Run on a disposable local database (safe now)

```sh
npm ci
node tools/benchmark-selection-requests.mjs
```

GitHub CI additionally runs it after API tests with PGlite fixture data; its log is an honest **local** benchmark, not a browser capture or final deployed result.

## Actual local CI measurement — November 8, 2026 PHT

On [GitHub Actions run 42394996195](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42394996195), commit `730ee03e73cf8dcb13178a2c36a9009a48a68e93`, the read-only benchmark executed **seven alternating rounds** on a disposable local HTTP/PGlite fixture after warmup.

| Observed median | Time |
|---|---:|
| Sequential detail then quote | **5.47 ms** |
| Parallel detail + quote | **4.59 ms** |
| Sequential minus parallel | **0.88 ms** |

These are **real local CI measurements**, not a public Render deployment, a browser Network waterfall or a controlled scientific speed claim. The two endpoints were `GET /api/slots/1` and `GET /api/pricing/quote?slotId=1&quantity=2`. Different hardware, cold starts, internet latency and caching can change the result or reverse the ordering. The public deployed run and the team's own interpretation remain pending.

## Run once a public service has live fictional sessions

```sh
node tools/benchmark-selection-requests.mjs https://YOUR-PUBLIC-GROUP-HOST 123 2
```

Use an actual active public session ID instead of 123. This command performs GETs only. Note measured times and test date/commit. Compare actual browser DevTools Network timing for the Selection page.

## Evidence the team must still record

- [ ] Source exact tested public URL + deployed commit, real session ID and quantity.
- [ ] Real sequential median, parallel median, difference, run count and environment (from script output).
- [ ] Screenshot of Selection Network waterfall showing two independent concurrent requests in final browser.
- [ ] Group's own short explanation of whether parallel helped, affected by latency, cache and backend; no fabricated improvement claims.
- [ ] Link the actual results, CI run and screenshot in `docs/challenges.md` after approved merge.

**Note:** An improvement is not guaranteed in every run. A slower parallel median is a legitimate experimental result, not a reason to misreport data.
