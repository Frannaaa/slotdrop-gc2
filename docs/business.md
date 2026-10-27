# Group 1 business first draft for CP0

Source filenames retain their original labels: Group 3 - GC1.pdf and GC1_feedback_grp3.pdf. Fran confirmed Group 1 for GC2. The source document is not renamed or rewritten.

## Scope and assumptions

SlotDrop focuses on young professionals, with students as a secondary audience. Supply includes recurring creative workshops and recreational drop-ins. Providers set their offers and can enable a bring-a-friend rate. Paid activity add-ons are reserved for the Final Project.

The 72-hour listing window, 10% commission, initial area, category mix and seed prices are planning assumptions. Customer demand, provider participation and costs still need validation through interviews.

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
| Monetization | Commission and featured placements in GC1, without an established rate in feedback | Draft10% provider-paid commission on discounted/group bookings; featured placement and paid add-ons deferred |
| Core flow | GC1 p6: customer selects “Book Now” | Browse -> select session and quantity -> confirm -> persist -> read receipt |
| Provider slot manager | GC1 provider posts/edits slots | Small session/offer manager within owner screen; seeded provider/activity catalog |
| Roles/integrations | GC1 includes roles, real integrations and later payments | GC2 demo without login; fictional data and simulated payment; integration deferred |

## Funnel and element choices

| Stage | Screen/elements and reason | Endpoint | Intended number |
|---|---|---|---|
| Browse | Date/area/people filters restrict to usable choices; cards show exact time and per-seat price before a click | GET /api/slots | Eligible Browse-to-detail visits |
| Select | Detail shows duration/inclusions context; quantity control checks companion availability and shows an opted-in bring-a-friend rate | GET /api/slots/:id and /api/pricing/quote | Detail-to-selection rate |
| Confirm | Short customer form, visible quantity/total, inline validation; changed total requires a new explicit confirmation | POST /api/bookings | Booking completion |
| Save | Confirmation ID and receipt fetched from saved record instead of displaying a browser-only success | GET /api/bookings/:id | Confirmed bookings and average booking value |

These are measurement intentions, not implemented analytics or observed conversion effects.

## Business rules and enforcement

| Plain-language rule | Server/data enforcement | Customer/provider sees |
|---|---|---|
| Show only released seats in sessions within 72 hours, before cutoff and already going ahead | List/quote eligibility; service and slot records | No promise of an unconfirmed workshop |
| Never sell more seats than the allocation | Lock slot and check SUM confirmed quantities during booking/edit | 409 SLOT_UNAVAILABLE instead of false confirmation |
| Provider sets the customer offer price per seat | Owner offer API validates and stores 0<offer<original | Regular price, offer, savings and net proceeds |
| Apply the provider-approved group rate only when at least 2 seats are booked together for the same session | Shared quote/booking service reads stored buddy rate; receipt stores pricing type | Clear per-person rate, group savings and whole-booking total |
| Charge the draft 10% fee only on the confirmed discounted amount | One shared server money function; immutable booking fee snapshot | Provider payout separate from SlotDrop fee |
| Ask again if the amount changes before saving | Booking compares acknowledged total to own recomputation before writes | Fresh quote and explicit reconfirmation |
| Retrying a request must not create another booking | UNIQUE request_id, normalized payload comparison | Same receipt for identical retry |
| Offer edits never rewrite an existing receipt | Saved date/price/fee snapshots | Stable confirmation |
| Pause sales without deleting prior bookings | Status and edit validation under lock | Existing bookings retained; new sales disabled |

## Two revenue features with worked numbers

1. Availability allocation and capacity protection. Fictional seeded session1 has four released seats, regular PHP 2,000 normal offer PHP 1,600 and an opted-in buddy rate PHP 1,520 per person. A two-seat booking leaves two allocated seats. A request for three additional seats returns 409 without another receipt or revenue. An identical network retry returns the same receipt. These are design expectations for future APIs; the SQL checks separately demonstrate receipt constraints and quantity-based remaining inventory.

2. Bring-a-friend tiered pricing. One seat uses the PHP 1,600 normal offer: fee PHP 160 provider proceedsPHP 1,440 before service costs. Two seats qualify for PHP 1,520 each, total PHP 3,040: fee PHP 304 and provider proceedsPHP 2,736. Compared with two normal-offer seats, the customer saves anotherPHP 160 SlotDrop gives upPHP 16 commission and the provider gives upPHP 144 proceeds. If the offer attracts a genuinely additional attendee it may help fill capacity; if both people would already have booked, it discounts existing demand. Provider participation is optional; the team must evaluate the extra attendee's material/service costs and actual booking behavior. These figures are transparent scenarios, not validated unit economics.

The two features map to the brief's listed availability filtering/inventory protection and tiered pricing. Manual provider price entry is configuration, not counted as a separate revenue feature. Paid add-ons are a Final Project improvement. Review both features against the rubric before implementation.

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
  Reference for selective excess-capacity allocation.
- Eatigo: https://eatigo.com/en/about-us
  Reference for time-specific quiet-period offers, not a proposal to add restaurants.
- Bookme: https://www.bookme.com.au/
  Reference for operator-controlled activity listings.
- Local schedule caution: https://lemonlab.ph/product/mugoctober/ advertises two October dates; https://linktr.ee/laro_ceramics advertises regular classes. Neither is evidence of a SlotDrop partnership or discounted available inventory.

Sources were read October27,2026. Published platform claims are descriptions of their products, not proof of incremental profit or demand for SlotDrop.

## Questions for team review

Confirm the initial area, supplier schedule, commission and booking cutoff. Check whether providers have enough regularly available seats and whether the buddy rate covers the cost of an additional attendee.

## Targeting and feedback follow-through

Working age range22-35 is a planning hypothesis for early-career professionals, not survey evidence. Initial demo offer prices range fromPHP 450 to PHP 1,700 before any buddy tier; they are fictional. Segment by willingness to pay for a specific nearby activity and available time, rather than estimated salary alone. Monthly income and observed frequency of unfilled sessions are not validated.

For provider acquisition, investigate regularly scheduled beginner-session operators in one reachable area. The first provider interviews should establish whether a provider will release specific seats, at which times, with what cutoff and optional group rate. Existing booking systems remain the provider's primary system; the proposed exclusive allocation prevents knowingly listing the same released seats twice, but external calendar accuracy remains an operational dependency.

| Risk from GC1 feedback | Proposed response | Remaining evidence needed |
|---|---|---|
| Ghost slots | Provider explicitly releases a bounded allocation; booking/edit locks protect internal capacity; pause/cutoff rules stop further sales | Actual provider discipline and external calendar reconciliation |
| Providers refuse discounts | Normal/group offers opt-in, show net proceeds before publishing | Provider willingness and service-cost economics |
| Deal-only customers | Track repeat use and whether attendees are new/incremental; do not assume loyalty | Real retention and direct-sale substitution data |
| Popular providers have no spare seats | Promise available near-term activities, not guaranteed access to sold-out popular venues | Actual suitable spare inventory |
| No supplier pipeline | Validate session cadence, spare places and reachable customers before broadening categories | First willing providers; no agreements yet |

Competition is real: FunNow offers near-term discovery; ClassPass offers scheduled excess-capacity distribution; Eatigo demonstrates time-specific offers. SlotDrop's proposed initial focus is nearby beginner leisure sessions with transparent per-booking pricing and optional companion rates. This positioning still needs customer and provider feedback.
