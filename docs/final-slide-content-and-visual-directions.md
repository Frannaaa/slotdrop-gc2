# SlotDrop: slide content and visual directions

Prepared 28 November 2026 for the group Final V2 defense. This is a content brief for the group to build into slides later.

## Build status

Group main is `00feaa5`: Home, persisted holds, hold-aware quotes and atomic hold conversion are merged. Kat and Kaitlyn's visible Selection/Checkout hold handoff and countdown remain pending.

Slide 5 describes the intended live proof. Keep that proof marked pending in the working deck until it passes on integrated main. Slides support the mandatory live demo. A diagram, screenshot or recording does not complete a live proof.

## Overall visual direction

Use the existing SlotDrop identity:
- Paper background `#F5F2EA`, ink `#20231E`, blue `#3048DB`.
- Lime `#DCFA63` for the hold duration and the final numerical decision.
- Space Grotesk headings and DM Sans body. Use 42–48 pt for the cover, 30–34 pt for slide titles and 20–24 pt for body copy.
- Keep one main point per slide. Use open space, flat tables and short labels. Avoid dashboard grids, tiny code screenshots and decorative stock graphics.
- Use the existing workshop photos in `public/images/workshops/`. Preserve their proportions and identify them as studio references. Do not imply a partnership.
- Build tables and architecture labels as editable elements. Switch to the actual app and editor for proof.

The copy below is the text to put on each slide. Presenter cues and status notes belong in speaker notes.

## Slide 1: SlotDrop

**On-slide copy**

SlotDrop

Empty slot, better price.

A workshop seat held while you finish booking.

Group 1 · ITMGT 45.03 · Final V2

**Visual direction**

Use a large wordmark on the left and the existing `laro-mug.webp` reference photo on the right. Keep the tagline smaller than the name. Use a paper background and a single blue accent. Do not add an interface mockup.

**Speaker and timing:** Fran, 0:00–0:20.

**Presenter cue:** Introduce a specific situation: a workshop is already going ahead, but some seats may remain empty before its preparation cutoff.

## Slide 2: A workshop seat expires

**On-slide copy**

A studio releases a small allocation before its booking cutoff.

A customer needs time to finish booking.

SlotDrop reserves those seats for up to ten minutes.

Classroom prototype. Studio partnerships and actual sales remain unvalidated.

**Visual direction**

Make “up to ten minutes” the largest phrase after the title. Beside it, show a simple sequence of three labels: seat available, reservation active, booked or expired. Leave the underlying rule explanation to the speaker.

**Speaker and timing:** Fran, 0:20–1:30.

**Presenter cue:** Explain the difference from tracking interest in a spreadsheet: the server applies one availability rule across competing requests, expires the reservation and converts it into a saved booking. The hold ends at the earlier of ten minutes or the session cutoff. State the 10% pilot fee and roughly 27-seat modeled break-even. Mention that the one prioritized GC2 comment was the approximately 22-second first visit.

## Slide 3: The group system

**On-slide copy**

Browser: HTML, CSS and JavaScript

Server: Node.js and Express

Rules: quote, availability, holds and booking

Storage: PostgreSQL on Neon

Render hosts the app. GitHub Actions runs its checks.

**Visual direction**

Use a clear four-step architecture diagram with large labels. Put customer and Owner views beside the same browser layer. Keep database and server labels distinct. The group build uses PostgreSQL on Neon; React and Supabase belong to Fran's separate individual project.

**Speaker and timing:** Kirsten, 1:30–2:30.

**Presenter cue:** Explain the route/service/database boundary. A browser total acknowledges a quote. The server recalculates it before saving.

## Slide 4: One booking, one saved receipt

**On-slide copy**

Choose two seats.

Confirm the server quote.

Refresh the receipt.

Find the same booking ID in Owner.

**Visual direction**

Use a plain transition slide, then switch to the live application. Keep the receipt ID and Owner row large enough to read. Do not print a made-up booking ID on the slide.

**Speaker and timing:** Fran operates; Janelle explains the quote and save. 2:30–7:30.

**Live-demo cues**
1. For a controlled local rehearsal, use a fresh seeded Laro mug-making release: four available seats, PHP 2,700 standard or PHP 2,565 each for two buddies.
2. Select two seats. The buddy total is PHP 5,130, including PHP 513 platform commission and PHP 4,617 studio payout.
3. Confirm using fictional guest details and simulated payment. Show the saved receipt, refresh it and match its actual ID in Owner.
4. Show remaining availability fall from four to two in that controlled example.
5. Attempt three seats when only two remain. Show the `SLOT_UNAVAILABLE` reason and verify that the refusal creates no extra booking.
6. Public inventory may differ. Read the actual starting count and verify the result against it. Do not reset or delete public bookings to match the example.

