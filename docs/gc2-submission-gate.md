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

- [ ] Get one teammate's substantive review on [PR #72](https://github.com/Frannaaa/slotdrop-gc2/pull/72). After approval and passing checks, merge and confirm Render is serving reviewed `main`.
- [ ] Run the readiness check on that deployment, then test a practice booking, the receipt reload and matching Owner row. Verify that expired offers are viewable under Closed sessions and that the workshop images load. Remeasure the [mobile Browse baseline](baseline.md) and verify the release's Checkout retry behavior.
- [ ] Have someone outside the group finish a booking on their own phone without help. Record the device, tested build, receipt reference and matching Owner row.
- [x] [Hand-drawn four-page booking trace](https://drive.google.com/file/d/1sD5XV-f596rkS2WaccFFvecWElqiZHw-/view?usp=drivesdk) uploaded and linked from [Challenge 2](challenges.md#challenge-2--trace-one-real-request). Confirm instructor playback/view access when packaging final submission.
- [ ] Collect all six recordings and verify playback and instructor access. Each member checks their own recording and [Git contribution evidence](../CONTRIBUTING.md#required-contribution-record).
- [ ] Tag `gc2-v1.0` on the tested commit. Submit the repo link, public URL, PDF and six recording links through the course submission channel.

```sh
npm run check:gc2 -- https://slotdrop-gc2-group-zx8j.onrender.com
```

This runs 16 read-only checks. It checks database health, the seven pages and their script references, bookable inventory, quotes, receipt lookup and the three Owner endpoints. See [Challenges](challenges.md) for the separate booking and stretch evidence. GitHub reports read access for the instructor account `knee-rel`.

[Issue #46](https://github.com/Frannaaa/slotdrop-gc2/issues/46) tracks the release handoff. [Issue #1](https://github.com/Frannaaa/slotdrop-gc2/issues/1) and [PR #62](https://github.com/Frannaaa/slotdrop-gc2/pull/62) preserve the checkpoint and Browse merge dates.
