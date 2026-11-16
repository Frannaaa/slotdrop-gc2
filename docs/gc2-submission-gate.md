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
| 7. Business, challenges and public baseline | [Business](business.md) · [**Improved GC1 / post-feedback proposal**](reference/gc1-revised-business-proposal.md) · [Challenges and stretches](challenges.md) · [Browse baseline](baseline.md) |
| 8. Stack versions and rationale | [README stack](../README.md#stack) |
| 9. AI-use disclosure | [AI-USAGE.md](../AI-USAGE.md) and each PR's disclosure |
| 10. Run steps, roster, environment and changes since GC1 | [README](../README.md) |
| 11. One recording per member | [Challenge 5 recording links and requirements](challenges.md#individual-recording-links) |

## Before submission

- [x] [PR #72](https://github.com/Frannaaa/slotdrop-gc2/pull/72) was reviewed and merged. Render confirmed [commit `3ef579d`](https://dashboard.render.com/web/srv-dbo1183m8hqs73f8soq0/deploys/dep-dbsrohu7bikc73fdfbl0) live after the main checks passed.
- [x] [Live release verification](evidence/live-release-3ef579d.json) passed all 16 readiness checks. The practice receipt still loaded after a refresh and matched one Owner row. Confirmed the Checkout wait and identical replay using a simulated first `429`. Checked workshop images and Closed sessions, and refreshed the [mobile Browse baseline](baseline.md#reviewed-release-measurement). [Browser evidence](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43727564732/artifacts/14167311156)
- [x] [Optional 429 stretch](challenges.md#too-many-requests). Earlier deployed evidence shows a server-issued `429` and a successful retry. The limiter has automated test coverage, and the final browser check verified the wait and retry with a simulated response.
- [x] Reviewed the [replacement independent phone-test recording](challenges.md#separate-outside-group-phone-test--16-november), which visibly follows Home → Browse → Detail → Selection → Checkout → saved Confirmation → Owner on an iPhone in Messenger. The new recorded booking is **Bumi & Ashe, one seat, ₱2,880**, reference `fbbfb294-20de-4e33-847b-15bc41e42eb9`. An independent [read-only deployed receipt/Owner check](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43852267719) returned 200 and exactly one matching Owner record. The video does not distinctly film a manual Confirmation reload. The team's statement that the tester is outside the group remains its own attestation.
- [x] [Corrected four-page hand-drawn Challenge 2 trace](evidence/challenge2-final/handdrawn-trace-corrected-2026-11-16.pdf) committed in the repo and [linked from Challenge 2](challenges.md#challenge-2-trace-one-real-request); follows the original 15 November slot **38** booking, distinct from the replacement phone test.
- [ ] **All six Challenge 5 files are now uploaded and linked** in [Challenges](challenges.md#individual-recording-links), including Kat's newly uploaded MP4 on 16 November. Each member must still verify playback, audio, duration, rubric compliance and instructor access; file presence alone does not establish video compliance.
- [ ] Check each member's individual Git evidence against the [contribution requirements](../CONTRIBUTING.md#required-contribution-record): three merged code PRs, two substantive peer reviews, and contributions within the dated grading windows. Kat's authored PRs [#41](https://github.com/Frannaaa/slotdrop-gc2/pull/41), [#78](https://github.com/Frannaaa/slotdrop-gc2/pull/78) and [#79](https://github.com/Frannaaa/slotdrop-gc2/pull/79) are merged; verify authorship, commits and reviews from GitHub records.
- [x] Kirsten approved [combined release PR #81](https://github.com/Frannaaa/slotdrop-gc2/pull/81), which merged as `e1f817b`. Kaitlyn reviewed [#78](https://github.com/Frannaaa/slotdrop-gc2/pull/78) and [#79](https://github.com/Frannaaa/slotdrop-gc2/pull/79); both merged. Render deployed the latest code commit [`d3d2f13`](https://github.com/Frannaaa/slotdrop-gc2/commit/d3d2f1381c0ef8776685abf46c081130f33dd889) on 16 November at 4:07 PM PHT.
- [x] Completed [final deployed read-only API, mobile Browse and Lighthouse verification](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43831616352) against live `d3d2f13`: **16/16 readiness checks passed**, two runs at **100 Performance / 100 Accessibility / 100 Best Practices**, three practice offers still bookable, no mobile horizontal overflow, and no page JavaScript errors. [Results](baseline.md#final-deployed-verification--16-november-2026) and [artifact](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/43831616352/artifacts/14209445042). This test never posted a booking.
- [x] Completed replacement phone booking and verified the stored receipt and matching Owner row through the live read-only check. Separate prior browser evidence verifies confirmation reload; the replacement phone video itself does not explicitly show a reload. Preserve both the original video and read-only verification artifact.
- [x] Kaitlyn's [AI-USAGE disclosure PR #85](https://github.com/Frannaaa/slotdrop-gc2/pull/85) is merged. Its cited commits and CI were checked through the connected GitHub account; **this AI-assisted account review does not replace a substantive review personally performed by a human teammate** if the instructor requires one.
- [ ] Tag `gc2-v1.0` on the tested commit. Submit the repo link, public URL, PDF and six recording links through the course submission channel.

```sh
npm run check:gc2 -- https://slotdrop-gc2-group-zx8j.onrender.com
```

This runs 16 read-only checks. It checks database health, the seven pages and their script references, bookable inventory, quotes, receipt lookup and the three Owner endpoints. See [Challenges](challenges.md) for the separate booking and stretch evidence. GitHub reports read access for the instructor account `knee-rel`.

[Issue #46](https://github.com/Frannaaa/slotdrop-gc2/issues/46) tracks the release handoff. [Issue #1](https://github.com/Frannaaa/slotdrop-gc2/issues/1) and [PR #62](https://github.com/Frannaaa/slotdrop-gc2/pull/62) preserve the checkpoint and Browse merge dates.