This section proves the complete transaction, persisted record and a refusal with no new save.

## Slide 5: Active and expired reservations

**On-slide copy**

| Reservation | Server decision |
| --- | --- |
| Active and matching | Convert the hold and save one booking |
| Expired | Release availability and refuse the booking |

The browser shows the time. The server enforces the deadline.

**Visual direction**

Use one large two-row table. Highlight the active state with the brand blue and the expired state with restrained warning text. During the demo, switch to Selection/Checkout and show the actual reservation status, countdown and refusal message. Do not manufacture a countdown in the slide.

**Speaker and timing:** Kat and Kaitlyn, 7:30–11:30. Run the feature itself in under one minute; use the remaining time to explain the result.

**Current gate:** The backend is implemented. The visible countdown and screen-to-screen handoff have not yet been verified on integrated main.

**Live-demo cues**
- Show one session, quantity, hold ID and expiry carried from Selection through quote and booking.
- Complete an active hold. The saved receipt must contain that hold reference.
- Use a separately prepared expired reservation. Show `HOLD_EXPIRED`, no new booking, and availability becoming usable again.
- Prepare expiry before the defense. Do not wait ten minutes live or change production duration.
- Existing expired hold rows can remain stored. The server derives effective expiry from the deadline and excludes expired reservations from available-seat calculations.

## Slide 6: The real save

**On-slide copy**

`public/js/checkout.js`

`POST /api/bookings`

`bookingRouter() → createBooking()`

`bookings` and `seat_holds`

Wrong accepted total: `409 PRICE_CHANGED`

**Visual direction**

Use four readable steps with short file/function labels. Open the actual editor and trace the booking created during the demo. Show only the relevant function, not a screenshot of an entire file.

**Speaker and timing:** Fran, with Janelle supporting, 11:30–12:30.

**Presenter cue:** The route is in `server/routes/bookings.js`. `createBooking()` in `server/services/bookings.js` locks the slot, checks for a prior request again, validates the hold, recalculates the quote, inserts the booking and converts the hold in one transaction. Availability derives from released capacity minus confirmed bookings and active, unexpired holds. There is no separate browser-owned stock counter. A wrong total returns the fresh quote before an insert occurs.

## Slide 7: Owner analytics

**On-slide copy**

Owner analytics bonus

Bookings  
Platform fee revenue  
Average booking value  
Top-selling workshop  
Nearly full sessions

Five server-computed figures from saved records.

**Visual direction**

Keep the five labels readable in a simple vertical list, then switch to the live Owner screen. Use the current values there. Do not fill the slide with invented totals or treat utilization as a replacement for one of the five figures.

**Speaker and timing:** Fran, 12:30–13:00.

**Presenter cue:** Explicitly claim the optional Owner analytics bonus. “Nearly full” means an eligible release has at least one seat left and at most 25% of its released allocation remaining. A sold-out session does not count as nearly full.

## Slide 8: The GC2 comment we prioritized

**On-slide copy**

First visit: about 22 seconds in GC2.

Our response:
- A health route and a ten-minute ping schedule
- Verified scheduled HTTP 200 responses
- Warm-up and a local fallback before presenting

Reliable first access lets people reach the prototype.

**Visual direction**

Give “22 seconds” one clear visual emphasis. Keep a small actual workflow-log excerpt available in presenter notes or a backup tab. Do not claim a new load-time benchmark or guaranteed continuous uptime.

**Speaker and timing:** Fran, 13:00–13:30.

**Presenter cue:** Explain the priority: existing price, lock and retry rules already earned positive feedback, while the delay affected a first-time user's ability to reach any feature. The schedule's successful runs are evidence of execution, not a promise that every request stays warm.

## Slide 9: A 10% fee and a 27-seat checkpoint

**On-slide copy**

Four-week pilot model

32 of 64 released seats sold across 28 bookings

| Platform outcome | PHP |
| --- | ---: |
| Commission | 8,532 |
| Support | (1,400) |
| Outreach and operations | (6,000) |
| Modeled surplus | 1,132 |

Keep the 10% commission for a one-studio pilot.

At the modeled sales mix, break-even is about 27 of 64 seats.

Expand only when actual studio contribution and platform margin are positive.

**Visual direction**

Use an editable financial table with right-aligned numbers. Make “10%” and “27 of 64” the visual anchors. Add a short footnote: “Assumptions exclude founder pay, taxes, real payment costs and refunds.” Avoid a growth chart because the project has no actual sales history.

