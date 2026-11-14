# SlotDrop business case

**Empty slot, better price.** We started GC1 with an idea for last-minute appointments. In GC2, we built a smaller version around creative workshops in Quezon City. Say you and a friend have a free Saturday near Katipunan. You can check which classes still have two released seats, when booking closes, and what both of you would pay. The studio decides how many seats to list in a class that will run anyway. SlotDrop models a **10% commission on each confirmed booking**, deducted from the studio’s share.

We’d start with one pottery studio and a small release of seats it expects to go unsold. The [four-week pilot plan](#pilot-and-risks) explains how we’d check that. Studio details and published prices come from [public research](#studio-research). The course demo uses simulated dates, seat releases, offers, bookings and payments.

The [post-feedback revision of GC1](gc1-post-feedback-revision.md) documents the instructor's strategic feedback, the originally missing monetization/features/tech-stack sections, updated competitor categories and the proposed partner validation plan. It is a **later working draft**, not a replacement for the original assessed GC1 proposal. The original proposal and instructor feedback are retained as separate course source files; the GC2 submission brief requires quotations and traceability, but does not explicitly request that feedback PDF as an additional public attachment.

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
| Vague age/income/area and no measured vacant-seat frequency | Defined a **proposed** QC pilot segment (age, income-screening and psychographics above) and limited booking discovery | Customer interviews and a studio's four weeks of actual capacity/sales |
| “Established booking giants” unnamed | Compared **Klook**, ClassPass, studio-direct websites and Fresha, and distinguished direct, indirect and auxiliary alternatives in [Competitors](#competitors) | Verify active local listings and why customers/providers would actually switch |
| Overpromised openings at popular providers | Offers only an allocation a studio deliberately releases from a class going ahead | Written partner agreement and realistic unfilled-seat data |
| Ghost slots, discount-resistant studios and deal-only customers | Server capacity checks, Owner pause/resume and prices; proposed ring-fenced inventory, minimum net payout and cannibalization test | The latter three safeguards are **pilot arrangements**, not implemented integrations or proven results |
| Commission, platform features and stack missing | Modeled **10% studio-paid commission**, persisted quotes and receipts, clear built/deferred features and stack in README | Real supplier unit costs, acquisition costs and agreed commercial terms |
| Duplicate role-based stores and incomplete user journey | Entity-oriented PostgreSQL, detailed receipt/data flow, Detail page and Owner metrics | Login/admin separation, real cancellations and external calendar sync are still deferred |

The original instructor feedback is the evidence for these gaps; this matrix is a **later interpretation of the group's response**, not proof that the early proposal contained the corrected sections. The [post-feedback GC1 working draft](gc1-post-feedback-revision.md) keeps the deeper comparison and explicitly labels untested assumptions.

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

## Pilot notes

### Customer and supply

For the pilot we’d **test** working adults aged **22–35**, living, studying or working near Katipunan, UP Village or Teachers Village, who sometimes make plans one to three days ahead and might spend ₱2,500–₱3,000 on a workshop. A proposed ₱35,000–₱80,000 monthly gross income *screening band* is a research hypothesis, not a measured income profile. We’d screen for discretionary spending, interest in a hands-on activity with a friend, and willingness to book inside a short window. Those proposed ages, income limits and preferences need real interviews before we treat them as market facts. We’d interview students separately to learn what price works for them. We do not have measured purchase frequency or demand yet.

A studio can run a class every week even if one guest only does pottery once in a while. We’d check which studios regularly have seats to release before looking for more activities. For example, Laro is close to our first customer area, but we still need to confirm which dates are in QC. Tahanan’s published Saturday schedule makes it a useful comparison for recurring supply.

Each activity stores one primary type, plus technique and inclusions. A mug-making class stays under pottery even if it includes painting. Someone searching “painting” can find that same session and book from the same allocation. Browse exposes text, broad category and pagination. The API also supports date, area, party size, type, attributes and sorting.

### Studio research

We checked the studios’ public pages on 29–30 October 2026. We’d confirm the branch, date, available seats and permission to list directly with a studio before the pilot. The [catalog data](../public/data/studio-research.json) contains the sources used in the demo.

<details>
<summary>Studio profiles, published prices and questions for outreach</summary>

#### In or near the launch area

**A1. Laro Ceramics** — 219 Katipunan Avenue, Blue Ridge A, QC
- **Published:** mug making + painting, ₱3,000, three hours; clay, tools, painting, glazing and firing included. Wheel throwing, ₱3,200, three hours (rechecked 30 October).
- **Watch for:** the product offers both QC and BGC branches, so a BGC date must not be used for Katipunan. Collection takes about three months; nothing is taken home the same day.
- **Fit:** local, beginner-friendly, suits going with a friend.
- **Not verified:** the next eligible date, seats that could be released, deadline, costs, partnership.
- **Sources:** https://laro-ceramics.com/products/mug-making-class-manila | https://laro-ceramics.com/collections/pottery-classes-laro-ceramics

**A2. Marz Today** — 44 Matimtiman Street, Teachers Village, QC
- **Published:** beginner stamp carving from ₱2,500, by appointment. Workshops take up to five people; open events up to ten, which are not workshop seats.
- **Fit:** a local craft prospect.
- **Risk:** an appointment made on request may not be a session that is already going ahead. Kat needs to confirm dated group sessions and how seats would be released first.
- **Sources:** https://shop.marz.today/collections/workshops | https://marz.today/booking/

**A3. Metals & Gems** — White Plains / Katipunan Extension, QC (address from 28 October research, to be rechecked)
- **Published:** Gem-to-Jewelry, ₱5,000 per person per piece, silver and stone included.
- **Unresolved:** the product page says 2.5–3 hours and the FAQ says about five. Sold-out labels and cart buttons appear together, so neither proves an open date.
- **Fit:** a premium cost comparison, not current bookable supply.
- **Sources:** https://www.metalsandgems.com.ph/products/gem-to-jewelry-workshop | https://www.metalsandgems.com.ph/pages/contact-us

#### Expansion candidates

**B1. Bumi & Ashe** — Cubao Expo, QC (the site also lists Makati, so the branch must be confirmed)
- **Published:** mug making, ₱2,650 sale / ₱3,200 regular, two hours, painting and firing included. Free-form + paint, ₱3,200, three hours (rechecked 30 October).
- **Watch for:** collection takes 6–8 weeks. The page describes one mug while the FAQ mentions three pieces, so the package must be confirmed. Mixed sold-out and cart signs do not show availability. Wheel products are separate research and are not in the booking samples.
- **Fit:** more creative supply, with collection and schedule limits.
- **Sources:** https://bumiandashe.com/products/mug-making-workshop-1 | https://bumiandashe.com/collections/workshops-1

**B2. Tahanan Pottery** — 27 Scout Tobias Street, QC
- **Published:** exploratory wheel, ₱2,500, Saturdays 2–5 PM; handbuilding, Sundays 9:30 AM–12:30 PM.
- **Fit:** a possible source of recurring seats. These are schedule patterns, not confirmed seats for a particular weekend.
- **Not verified:** the dated product, deadline and seats that could be released.
- **Source:** https://tahananpottery.ph/collections/pottery-classes-workshops

**B3. Sip & Gogh Eastwood** — Eastwood City, QC
- **Published:** the FAQ sends customers to the branch calendar. We state no Eastwood price.
- **Fit:** a different occasion (painting). Another branch's price or an old calendar must not be reused.
- **Source:** https://sipandgogh.com/faqs

**B4. AMT Ceramics** — Tandang Sora, QC
- **Published:** handbuilding and wheel exploratory single sessions, ₱2,900 each, Fridays, Saturdays and Sundays 10 AM–1 PM. The sample catalog includes both three-hour activities.
- **Not verified:** a specific date, spare seats, inclusions, deadline.
- **Source:** https://amtceramics.com/pages/faqs

**B5. Sip & Gogh Century Mall** — Makati (separate from the Eastwood prospect)
- **Published:** Open Session on 6 November 2026, ₱1,400, 6–9 PM.
- **Use:** an example of a painting price and duration. It does not show a QC offering or a live eligible session. The sample dates are simulated and are not that reservation.
- **Source:** https://www.sipandgogh.com/branches/century-mall/sessions/12100

#### Reference only

- **Core Pilates.** The published ₱1,150 single-session credit is not a dated class, and the class duration and timetable are not verified. Source: https://corestudio.ph/class-packages
- **Studio Matisse, San Juan** (outside the launch area). Its policy requires reservations at least two days ahead. With a 72-hour discovery window, a 48-hour deadline leaves only 24 hours to sell, and a 72-hour deadline leaves none. This shows how a studio's lead time can rule it out. It is not a partner, and we do not claim it accepts resale. Source: https://studiomatisse.myshopify.com/pages/studio-policies

#### Research priority

1. Verify Laro's next dated QC session and Tahanan's recurring schedule.
2. Use Marz to test whether appointment-based crafts fit the model at all.
3. Keep Metals & Gems as a higher-cost comparison until its duration and availability are resolved.
4. Before building out the catalog, ask each studio for four weeks of class records: scheduled capacity, paid seats, late cancellations and unfilled seats, and which openings could have been released before its preparation cutoff. That tells us how many seats we could really list, a number the public catalogs cannot supply.

</details>

### Competitors

GC1's feedback called out that our SWOT mentioned “established booking giants” without naming a single competitor. For this narrower QC-workshop concept, we classify competitors by whether they help customers book the *same kind of experience*, offer another booking channel, or compete for discovery and leisure spending. Categories are **our analytical labels**, not formal categories imposed by the GC2 brief.

| Category | Real alternative and evidence | What it offers / why it threatens us | What SlotDrop would need to prove |
|---|---|---|---|
| **Direct marketplace** | **[Klook Philippines](https://www.klook.com/en-PH/activity/116888-pottery-workshop-wabi-sabi/)** lists a Wabi Sabi pottery workshop in Metro Manila | A customer can discover beginner-friendly pottery through an existing experiences marketplace. We **did not confirm a currently purchasable pass** on the page checked. | Reliable near-term QC releases with explicit peso totals, not just another marketplace listing. |
| **Closest adjacent capacity model** | **[ClassPass Manila](https://classpass.com/search-index/manila)**; its [partner documentation](https://classpass.com/partners/faqs) describes excess-inventory tools and payout floors | ClassPass already markets incremental reservations from idle capacity, primarily in fitness/wellness. Spare-seat discounting is **not** SlotDrop's unique innovation. | A differentiated workshop category, relevant studio partnerships, and economics that protect direct demand. |
| **Indirect: studio-direct bookings** | **[Laro Ceramics](https://laro-ceramics.com/products/mug-making-class-manila)**, Bumi & Ashe and Tahanan's own websites | A customer can buy a class directly; a studio can keep its full direct-sale proceeds. The same potential partners are also substitutes for using SlotDrop. | Demonstrate genuinely incremental customers or simpler cross-studio discovery; otherwise our commission is unnecessary. |
| **Indirect: neighboring appointment marketplaces** | **[Fresha's Philippine salon listings](https://www.fresha.com/lp/en/bt/beauty-salons/in/philippines)** | Relevant to GC1's *original* broad salons/appointments concept, but not proof that Fresha lists QC pottery seats. | Avoid an unsupported claim that we can compete broadly across salons, spas and creative classes on day one. |
| **Auxiliary: discovery channels** | Studio Instagram/Facebook pages and Google Maps/search | Customers can discover and contact a studio without another marketplace. These compete for attention rather than providing exactly the same booking service. | Present useful dates, remaining seats, cutoffs and group totals more clearly than separately checking studio pages and messages. |
| **Auxiliary: experience substitutes** | Cinema dates, café visits, at-home crafting and free local events | Compete for an optional afternoon or date budget; not identical last-minute workshop-booking platforms. | Test the actual workshop value and total cost instead of assuming discounted pottery automatically wins. |

**Geography and precision matter.** Klook's local listing is closer to our *creative experience* category than the international [HotelTonight](https://www.hoteltonight.com/) analogy. ClassPass competes more directly with our *spare-capacity economics*. Fresha is important background for our old appointment-marketplace idea, but it does not establish pottery supply. [FunNow](https://www.events.myfunnow.com/whyfunnow-en) is a near-term experiences analogy; its Philippine operation was not verified. None of these references proves that a specific competitor has an available QC pottery seat today.

**Where we would try to win:** one QC neighborhood, a limited studio-approved allocation, transparent price/seat/cutoff information, and the ability to confirm and retrieve a saved booking. Those are **pilot hypotheses**, not demonstrated advantages. A [ClassPass-style payout floor](https://classpass.com/partners/faqs) cannot be claimed as our implemented feature: in GC2 the Owner sets prices, but our system does not independently enforce a negotiated minimum studio payout.

**Supplier choice and cannibalization:** A studio receives **₱2,430** before attendance costs on our simulated ₱2,700 single seat, versus **₱3,000** in gross revenue if the same customer booked direct at the published price. The ₱570 difference is a warning: the platform must earn its share through additional bookings that would not have occurred otherwise. Before any real pilot, we would request four weeks of filled/empty seats, agree a ring-fenced release allocation and a minimum acceptable net price, and compare direct *plus* marketplace paid attendance rather than counting discounted bookings alone. No such supplier records or agreements are available yet.

### Provider unit economics and four-week pilot scenario (assumptions, not actual studio financials)

**Case anchor:** Laro Ceramics publicly lists a three-hour mug-making + painting workshop for **₱3,000** ([studio listing](https://laro-ceramics.com/products/mug-making-class-manila)). We use the *simulated GC2 seeded* prices of ₱2,700 for a single seat and ₱2,565 per buddy seat, and SlotDrop's *proposed* 10% studio-paid commission. None of these discounted prices or commission terms has been agreed with Laro; do not present this exercise as its P&L.

**Why the cost assumptions look this way:** The class is assumed to run **regardless of SlotDrop bookings**, so rent and already-committed instructor time are not charged again to each extra seat. For sensitivity testing, assume **₱500 marginal cost per added attendee**: illustrative clay/consumables ₱180, glaze/firing ₱170, cleaning/packaging ₱100 and additional handling ₱50. These allocations are **not observed supplier invoices**; the purpose is to avoid the common mistake of treating all payout as profit. Confirm clay yield, kiln loads, instructor capacity, firing failures and packaging with an actual partner. If the class would be cancelled without our bookings, the fixed cost of running the entire class must be included instead.

| One attendee / one seat | Customer price | SlotDrop fee | Studio payout | Assumed extra attendance cost | Studio incremental contribution |
|---|---:|---:|---:|---:|---:|
| **Direct** booking at published reference price | ₱3,000 | ₱0 | ₱3,000 | ₱500 | **₱2,500** |
| **SlotDrop standard** (GC2 hypothetical) | ₱2,700 | ₱270 | ₱2,430 | ₱500 | **₱1,930** |
| **SlotDrop buddy** (per person, party of 2+) | ₱2,565 | ₱256.50 | ₱2,308.50 | ₱500 | **₱1,808.50** |
| **Otherwise empty seat** in an already-running class | ₱0 | ₱0 | ₱0 | ₱0 new cost | **₱0** |

If the **standard SlotDrop booking is genuinely additional**, the studio gains ₱1,930 of contribution on a seat otherwise worth ₱0, and the platform gets ₱270 of gross fee income. If the *same person would instead have paid ₱3,000 directly*, the studio loses **₱570** in contribution (₱2,500 versus ₱1,930), before differences in direct-channel marketing/payment costs. For a buddy seat the corresponding diversion loss is **₱691.50**. An attractive discount can therefore **harm the provider while benefiting the platform**.

Buddy pricing creates a second trade-off. Compared with **one SlotDrop standard buyer plus one empty seat**, a two-person buddy booking adds **₱1,687** to the studio after the assumed extra attendee cost (₱3,617 versus ₱1,930) and **₱243** in platform fee income (₱513 versus ₱270). But compared with **two SlotDrop standard buyers**, the pair reduces studio payout/contribution by **₱243** and platform fees by **₱27**. If these were the only two counterfactuals, a buddy pair would need to add a second attendee in **over 12.6%** of comparable cases to break even for the studio: ₱243 ÷ (₱1,687 + ₱243). **This is a scenario threshold, not an observed buddy conversion rate.** A stricter comparison with *one full-price direct buyer* yields only **₱1,117** additional studio contribution from the buddy pair; if *both* would buy direct, the buddy pair loses **₱1,383** instead.

**Marginal-cost sensitivity:** At ₱300 / **₱500** / ₱800 extra cost per person, studio contribution on a standard SlotDrop seat is **₱2,130 / ₱1,930 / ₱1,630**; on a buddy seat it is **₱2,008.50 / ₱1,808.50 / ₱1,508.50**. Proposed supplier acceptance criterion (not built into the platform): agree a net-payout floor and a minimum per-attendee contribution after actual marginal cost. For example, a *hypothetical* ₱2,000 payout floor is met by both current simulated tiers, but this is neither Laro's stated floor nor a software-enforced rule.

**Four-week pilot volume scenario, not a demand forecast.** Assume a willing studio confirms **16 already-running sessions** over four weeks (four weekly) and releases **four ring-fenced seats each** = **64 seats**. We **hypothesize 50% fill** = **32 SlotDrop seats**, comprising 24 single standard bookings and four two-person buddy bookings (**28 bookings**, not 32 bookings). No published records establish those sessions or the fill rate.

| Four-week financial bridge | Assumption / formula | Modeled total |
|---|---|---:|
| Customer gross booking value | 24 × ₱2,700 + 8 × ₱2,565 | **₱85,320** |
| SlotDrop gross commission | 24 × ₱270 + 8 × ₱256.50 | **₱8,532** |
| Studio payout before marginal costs | ₱85,320 − ₱8,532 | **₱76,788** |
| Studio variable attendance costs | 32 × ₱500 | **(₱16,000)** |
| Studio contribution on the 32 marketplace seats | ₱76,788 − ₱16,000 | **₱60,788** |
| Opportunity cost if **8 of those 32** would have booked direct | 8 × (₱3,000 − ₱500) | **(₱20,000)** |
| Extra studio coordination/reconciliation | Proposed four-week manual effort budget | **(₱2,500)** |
| **Incremental studio contribution versus no SlotDrop** | ₱60,788 − ₱20,000 − ₱2,500 | **₱38,288** |
| SlotDrop per-booking support/reconciliation | 28 bookings × *assumed* ₱50 | **(₱1,400)** |
| SlotDrop four-week customer outreach + basic operations | *Assumed* ₱6,000 pilot budget | **(₱6,000)** |
| **SlotDrop provisional pilot surplus** | ₱8,532 − ₱1,400 − ₱6,000 | **₱1,132** |

**What these assumptions represent:** The studio's ₱2,500 extra coordination is a *test budget*, not paid staff data. Platform outreach/ops ₱6,000 can be modeled as ₱4,000 local acquisition/promotion, ₱1,500 campaign/content coordination and ₱500 basic hosting/tools; the ₱50 per booking approximates incremental support and manual reconciliation. **Not included** are founder/developer salaries, formal payment-processing fees, tax/VAT, chargebacks, refunds, fraud and the cost of scaling a real supplier operation. As a consequence **₱1,132 is not net profit**; it is a narrow pre-tax pilot contribution *under these assumptions*. With the same mix and costs, the platform needs about **27 sold seats out of 64 (42% released-seat fill)** to cover the ₱6,000 fixed pilot budget; if the budget doubled to ₱12,000 it would need about **54 seats (84% fill)**. Provider profitability depends separately on the number of sales that would have been made directly; the assumed eight diverted seats are **not a measured cannibalization rate**.

**Pilot go/no-go:** Before accepting the deal, obtain four weeks of actual attendance/unused seats, check that classes are confirmed, price a studio-approved floor from its real per-attendee costs, and restrict the marketplace to a **ring-fenced** allocation. During the pilot track *combined studio-direct + SlotDrop paid seats*, incremental studio contribution, group discount cannibalization, actual platform cost per booking and reconciliation failures. Do not scale or claim mutually beneficial returns merely because the app reports bookings.

### Competitor business-model benchmarks (what is documented vs unknown)

| Platform/channel | Publicly documented model | Economics/controls relevant to our pilot | Comparison that is **not** supported |
|---|---|---|---|
| **SlotDrop (proposed)** | **10% on every confirmed simulated booking**, deducted from studio share; no listing subscription in our model | GC2 stores fee/payout, studio sets discounts and released seats; **no negotiated payout-floor enforcement, real merchant settlement or partner acquisition** | No actual paying suppliers, CAC or conversion rates yet |
| **[Laro direct](https://laro-ceramics.com/)** | Own storefront lists the ₱3,000 mug class and advertises **up to ₱500/person off** when booking with friends | No third-party *marketplace* commission on direct sales; direct marketing and payment costs may remain. A direct group promo **might beat** our ₱2,565 buddy price, depending on eligibility and actual checkout | “Up to” is not a confirmed ₱2,500 price for a given date/branch or party size |
| **[ClassPass](https://classpass.com/partners/how-it-works)** | Customer **credit-based membership**; partners list with no up-front fixed fee and get per-reservation payouts based on **confidential negotiated rate floors**. SmartSpot/SmartRate manage spot inventory and demand-sensitive credits | Its [March 2026 explanation](https://classpass.com/partners/blog/classpass-payouts-pricing-policies-rates) explicitly protects a minimum supplier payout and argues for incremental sales. This is a **product/contract benchmark**, not proof of available QC workshop inventory | No general public Philippine “ClassPass commission %”; confidential payout floors are **not** comparable to SlotDrop's 10% face-value commission |
| **[Fresha](https://www.fresha.com/pricing)** | **Salon/appointment software subscription plus marketplace acquisition:** published pricing lists **20% one-time commission on brand-new marketplace-sourced customers**, with a **US$6 minimum**, and **no marketplace fee on returning or direct-booking customers**. Subscriptions and processing have separate fees | Charges for acquiring *new* business, unlike **SlotDrop's proposed 10% on every booking**, even repeat purchases. Appointments, calendar, marketplace discovery and payment tools are bundled | The published USD price sheet is **not a negotiated Philippine workshop quote**. Currency, local terms, payment cost and subscription complicate the comparison |
| **[HotelTonight](https://www.hoteltonight.com/faq)** | Hotel booking marketplace specializing in short-notice stays and deals on rooms that might otherwise go unsold; its FAQ describes variable hotel rates, special deals and price comparison | **A perishable-inventory and pricing precedent**, not a direct competitor for QC creative workshops. The analogy reinforces comparing a true incremental booking against an unsold seat | No verified generally applicable hotel-commission rate or evidence that hotel economics transfer to ceramics; avoid inventing either |
| **[Klook merchant marketplace](https://merchant.klook.com/introduction)** | Sells experiences through merchant-managed activity inventory, booking, redemption and marketing tools; merchant contracts govern commercial terms | Established discovery and booking distribution; our proposed advantage must be a *verified local release and incrementality*, not “first marketplace for workshops” | No verified standard commission percentage applicable to QC workshops; **do not invent one** |

**Specifically responding to the instructor’s GC1 examples:** [ClassPass’s partner FAQ](https://classpass.com/partners/faqs) says its SmartSpot tool uses historical attendance and current availability to expose spots predicted not to sell through a studio’s direct channel, while SmartRate changes the credits customers spend and protects an agreed payout floor. ClassPass does **not** ring-fence those spots from direct bookings: integrated partner inventory can remain available for direct customers. Our GC2 model instead requires **manually ring-fenced seats**, because we have no studio calendar sync. That is an operational limitation, not a verified competitive advantage. The ClassPass [partner how-it-works page](https://classpass.com/partners/how-it-works) reports gains in payout/fill rates from its own fitness partners; those platform-reported results **must not be used as a pottery-demand estimate**.

Fresha attacks GC1’s *original broader problem* (salon/spa appointments and acquisition) more directly than our narrowed pottery launch. A transparent 20%-new-client model could appear more expensive than 10%, but direct comparisons are misleading: it is charged only for newly marketplace-referred customers and has a minimum and separate software/payment costs. HotelTonight similarly proves that short-notice surplus inventory has precedent, but rooms and workshop places have different materials, preparation cutoffs, event cancellation risks and incremental costs. **None of the three is evidence that SlotDrop can attract a QC studio profitably without a real supply agreement.**

**Competitive implication:** SlotDrop's flat 10% is simpler but may be a weaker studio proposition than **(a)** direct booking, especially with existing friends discounts, **(b)** ClassPass-style contractual payout protection, and **(c)** Fresha's first-time-only marketplace fee for providers receiving repeat customers. A sensible next commercial hypothesis is **a supplier-approved minimum payout per attendee and first-time/incremental booking incentives**, but those would be **future changes** requiring studio interviews and software rules; they are not current features or a decision endorsed by the group.

### Pilot and risks

The instructor's GC1 feedback also named three concrete risks. **Ghost slots:** the production pilot must ring-fence agreed seats in the studio's own calendar because SlotDrop's server protects only its own allocations; no external calendar sync exists. **Premium studios rejecting discounts:** operators set their own offer and buddy prices, with a negotiated minimum net payout required *before* a real listing; there is no automatically enforced provider-specific floor in GC2. **Deal-only buyers:** compare direct and marketplace sales and selectively test buddy discounts so cannibalized full-price bookings do not masquerade as growth. These are proposed controls, not live partner processes.

| When | What we’d do | What would change our decision |
|---|---|---|
| Before listing | Ask for four weeks of past session records. Check paid seats, late cancellations, what was empty before cutoff, and how much prep time the studio needs. Agree on the lowest payout it will accept and which seats it can set aside. | If spare seats show up after the studio needs to close bookings, try a different studio or adjust the discovery window before recruiting customers. |
| Weeks 1–2 | Release a few seats at the standard price. Recruit nearby prospects through studio posts and local communities. Record seats released, withdrawn and sold. | If inventory disagrees with the studio’s own calendar, pause and reconcile it before reopening sales. |
| Weeks 3–4 | Offer the buddy rate on some comparable sessions and keep the standard price on others. Record direct and SlotDrop sales and ask buyers what they would have done without the offer. | Keep buddy pricing where it adds paid attendees and improves the studio’s proceeds after the cost of serving them. Treat a small sample as directional. |
| End of week 4 | Check whether the studio wants to continue, whether seat counts stayed accurate, and what we earned in fees versus acquisition and support costs. | Repeat locally if the result is promising but unclear. Discuss expansion after both sides see a credible return. |

The main risk is selling a seat that the studio has already sold elsewhere. The server protects the allocation inside SlotDrop. The pilot still needs the studio to set those seats aside because its calendar is separate. We’d also verify materials, lead times and collection terms before listing. Accounts, refunds, real payments and calendar sync are outside the course demo.

### Studio applications

The demo can save a studio application and read back its pending status. The studio can state that it’s authorized to apply. Actual verification and permission to publish a listing would happen before real onboarding. See [provider onboarding](provider-onboarding.md).
