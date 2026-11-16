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
- [x] [Optional 429 stretch](challenges.md#too-many-requests). Earlier deployed evidence shows a server-issued `429` and a successful retry. The limiter has automated test coverage, and the final browser check verified the wait and retry with a simulated response.
- [ ] Have someone outside the group finish a booking on their own phone without help. Record the device, tested build, receipt reference and matching Owner row.
- [x] [Four-page hand-drawn trace](https://drive.google.com/file/d/1sD5XV-f596rkS2WaccFFvecWElqiZHw-/view?usp=drivesdk) linked from [Challenge 2](challenges.md#challenge-2-trace-one-real-request). The PDF can be opened by anyone with the link.
- [ ] Collect all six recordings and verify playback and instructor access. **16 November folder check:** five members’ recordings are present. Kat (M5) is still pending. Each member checks their own audio, duration and compliance with the one-take requirement before submission.
- [ ] Recheck [individual Git gates](../CONTRIBUTING.md#required-contribution-record) by member, including **3 merged code PRs**, **2 substantive reviews**, and **merged work in 2 of the 3 dated windows**. A 16 November PR search found Kat (M5) with only one merged authored PR (#41). Kat's open PRs [#78](https://github.com/Frannaaa/slotdrop-gc2/pull/78) and [#79](https://github.com/Frannaaa/slotdrop-gc2/pull/79) now have captain-authored integration repairs and passing CI; they still need a fresh independent review of the updated heads before merge. The captain's follow-up commits must not be counted as Kat-authored work. Merging now does not retroactively satisfy an earlier grading window; consult the instructor before the deadline if that requirement cannot be met.
- [ ] Get a teammate review of the [combined release PR #81](https://github.com/Frannaaa/slotdrop-gc2/pull/81). It includes Browse and the archive, the benchmark and recording links, and the favicon and load-time fixes. Confirm the reviewed commit is live on Render before recording new public scores.
- [ ] After the final reviewed changes deploy, confirm the practice offers have seats and recheck the booking flow, receipt reload, matching Owner row and phone layout. Record the tested commit before tagging it.
- [ ] Tag `gc2-v1.0` on the tested commit. Submit the repo link, public URL, PDF and six recording links through the course submission channel.

```sh
npm run check:gc2 -- https://slotdrop-gc2-group-zx8j.onrender.com
```

This runs 16 read-only checks. It checks database health, the seven pages and their script references, bookable inventory, quotes, receipt lookup and the three Owner endpoints. See [Challenges](challenges.md) for the separate booking and stretch evidence. GitHub reports read access for the instructor account `knee-rel`.

[Issue #46](https://github.com/Frannaaa/slotdrop-gc2/issues/46) tracks the release handoff. [Issue #1](https://github.com/Frannaaa/slotdrop-gc2/issues/1) and [PR #62](https://github.com/Frannaaa/slotdrop-gc2/pull/62) preserve the checkpoint and Browse merge dates.
