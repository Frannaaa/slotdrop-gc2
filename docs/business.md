# SlotDrop business case

SlotDrop helps people find nearby activities with available seats and a provider-set offer. The GC2 focus is beginner creative sessions, with some recreational drop-ins, in Katipunan and UP Village. Young professionals are the primary audience; students are secondary. This is a working target, not a survey result.

All seed providers, prices and schedules are fictional. No supplier agreement or customer interview has been completed.

## GC1 traceability

The source files retain their original names, `Group 3 - GC1.pdf` and `GC1_feedback_grp3.pdf`; the GC2 team is Group 1. The page references below come from the existing GC1 notes and still need checking against the submitted PDF.

| GC1 element | Source anchor | Where it appears in GC2 |
|---|---|---|
| Target market | Page 1 describes people looking for quick, affordable services and providers with unused appointments | A small local activity catalog with date, area and people filters |
| Problem | Page 2: “profit off of cancelled/empty appointment slots” | Provider-released seats, visible deadlines and capacity checks |
| Value proposition | Page 1: “Empty slot, better price.” | Planned Home message and visible regular/offer prices |
| Monetization | Commission and featured placements | A 10% model commission; featured placements are deferred |
| Core flow | Page 6: “Book Now” | Browse → choose a session/quantity → confirm → save → read the receipt |
| Provider controls | Providers post and edit slots | Owner session/offer manager |
| Accounts and integrations | Roles, external integrations and payments | Deferred; GC2 has no login and uses simulated payment |

## Main choices

- Start with a small area and recurring sessions so the catalog and supplier search stay manageable.
- Show sessions less than 72 hours away. This supports near-term planning without listing a large calendar.
- Let each activity have a default booking lead time, with an override for each session. There is no universal cutoff.
- List only sessions already going ahead. Providers release a specific allocation of seats and can pause sales.
- Use a 10% commission for the course model, deducted from the accepted customer price. It is not an established market rate.
- Make buddy pricing optional. A provider can set a lower per-person rate for two or more seats booked together in the same session.
- Keep paid add-ons, accounts, real payments and React for the separate Final Project.

Provider proceeds are not profit. Materials, instruction, processing and other costs still have to be covered. The team needs to confirm these choices and its own reasons before submission.

## Funnel

| Stage | Screen and elements | Why these elements | Endpoint | Intended measure |
|---|---|---|---|---|
| Browse | Session cards; date, area and people filters | Help visitors find an offer they can actually attend | GET /api/slots | Browse-to-detail visits |
| Select | Detail, quantity selector and price summary | Show the session, available seats and whole-booking total | GET /api/slots/:id; planned quote route | Detail-to-selection rate |
| Confirm | Short booking form, payment choice and inline errors | Catch missing details and show the accepted amount before saving | Planned POST /api/bookings | Booking completion |
| Save | Booking ID and receipt | Read back what the database saved | Planned GET /api/bookings/:id | Bookings and average booking value |

These are proposed funnel measures. Event analytics and the full customer flow are not implemented in Fran's PRs.

## Business rules

“Implemented” below refers to the development PRs, not the unmerged main branch.

| Rule | Enforcement | Result |
|---|---|---|
| Only show released seats before the deadline and within 72 hours | Implemented in listSlots(), server/services/discovery.js | Closed, full, paused and inactive offers are excluded |
| Do not reduce allocation below booked seats | Implemented in editOffer(), server/services/offers.js | 409 CAPACITY_CONFLICT |
| The offer must be below the regular price | Implemented in createOffer()/editOffer() and SQL constraints | Invalid prices are refused |
| Buddy pricing needs at least two seats in one booking | Rate storage and receipt constraints exist; tier selection awaits the booking service | Planned standard/buddy quote and saved pricing type |
| Compute fees and totals on the server | Planned quote/booking service; receipt arithmetic is checked by SQL | Browser totals are a preview |
| Ask again when the price changes | Planned booking comparison with expectedTotalCentavos | Planned 409 PRICE_CHANGED and a fresh confirmation |
| A network retry must not create a second booking | Unique request_id exists; HTTP retry handling awaits the booking service | Planned same receipt for an identical retry |
| Offer edits must not change existing receipts | Implemented offer edits do not update bookings | Saved prices and fees remain unchanged |
| Reopening sales must not bypass availability | Implemented in editOffer() | Passed cutoffs, started sessions, full allocations, inactive activities and unconfirmed sessions prevent reopening paused or cancelled inventory |

## Revenue features and examples

**Availability.** Seed session 1 has four released seats. Two seats at the buddy rate of ₱1,520 total ₱3,040, with a modeled ₱304 commission and ₱2,736 provider proceeds. Two allocated seats remain. A later request for three seats must be refused without creating another booking. That protects the customer from a false confirmation and the provider from an oversold session. Booking-time enforcement still needs the assigned booking implementation; the schema, derived counts and owner edit protection are tested.

**Buddy pricing.** One seat costs ₱1,600: ₱160 commission and ₱1,440 provider proceeds. Two seats at ₱1,520 cost ₱3,040, compared with ₱3,200 at the standard offer. The extra ₱160 discount reduces commission by ₱16 and provider proceeds by ₱144. It helps only if the added booking value outweighs the discount and additional attendee costs. If both customers would already have booked, proceeds fall. The provider therefore chooses whether to offer it.

Availability and tiered pricing are the two proposed revenue features. They are complete only when the booking service enforces and saves them.

## Owner numbers

| Metric | Definition | Decision it supports |
|---|---|---|
| Booking count | Confirmed transactions, not seats | Check whether the booking flow is producing orders |
| Platform revenue | Sum of saved commission | Compare fee income with acquisition and support costs |
| Average booking value | Average full transaction total | Check whether companion bookings change order size |
| Top activity | Activity with the most confirmed seats | Decide which supply to investigate or recruit |
| Nearly full sessions | Eligible sessions with at most 25% of released allocation remaining, including sold-out sessions | Decide where to add supply |

Fictional bookings demonstrate calculations; they do not measure real demand.

## Research and feedback

Sources checked October 27, 2026:

- [Laro Ceramics](https://laro-ceramics.com/) lists a Katipunan branch, beginner classes and group offers. Its [mug-making page](https://laro-ceramics.com/products/mug-making-class-manila) lists ₱3,000 and describes a three-hour class. This supports researching local activities and companion offers, but does not establish spare inventory or a partnership.
- [Bumi & Ashe's catalog](https://bumiandashe.com/collections/single-session) lists mug-making at ₱2,650 and free-form pottery at ₱3,200. These are product examples, not a market average. Several seed prices are lower and must remain labeled fictional.
- [Studio Matisse's policy](https://studiomatisse.myshopify.com/pages/studio-policies) requires bookings two days ahead. It is a San Juan policy reference, not a QC supplier claim. It shows why lead times must vary. With a 48-hour cutoff, the 72-hour discovery window has only a 24-hour bookable overlap.
- [FunNow](https://www.events.myfunnow.com/whyfunnow-en) already offers near-term experience discovery. Last-minute booking alone is not unique.
- [ClassPass](https://classpass.com/partners/faqs) describes excess-capacity distribution and integrated inventory tools. Its model does not validate SlotDrop's manual allocation, commission or expected results.

The GC1 feedback raised ghost slots, unwilling providers, deal-only customers and a lack of supplier pipeline. SlotDrop addresses the design side with explicit allocations, cutoff/pause controls, optional prices and visible proceeds. Provider interviews are still needed to establish actual schedules, spare seats, costs and willingness to participate. External calendar accuracy remains an operational dependency.

