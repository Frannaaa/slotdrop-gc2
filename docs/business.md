# SlotDrop | Business case, market strategy and GC2 implementation

*Group 1 · ITMGT 45.03-YZW · 16 November 2026*

**Empty slot, better price.** SlotDrop helps someone book a seat in a nearby workshop that is already going ahead, while giving a studio a controlled way to sell capacity it might otherwise leave empty. We originally pitched a general last-minute appointments marketplace in GC1. After the feedback, we narrowed our first market to **short-notice creative workshops near Katipunan and nearby Quezon City**.

That change matters. A fully booked studio has nothing for a last-minute marketplace to sell; a studio with spare places may still lose money if a discount simply replaces a full-price customer. Our plan therefore starts with **a small, explicitly released allocation**, visible booking cutoffs, a studio-controlled offer price and a test of **incremental contribution**—not a promise that every cancellation is recoverable.

**Evidence boundary:** The [GC2 prototype](https://slotdrop-gc2-group-zx8j.onrender.com/) uses publicly researched studio names and reference prices, but dates, seats, discounts, reservations and payments are **simulated**. No studio partnership, supplier consent for real inventory, actual customer conversion or profit has been established. This document distinguishes working software from the future commercial pilot.

[Full revised GC1 proposal](reference/gc1-revised-business-proposal.md) · [Original research, links and sensitivity calculations](reference/business-research-appendix.md) · [Two-page GC2 business PDF](SlotDrop_GC2_Summary.pdf) · [Architecture](system.md)

## 1. Business concept brief

| Requirement | SlotDrop's specific answer |
|---|---|
| **Name and tagline** | **SlotDrop — “Empty slot, better price.”** The live Home page leads with “A free evening. An open seat.” |
| **E-commerce category** | Two-sided **booking/experiences marketplace**. Studios release limited inventory in already-confirmed workshops; customers choose, quote and complete an online booking. |
| **Primary customer** | Proposed **22–35-year-old working adults** who live, study or work around Katipunan, UP Village and Teachers Village, and sometimes decide on weekend or after-work plans within three days. Initial **₱35,000–₱80,000 monthly gross income** is a screening hypothesis—not a measured segment or claim of affordability. |
| **Customer psychographics** | Values experiences with friends, a convenient process, transparency about inclusions and total prices, and reassurance that a short-notice class can actually be attended. A deal alone is not enough if the location, travel or preparation is impractical. |
| **Secondary customer** | Students and younger adults in the area. Their budget needs must be tested separately; a ₱2,500+ workshop may not be an accessible impulse purchase. |
| **Supplier** | Independent studios that regularly run workshops and can point to **real, recurring unfilled seats before preparation cutoff**. Laro Ceramics, Bumi & Ashe, Tahanan, AMT and Sip & Gogh are **research candidates only**, not signed partners. |
| **Customer problem** | Workshops are scattered across provider pages and social posts. Comparing **the actual session, included materials, remaining seats, deadline and full party price** takes work; a short-notice buyer wants certainty before committing. |
| **Provider problem** | A seat in a class already going ahead may expire unused, but discounting everyone or marketing an unconfirmed cancellation may cost more than it earns. |
| **Value proposition** | Customers compare a curated set of **provider-released near-term seats** and book with a saved reference. The studio chooses capacity, cutoff and price. SlotDrop must demonstrate *new revenue*, not merely lower prices. |

**Why workshops first?** A workshop has a clear start time, fixed seats and a recognizable “one more guest” decision. We can model that properly with a real database and six-screen booking flow. The 72-hour window is an operating hypothesis, not proof that customers or studios prefer exactly three days.

## 2. Strategic analysis — our chosen two frameworks

### 2.1 SWOT: what would actually make us change course?

| Lens | Finding | Response we would test |
|---|---|---|
| **Strength** | Clear two-sided need, constrained seats, a transparent final price and server-enforced booking logic. | Start with **one studio and one activity type** instead of an empty citywide marketplace. |
| **Weakness** | Cold-start supply problem, no direct studio-calendar sync, weak brand trust and a thin commission on small transaction volumes. | Obtain a supplier-approved allocation, reconcile it manually, make the booking policies explicit and measure acquisition/support cost per booking. |
| **Opportunity** | Some scheduled classes may have spare capacity; a pair discount may encourage an extra person to attend. | Measure unsold seats and test standard vs buddy offers on comparable sessions. |
| **Threat** | **Ghost slots**, popular studios refusing discounts, deal hunters replacing direct buyers, existing booking platforms and provider no-shows. | Ring-fence inventory, agree a **minimum net provider payout** before launch, pause inaccurate offers and monitor direct + platform sales together. A provider-specific payout floor is **proposed, not yet enforced in GC2**. |

The largest weakness is **not the booking code**. It is whether a studio can release attractive inventory early enough and still earn more after any cannibalization, materials cost and commission.

### 2.2 Business Model Canvas

| Block | Proposed model |
|---|---|
| **Customers** | QC short-notice experience seekers; potentially price-sensitive groups; studios with observable spare capacity |
| **Value** | One place to see a bookable near-term seat, full price and cutoff; a controlled incremental sales channel for a provider |
| **Channels** | Studio referrals, local creator/community posts, neighborhood discovery, and the public SlotDrop web app |
| **Relationships** | Trustworthy listing details, a saved booking number, clear support/escalation; accounts and refunds are future work |
| **Revenue** | **10% of confirmed booking value**, deducted from the studio's payout in the simulated model; no ad or subscription revenue assumed |
| **Key activities** | Studio onboarding, seat reconciliation, offer quality checks, local marketing, booking support, performance measurement |
| **Key resources** | Supplier agreements, verified availability, transactional database/API, a credible local audience and customer support |
| **Partners** | Initially one consenting studio; then hosting/database providers and eventually payments, notifications and calendar vendors |
| **Costs** | Acquisition, onboarding, hosting, customer support, handling errors/refunds, future payment costs and founder time |

**Our business-model assessment:** As a narrow pilot, SlotDrop is feasible to build and test. As a marketplace, it remains **commercially unproven**. Getting both sides to participate and proving that studios earn **incremental**, not cannibalized, revenue is the actual business experiment.

## 3. Competitors: direct, indirect and auxiliary

We revised the generic “booking giants” comparison from GC1. The point is not to claim SlotDrop invented last-minute bookings; it is to identify **which alternatives already satisfy part of the same job**, and what we would need to do better.

### 3.1 Direct competitors — bookable inventory or excess-capacity platforms

| Player | Relevant offering | Why users/providers might prefer it | What SlotDrop has to test |
|---|---|---|---|
| **[Klook](https://www.klook.com/en-PH/activity/116888-pottery-workshop-wabi-sabi/)** | Discovery and booking of Philippine leisure experiences, including pottery | Established booking flow, distribution and activity catalog | A tighter QC inventory window, exact cutoff and released-seat count that are actually more useful than a broad experience list |
| **[ClassPass](https://classpass.com/partners/faqs)** | Marketplace for fitness/wellness class and appointment availability, including underused capacity | Established demand, provider integrations and **contractual payout floors** | A straightforward peso price and **standalone workshop booking** without customers needing subscription credits; persuade the studio its incremental payout is competitive |
| **[Fresha](https://www.fresha.com/pricing)** | Salon and appointment scheduling, with marketplace discovery | Operational tools and an existing way to attract new clients; marketplace fees differ from per-booking fees | In our narrowed workshop niche, avoid competing as a full salon-management system; only an adjacent direct threat from the original broader GC1 scope |

**The hardest benchmark is ClassPass:** it already markets excess capacity. Its partner information describes minimum payouts and inventory management. We should borrow the discipline of protecting direct demand rather than presenting “we sell empty seats” as a unique breakthrough.

### 3.2 Indirect competitors — ways to solve the outing without SlotDrop

| Alternative | Why it is a substitute | Implication |
|---|---|---|
| **Direct studio websites / booking** — [Laro](https://laro-ceramics.com/products/mug-making-class-manila), [Bumi & Ashe](https://bumiandashe.com/products/mug-making-workshop-1), [Tahanan](https://tahananpottery.ph/) | Existing studio relationship, up-to-date classes, occasional friend promotions; the studio keeps the full direct sale | We must supply buyers who would otherwise miss the class. Redirecting a full-price buyer to our discounted link hurts the studio. |
| **Other social activities** — cafés, cinema, malls and cheaper group plans | Compete for the same after-work or weekend time and leisure spending | Inclusions, convenience and the total cost of going out matter more than the discount percentage alone. |

### 3.3 Auxiliary discovery services and comparable models

**[Google Maps](https://maps.google.com/)** and social posts on Instagram/Facebook help customers discover studios and are more realistically **acquisition channels or discovery substitutes**, not operators of the same completed checkout. A studio's social page may nevertheless divert a customer directly to its own booking link. **[HotelTonight](https://www.hoteltonight.com/faq)** is a useful **last-minute surplus-inventory benchmark from hotels**, *not a local workshop competitor*; hotel rooms do not share workshops' material costs or preparation deadlines.

**Where we could genuinely differentiate:** localized supply **confirmed by the studio**, truthful seats and cutoffs, a quantity-aware final peso quote, and an agreed payout the studio is willing to accept. We cannot yet claim better prices, real availability or superior conversion against these players. Full source notes are in the [research appendix](reference/business-research-appendix.md).

## 4. Monetization and unit economics

**Who pays?** We model **a 10% commission charged to the studio from each confirmed booking**, not an extra checkout fee. The amount is rounded per seat in centavos and stored with the booking, so the provider payout and saved receipt can be audited. **Paid placement** was mentioned in the original GC1 canvas but is deferred: selling exposure before we have real demand would be premature.

**Why two revenue-enabling features?** The first is *availability of released seats*—without bookable supply, neither side earns anything. The second is *optional buddy pricing* for two or more people in the same booking, which might increase attendance but can also discount buyers who would have paid full price. The server, not the browser, chooses the tier.

### 4.1 Two revenue-supporting features

Both examples use [the seeded Laro Ceramics mug-making session](../db/seed.sql). Laro listed the class at **₱3,000**. In our demo we released **four seats** at **₱2,700 standard** or **₱2,565 per person** for buddies, with a 10% commission.

| Booking | Customer total | SlotDrop fee | Studio payout before attendance costs |
|---|---:|---:|---:|
| One standard seat | ₱2,700 | ₱270 | ₱2,430 |
| Two standard seats | ₱5,400 | ₱540 | ₱4,860 |
| Two buddy seats | ₱5,130 | ₱513 | ₱4,617 |

#### Feature A. Released-seat availability

When a studio sells an otherwise empty seat at ₱2,700, SlotDrop earns ₱270 and the studio gets ₱2,430 before the extra cost of serving that guest. If the customer would have paid the studio ₱3,000 directly, the same sale cuts the studio’s proceeds by ₱570 before channel cost differences.

We’d ask the studio to release a few seats once direct bookings slow down, while there’s still time to prepare. We’d use its sales records to pick sessions. In the demo, if a pair books two of four released seats, the next group of three gets a 409 and the booking is declined.

The `slots` table holds the allocation and cutoff. [Discovery](../server/services/discovery.js) lists the active releases. The [booking service](../server/services/bookings.js) locks the slot and counts confirmed seats again before saving.

#### Feature B. Buddy pricing

Two friends pay ₱5,130 together. Whether it’s worth offering depends on who would have booked at the standard price.

| Without the buddy price | Change in customer spend | Change in SlotDrop fee | Change in studio payout |
|---|---:|---:|---:|
| Both friends would pay standard, ₱5,400 total | −₱270 | −₱27 | −₱243 |
| One friend would pay standard, ₱2,700, and the other seat would stay empty | +₱2,430 | +₱243 | +₱2,187 |

For SlotDrop, nine buddy bookings that replace two standard seats cost ₱243 in fees. One buddy booking that adds a second attendee makes that back, so the break-even point is **1 in 10**. At an assumed **₱500** cost for the extra attendee, the studio gains ₱1,687 when a buddy booking adds a guest and loses ₱243 when both would have come anyway. The studio breaks even at **12.6%** (₱243 ÷ [₱243 + ₱1,687]), about 13 in 100.

We’d test the buddy rate on some comparable classes and keep the standard price on the others. We’d count total paid seats across SlotDrop and direct sales, then compare what the studio earned after costs.

The optional rate lives in `slots.buddy_price_centavos`. The server uses the buddy rate for groups of two or more when the rate is set. It rounds the fee per seat in centavos, then multiplies by the number of seats. The [worked-number test](../tests/business-worked-numbers.test.js) checks the saved amounts and the Owner figures.


### 4.2 Margin logic, not just gross bookings

A standard ₱2,700 seat yields **₱270** in gross fees and **₱2,430** in studio proceeds *before* materials and attendance costs. At a hypothetical **₱500 incremental studio cost**, that seat adds **₱1,930** if it would otherwise go empty. But if the exact same customer would have paid the published **₱3,000** directly, the studio gives up **₱570** of gross proceeds before channel cost differences.

**The buddy decision changes with the counterfactual:** if two customers would already have paid standard, the studio loses **₱243** in payout. If the discount genuinely adds a second person, its added payout is **₱2,187** and added contribution after the assumed ₱500 cost is **₱1,687**. The modeled break-even share of genuinely incremental buddy bookings is about **12.6%**; our team has not measured that share.

### 4.3 Is 10% enough for SlotDrop?

The example pilot later in this document assumes **28 bookings** producing **₱8,532** in gross fees. That is around **₱305 gross fee per booking**. With **₱50 in support per booking** and **₱6,000 in outreach/operating spend**, the surplus is just **₱1,132** before founder time, taxes, future payment processing, refunds or chargebacks. We could lose money if paid acquisition costs slightly more or if we fail to fill the predicted seats.

**Decision:** keep 10% as a transparent *pilot hypothesis*. Do not announce it as proven optimal, or charge an unapproved supplier rate. We would negotiate a minimum payout with the pilot studio, compare against its direct-price promotions, and revisit the fee if realistic costs show the platform or the studio cannot sustain it.

## 5. From GC1 into the working GC2 platform

The original roadmap had the right core journey: post a slot, discover it, book it, confirm it. GC2 now carries that **Browse → Select → Confirm → Save** sequence through actual server routes and a saved PostgreSQL booking, with Home and Detail before checkout and Owner afterward.

The important improvement is that the business rules are backed by the same saved data from Browse through Owner. A listing is not just a picture or a hardcoded discount. The following tables trace the original idea, its feedback, what the team implemented, and how it is enforced.

### 5.1 What changed between GC1 and GC2

These are the parts of GC1 we carried into the build, along with the decisions we made after feedback.

| From GC1 | What we wrote in GC1 | Where it shows up in GC2 |
|---|---|---|
| Target market | “a wide range of people who are looking for last-minute appointment availability … people in need of a quick and cheap service that they can book on a last minute basis” (p. 1) | We narrowed this to young professionals near Katipunan and UP Village who make some plans within three days. Browse puts the area, start time and booking deadline on one card. Selection gives the party total before Checkout asks for contact details. Students are a secondary group. |
| Problem statement | “it can be hard for one to get an appointment soon, especially with popular service providers whose next available date is weeks or months away” (p. 1). For the studio, “a lost appointment is still lost money” (p. 2). | A visitor can check multiple workshops in one Browse list. Owner can release a few seats, set a cutoff or pause sales for a specific session. |
| Value proposition | “Empty slot, better price.” (p. 1). Providers “profit off of empty slots rather than making no money at all” (p. 2). | Home says “A free evening. An open seat.” The session card gives the price, seats left and booking cutoff. Detail explains what the workshop includes, and Selection quotes the total for the actual group size. |
| Monetization | The feedback notes that GC1 put “a commission and featured placements” in the canvas without specifying the rate. | We model a 10% commission. [`priceQuote()`](../server/services/pricing.js) calculates it for both the quote and the booking. The booking saves the accepted price, fee and studio payout. Paid placements are deferred. |
| Core features | Phase 1 listed Auth & Roles, Slot Manager, Marketplace Feed, Simulated Booking and User Schedules (pp. 6–7). | Owner publishes offers, Browse lists them, and Confirmation reads the booking that Checkout saved. |

| GC1 feature | GC2 decision |
|---|---|
| Slot Manager | “Stores service, date/time, location, original price, discounted price, and availability.” Owner creates a dated offer with prices, a cutoff and released seats. The edit route updates the cutoff, offer prices, capacity and sale status. |
| Marketplace Feed and search | “Displays only upcoming slots that are still available.” The bookable list follows that rule for dated offers. Browse shows six workshops per page and lists each workshop’s upcoming dates together. It keeps closed dates in the archive. Three undated sample bookings have their own section so the instructor can test after the dated offers expire. |
| Simulated Booking | “Checks availability, marks the slot as booked, and creates a booking record.” We added Detail after the GC1 feedback, followed by quantity and quote on Selection, simulated payment on Checkout, and a saved receipt on Confirmation. The server checks stock and price when the booking is saved. The five-minute hold from the wireframe was dropped. |
| User Schedules and Provider Analytics | Owner shows saved bookings and five metrics. Personal schedules and role-specific reports are future work. |
| Auth & Roles, real payments, integrations and paid placements | Outside the scope of the GC2 demo. |

#### The instructor's feedback and what we changed

| GC1 feedback | What we changed | What we’d check in a pilot |
|---|---|---|
| The target buyer was vague, and we had no estimate of vacant seats. | Defined a [proposed QC customer segment](#customer-and-supply) and a three-day discovery window. | Interview customers and ask one studio for four weeks of capacity and sales. |
| We referred to unnamed “booking giants.” | Compared Klook, ClassPass, studio websites and Fresha in [Competitors](#3-competitors-direct-indirect-and-auxiliary). | Check actual local listings and ask what would make customers and studios switch. |
| We assumed popular studios would have openings to list. | The app offers only seats a studio has released from a class going ahead. | Confirm recurring spare seats and agree on the allocation with the studio. |
| Studios may resist discounts, and existing customers may move to cheaper offers. | Owners set prices and can pause sales. The server takes confirmed bookings out of the available allocation. | Agree on a minimum payout and compare total sales across SlotDrop and the studio’s own channels. |
| Commission, app features and stack needed specifics. | Set a 10% studio-paid fee, saved the accepted price and fee with each receipt, and listed the stack in the README. | Check supplier costs, acquisition costs and terms with a pilot studio. |
| The data design duplicated roles and the customer journey stopped too early. | Used linked PostgreSQL tables, added Detail and connected Checkout, Confirmation and Owner to the same saved booking. | Work out how customer and studio accounts would fit the existing flow. |

### 5.2 Customer journey and conversion measures

The last column is what we’d measure in a pilot. GC2 records bookings and Owner metrics.

| Stage | Screen | What we put there and why | Endpoint | What we’d measure |
|---|---|---|---|---|
| Browse | Home | Up to three bookable offers give someone with a free afternoon a quick sense of what’s available. Practice offers are labeled. “Browse all sessions” opens the full list. | `GET /api/slots` | Home visits that open Browse or Detail ÷ Home visits |
| Browse | Browse | Each workshop lists its bookable dates with their own price, seats and cutoff. Search accepts studio or activity names, the activity buttons narrow the list, and six workshops per page keep it short. | `GET /api/slots?view=workshops&q=…&type=…&page=…&limit=6` | Browse visits that open a bookable session’s Detail page ÷ Browse visits |
| Select | Detail | A labelled list puts inclusions, preparation, location and the deadline where a customer can scan them before choosing seats. | `GET /api/slots/:id` | Detail visits that continue to Selection ÷ Detail visits |
| Select | Selection | A number field lets the customer enter the group size directly. The server returns a new price as it changes, so a pair can see what the buddy rate does to the total. | `GET /api/slots/:id`, `GET /api/pricing/quote` | Selection visits that open Checkout ÷ Selection visits |
| Confirm | Checkout | Labelled contact fields show which entry needs fixing. A dropdown keeps the two simulated payment options in one place. The checkbox sits next to the quote so the customer can see the exact amount they’re accepting. | `GET /api/slots/:id`, `GET /api/pricing/quote`, `POST /api/bookings` | Confirmed saves ÷ unique submitted request IDs |
| Save | Confirmation | The page fetches the saved booking by its reference. Refreshing it shows the accepted seat count, price and payment choice again. The reference also lets Owner find the same booking. | `GET /api/bookings/:id` | Saved bookings and average booking value |

The studio uses Owner to edit offers and check sales. The bookings table and five metrics come from `GET /api/bookings` and `GET /api/metrics`.

### 5.3 Rules that make the offer credible

Scheduled offers appear within 72 hours of their start and close at the studio’s cutoff. **Closed sessions** shows up to 16 recently closed offers. The three practice offers start with 20 simulated seats each. They stay bookable as long as the activity is active, sales are open and seats remain, so the instructor can still test the flow after the dated offers expire.

| Rule, in the owner’s words | Where it’s enforced | What the customer sees |
|---|---|---|
| “Only offer seats we’ve released for a class that’s going ahead.” | `createOffer()` requires the class to be marked as running. `listSlots()` filters for active, open, confirmed sessions with seats left. | Browse shows eligible sessions with their remaining allocation. |
| “Show the next three days. Close each listing at that studio’s cutoff.” | `listSlots()` and `checkBookable()` check the start and cutoff. `createOffer()` and `editOffer()` validate the deadline. | Dated cards show the deadline. Recent offers that were still listed appear in Closed sessions. An attempt to quote or book after cutoff returns 409. |
| “Set the regular price above the offer price. The buddy price goes lower if we offer it.” | `createOffer()`, `editOffer()` and the price constraints in [`db/schema.sql`](../db/schema.sql). | The card shows the prices side by side and only shows a buddy price when one is set. |
| “Give the buddy rate to two or more people in the same booking.” | `priceQuote()` selects the tier. `createBooking()` saves it in `bookings.pricing_type`. | Selection displays “Buddy price applied” for a qualifying group. |
| “Never book more seats than we’ve set aside.” | `createBooking()` locks the `slots` row, then calls `checkBookable()` before the insert. `editOffer()` guards against lowering capacity below sold seats. | A request for three when only two remain is refused with 409 and creates no booking. |
| “Ask the customer again if their total changes.” | `createBooking()` recomputes the price with `priceQuote()` and compares it with `expectedTotalCentavos`. | Checkout asks the customer to accept a fresh total after `409 PRICE_CHANGED`. |
| “A retry should give the customer their original receipt.” | `bookings.request_id` is unique. `createBooking()` replays an identical request and rejects a conflicting reuse. | Checkout keeps the original request if the save result is uncertain. A matching retry returns the same reference. |
| “A price edit should leave earlier receipts alone.” | Booking rows store the accepted prices, fee and payout. `findReceipt()` reads those values by ID. | Confirmation keeps the original total. |
| “We can pause new sales for a session with bookings.” | `editOffer()` changes the offer status and refuses cancellation if it has confirmed bookings. | The paused offer leaves Browse. Existing receipts stay available. |
| “Take 10% out of the studio’s share.” | `COMMISSION_BASIS_POINTS` feeds `priceQuote()`. The accepted rate and amounts are saved with the booking. | The customer pays the quoted total. Owner can see the fee and payout separately. |

### 5.4 How the studio uses Owner numbers

Here’s what [`GET /api/metrics`](../server/repositories/owner.js) reports after two bookings in the same four-seat release. A pair takes two buddy seats first, then someone books one standard seat.

| Owner number | Two buddy seats | Plus one standard seat | What we’d do with it |
|---|---:|---:|---|
| Confirmed bookings | 1 | 2 | Few bookings despite steady availability? Check where visitors drop out before asking the studio for more seats. |
| Platform revenue | ₱513 | ₱783 = ₱513 + ₱270 | Compare fees with what we spent getting and supporting those bookings. Hold paid acquisition if those costs eat up the fee. |
| Average booking value | ₱5,130 | ₱3,915 = (₱5,130 + ₱2,700) ÷ 2 | More bookings can bring in more fees even when the average falls. Check whether larger groups bring extra attendees before expanding buddy pricing. |
| Top-selling activity by confirmed seats | Mug-making + painting, 2 | Mug-making + painting, 3 | If mug-making leads across several releases, ask that studio for another release and compare how many of those seats sell. |
| Nearly full sessions | 0, with 2 of 4 left | 1, with 1 of 4 left | Ask if the studio has another seat it can set aside before cutoff. Increase the allocation only after it confirms. |

Nearly full counts eligible releases with **at least one and at most 25% of released seats left**. A sold-out session leaves that count. Its confirmed bookings still contribute to the other metrics.

The separate utilization figure shows confirmed seats as a share of currently open releases. It updates when a session crosses its cutoff. Use **Refresh data** to get newer bookings or inventory.

## 6. Product architecture, technology and feature roadmap

### 6.1 End-to-end architecture

`Browser (Home · Browse · Detail · Selection · Checkout · Confirmation · Owner)
       ↓ HTTP JSON (fetch)
Express 5 routes (validate requests and return statuses)
       ↓
Services: eligibility · 72-hour window · priceQuote() · createBooking()
       ↓
Repositories: parameterized SQL and row-locked transactions
       ↓
Neon PostgreSQL: providers → services → slots → bookings
                          ↘ provider_applications
       ↑
Saved receipt read by ID → Confirmation and Owner's metrics`

**Customer interface:** HTML/CSS/JavaScript pages with loading, empty and error states. **Back end:** Node.js 22/Express 5; the server rechecks the chosen slot, quantity, cutoff, tier, customer input and accepted total. **Database:** PostgreSQL 16 in CI, five entity-based tables; dates, offer allocations and saved money snapshots are stored in the database rather than browser storage. **Deployment:** Render with persistent Neon storage, GitHub Actions checks and Postman/Newman evidence; local PGlite for the demo/tests.

A new booking locks its slot row and recalculates availability and commission **before** inserting one confirmed booking. A repeated identical request ID returns the same receipt; a changed price or insufficient seats produces HTTP 409. The confirmation page fetches the saved booking by ID, and Owner reads the same persisted transactions.

**Integrations today:** The app runs with its own APIs and database. GC2 **does not** process real payment cards, sync an actual studio calendar, or provide production authentication. **Phase 2 candidates:** React, authenticated customer/provider roles, PayMongo or Xendit, calendar APIs, notifications and provider verification. They are options, not installed integrations or signed contracts.

[Detailed system diagram/data flow](system.md) · [API route contract](routes.md) · [Database schema](schema.md) · [Technology versions](../README.md#stack)

### 6.2 Core platform features linked to a business outcome

| Feature in GC2 | Customer or provider job | Business implication |
|---|---|---|
| Source-backed workshop cards and searchable Browse | Find an activity, studio and eligible dates | Discovery-to-Detail conversion (to measure in a real pilot) |
| Session Detail and per-workshop cutoff | See materials, place, time and whether booking is still feasible | Fewer failed checkouts and surprises |
| Party-aware server quote and buddy rate | Know **total** spend for two or more friends | Test added attendance rather than merely discounting |
| Transactional booking and stable receipt ID | Prevent double sale, stale accepted price and repeated charge requests | Trust, stock integrity and recoverable orders |
| Owner edit/pause tools and saved-booking metrics | Control released capacity and see actual platform activity | Measure fee revenue, popular sessions and whether to release more seats |
| Separate **undated practice offers** | Permit the instructor to test after all scheduled samples expire | **Course-only exception**; not an actual commercial 72-hour offer |

### 6.3 Two-phase roadmap

| Scope | Feature choice | Reason |
|---|---|---|
| **Phase 1 / GC2 (built)** | Home, Browse/filters, Detail, Selection, simulated Checkout, saved Confirmation, offer management, transaction-safe seats, tiered pricing and Owner metrics | Proves the proposed core business action can happen end to end |
| **Phase 1 / reliability (built)** | Cutoffs, server total validation, idempotent retries, responsive layouts, API tests and proof of persisted receipt | Makes the MVP credible; a “discounted seat” has no value if it cannot be booked reliably |
| **Phase 2 / Final Project (proposed)** | React frontend, secure customer/provider/admin accounts, real payments, cancellation/refund rules, reconciliation with actual provider calendars, notifications, improved analytics | Needed to support real partners and money, not required to demonstrate GC2 |
| **Later commercial experiments (not yet built)** | Automated price-drop schedules, customer personalization, paid placements, multi-city supplier growth | Launch only after studying supplier inventory, conversion and unit economics |

**Roadmap correction after GC1 feedback:** the original listed customer/provider login in MVP despite the assignment permitting no login, and described a five-minute hold. GC2 deliberately omits both. A quote is **not a reservation**; the confirmed database write is the booking point.



## 7. Pilot plan, realistic economics and decision criteria

Would a studio earn more by using SlotDrop? We’d start with one pottery studio and track what happens to bookings and payout across its sales channels.

### Customer and supply

We’d start by interviewing working adults **22–35** near Katipunan, UP Village and Teachers Village who sometimes make plans within three days and would consider a **₱2,500–₱3,000** workshop. A gross monthly income of **₱35,000–₱80,000** is a proposed screening range. We’d interview students separately to learn what fits their budget.

The first thing we’d ask a studio for is four weeks of capacity, attendance and cancellations. We need to know which classes are already confirmed and how many seats are still open before the preparation deadline.

### Studio research

We looked at Laro Ceramics, Marz Today, Metals & Gems, Bumi & Ashe, Tahanan Pottery, Sip & Gogh and AMT Ceramics. Laro is close to our pilot area and listed a **₱3,000** mug-making class. Tahanan listed recurring weekend classes. We’d ask each about its exact branch, next session, preparation lead time and seats it could set aside. [Studio research and sources](reference/business-research-appendix.md#a-studios-and-why-each-might-fit)

### Provider economics and business-model benchmarks

For the modeled costs below, we used Laro’s **₱3,000** listed price and assumed **₱500 per extra guest** for clay, finishing, firing and handling. The studio would need to supply its actual costs.

| One seat | Customer pays | Studio receives after our fee | Studio contribution after assumed ₱500 extra cost |
|---|---:|---:|---:|
| Direct at published reference price | ₱3,000 | ₱3,000 | **₱2,500** |
| SlotDrop standard | ₱2,700 | ₱2,430 | **₱1,930** |
| SlotDrop buddy, per attendee | ₱2,565 | ₱2,308.50 | **₱1,808.50** |

A ₱2,700 sale adds **₱1,930** before fixed class costs if the chair would have stayed empty. If the same buyer would have booked directly for ₱3,000, the studio earns **₱570 less**.

In a four-week example, the studio releases four seats in each of 16 classes that are already going ahead. If half of those 64 seats sell, and we sell 24 at standard and eight as buddy seats in four pairs, that gives us **32 seats and 28 bookings**.

| Hypothetical four-week outcome | Modeled amount |
|---|---:|
| Customer booking value | **₱85,320** |
| SlotDrop gross commission | **₱8,532** |
| Studio payout before added-attendee costs | **₱76,788** |
| Studio added-attendee costs, 32 × ₱500 | **(₱16,000)** |
| Less hypothetical eight displaced direct buyers × ₱2,500, and ₱2,500 studio coordination | **(₱22,500)** |
| **Studio incremental contribution versus no SlotDrop** | **₱38,288** |
| **SlotDrop pilot surplus** after 28 × ₱50 support and ₱6,000 outreach/ops | **₱1,132** |

These figures come from our assumptions about fill, sales mix, direct bookings and operating costs. At the same mix, SlotDrop would need to sell about **27 of 64 released seats** to cover the assumed ₱6,000 budget, after ₱50 of support per booking. Founder labor, taxes, real payment costs and refunds sit outside that calculation. [Detailed math and cost sensitivity](reference/business-research-appendix.md#c-detailed-per-seat-and-pilot-calculations)

ClassPass uses credits and agreed partner payouts. Fresha listed a **20% one-time marketplace fee for new customers**, with a minimum, alongside separate software and payment terms. SlotDrop’s **10% on every booking** could cost a studio more if many customers return. Laro also advertised friend discounts of up to ₱500 per person. We’d compare both the studio payout and what the customer actually pays before picking a pilot offer. [Business-model comparison](reference/business-research-appendix.md#d-competing-marketplace-business-models)

### Pilot and risks

| Step | What we'd verify | Decision |
|---|---|---|
| Before launch | Four weeks of studio sales and capacity, actual costs, preparation cutoffs, a minimum net payout and a set-aside allocation. | Proceed if the studio has enough spare seats before cutoff. |
| Weeks 1–2 | Start with the standard offer. Check SlotDrop bookings against the studio calendar and count direct and SlotDrop attendance together. | Pause the release if the calendars disagree. |
| Weeks 3–4 | Test the buddy rate on comparable sessions. Track how many extra visitors came, how many would have paid full price and what serving them cost. | Keep it where it improves the studio’s contribution. |
| End of week 4 | Compare incremental studio earnings and SlotDrop fees with the actual costs of getting and supporting bookings. | Expand if both sides gained. |

Our main risks are listing a seat the studio already sold, asking a studio to discount below its minimum, and moving full-price buyers onto a cheaper offer. For a pilot we’d set aside seats with the studio, agree on a payout floor and compare total sales with the studio’s usual results. Calendar reconciliation would be manual.

### Studio applications

A studio can send an application and look up its pending status. Before publishing a real studio page, we’d verify who submitted it, confirm permission and agree on commercial terms. [Studio application contract](routes.md#studio-research-and-applications)


## 8. Wireframes / mockups and where to see the real screens

These four layouts fill the specific gap in the original GC1 mockups: a **service Detail page** and an explicit **admin/vendor view**. They describe intended screen structure; the links show the **current customer and Owner implementation** (not a working administrative permissions system).

| Required screen | Key layout and why | Implemented view |
|---|---|---|
| **Home** | Tagline → “Explore workshops” primary action → featured cards with a date, area and seat price. Don't force people to register before seeing supply. | [Home](https://slotdrop-gc2-group-zx8j.onrender.com/) |
| **Detail** | Photo and studio name → time, location, inclusions, preparation, cutoff, available seats and tier prices → “Choose seats.” A real-time allocation is more useful than a generic marketing page. | [Browse](https://slotdrop-gc2-group-zx8j.onrender.com/browse.html) → open a specific session |
| **Booking / Checkout** | Selected session + group size + server total → fictional guest fields and simulated payment choice → consent to the amount → saved confirmation. There is **no fake five-minute hold**. | Browse → Detail → Selection → Checkout |
| **Vendor / future admin** | Offer capacity, time, deadline, status and prices → bookings, platform fees and five metrics. Future admin would add verified accounts, dispute resolution and audit tools; these are **not in GC2**. | [Owner](https://slotdrop-gc2-group-zx8j.onrender.com/owner.html) |

**Wireframe structure (for the revised GC1 text proposal):**

`HOME:     [Brand] [Explore] [For studios] → [Promise] [CTA] → [Featured]
DETAIL:   [Studio/photo] → [Date·Cutoff·Seats] → [Price/inclusions] → [Choose]
CHECKOUT: [Chosen activity] → [Quantity·Total] → [Contact·Mock pay] → [Confirm]
OWNER:    [Offer editor] → [Released inventory] → [Bookings] → [Five metrics]
ADMIN*:   [Provider verification] → [Disputes] → [Audit] (*Phase 2 only)`

The [revised GC1 proposal](reference/gc1-revised-business-proposal.md#7-wireframes--screen-mockups) contains the fuller four-screen sketches. The original GC1 included marketplace, provider and confirmation wireframes; we do not claim the future admin panel already exists.

## 9. What is demonstrated, what is still unknown

| Demonstrated by the GC2 code and evidence | Must be shown in a real-world test |
|---|---|
| JSON discovery from a database; actual server price tiers; save and reload one simulated booking; preserved receipts, stock/cutoff checks and owner metrics | Provider-approved allocation that matches its own calendar; *real* bookings and reconciled attendance |
| Named studio references and public list prices; simulated allocations and 10% fee math; user-facing quote and receipt | Willingness to release seats, agreed payout floor, actual costs of serving a guest, customer willingness to pay |
| Technical ability to count confirmed bookings, fees, AOV, top activity and near-full releases | Incremental customer acquisition, conversion, deal cannibalization, refunds, payment failure rate and repeat usage |

**Bottom line:** SlotDrop works as a course MVP. The business only earns the right to expand if an actual studio makes **more incremental contribution**, the platform has **positive net unit economics**, and customers can reliably book a real slot before cutoff. We should be willing to narrow the activity, revisit the fee or stop if any of those tests fails.

### References and audit trail

- **Original GC1:** Group 3's initial “SlotDrop Business Proposal” and instructor's written GC1 feedback were used to correct the missing monetization/stack section, vague buyer profile, unnamed competitors, ghost-slot risk and entity model. They remain **historical source documents**, not rewritten past submissions.
- [**Revised GC1 proposal, structured to cover the full GC1 brief**](reference/gc1-revised-business-proposal.md)
- [Studio research, competitor source pages, and detailed four-week pilot assumptions](reference/business-research-appendix.md)
- [System and trace](system.md) · [Schema](schema.md) · [Routes](routes.md) · [Group challenges and test evidence](challenges.md) · [Measured GC2 baseline](baseline.md)
- [Two-page GC2 business summary](SlotDrop_GC2_Summary.pdf) — a different deliverable from the larger GC1 proposal.
