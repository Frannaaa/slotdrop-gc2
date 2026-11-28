# Final V2 execution checklist

Updated 28 November 2026 after Kat's Selection handoff. Grounded in Ma'am Nirel Marie M. Ibarra's Nov 27 V2 announcement, the supplied assignment and verified project status. Historical GC2 evidence remains unchanged.

## Submission and defense

| Item | Requirement and current status |
| --- | --- |
| Prototype | A visible USP and ONE highest-impact GC2 feedback choice. Home PR93, V2/browser fixes PR94 and hold-aware quote/atomic conversion PR95 are merged. Kat/Kaitlyn's visible Selection/Checkout hold handoff and countdown remain pending. |
| Reflection | Exactly two pages, PDF, Times New Roman 10 pt, single spacing. Fran owns the complete shared paper. Current PDF/source/previews are in PR96 and need Janelle's independent review. |
| Repository | Reviewed, tested main tagged `final-v1.0`; deployed link OR runnable README; AI-USAGE current through Dec 1. The final tag is not yet created. Keep `gc2-v1.0` fixed. |
| Deadline | December 1, 11:59 PM PHT. Use the date because the supplied announcement's weekday is inconsistent with the 2026 calendar. |
| Defense | December 2, SOM 205, 15-minute presentation/live demo and 5-minute Q&A. Slides and live demo are required. Five presenters; Chonel's absence is teacher-approved. |
| Availability | Keep the app usable through December 5. |
| Peer ballot | Rank the other three groups, give concrete reasons on demo/business/explanation, sign and submit in the room. An incomplete or missing ballot scores 2.75 for this 10% component. |

Cancelled deliverables: `docs/refusals.md`, `docs/changes-since-gc2.md`, `docs/gc2-feedback-response.md`, the old declaration/step checklist and the six-section technical report. Existing old files remain reference history. Final does not add a second outside-group tester, a new GC2 video, a React migration, accounts or real payment.

## Verified implementation

Reviewed group main is `00feaa5f8186f3d98db9470ba9acd228d02ee91d`. Main CI passed and Render deployed the same commit.

- PR93: Fran independently reviewed, approved and merged Chonel's Home implementation. Grouped cards, full booking/receipt/Owner read-back, Home empty/error/retry and mobile checks passed. Chonel retains authorship.
- PR94: Janelle approved the V2 clarification and browser Back/quantity fixes, and it was merged.
- PR95: Fran reviewed and merged Janelle's hold-aware quote and atomic conversion. A matching hold is accepted by quote and booking. The former unsupported-holdId HTTP 400 is resolved.
- PR96: the updated single reflection, sources and measured page previews pass CI on the reviewed head. New changes require fresh exact-head CI and Janelle's independent review before merge.
- The hold server owns expiry. It ends a reservation at the earlier of ten minutes or the studio cutoff. Effective expiry removes held seats from availability even if the old row still exists.
- Saving inserts one booking and converts its hold in one transaction. Remaining availability is computed from capacity, confirmed bookings and active unexpired holds.

## One feedback choice

The actual prioritized GC2 comment is the approximately 22-second cold start. GC2 scored 105/100 and praised the lock, stale-price refusal, identical retry behavior and financial model. Do not invent another criticism.

Implemented response: health route, ten-minute ping schedule, presentation warm-up and local fallback. Scheduled run 45928020576 on Nov 27 at 10:23 AM PHT logged `attempt 1: HTTP 200`; run 45883779764 also succeeded. Observed runs establish execution, not guaranteed continuous warmth. Check recent logs and the actual first click before choosing the defense environment.

## Selection-to-Checkout contract

[The exact receiving contract and acceptance matrix](final-hold-handoff.md) distinguishes the five browser fields from API fields. The current Checkout parser rejects the held URL before fetching; quote/save also need the same holdId. The gap was reproduced against the real parser. Kaitlyn owns these receiving updates; Kat does not need to expand her Selection PR. Kat's local implementation/results remain reported, not independently verified.

## Current handoffs

