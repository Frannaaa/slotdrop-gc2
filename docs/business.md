# SlotDrop business case

**Empty slot, better price.** We started GC1 with an idea for last-minute appointments. In GC2, we built a smaller version around creative workshops in Quezon City. Say you and a friend have a free Saturday near Katipunan. You can check which classes still have two released seats, when booking closes, and what both of you would pay. The studio decides how many seats to list in a class that will run anyway. SlotDrop models a **10% commission on each confirmed booking**, deducted from the studio’s share.

We’d start with one pottery studio and a small release of seats it expects to go unsold. The [four-week pilot plan](#pilot-and-risks) explains how we’d check that. Studio details and published prices come from [public research](#studio-research). The course demo uses simulated dates, seat releases, offers, bookings and payments.

## 4.1 GC1 traceability

The quotes below come from our GC1 proposal and the instructor’s feedback.

| From GC1 | What we wrote in GC1 | Where it shows up in GC2 |
|---|---|---|
| Target market | “a wide range of people who are looking for last-minute appointment availability … people in need of a quick and cheap service that they can book on a last minute basis” (p. 1) | We narrowed this to young professionals near Katipunan and UP Village who make some plans within three days. Browse puts the area, start time and booking deadline on one card. Selection gives the party total before Checkout asks for contact details. Students are a secondary group. |
| Problem statement | “it can be hard for one to get an appointment soon, especially with popular service providers whose next available date is weeks or months away” (p. 1). For the studio, “a lost appointment is still lost money” (p. 2). | A visitor can check multiple workshops in one Browse list. Owner can release a few seats, set a cutoff or pause sales for a specific session. |
| Value proposition | “Empty slot, better price.” (p. 1). Providers “profit off of empty slots rather than making no money at all” (p. 2). | Home says “A free evening. An open seat.” The session card gives the price, seats left and booking cutoff. Detail explains what the workshop includes, and Selection quotes the total for the actual group size. |
| Monetization | The feedback notes that GC1 put “a commission and featured placements” in the canvas without specifying the rate. | We model a 10% commission. [`priceQuote()`](../server/services/pricing.js) calculates it for both the quote and the booking. The booking saves the accepted price, fee and studio payout. Paid placements are deferred. |
| Core features | Phase 1 listed Auth & Roles, Slot Manager, Marketplace Feed, Simulated Booking and User Schedules (pp. 6–7). | Owner publishes offers, Browse reads them, and Checkout saves bookings that Confirmation reads by ID. The table below shows what remains for the Final Project. |

| GC1 feature | GC2 decision |
|---|---|
| Slot Manager | “Stores service, date/time, location, original price, discounted price, and availability.” Owner creates a dated offer with prices, a cutoff and released seats. The edit route updates the cutoff, offer prices, capacity and sale status. |
| Marketplace Feed and search | “Displays only upcoming slots that are still available.” The bookable list follows that rule for dated offers. Browse adds search, category buttons, six offers per page and a separate Closed sessions section. Two undated practice offers let the instructor test bookings after the dated samples expire. |
| Simulated Booking | “Checks availability, marks the slot as booked, and creates a booking record.” We added Detail after the GC1 feedback, followed by quantity and quote on Selection, simulated payment on Checkout, and a saved receipt on Confirmation. The server checks stock and price when the booking is saved. The five-minute hold from the wireframe was dropped. |
| User Schedules and Provider Analytics | Partial. Owner can see saved bookings and five metrics. Personal schedules and role-specific reporting need accounts. |
| Auth & Roles, real payments, integrations and paid placements | Deferred to the Final Project. The GC2 demo uses one set of linked provider, service, slot and booking tables. |

### Instructor's GC1 feedback: response and remaining proof

| Feedback raised in GC1 | What changed in GC2 | Still requires real-world evidence |
|---|---|---|
| Vague age/income/area and no measured vacant-seat frequency | Defined a **proposed** QC pilot segment (see Customer and supply below) and limited booking discovery | Customer interviews and a studio's four weeks of actual capacity/sales |
| “Established booking giants” unnamed | Compared **Klook**, ClassPass, studio-direct websites and Fresha, and distinguished direct, indirect and auxiliary alternatives in [Competitors](#competitors) | Verify active local listings and why customers/providers would actually switch |
| Overpromised openings at popular providers | Offers only an allocation a studio deliberately releases from a class going ahead | Written partner agreement and realistic unfilled-seat data |
| Ghost slots, discount-resistant studios and deal-only customers | Server capacity checks, Owner pause/resume and prices; proposed ring-fenced inventory, minimum net payout and cannibalization test | The latter three safeguards are **pilot arrangements**, not implemented integrations or proven results |
| Commission, platform features and stack missing | Modeled **10% studio-paid commission**, persisted quotes and receipts, clear built/deferred features and stack in README | Real supplier unit costs, acquisition costs and agreed commercial terms |
| Duplicate role-based stores and incomplete user journey | Entity-oriented PostgreSQL, detailed receipt/data flow, Detail page and Owner metrics | Login/admin separation, real cancellations and external calendar sync are still deferred |

## 4.2 Funnel map

The rates are what we’d measure in a pilot. GC2 records bookings and Owner metrics.

| Stage | Screen | What we put there and why | Endpoint | What we’d measure |
|---|---|---|---|---|
| Browse | Home | Up to three bookable offers give someone with a free afternoon a quick sense of what’s available. Practice offers are labeled. “Browse all sessions” opens the full list. | `GET /api/slots` | Home visits that open Browse or Detail ÷ Home visits |
| Browse | Browse | A bookable card keeps the studio, time, cutoff, seats left and price together so someone comparing offers on a phone can scan them at once. Search takes studio or activity names, category buttons narrow the list in one tap, and six cards per page keep the list short. | `GET /api/slots?q=…&category=…&page=…&limit=6` | Browse visits that open a bookable session’s Detail page ÷ Browse visits |
| Select | Detail | A labelled list puts inclusions, preparation, location and the deadline where a customer can scan them before choosing seats. | `GET /api/slots/:id` | Detail visits that continue to Selection ÷ Detail visits |
| Select | Selection | A number field lets the customer enter the group size directly. The server returns a new price as it changes, so a pair can see what the buddy rate does to the total. | `GET /api/slots/:id`, `GET /api/pricing/quote` | Selection visits that open Checkout ÷ Selection visits |
| Confirm | Checkout | Labelled contact fields show validation errors. A dropdown offers the two simulated payment choices. The agreement checkbox sits with the quoted amount so the customer can see what they’re accepting. | `GET /api/slots/:id`, `GET /api/pricing/quote`, `POST /api/bookings` | Confirmed saves ÷ unique submitted request IDs |
| Save | Confirmation | The page fetches the saved booking by its reference. Refreshing it shows the accepted seat count, price and payment choice again. The reference also lets Owner find the same booking. | `GET /api/bookings/:id` | Saved bookings and average booking value |

Owner sits beside the funnel. The release form changes future availability. The bookings table and five metrics come from saved data via `GET /api/bookings` and `GET /api/metrics`.

## 4.3 Business rules

The 72-hour window and booking cutoffs apply to scheduled offers. Closed sessions shows up to 16 recently expired offers. Two practice offers show “Demo only · No booking cutoff” so the instructor can test price, seat limits and receipt persistence after the scheduled samples run out. Each starts with 20 simulated seats. A practice offer remains bookable while its activity is active, sales are open and seats remain.

| Rule, in the owner’s words | Where it’s enforced | What the customer sees |
|---|---|---|
| “Only offer seats we’ve released for a class that’s going ahead.” | `createOffer()` requires the class to be marked as running. `listSlots()` filters for active, open, confirmed sessions with seats left. | Browse shows eligible sessions with their remaining allocation. |
| “Show the next three days. Close each listing at that studio’s cutoff.” | `listSlots()` and `checkBookable()` check the start and cutoff. `createOffer()` and `editOffer()` check the deadline when the offer is saved. | Dated bookable cards show the deadline. After the cutoff, recent offers move to Closed sessions and show “Booking closed” or “Event ended.” A new quote or booking after the cutoff returns 409. |
| “Set the regular price above the offer price. The buddy price goes lower if we offer it.” | `createOffer()`, `editOffer()` and the price constraints in [`db/schema.sql`](../db/schema.sql). | The card shows the prices side by side and only shows a buddy price when one is set. |
| “Give the buddy rate to two or more people in the same booking.” | `priceQuote()` selects the tier. `createBooking()` saves it in `bookings.pricing_type`. | Selection displays “Buddy price applied” for a qualifying group. |
| “Never book more seats than we’ve set aside.” | `createBooking()` locks the `slots` row, then calls `checkBookable()` before the insert. `editOffer()` guards against lowering capacity below sold seats. | A request for three when only two remain is refused with 409 and creates no booking. |
| “Ask the customer again if their total changes.” | `bookingRequest()` rejects unsupported inputs. `createBooking()` recomputes the price with `priceQuote()` and compares it with `expectedTotalCentavos`. | Checkout shows a fresh quote after `409 PRICE_CHANGED` and asks for acceptance. |
| “A retry should give the customer their original receipt.” | `bookings.request_id` is unique. `createBooking()` replays an identical request and rejects a conflicting reuse. | Checkout keeps the original request if the save result is uncertain. A matching retry returns the same reference. |
| “A price edit should leave earlier receipts alone.” | Booking rows store the accepted prices, fee and payout. `findReceipt()` reads those values by ID. | Confirmation keeps the original total. |
| “We can pause new sales for a session with bookings.” | `editOffer()` changes the offer status and refuses cancellation if it has confirmed bookings. | The paused offer leaves Browse. Existing receipts stay available. |
| “Take 10% out of the studio’s share.” | `COMMISSION_BASIS_POINTS` feeds `priceQuote()`. The accepted rate and amounts are saved with the booking. | The customer pays the quoted total. Owner can see the fee and payout separately. |

## 4.4 Two revenue features

We use [the seeded Laro Ceramics mug-making session](../db/seed.sql) for both examples. The published reference price was **₱3,000**. The simulated session has **four released seats**, a **₱2,700 standard offer** and a **₱2,565 buddy rate** per person. The examples assume a 10% commission.

| Booking | Customer total | SlotDrop fee | Studio payout before attendance costs |
|---|---:|---:|---:|
| One standard seat | ₱2,700 | ₱270 | ₱2,430 |
| Two standard seats | ₱5,400 | ₱540 | ₱4,860 |
| Two buddy seats | ₱5,130 | ₱513 | ₱4,617 |

### Feature A. Released-seat availability

When a studio sells an otherwise empty seat at ₱2,700, SlotDrop earns ₱270 and the studio gets ₱2,430 before the extra cost of serving that guest. If the customer would have paid the studio ₱3,000 directly, the same sale cuts the studio’s proceeds by ₱570 before channel cost differences.

**So we’d ask for a small allocation once direct bookings slow down, while the studio still has time to prepare.** Before listing, we’d check which classes had unsold seats at that point and agree on how many the studio can set aside. If a pair has booked two of the four released seats, the system refuses the next party of three. There’s no saved sale or commission for those three seats.

**In the build.** `slots` stores released capacity, start, cutoff and status. `bookings.quantity` records the seats taken by each booking. [Discovery](../server/services/discovery.js) shows eligible releases. The [booking service](../server/services/bookings.js) locks the session and rechecks availability before it saves.

### Feature B. Buddy pricing

Two friends pay ₱5,130 together. Whether it’s worth offering depends on who would have booked at the standard price.

| Without the buddy price | Change in customer spend | Change in SlotDrop fee | Change in studio payout |
|---|---:|---:|---:|
| Both friends would pay standard, ₱5,400 total | −₱270 | −₱27 | −₱243 |
| One friend would pay standard, ₱2,700, and the other seat would stay empty | +₱2,430 | +₱243 | +₱2,187 |

The first case costs SlotDrop ₱27 in fees. The second adds ₱243. At **one extra attendee in ten buddy bookings**, the gain and the loss cancel out in this two-scenario example. The studio has to serve the extra guest. At an assumed **₱500 per extra attendee**, it gains ₱1,687 in the second case and loses ₱243 in the first. The studio breaks even at **12.6%** (₱243 ÷ [₱243 + ₱1,687]), or about 13 in 100.

**So we’d test the buddy rate on some comparable releases and leave the rest at the standard price.** We’d keep it where the extra bookings cover the discount and attendance costs. Count total paid seats across SlotDrop and direct sales, so moving the same buyers to a cheaper price doesn’t look like growth.

**In the build.** `slots.buddy_price_centavos` stores the optional rate. The server applies it for a group of two or more, then saves the accepted tier, price, fee and payout. It rounds commission per seat in centavos before multiplying by quantity. The [worked-number regression](../tests/business-worked-numbers.test.js) exercises both tiers, checks the saved totals and verifies what Owner reports.

## 4.5 What Owner does with the numbers

Here’s what [`GET /api/metrics`](../server/repositories/owner.js) returns in the worked example. In the first column of results, one group takes two buddy seats. In the second, a third person books one standard seat in the same four-seat release.

| Owner number | Two buddy seats | Plus one standard seat | What we’d do with it |
|---|---:|---:|---|
| Confirmed bookings | 1 | 2 | Few bookings despite steady availability? Check where visitors drop out before asking the studio for more seats. |
| Platform revenue | ₱513 | ₱783 = ₱513 + ₱270 | Compare fees with what we spent getting and supporting those bookings. Hold paid acquisition if those costs eat up the fee. |
| Average booking value | ₱5,130 | ₱3,915 = (₱5,130 + ₱2,700) ÷ 2 | More bookings can bring in more fees even when the average falls. Check whether larger groups bring extra attendees before expanding buddy pricing. |
| Top-selling activity by confirmed seats | Mug-making + painting, 2 | Mug-making + painting, 3 | If mug-making leads across several releases, ask that studio for another release and compare how many of those seats sell. |
| Nearly full sessions | 0, with 2 of 4 left | 1, with 1 of 4 left | Ask if the studio has another seat it can set aside before cutoff. Increase the allocation only after it confirms. |

Nearly full counts eligible releases with **at least one and at most 25% of released seats left**. A sold-out session leaves that count. Its confirmed bookings still contribute to the other metrics.

## Pilot notes — is there a viable business here?

The technical build shows that SlotDrop can quote, save and retrieve a simulated booking. The commercial question is tougher: can we help a studio earn **more than it would without us**? We would start with one willing studio, not a citywide marketplace.

### Customer and supply

Our first **research hypothesis**, not a measured market profile, is working adults **22–35** who live, study or work near Katipunan, UP Village and Teachers Village, sometimes choose an activity within one to three days, and can consider a **₱2,500–₱3,000** workshop. A proposed **₱35,000–₱80,000 gross monthly income band** is only an interview-screening idea. Students may like the concept but have a different budget, so we would interview them separately.

The harder side is supply. A workshop must already be confirmed to run, and its studio must have seats it can release **before** the preparation cutoff. Neither popular-studio availability nor unfilled-seat frequency can be inferred from a website listing. We would request four weeks of actual capacity, attendance and cancellation records before signing a pilot.

### Studio research

Our [studio research and sources](reference/business-research-appendix.md#a-studios-and-why-each-might-fit) cover Laro Ceramics, Marz Today, Metals & Gems, Bumi & Ashe, Tahanan Pottery, Sip & Gogh and AMT Ceramics. **Laro** is near the proposed Katipunan customer area and publishes a **₱3,000** mug-making class; **Tahanan** publishes recurring weekend classes. These are reasons to **approach** them, not proof that either has empty seats or agreed to sell through SlotDrop. We would verify the exact QC branch, next dated session, preparation lead time and a studio-approved allocation before listing anything real.

### Competitors

The GC1 feedback asked us to name competitors instead of vaguely referring to “booking giants.” We looked at both the customer's alternatives and what the studio would give up by choosing our channel.

| Type | Alternative | What it means for SlotDrop |
|---|---|---|
| **Direct marketplace for experiences** | [Klook](https://www.klook.com/en-PH/activity/116888-pottery-workshop-wabi-sabi/) lists Philippine pottery experiences | Compete on **actual near-term QC availability and clear final prices**, not merely having workshop listings |
| **Closest spare-capacity model** | [ClassPass Manila](https://classpass.com/search-index/manila) and [partner tools](https://classpass.com/partners/faqs) | ClassPass already addresses idle class inventory. Its subscription credits, inventory controls and **negotiated payout floors** are important supplier benchmarks, though largely fitness/wellness focused |
| **Indirect: studio-direct bookings** | [Laro](https://laro-ceramics.com/products/mug-making-class-manila), Bumi & Ashe, Tahanan and other studio websites | The studio keeps its direct customer relationship and avoids our 10% marketplace deduction. We must show **additional buyers**, not divert full-price sales |
| **Indirect: wider appointment platforms** | [Fresha](https://www.fresha.com/pricing), especially salons and spas from our original GC1 concept | Shows why a broad last-minute appointments app would be hard to differentiate. Its commercial terms are not a direct pottery-market quote |
| **Auxiliary alternatives** | Studio social pages, Google Maps/search, cafés, cinema and other leisure plans | Compete for discovery and the same discretionary afternoon, even without offering the same booking service |
| **Cross-industry reference** | [HotelTonight](https://www.hoteltonight.com/faq) | Last-minute unused capacity is not new, but room economics should not be assumed to work for pottery |

**Our proposed position:** a small, local marketplace where studios control the released allocation and buyers see a peso price, cutoff and saved receipt. It is an **unproven** position until studios and customers choose it over their existing options. [Full competitor notes and links](reference/business-research-appendix.md#b-competitors-categories-and-source-notes).

### Provider economics and business-model benchmarks

Using Laro's publicly listed **₱3,000** class as a reference, the **₱2,700 standard** and **₱2,565 buddy** offer prices are *our simulated course values*. Assume an **extra ₱500 per attendee** for clay, glazing/firing, packing and handling; that is a cost hypothesis, not Laro's actual expense.

| One seat | Customer pays | Studio receives after our fee | Studio contribution after assumed ₱500 extra cost |
|---|---:|---:|---:|
| Direct at published reference price | ₱3,000 | ₱3,000 | **₱2,500** |
| SlotDrop standard | ₱2,700 | ₱2,430 | **₱1,930** |
| SlotDrop buddy, per attendee | ₱2,565 | ₱2,308.50 | **₱1,808.50** |

If the seat would otherwise be empty, **₱1,930** is a meaningful addition before already-committed class costs. But if the same buyer would have paid **₱3,000 directly**, the studio loses **₱570** on that standard seat. The extra attendance must be real, not merely cheaper sales through a new channel.

For scale, a **hypothetical four-week pilot** could release four seats in each of 16 *already-running* classes (64 seats). At an assumed 50% fill, with 24 standard seats and eight buddy seats sold in four pairs, that is **32 seats / 28 bookings**:

| Hypothetical four-week outcome | Modeled amount |
|---|---:|
| Customer booking value | **₱85,320** |
| SlotDrop gross commission | **₱8,532** |
| Studio payout before added-attendee costs | **₱76,788** |
| Studio added-attendee costs, 32 × ₱500 | **(₱16,000)** |
| Less hypothetical eight displaced direct buyers × ₱2,500, and ₱2,500 studio coordination | **(₱22,500)** |
| **Studio incremental contribution versus no SlotDrop** | **₱38,288** |
| **SlotDrop pilot surplus** after 28 × ₱50 support and ₱6,000 outreach/ops | **₱1,132** |

These totals are **not forecasts or net profit**. None of the 16 sessions, 50% fill, eight displaced buyers or spending assumptions has been observed; the platform surplus excludes founder labor, taxes, real payment costs, refunds and scale. Under the same mix, SlotDrop would need roughly **27 of 64 released seats** merely to cover that assumed ₱6,000 budget. The [appendix](reference/business-research-appendix.md#c-detailed-per-seat-and-pilot-calculations) tests attendance-cost sensitivity and the assumptions behind this calculation.

**Competitor economics change the decision.** [ClassPass](https://classpass.com/partners/faqs) uses a credit membership and negotiated minimum partner payouts, rather than a universally published Philippine commission percentage. [Fresha](https://www.fresha.com/pricing) publishes a **20% one-time marketplace fee for new customers** (with a minimum), while charging no such marketplace fee for direct and repeat clients; its software and processing charges differ. SlotDrop's proposed **10% on every booking** could therefore be less attractive to a studio with many repeat customers. Laro also advertises friends discounts of up to ₱500 per person, so our buddy tier is **not automatically the lowest available price**. These are models to learn from, not evidence that our chosen fee is optimal. [Detailed business-model comparison](reference/business-research-appendix.md#d-competing-marketplace-business-models).

### Pilot and risks

| Step | What we'd verify | Decision |
|---|---|---|
| **Before launch** | Four weeks of real studio capacity/sales, marginal costs, preparation cutoffs, a **studio-approved minimum net payout**, and a set-aside allocation that cannot be double-sold | If no meaningful spare seats exist before cutoff, **do not run this pilot with that studio** |
| **Weeks 1–2** | Release a few seats at the standard offer, reconcile with the studio calendar, and count total direct **plus** SlotDrop attendance | Pause immediately if counts differ; the server prevents overselling **inside SlotDrop**, not on other channels |
| **Weeks 3–4** | Test buddy offers on comparable sessions and measure extra paid attendees, discount cannibalization and service costs | Keep the buddy tier only where it improves *studio contribution*, not just the booking count |
| **End of week 4** | Compare studio incremental earnings and SlotDrop fees against actual supplier/acquisition/support expenses | Repeat a narrow trial if uncertain; expand only if both sides benefit |

Our three biggest risks are **ghost seats**, a premium studio unwilling to discount, and customers switching from full-price to discounted bookings. Ring-fenced inventory, a negotiated studio payout floor and a measured direct-versus-marketplace comparison are **proposed operating safeguards**, not things the GC2 app automatically enforces. We have not integrated studio calendars or real money.

### Studio applications

The app can save a prospective provider's application and show its pending status. That is **not verification or permission to publish a studio**. Real onboarding would require identity, consent and commercial terms. [Studio application contract](routes.md#studio-research-and-applications)

