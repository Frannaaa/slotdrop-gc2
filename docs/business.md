# Group 1 business first draft for CP0

Source filenames retain their original labels: Group 3 - GC1.pdf and GC1_feedback_grp3.pdf. Fran confirmed Group1 for GC2. The source document is not renamed or rewritten.

## User statements and current planning status

Fran explicitly prefers young professionals as the primary audience, with students secondary; activity-based offers such as pottery; provider control of manual discounts; and consideration of weekly/recurring supply rather than relying on occasional monthly events. After reviewing FunNow, ClassPass, Eatigo and Bookme examples, Fran authorized updating CP0 to recurring local leisure sessions and provider-approved offers.

This is the CP0 business first draft. The 72-hour window, 10% model commission, one-area demo, exact seed prices and initial category mix are concrete implementation assumptions proposed in this conversation, not validated customer/partner facts. The course requires the team's own business reasoning: a human must supply the actual reasons and can revise these defaults. No interview, partner agreement, teammate approval or market validation is invented.

## Working proposition and first segment

Find a nearby activity with an available spot and a provider-approved deal in the next few days.

Primary planning segment: young professionals with discretionary leisure spending, flexible near-term plans, and interest in beginner-friendly activities alone or with a companion. Students remain a secondary segment. The initial demo uses Quezon City/Katipunan and nearby areas; geographic scope is a test hypothesis, not evidence of secured suppliers.

Supply focus: regularly scheduled beginner creative sessions, with selected recreational drop-ins as adjacent variety. Occasional workshops are supplementary. Prioritize a provider only after verifying actual session frequency, spare seats, suitable times, late-booking cutoff and willingness to release a specific allocation. A studio being open does not establish that sessions run or seats are available.

Only sessions already going ahead are listed in this model. Unsold seats or provider-authorized reopened seats may be released. An attendee cancellation does not automatically establish lost provider revenue, refundable payment or resale rights.

## GC1 traceability

| GC1 element | Source anchor or documented proposal | GC2 implementation/change |
|---|---|---|
| Target | GC1 p1 describes people seeking quick/cheap last-minute service and providers with unused appointments | Narrows discovery to young professionals and recurring leisure; students secondary |
| Problem | GC1 p2: providers can “profit off of cancelled/empty appointment slots” | Tracks actual provider-released seats; no claim that every cancellation loses revenue |
| Value proposition | GC1 p1: “Empty slot, better price.” | Home proposition; session time, availability and regular/offer price visible |
| Monetization | Commission and featured placements in GC1, without an established rate in feedback | Draft10% provider-paid commission on discounted bookings; featured placement deferred |
| Core flow | GC1 p6: customer selects “Book Now” | Browse -> select session and quantity -> confirm -> persist -> read receipt |
| Provider slot manager | GC1 provider posts/edits slots | Small session/offer manager within owner screen; seeded provider/activity catalog |
| Roles/integrations | GC1 includes roles, real integrations and later payments | GC2 demo without login; fictional data and simulated payment; integration deferred |

## Funnel and element choices

| Stage | Screen/elements and reason | Endpoint | Intended number |
|---|---|---|---|
| Browse | Date/area/people filters restrict to usable choices; cards show exact time and per-seat price before a click | GET /api/slots | Eligible Browse-to-detail visits |
| Select | Detail shows duration/inclusions context; quantity control lets a customer check whether a companion can join | GET /api/slots/:id and /api/pricing/quote | Detail-to-selection rate |
| Confirm | Short customer form, visible quantity/total, inline validation; changed total requires a new explicit confirmation | POST /api/bookings | Booking completion |
| Save | Confirmation ID and receipt fetched from saved record instead of displaying a browser-only success | GET /api/bookings/:id | Confirmed bookings and average booking value |

These are measurement intentions, not implemented analytics or observed conversion effects.

## Business rules and enforcement

