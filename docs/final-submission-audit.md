# Final V2 execution checklist

Updated 27 November 2026 from Ma'am Nirel Marie M. Ibarra's 2:19 PM announcement and the supplied V2 assignment. This replaces the earlier audit of V1 requirements. Historical GC2 evidence remains unchanged.

## What the group submits

| Item | Current requirement | Owner/status |
|---|---|---|
| Working prototype | Visible, demonstrable USP: server-enforced ten-minute workshop seat hold; improve ONE highest-impact GC2 comment | Hold API deployed. Countdown and atomic conversion pending teammate integration. |
| Group reflection | Exactly 2 pages, PDF, Times New Roman 10 pt, single spacing; end with a numerical business decision | Fran: rewritten source and renderer in this PR; group reviews implementation status before submission |
| Repository | Reviewed main, `final-v1.0`, deployed link OR runnable README; AI-USAGE current through Dec 1 | Fran releases after independent review and final checks. GC2 tag stays fixed. |
| Deadline | December 1, 11:59 PM | Use date; supplied announcement's weekday label is inconsistent with the 2026 calendar. |
| Defense | December 2, SOM 205, 15 minutes plus 5 minutes Q&A; slides and live demo mandatory | Five presenters. Fran confirmed Ma'am approved Chonel's absence. |
| Availability | Working app through December 5 | Keep practice sessions and deployed/local instructions usable. |
| Peer ballot | Rank the other three groups, give reasons on published grounds, sign and submit in the room | Missing/incomplete ballot caps this component at 2.75. |

Cancelled: `docs/refusals.md`, `docs/changes-since-gc2.md`, `docs/gc2-feedback-response.md`, the old declaration/step checklist and six-section report. Existing old documents are reference history, not work to extend. No second outsider tester, new GC2 video, React migration, accounts or real payment is required.

## One feedback choice

The actual GC2 comment is the approximately 22-second cold start. GC2 scored 105/100 and praised existing locks, stale-price refusal, identical retries and the financial model. Prioritize reliable first access. Do not invent an additional criticism.

Current implementation: health route, ten-minute configured health-ping schedule, presentation warm-up and tested local fallback. Automatic scheduled run 45928020576 on Nov 27 at 10:23 AM PHT logged `attempt 1: HTTP 200`; run 45883779764 also succeeded. Observed execution does not prove perfectly continuous ten-minute uptime. Check recent logs and actual first-load responsiveness before the defense.

## Code handoffs and internal deadlines, PHT

| Member | Concrete finish | Deadline/reviewer |
|---|---|---|
| Janelle | Accept matching `holdId` in quote/save; validate session/quantity/status/expiry; exclude own hold exactly once; atomically consume hold and decrement stock; retain stable retry receipt and stale-price refusal | API contract Nov 27, 5 PM; PR by 8 PM. Fran reviews. |
| Kat | Create/reuse the hold in Selection; preserve session, quantity, hold ID and expiry into Checkout; display the reservation; handle invalid quantities and expired/full sessions | PR Nov 27, 8 PM. Kaitlyn reviews. |
| Kaitlyn | Show visible countdown using server expiry; block expired submit with reason and recovery; send same hold and stable request ID; keep receipt refresh/Back/double-submit correct | PR Nov 27, 8 PM. Kat reviews. |
| Kirsten | Review Home PR93; shared hold/expiry/empty states and Owner labels at 320/390 px; draft one substantive question for another group | PR/review Nov 27, 8 PM. Chonel reviews styles; Fran integrates. No feedback-response file. |
| Chonel | Finish Home PR93 handoff, verify its links and server availability; pass slides formatting and final assets to five presenters | Nov 27, 8 PM. Kirsten reviews. Approved absence is unchanged. |
| Fran | Hold DB/APIs and Owner, cold-start mitigation, integration/QA, two-page reflection, run sheet, reviewed release and tag | Captain fixes in PR94; integrate after paired reviews. Janelle independently reviews PR94. |

Everyone: send 2 specific reflection bullets by Nov 27, 8 PM: one actual change/breakage and one lesson or next decision. No duplicate individual reports.
Paired reviews by Nov 28 noon; integrated tinker checks and all four proofs by Nov 28, 8 PM.
Reflection, slides and three question cards ready Nov 29, 8 PM.
Run two complete 15-minute rehearsals plus Q&A on Nov 30; choose exact time together. Complete three full-flow proof runs before release.

## What must be visible

1. One uninterrupted customer transaction from discovery to Confirmation.
2. Saved ID read back in Confirmation/Owner and the actual seat change.
3. The USP produces two correct outcomes: active hold can complete, expired hold refuses and releases availability. Prepare the expired state beforehand; demonstrate the feature in under one minute.
4. A refusal with a named reason on screen and no new saved record.

A static badge or description is insufficient. Currently `holdId` quote is HTTP 400, so the integrated USP is not ready. Preserve that failing gate until Janelle's implementation passes.

## Live marking and optional bonus

| Component | Weight |
|---|---:|
| Live demo | 35% |
| Business alignment | 20% |
| System explanation | 15% |
| Q&A: answer AND ask | 20% |
| Peer ranking | 10% |

Owner analytics is the only optional +5 bonus: claim on a slide/reflection and show the five server-computed figures. Automation bonus is cancelled. Live explanations must name the rule file, trace one real save screen → route → service → database, and explain wrong-total handling. The numerical pilot decision is 10% commission, modeled break-even about 27 of 64 released seats, with actual studio contribution checked before expanding.

## Release gates still open

- Janelle, Kat and Kaitlyn's integrated hold flow; rerun own-hold, expiry, mismatch and retry tests.
- Independent review of PR94 and PR93, exact-head CI, merge reviewed changes.
- Seven V2 tinker cases on integrated main and final deployed/local rehearsal.
- Refresh reflection's honest pending-status paragraph once integration is proved; collect teammate corrections.
- Slides, twice-timed rehearsal, question cards, signed in-room ballot, final-v1.0 and Canvas upload by deadline.
