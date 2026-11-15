# GC2 submission checklist

**Canvas deadline · 16 November 2026, 11:59 PM Philippine time**

| Brief item | Where to find it |
|---|---|
| 1. Repository and release tag | [Group repository](https://github.com/Frannaaa/slotdrop-gc2). Apply `gc2-v1.0` to reviewed `main` after the release check. |
| 2. Working deployment | [Render course demo](https://slotdrop-gc2-group-zx8j.onrender.com/) · [Owner](https://slotdrop-gc2-group-zx8j.onrender.com/owner.html) |
| 3. Two-page business PDF | [Business summary](SlotDrop_GC2_Summary.pdf). Both pages rendered and checked. Upload the PDF with the submission. |
| 4. System diagram and booking data flow | [Architecture and booking path](system.md) |
| 5. API routes and database schema | [Route table](routes.md) · [Schema](schema.md) |
| 6. Exported Postman collection | [Challenge 1 collection](SlotDrop-GC2-Challenge1.postman_collection.json) · [Deployed results](challenges.md#challenge-1-break-your-own-api) |
| 7. Business, challenges and public baseline | [Business](business.md) · [Challenges and stretches](challenges.md) · [Browse baseline](baseline.md) |
| 8. Stack versions and rationale | [README stack](../README.md#stack) |
| 9. AI-use disclosure | [AI-USAGE.md](../AI-USAGE.md) and each PR's disclosure |
| 10. Run steps, roster, environment and changes since GC1 | [README](../README.md) |
| 11. One recording per member | [Challenge 5 recording links and requirements](challenges.md#individual-recording-links) |

## Before submission

- [x] [PR #72](https://github.com/Frannaaa/slotdrop-gc2/pull/72) was reviewed and merged. Render confirmed [commit `3ef579d`](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbsrohu7bikc73fdfbl0) live after the main checks passed.
- [x] [Live release verification](evidence/live-release-3ef579d.json) passed all 16 readiness checks. The practice receipt still loaded after a refresh and matched one Owner row. Confirmed the Checkout wait and identical replay using a simulated first `429`. Checked workshop images and Closed sessions, and refreshed the [mobile Browse baseline](baseline.md#reviewed-release-measurement). [Browser evidence](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43727564732/artifacts/14167311156)
- [ ] Verify the deployed POST-only booking limiter still returns `429` and `Retry-After` when `X-Forwarded-For` is varied. The regression tests use Render's `CF-Connecting-IP` and Vercel's `X-Vercel-Forwarded-For` as trusted ingress values; the limiter remains per-instance, not a shared multi-server rate limit.
- [ ] Have someone outside the group finish a booking on their own phone without help. Record the device, tested build, receipt reference and matching Owner row.
- [x] [Four-page hand-drawn trace](https://drive.google.com/file/d/1sD5XV-f596rkS2WaccFFvecWElqiZHw-/view?usp=drivesdk) linked from [Challenge 2](challenges.md#challenge-2-trace-one-real-request). The PDF can be opened by anyone with the link.
- [ ] Collect all six recordings and verify playback and instructor access. Each member checks their own recording and [Git contribution evidence](../CONTRIBUTING.md#required-contribution-record).
- [ ] Tag `gc2-v1.0` on the tested commit. Submit the repo link, public URL, PDF and six recording links through the course submission channel.

```sh
npm run check:gc2 -- https://slotdrop-gc2-group-zx8j.onrender.com
```

This runs 16 read-only checks. It checks database health, the seven pages and their script references, bookable inventory, quotes, receipt lookup and the three Owner endpoints. See [Challenges](challenges.md) for the separate booking and stretch evidence. GitHub reports read access for the instructor account `knee-rel`.

[Issue #46](https://github.com/Frannaaa/slotdrop-gc2/issues/46) tracks the release handoff. [Issue #1](https://github.com/Frannaaa/slotdrop-gc2/issues/1) and [PR #62](https://github.com/Frannaaa/slotdrop-gc2/pull/62) preserve the checkpoint and Browse merge dates.
