# SlotDrop business case

SlotDrop started as a way to find last-minute appointments. For GC2 we focused on workshops near Katipunan. Say you and a friend have a free Saturday. You can check which studios still have two seats, what you’d pay together and when booking closes. Studios decide how many seats to release from classes that are already going ahead. SlotDrop models a **10% commission on each confirmed booking**, deducted from the studio’s payout.

We’d try this with one pottery studio and a few seats it usually leaves empty. The [pilot plan](#pilot-and-risks) shows how we’d test whether the studio earns more. We took the studio details and reference prices from [public listings](#studio-research). Dates, seats, offers, bookings and payments in the app are simulated.

## 4.1 GC1 traceability

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
| Marketplace Feed and search | “Displays only upcoming slots that are still available.” The bookable list follows that rule for dated offers. Browse adds search, category buttons, six offers per page and a separate Closed sessions section. Two undated practice offers let the instructor test bookings after the dated samples expire. |
| Simulated Booking | “Checks availability, marks the slot as booked, and creates a booking record.” We added Detail after the GC1 feedback, followed by quantity and quote on Selection, simulated payment on Checkout, and a saved receipt on Confirmation. The server checks stock and price when the booking is saved. The five-minute hold from the wireframe was dropped. |
| User Schedules and Provider Analytics | Owner shows saved bookings and five metrics. Personal schedules and role-specific reports are future work. |
| Auth & Roles, real payments, integrations and paid placements | Outside the scope of the GC2 demo. |

### How we used the instructor’s feedback

| GC1 feedback | What we changed | What we’d check in a pilot |
|---|---|---|
| The target buyer was vague, and we had no estimate of vacant seats. | Defined a [proposed QC customer segment](#customer-and-supply) and a three-day discovery window. | Interview customers and ask one studio for four weeks of capacity and sales. |
| We referred to unnamed “booking giants.” | Compared Klook, ClassPass, studio websites and Fresha in [Competitors](#competitors). | Check actual local listings and ask what would make customers and studios switch. |
| We assumed popular studios would have openings to list. | The app offers only seats a studio has released from a class going ahead. | Confirm recurring spare seats and agree on the allocation with the studio. |
| Studios may resist discounts, and existing customers may move to cheaper offers. | Owners set prices and can pause sales. The server takes confirmed bookings out of the available allocation. | Agree on a minimum payout and compare total sales across SlotDrop and the studio’s own channels. |
| Commission, app features and stack needed specifics. | Set a 10% studio-paid fee, saved the accepted price and fee with each receipt, and listed the stack in the README. | Check supplier costs, acquisition costs and terms with a pilot studio. |
| The data design duplicated roles and the customer journey stopped too early. | Used linked PostgreSQL tables, added Detail and connected Checkout, Confirmation and Owner to the same saved booking. | Work out how customer and studio accounts would fit the existing flow. |

## 4.2 Funnel map

The last column is what we’d measure in a pilot. GC2 records bookings and Owner metrics.

| Stage | Screen | What we put there and why | Endpoint | What we’d measure |
|---|---|---|---|---|
| Browse | Home | Up to three bookable offers give someone with a free afternoon a quick sense of what’s available. Practice offers are labeled. “Browse all sessions” opens the full list. | `GET /api/slots` | Home visits that open Browse or Detail ÷ Home visits |
| Browse | Browse | A bookable card keeps the studio, time, cutoff, seats left and price together so someone comparing offers on a phone can scan them at once. Search takes studio or activity names, category buttons narrow the list in one tap, and six cards per page keep the list short. | `GET /api/slots?q=…&category=…&page=…&limit=6` | Browse visits that open a bookable session’s Detail page ÷ Browse visits |
| Select | Detail | A labelled list puts inclusions, preparation, location and the deadline where a customer can scan them before choosing seats. | `GET /api/slots/:id` | Detail visits that continue to Selection ÷ Detail visits |
| Select | Selection | A number field lets the customer enter the group size directly. The server returns a new price as it changes, so a pair can see what the buddy rate does to the total. | `GET /api/slots/:id`, `GET /api/pricing/quote` | Selection visits that open Checkout ÷ Selection visits |
| Confirm | Checkout | Labelled contact fields show which entry needs fixing. A dropdown keeps the two simulated payment options in one place. The checkbox sits next to the quote so the customer can see the exact amount they’re accepting. | `GET /api/slots/:id`, `GET /api/pricing/quote`, `POST /api/bookings` | Confirmed saves ÷ unique submitted request IDs |
| Save | Confirmation | The page fetches the saved booking by its reference. Refreshing it shows the accepted seat count, price and payment choice again. The reference also lets Owner find the same booking. | `GET /api/bookings/:id` | Saved bookings and average booking value |

The studio uses Owner to edit offers and check sales. The bookings table and five metrics come from `GET /api/bookings` and `GET /api/metrics`.

## 4.3 Business rules

Scheduled offers appear within 72 hours of their start and close at the studio’s cutoff. **Closed sessions** shows up to 16 recently closed offers. The two practice offers start with 20 simulated seats each. They stay bookable as long as the activity is active, sales are open and seats remain, so the instructor can still test the flow after the dated offers expire.

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

## 4.4 Two revenue features

Both examples use [the seeded Laro Ceramics mug-making session](../db/seed.sql). Laro listed the class at **₱3,000**. In our demo we released **four seats** at **₱2,700 standard** or **₱2,565 per person** for buddies, with a 10% commission.

| Booking | Customer total | SlotDrop fee | Studio payout before attendance costs |
|---|---:|---:|---:|
| One standard seat | ₱2,700 | ₱270 | ₱2,430 |
| Two standard seats | ₱5,400 | ₱540 | ₱4,860 |
| Two buddy seats | ₱5,130 | ₱513 | ₱4,617 |

### Feature A. Released-seat availability

When a studio sells an otherwise empty seat at ₱2,700, SlotDrop earns ₱270 and the studio gets ₱2,430 before the extra cost of serving that guest. If the customer would have paid the studio ₱3,000 directly, the same sale cuts the studio’s proceeds by ₱570 before channel cost differences.

We’d ask the studio to release a few seats once direct bookings slow down, while there’s still time to prepare. We’d use its sales records to pick sessions. In the demo, if a pair books two of four released seats, the next group of three gets a 409 and the booking is declined.

The `slots` table holds the allocation and cutoff. [Discovery](../server/services/discovery.js) lists the active releases. The [booking service](../server/services/bookings.js) locks the slot and counts confirmed seats again before saving.

### Feature B. Buddy pricing

Two friends pay ₱5,130 together. Whether it’s worth offering depends on who would have booked at the standard price.

| Without the buddy price | Change in customer spend | Change in SlotDrop fee | Change in studio payout |
|---|---:|---:|---:|
| Both friends would pay standard, ₱5,400 total | −₱270 | −₱27 | −₱243 |
| One friend would pay standard, ₱2,700, and the other seat would stay empty | +₱2,430 | +₱243 | +₱2,187 |

For SlotDrop, nine buddy bookings that replace two standard seats cost ₱243 in fees. One buddy booking that adds a second attendee makes that back, so the break-even point is **1 in 10**. At an assumed **₱500** cost for the extra attendee, the studio gains ₱1,687 when a buddy booking adds a guest and loses ₱243 when both would have come anyway. The studio breaks even at **12.6%** (₱243 ÷ [₱243 + ₱1,687]), about 13 in 100.

We’d test the buddy rate on some comparable classes and keep the standard price on the others. We’d count total paid seats across SlotDrop and direct sales, then compare what the studio earned after costs.

The optional rate lives in `slots.buddy_price_centavos`. The server uses the buddy rate for groups of two or more when the rate is set. It rounds the fee per seat in centavos, then multiplies by the number of seats. The [worked-number test](../tests/business-worked-numbers.test.js) checks the saved amounts and the Owner figures.

## 4.5 What Owner does with the numbers

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

## Pilot plan and economics

Would a studio earn more by using SlotDrop? We’d start with one pottery studio and track what happens to bookings and payout across its sales channels.

### Customer and supply

We’d start by interviewing working adults **22–35** near Katipunan, UP Village and Teachers Village who sometimes make plans within three days and would consider a **₱2,500–₱3,000** workshop. A gross monthly income of **₱35,000–₱80,000** is a proposed screening range. We’d interview students separately to learn what fits their budget.

The first thing we’d ask a studio for is four weeks of capacity, attendance and cancellations. We need to know which classes are already confirmed and how many seats are still open before the preparation deadline.

### Studio research

We looked at Laro Ceramics, Marz Today, Metals & Gems, Bumi & Ashe, Tahanan Pottery, Sip & Gogh and AMT Ceramics. Laro is close to our pilot area and listed a **₱3,000** mug-making class. Tahanan listed recurring weekend classes. We’d ask each about its exact branch, next session, preparation lead time and seats it could set aside. [Studio research and sources](reference/business-research-appendix.md#a-studios-and-why-each-might-fit)

### Competitors

We checked where a customer might book and what a studio already gets from those channels.

| Type | Alternative | What it means for SlotDrop |
|---|---|---|
| Direct marketplace | Klook lists Philippine pottery experiences. [Sample listing](https://www.klook.com/en-PH/activity/116888-pottery-workshop-wabi-sabi/) | Win bookings with near-term QC availability, a visible cutoff and a final peso price. |
| Spare-capacity marketplace | ClassPass sells membership credits and gives partners tools to manage unused capacity, mostly in fitness and wellness. [Manila listings](https://classpass.com/search-index/manila) · [Partner FAQ](https://classpass.com/partners/faqs) | A studio will compare what it earns when it releases a seat, including any agreed minimum payout. |
| Studio-direct sales | Laro, Bumi & Ashe, Tahanan and other studios take direct bookings. [Laro booking page](https://laro-ceramics.com/products/mug-making-class-manila) | Studios keep the customer relationship and the full sale price. We need to bring in buyers they would otherwise miss. |
| Wider appointment platforms | Fresha covers salons and other appointments from the original GC1 concept. [Fresha pricing](https://www.fresha.com/pricing) | A focused workshop pilot is easier to test than a general appointments marketplace. |
| Discovery and leisure alternatives | Studio social pages, Google Maps, cafés and cinemas | A customer can find a studio directly or make a different plan for the afternoon. |
| Cross-industry example | HotelTonight sells last-minute hotel availability. [HotelTonight FAQ](https://www.hoteltonight.com/faq) | It shows how a marketplace can sell spare capacity. Pottery still needs its own cost and demand evidence. |

We’d test one specific offer against those alternatives: released workshop seats in QC with the studio’s cutoff, a final peso price and a saved receipt. [Full competitor notes](reference/business-research-appendix.md#b-competitors-categories-and-source-notes)

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

