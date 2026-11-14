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
| Marketplace Feed and search | “Displays only upcoming slots that are still available.” Home shows up to three eligible sessions. Browse adds search, category buttons and six sessions per page. |
| Simulated Booking | “Checks availability, marks the slot as booked, and creates a booking record.” We added Detail after the GC1 feedback, followed by quantity and quote on Selection, simulated payment on Checkout, and a saved receipt on Confirmation. The server checks stock and price when the booking is saved. The five-minute hold from the wireframe was dropped. |
| User Schedules and Provider Analytics | Partial. Owner can see saved bookings and five metrics. Personal schedules and role-specific reporting need accounts. |
| Auth & Roles, real payments, integrations and paid placements | Deferred to the Final Project. The GC2 demo uses one set of linked provider, service, slot and booking tables. |

## 4.2 Funnel map

The rates are what we’d measure in a pilot. GC2 records bookings and Owner metrics.

| Stage | Screen | What we put there and why | Endpoint | What we’d measure |
|---|---|---|---|---|
| Browse | Home | Up to three dated offers give someone with a free afternoon a quick sense of what’s available. “Browse all sessions” opens the full list. | `GET /api/slots` | Home visits that open Browse or Detail ÷ Home visits |
| Browse | Browse | A card keeps the studio, time, cutoff, seats left and price together. Search takes studio or activity names. Buttons make the two broad categories easy to switch, and six cards per page keep the phone list short. | `GET /api/slots?q=…&category=…&page=…&limit=6` | Browse visits that open Detail ÷ Browse visits |
| Select | Detail | A labelled list puts inclusions, preparation, location and the deadline where a customer can scan them before choosing seats. | `GET /api/slots/:id` | Detail visits that continue to Selection ÷ Detail visits |
| Select | Selection | A number field lets the customer enter the group size directly. The server returns a new price as it changes, so a pair can see what the buddy rate does to the total. | `GET /api/slots/:id`, `GET /api/pricing/quote` | Selection visits that open Checkout ÷ Selection visits |
| Confirm | Checkout | Labelled contact fields show validation errors. A dropdown offers the two simulated payment choices. The agreement checkbox sits with the quoted amount so the customer can see what they’re accepting. | `POST /api/bookings` | Confirmed saves ÷ unique submitted request IDs |
| Save | Confirmation | The page fetches the saved booking by its reference. Refreshing it shows the accepted seat count, price and payment choice again. The reference also lets Owner find the same booking. | `GET /api/bookings/:id` | Saved bookings and average booking value |

Owner sits beside the funnel. The release form changes future availability. The bookings table and five metrics come from saved data via `GET /api/bookings` and `GET /api/metrics`.

## 4.3 Business rules

| Rule, in the owner’s words | Where it’s enforced | What the customer sees |
|---|---|---|
| “Only offer seats we’ve released for a class that’s going ahead.” | `createOffer()` requires the class to be marked as running. `listSlots()` filters for active, open, confirmed sessions with seats left. | Browse shows eligible sessions with their remaining allocation. |
| “Show the next three days. Close each listing at that studio’s cutoff.” | `listSlots()` and `checkBookable()` check the start and cutoff. `createOffer()` and `editOffer()` check the deadline when the offer is saved. | The card says “Book before …”. Passed-cutoff sessions leave Browse. Saving one from an old page returns 409. |
| “Set the regular price above the offer price. The buddy price goes lower if we offer it.” | `createOffer()`, `editOffer()` and the price constraints in [`db/schema.sql`](../db/schema.sql). | The card shows the prices side by side and only shows a buddy price when one is set. |
| “Give the buddy rate to two or more people in the same booking.” | `priceQuote()` selects the tier. `createBooking()` saves it in `bookings.pricing_type`. | Selection displays “Buddy price applied” for a qualifying group. |
| “Never book more seats than we’ve set aside.” | `createBooking()` locks the `slots` row, then calls `checkBookable()` before the insert. `editOffer()` guards against lowering capacity below sold seats. | A request for three when only two remain is refused with 409 and creates no booking. |
| “Ask the customer again if their total changes.” | `bookingRequest()` rejects unsupported inputs. `createBooking()` recomputes the price with `priceQuote()` and compares it with `expectedTotalCentavos`. | Checkout shows a fresh quote after `409 PRICE_CHANGED` and asks for acceptance. |
| “A retry should give the customer their original receipt.” | `bookings.request_id` is unique. `createBooking()` replays an identical request and rejects a conflicting reuse. | A matching retry returns the same reference. |
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

For the pilot we’d look for people near Katipunan or UP Village who sometimes make plans one to three days ahead and can consider a ₱2,500–₱3,000 workshop. That range comes from the initial offers we researched. We’d interview students separately to learn what price works for them. We don’t have a measured purchase frequency yet.

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

| Alternative | What it already does | Our response |
|---|---|---|
| **ClassPass Manila** | A named local option for finding fitness and wellness classes. Its partner pages describe selling excess capacity, pricing and inventory tools, and rate protection. These are ClassPass's own claims. | Use a public cash price for a few pottery workshop seats. Keep the studio in control of the release. |
| **Studios' own sites** | Laro, Bumi & Ashe and Tahanan already publish products, schedules and policies. Customers can book without a marketplace. | Show near-term details side by side across willing studios. A studio needs extra customers or simpler selling to justify our fee. |
| **FunNow** | A near-term experience-booking service we use as an analogy. We did not confirm that it operates in the Philippines. | Use it as a reference for near-term booking. Local comparison focuses on studio-direct sites and ClassPass. |

The GC1 feedback cited HotelTonight and Fresha as precedents for selling spare capacity. The question for SlotDrop is whether it can bring a studio a booking it would have missed through its existing channels.

[ClassPass Manila](https://classpass.com/search-index/manila) · [ClassPass partner FAQs](https://classpass.com/partners/faqs) · [FunNow](https://www.events.myfunnow.com/whyfunnow-en)

### Pilot and risks

| When | What we’d do | What would change our decision |
|---|---|---|
| Before listing | Ask for four weeks of past session records. Check paid seats, late cancellations, what was empty before cutoff, and how much prep time the studio needs. Agree on the lowest payout it will accept and which seats it can set aside. | If spare seats show up after the studio needs to close bookings, try a different studio or adjust the discovery window before recruiting customers. |
| Weeks 1–2 | Release a few seats at the standard price. Recruit nearby prospects through studio posts and local communities. Record seats released, withdrawn and sold. | If inventory disagrees with the studio’s own calendar, pause and reconcile it before reopening sales. |
| Weeks 3–4 | Offer the buddy rate on some comparable sessions and keep the standard price on others. Record direct and SlotDrop sales and ask buyers what they would have done without the offer. | Keep buddy pricing where it adds paid attendees and improves the studio’s proceeds after the cost of serving them. Treat a small sample as directional. |
| End of week 4 | Check whether the studio wants to continue, whether seat counts stayed accurate, and what we earned in fees versus acquisition and support costs. | Repeat locally if the result is promising but unclear. Discuss expansion after both sides see a credible return. |

The main risk is selling a seat that the studio has already sold elsewhere. The server protects the allocation inside SlotDrop. The pilot still needs the studio to set those seats aside because its calendar is separate. We’d also verify materials, lead times and collection terms before listing. Accounts, refunds, real payments and calendar sync are outside the course demo.

### Studio applications

The demo can save a studio application and read back its pending status. The studio can state that it’s authorized to apply. Actual verification and permission to publish a listing would happen before real onboarding. See [provider onboarding](provider-onboarding.md).