| Plain-language rule | Server/data enforcement | Customer/provider sees |
|---|---|---|
| Show only released seats in sessions within72h, before cutoff and already going ahead | List/quote eligibility; service and slot records | No promise of an unconfirmed workshop |
| Never sell more seats than the allocation | Lock slot and check SUM confirmed quantities during booking/edit | 409 SLOT_UNAVAILABLE instead of false confirmation |
| Provider sets the customer offer price per seat | Owner offer API validates and stores 0<offer<original | Regular price, offer, savings and net proceeds |
| Charge the draft10% fee only on the confirmed discounted amount | One shared server money function; immutable booking fee snapshot | Provider payout separate from SlotDrop fee |
| Ask again if the amount changes before saving | Booking compares acknowledged total to own recomputation before writes | Fresh quote and explicit reconfirmation |
| Retrying a request must not create another booking | UNIQUE request_id, normalized payload comparison | Same receipt for identical retry |
| Offer edits never rewrite an existing receipt | Saved date/price/fee snapshots | Stable confirmation |
| Pause sales without deleting prior bookings | Status and edit validation under lock | Existing bookings retained; new sales disabled |

## Two revenue features with worked numbers

1. Availability allocation and capacity protection. Fictional seeded session1 has four SlotDrop seats, regular PHP2,000 per seat, offer PHP1,600. Booking two seats records PHP3,200 gross value, PHP320 fee and PHP2,880 provider proceeds before service costs, leaving two released seats. A request for three more seats returns409 and adds no revenue or booking. An identical network retry returns the same receipt, not another PHP320 fee. These are design expectations, not executed API tests.

2. Provider-controlled limited-session offer. At the same session, one seat at PHP1,600 saves the customer PHP400 (20%) versus PHP2,000. Draft10% fee is PHP160; provider proceeds PHP1,440 before costs. This is a provider-entered offer, not automated tier pricing. Whether PHP1,440 is attractive depends on incremental costs, what direct sale it may replace, and the provider's own decision. The team must supply its own commercial conclusion.

Feature2 is a custom revenue feature under the brief's “Your own” option. Instructor clearance is REQUIRED at CP0 and is not yet obtained. The draft does not count commission as an unrelated third feature or label manual offers “tiered pricing.” See docs/cp0-instructor-clarification.md.

## Five owner metrics and intended decisions

| Metric | Meaning | Decision supported |
|---|---|---|
| bookingCount | Confirmed transactions, not seats | Whether the flow generates bookings |
| platformRevenueCentavos | Saved commission, not gross value | Whether fee income can support acquisition/service costs |
| averageOrderValueCentavos | Average full booking value, including quantity | Whether companion bookings change ticket size |
| topSellingService | Activity with most confirmed seats | Which activity supply to investigate/recruit |
| nearlyFullSessionCount | Sessions at <=25% of their released allocation remaining | Whether useful supply needs replenishment |

Do not infer general market demand from fictional seed bookings.

## Real-world references and limits

- FunNow: https://www.events.myfunnow.com/whyfunnow-en and https://help.boss.myfunnow.com/hc/en-us/articles/47363352109337-How-to-Set-Regular-Prices-via-Cycle-Setting
  Reference for near-term discovery, recurring time slots and merchant price/capacity controls.
- ClassPass: https://classpass.com/partners/faqs
  Reference for selective excess-capacity allocation; no proprietary algorithm is claimed here.
- Eatigo: https://eatigo.com/en/about-us
  Reference for time-specific quiet-period offers, not a proposal to add restaurants.
- Bookme: https://www.bookme.com.au/
  Reference for operator-controlled activity listings.
- Local schedule caution: https://lemonlab.ph/product/mugoctober/ advertises two October dates; https://linktr.ee/laro_ceramics advertises regular classes. Neither is evidence of a SlotDrop partnership or discounted available inventory.

Sources were read October27,2026. Published platform claims are descriptions of their products, not proof of incremental profit or demand for SlotDrop.

## Human business reasoning to preserve

Fran and the team should record their own rationale during review for the segment, supplier cadence, selected geography, commission economics and release/cutoff policy. User authorization to prepare this draft is not represented as classmates independently deciding or validating it. No canned personal rationale is attributed to a member.