| Member | Concrete finish | Review/status |
| --- | --- | --- |
| Janelle | Support Kat/Kaitlyn's quote/save contract; independently review the current reflection/preparation PR96 | PR95 is merged. PR94 review is complete. |
| Kat | Selection hold implementation and tests reported complete; publish the Selection-only PR carrying slotId, quantity, holdId, expiresAt and serverNow | Awaiting publication/independent review. Kaitlyn reviews. Kat reviews Checkout. |
| Kaitlyn | Own Checkout/Confirmation receiving the five browser fields, authoritative hold revalidation/countdown, same-hold quote/save and stable retry/receipt | [Issue 97](https://github.com/Frannaaa/slotdrop-gc2/issues/97). PR target Nov 29 noon; Kat reviews by 2 PM. |
| Kirsten | Check shared reservation/expiry/error states and Owner labels at 320/390 px; prepare one question for another group | Home review/merge is complete. Fran/Janelle cover style reviews during Chonel's absence. |
| Chonel | All required Home work complete; original authorship retained | PR93 merged/live and Home issue 3 closed. No new task during approved absence. Fran owns remaining Home/integration/style-review follow-ups and later presentation coordination. |
| Fran | Integrate reviewed changes, verify four proofs/seven tinker cases, maintain the single paper and disclosure, prepare content/run sheet, release and submit the reviewed build | PR94 is merged. Current paper is in PR96. Slide content and visual directions are prepared; actual deck assembly is deferred at Fran's request. |

Fran writes the complete group reflection with Codex assistance. Separate member sections or two reflection bullets are not required. Teammates may correct project facts.

Current finishing targets, PHT: Kat publishes Selection tonight, Nov 28; Kaitlyn Checkout PR Nov 29 noon; paired review and Janelle's PR96 review Nov 29, 2 PM; Fran integrated tinker/four-proof checks Nov 29, 8 PM, after reviews and CI. Two timed 15-minute rehearsals plus Q&A remain Nov 30. Slide content is prepared; actual deck assembly remains deferred at Fran's request. The original Nov 27/28 code/review targets are superseded by this finishing sequence.

## Four live proofs

1. Complete one uninterrupted customer transaction.
2. Refresh/read the saved booking ID and match it in Owner, with the actual change in available seats.
3. Run the visible USP with two correct outcomes: active hold converts; expired hold refuses and releases availability. Prepare expiry beforehand and run the feature itself in under one minute.
4. Show a named refusal on screen and verify no new booking was saved.

Backend API coverage does not complete the visible proof. Keep the frontend integration gate open until a customer can see and finish the same reservation journey.

## Integrated tinker checks and rehearsal

Run the seven V2 checks after integrating the final frontend:
- Back mid-flow.
- Refresh the saved receipt.
- Empty selection.
- Manually entered invalid quantities.
- Repeated Confirm.
- Direct valid and invalid Detail links.
- Unmatched search.

Also verify Back after a successful save, 320/390 px layouts, hold mismatch/expiry, a retry after the original deadline, and cutoff edits. Run the complete 15 minutes aloud twice with a timer. The team's release target also includes three uninterrupted full booking flows on the final build.

## Presentation and bonus

The grading weights remain 35% live demo, 20% business alignment, 15% system explanation, 20% answering AND asking in Q&A, and 10% peer ranking.

[Slide content and visual directions](final-slide-content-and-visual-directions.md) contains exact copy, layouts, speaker timings and live-proof cues. It is a brief, not a finished deck.

Owner analytics is the only optional +5 bonus. The reflection and slide brief explicitly claim it. Show five server-computed figures: booking count, platform fee revenue, average booking value, top-selling workshop and nearly full sessions. The automation bonus is cancelled.

Explain one actual save from browser handler to route to function to database. Name `server/services/holds.js` and `server/services/bookings.js`, explain wrong-total refusal and own the AI-assisted code. The numerical business decision is a 10% commission for a one-studio pilot, with modeled break-even around 27 of 64 released seats. Expand only after actual studio contribution and platform margin are positive.

## Release gates still open

- Kat/Kaitlyn's visible hold/countdown integration, independent reviews and exact-head CI.
- Janelle's independent review of the updated reflection/preparation PR96.
- All four live proofs and integrated tinker checks on the final deployed/local build.
- Update the reflection's honest frontend-status paragraph only after that visible proof passes.
- Build slides later from the prepared content, run two timed rehearsals, prepare questions and the in-room signed ballot.
- Tag reviewed/tested main `final-v1.0` and upload the required reflection/repository/link on Canvas by December 1, 11:59 PM.

Both group and individual Canvas submissions remain pending. The individual recording and its React/Supabase repository are separate from these group deliverables.
