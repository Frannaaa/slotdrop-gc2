# SlotDrop Final V2 run sheet

December 2, SOM 205. **15-minute hard stop, then 5-minute Q&A.** Chonel's absence is approved; five presenters retain the speaking plan. The rubric is 35/20/15/20/10.

| Time | Speaker/operator | Show and say |
|---|---|---|
| 0:00–1:30 | Fran | Empty workshop seats expire; trace GC1 problem to released seats. Say the USP and one cold-start feedback choice. State the 10% pilot decision and modeled 27-seat checkpoint. |
| 1:30–2:30 | Kirsten | One architecture slide: browser → Express routes/services → PostgreSQL; customer and Owner views. |
| 2:30–7:30 | Fran + Janelle | Live full booking, exact server quote, stable request identity, saved ID readback and seat change in Owner. Run a refusal with its reason and no extra saved row. |
| 7:30–11:30 | Kat + Kaitlyn | Show where the hold appears, pass one hold through screens, demonstrate active versus pre-expired outcome. The USP itself runs in under one minute; use remaining time to explain server expiry and recovery, not wait for the timer. |
| 11:30–13:30 | Fran, Janelle supports | Trace the real saved ID through browser handler, POST route, booking service and bookings table. Name actual hold rule and conversion files. Explain client wrong-total refusal and retry. Show five Owner metrics if claiming bonus. |
| 13:30–15:00 | All, Kirsten closes | Recovery buffer; optional one concrete next pilot learning if all four proofs already landed. Stop at 15:00. |

Do not present the complete hold feature until the integration gate passes. Prepare an expired fixture before the slot; never lower production expiry or wait ten minutes live.

## Open and rehearse

Open tabs in order: app, Owner/database readback, editor on rule, two-page reflection PDF. Open slides. Warm the deployed site and test its first click, or decide in advance to start locally. Keep the alternative ready. Use fictional guest details and simulated payment.

Use the seven cases in final-testing-requirements.md, plus Back after save and 320/390 px layouts. Run the complete script aloud twice with a timer. Record chosen speaker for every beat and the actual elapsed time. Finish three uninterrupted full-flow runs on the final build.

## Five-minute Q&A preparation

- Fran: who owns the clock, cutoff edits and stock transaction; architecture and pilot assumptions.
- Janelle: quote, accepted total, atomic conversion, same-ID retry and stored receipt.
- Kat: hold creation, quantity edits, direct Detail links and Selection handoff.
- Kaitlyn: expiry refusal, refresh, Back, uncertain-result retry and double click.
- Kirsten: discovery/empty states, shared layout, Owner figures and next learning.

Each speaker owns the code they explain, including AI-assisted portions.

## Ask the other three groups

Assign one group each to Kirsten, Kat and Kaitlyn before the defense. Adapt these to what the team actually shows:

1. If two customers confirm the last item together, where is the final availability check and which record changes atomically?
2. If the connection drops after a save, how does retry identify the original result and prevent a second order?
3. What happens when the customer refreshes a completed transaction or sends a different total, and where is the source of truth?

## Peer ballot, complete in the room

Rank each other group once, with a concrete reason about working demo, convincing business case and ability to explain its own build. Do not rank in advance.

| Rank | Group | Demo evidence | Business evidence | System/Q&A evidence |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

Signer/name: __________________  Date: __________________

Submit the complete reasoned ballot. Position by average peer rank converts to 4.00 / 3.50 / 3.00 / 2.75; ties split. Missing/incomplete ballot scores 2.75 for the 10% component.

Pack laptop, charger, adapter, hotspot, slides, PDF and runnable backup. Submission is December 1 at 11:59 PM; defense is December 2. Keep the app usable through December 5.