**Speaker and timing:** Kirsten closes, 13:30–14:30. Keep 14:30–15:00 as a recovery buffer.

**Presenter cue:** These are modeled results. A discounted sale is useful only if it adds attendance or improves total contribution. The next step is a consenting studio, an agreed allocation and actual cost/attendance records.

## Backup content: three slides for Q&A

These sit after the nine main slides and do not add to the timed talk.

### A. Buddy pricing and studio contribution

**On-slide copy**

| Two seats | Standard | Buddy |
| --- | ---: | ---: |
| Customer total | PHP 5,400 | PHP 5,130 |
| Platform commission | PHP 540 | PHP 513 |
| Studio payout | PHP 4,860 | PHP 4,617 |

If both customers would already attend, the studio gives up PHP 243.

If the second guest is additional, the outcome can improve.

**Visual direction:** One editable table and one sentence below it. Keep the assumed incremental attendance cost in speaker notes rather than implying that the studio confirmed it.

**Answer cue:** At the modeled PHP 500 cost for an extra attendee, adding a second buddy guest improves studio contribution by PHP 1,687 versus selling one standard seat. An otherwise unchanged standard pair loses PHP 243. Studio break-even for that mix is roughly 12.6% of buddy bookings adding a guest. Validate the actual costs before choosing a permanent promotion.

### B. Retry, expiry and browser recovery

**On-slide copy**

Same request and same fields: original receipt.

Same request ID with different fields: conflict.

Expired hold: refusal, no new booking.

Refresh: read the saved receipt by ID.

**Visual direction:** A simple behavior table. Put the relevant rule files in speaker notes. Avoid tiny test-output screenshots.

**Answer cues**
- New booking: HTTP 201. Identical retry: HTTP 200 and the saved receipt, including after the original hold deadline.
- A reused request ID with changed fields returns `REQUEST_KEY_CONFLICT`.
- Hold failures include `HOLD_NOT_FOUND`, `HOLD_MISMATCH`, `HOLD_EXPIRED`, `HOLD_RELEASED` and `HOLD_CONVERTED`.
- Successful Checkout uses replace navigation so Back does not revive a locked Saving form.
- Invalid typed quantities retain a useful Selection screen and keep Continue disabled.
- The visible final hold flow must preserve those existing behaviors.

### C. Questions for the other groups

**On-slide copy**

Where do you enforce the final availability check when two customers confirm together?

How does a retry recover a save after the browser loses the response?

Which business number determines whether you would keep your upgrade?

**Visual direction:** Three plain questions with generous spacing. Use this as a cue card when watching other teams.

**Operator cue:** Kirsten, Kat and Kaitlyn each cover one other group, assigned once the presentation order is known. Adapt questions to what the team actually demonstrates. Complete and sign the reasoned peer ballot after watching all three groups.

## Timing and ownership

| Segment | Owner | Time |
| --- | --- | --- |
| Slides 1–2 | Fran | 0:00–1:30 |
| Slide 3 | Kirsten | 1:30–2:30 |
| Slide 4, live transaction and refusal | Fran + Janelle | 2:30–7:30 |
| Slide 5, visible USP | Kat + Kaitlyn | 7:30–11:30 |
| Slides 6–8 | Fran, Janelle supports | 11:30–13:30 |
| Slide 9 and closing | Kirsten | 13:30–14:30 |
| Recovery buffer | All | 14:30–15:00 |
| Questions and answers | Five presenters | 15:00–20:00 |

Chonel's absence is approved. His Home code handoff is complete. No additional video or speaking slot is assigned to him.

## Sources and update rules

Code facts are grounded in reviewed group main `00feaa5f8186f3d98db9470ba9acd228d02ee91d`:
- [Booking route](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/server/routes/bookings.js)
- [Booking service](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/server/services/bookings.js)
- [Hold service](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/server/services/holds.js)
- [Hold repository](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/server/repositories/holds.js)
- [Pricing and refusal rules](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/server/services/pricing.js)
- [Business model and calculations](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/docs/business.md)
- [Run sheet](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/docs/final-v2-run-sheet.md)
- [Current group reflection](https://github.com/Frannaaa/slotdrop-gc2/blob/8640fea4e4f9769b0874c4f4f441848bb2729545/docs/SlotDrop_Final_Reflection.md)

Recheck the visible hold integration before changing Slide 5's pending status. Keep actual receipt IDs, Owner figures and proof results tied to the demonstrated build. Fran prepared this brief with Codex assistance. It is for the group Final, not the individual assignment's recording.
