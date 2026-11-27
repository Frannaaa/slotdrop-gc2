# Final V2 testing, 27 November 2026

V2 supersedes the earlier Final checklist. Retain the completed November 16 GC2 outside-group iPhone test and matching saved receipt; Final requires no second outsider or new recording.

## Seven instructor tinker checks

1. Navigate Back midway through a booking and continue normally.
2. Refresh Confirmation; read the existing saved receipt by ID without creating another booking.
3. Open Selection/Checkout without a chosen session; show a useful refusal and save nothing.
4. Type zero, a negative value, a huge value or letters as quantity. Identify Quantity, refuse the action and save nothing.
5. Click Confirm rapidly more than once; one request identity produces one booking, one seat decrement and one receipt.
6. Open good and bad Detail links directly; render the good session or an understandable recovery state.
7. Search for a phrase that matches nothing; show an empty state with recovery.

Also check Back after a completed save, 320/390 px layouts and uncaught browser errors. Run against the changed integrated build, then repeat relevant checks on reviewed main. Keep practice sessions usable through December 5. This does not add load or security testing requirements.

## Four mandatory live proofs

Show the full transaction uninterrupted; read the saved ID in Confirmation/Owner and show seats changed; run the visible USP with two different correct outcomes; run a refusal with its reason visible and show no extra record was saved.

For the hold USP, prepare an expired hold before the slot. Do not make the room wait ten minutes. API-only success is insufficient: hold status/countdown, availability and successful/expired outcomes must be on screen. Hold-aware quote/save remains an integration gate.

`node tools/check-v2-browser.mjs` uses an isolated fixture and a real browser. Its report separates tinker passes from the pending USP. `npm run check:final` intentionally exits nonzero while hold conversion is absent.

Run two full 15-minute rehearsals out loud, with named speakers and a five-minute Q&A practice. Complete three successful full-flow rehearsals on the final build, check first-click responsiveness, and bring a tested local fallback.
