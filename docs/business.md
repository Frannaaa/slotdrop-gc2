# SlotDrop | Business Case

**Empty slot, better price.** SlotDrop lists seats that a studio has released in a session that is already going ahead and starts within the next 72 hours. The first catalog is beginner-friendly creative workshops in Quezon City.

> **What is real and what is simulated.** Studio names, activities and published prices come from each studio's public website, checked on 29–30 October 2026 (sources in [section 8](#8-studio-research)). Session dates, released seats, booking deadlines, offer prices, bookings and payments are simulated for this course. No studio has agreed to a partnership, and no customer demand has been measured.

| Section | Brief |
|---|---|
| [1. Summary](#1-summary) | |
| [2. GC1 traceability](#2-gc1-traceability) | 4.1 |
| [3. Funnel map](#3-funnel-map) | 4.2 |
| [4. Business rules](#4-business-rules) | 4.3 |
| [5. Revenue features, with a number](#5-revenue-features-with-a-number) | 4.4 |
| [6. What the owner does with the numbers](#6-what-the-owner-does-with-the-numbers) | 4.5 |
| [7. Customer, supply and discovery](#7-customer-supply-and-discovery) | |
| [8. Studio research](#8-studio-research) | |
| [9. Competitors](#9-competitors) | |
| [10. Risks and what is still unknown](#10-risks-and-what-is-still-unknown) | |
| [11. Studio applications](#11-studio-applications) | |

## 1. Summary

| Question | Our answer in GC2 | What it means for the business |
|---|---|---|
| Who is it for? | Young professionals around Katipunan and nearby Quezon City who plan an activity a few days ahead. Students are a secondary group. | Test real demand and willingness to pay here before expanding to other areas. |
| Where do the seats come from? | A studio releases a **limited number of seats** in a class that is already confirmed to run. | The studio must set those seats aside and keep the count accurate. We do not assume every advertised class has vacancies. |
| How does SlotDrop earn? | A modeled **10% commission** on each confirmed booking, taken from the studio's share. | We earn per completed booking, not per listing or page view. The rate is our proposal, not a negotiated contract. |
| What are the two revenue features? | **Released-seat availability with a booking deadline**, and **optional buddy pricing** for two or more people. | The first makes released seats bookable without overselling. The second can bring an extra attendee, but can also discount people who would have paid more. |
| When is a pilot worth running? | When a studio genuinely agrees, manages its released seats separately, and still earns after the cost of serving each extra attendee. | Mock bookings and website research do not prove demand. |

**Decision.** Run a narrow, reliable released-seat pilot, not a broad activity marketplace. Offer the buddy price selectively, not on every session: [section 5](#5-revenue-features-with-a-number) shows that a bigger booking does not always mean more money.

## 2. GC1 traceability

Quotes are from our GC1 proposal (page numbers in brackets) and the instructor's GC1 feedback.

| From GC1 | What we wrote in GC1 | Where it shows up in the build |
|---|---|---|
| **Target market** | "a wide range of people who are looking for last-minute appointment availability … people in need of a quick and cheap service that they can book on a last minute basis" (p.1) | We narrowed this, as the feedback asked. Home opens with "Nearby activities / Next 72 hours". Every card shows the area and city, the start time and the booking deadline, so someone deciding within three days can compare quickly. `GET /api/slots` only returns sessions starting in the next 72 hours. |
| **Problem statement** | "it can be hard for one to get an appointment soon, especially with popular service providers whose next available date is weeks or months away" (p.1). For providers: "a lost appointment is still lost money" (p.2) | **Customer:** Home and Browse list only seats that can still be booked now, with seats left and "Book before …" on each card. **Studio:** the Owner screen releases seats in a session that is going ahead (`POST /api/slots`), and can pause or resume them (`PATCH /api/slots/:id`). |
| **Value proposition** | "Empty slot, better price." (p.1). Customers "get guaranteed appointments that can occur much sooner, alongside getting them at a much lower price"; providers "profit off of empty slots rather than making no money at all" (p.2) | **Read on Home:** "A free evening. An open seat." and "Book nearby activities happening in the next 72 hours, with released seats and upfront prices." **Experienced on every card and on Selection:** the offer price beside the regular price, and the total for the chosen number of people. We no longer promise that popular studios always have openings. |
| **Monetization model** | GC1 had no monetization section. The feedback notes: "Revenue appears only in the canvas (a commission and featured placements) with no rate or price." | A 10% commission on the accepted booking amount. The rate is `COMMISSION_BASIS_POINTS` in `server/config/business.js`. The money is computed in `priceQuote()` in `server/services/pricing.js`, used by both `GET /api/pricing/quote` and `POST /api/bookings`. The fee and the studio's payout are saved on every booking. Featured placements: Final Project. |
| **Core platform features** | Phase 1 roadmap (pp.6–7): Auth & Roles · Slot Manager · Marketplace Feed · Simulated Booking · User Schedules | See the table below. |

### Core platform features: built now or Final Project

| GC1 feature | GC1 system logic | GC2 status |
|---|---|---|
| Slot Manager | "Stores service, date/time, location, original price, discounted price, and availability." | **Built.** Owner screen; `POST /api/slots`, `PATCH /api/slots/:id`. |
| Marketplace Feed | "Displays only upcoming slots that are still available." | **Built.** `GET /api/slots` hides inactive, paused, not-confirmed, full and expired sessions. Home shows up to three, and Browse lists them all with a search box and category buttons. Page controls for Browse are in review (PR #63). |
| Simulated Booking | "Checks availability, marks the slot as booked, and creates a booking record." | **Built on the server.** `POST /api/bookings` checks seats and saves in one transaction; `GET /api/bookings/:id` reads the receipt back. The Checkout and Confirmation pages are in review (PR #43). |
| User Schedules | "Shows bookings associated with the logged-in customer or provider." | **Partly built.** The Owner screen lists saved bookings (`GET /api/bookings`). A customer's own schedule needs accounts: Final Project. |
| Auth & Roles | "Stores the user's account type and limits features based on their role." | **Final Project.** The GC2 brief does not require login. |
| Search & Filters (GC1 Phase 2) | "Displays slots that match the selected criteria." | **Brought forward** because Browse must narrow the list. The Browse page narrows by search text and category. `GET /api/slots` also accepts area, date, people, activity type, one attribute and sort, which the page does not use yet. |
| Provider Analytics (GC1 Phase 2) | "Calculates metrics from total slots, booked slots, and completed bookings." | **Partly built** as the five owner numbers (`GET /api/metrics`). |
| Time-based price drops, favorites and alerts, cancellations and reviews, admin panel, real payment | GC1 Phase 2 | **Final Project.** |

### What we changed from GC1, and why

| GC1 | GC2 | Why |
|---|---|---|
| Any appointment-based service | Near-term leisure workshops, starting with Quezon City | A small catalog is easier to compare and to supply. Whether this segment fits still needs evidence. |
| Cancelled or empty appointment slots | Seats a studio explicitly releases in a session that is already running | An opening is not a guarantee of attendance, and popular studios may have no spare seats. |
| Three data stores, one per role (customer, provider, admin) | Tables by entity: providers, services, slots and bookings (plus studio applications) | The GC1 feedback asked us to "organize data by entity rather than by role". |
| A 5-minute hold in the wireframe | No hold. Selection is a preview; seats and price are checked again when the booking is saved. | A countdown that reserves nothing would be misleading. |
| No detail page in the wireframes | A Detail screen for each session | The feedback noted it was missing, and the brief requires it. |
| Login, payment gateway, maps | Simulated payment, no login, stored area names | Allowed by the GC2 brief. Real integrations are Final Project work. |

### How we answered the GC1 feedback

| Instructor's question | Our response | Where |
|---|---|---|
| Which providers will list first, and why would they post on SlotDrop on top of their own booking system? | No partner is signed yet. Our research priority is Laro Ceramics (Katipunan) and Tahanan Pottery (a published weekend schedule). The reason to list is extra income from a few seats in a class that is running anyway, without discounting the rest. | [7](#7-customer-supply-and-discovery), [8](#8-studio-research) |
| Name your closest competitors in the Philippines. | ClassPass Manila and the studios' own booking sites. | [9](#9-competitors) |
| Popular providers rarely have empty slots. How does that change the promise? | We stopped promising popular studios. The promise is now "a released seat in a session that is going ahead". | [2](#2-gc1-traceability), [7](#7-customer-supply-and-discovery) |
| How do you handle ghost slots, providers who refuse to discount, and deal-only customers? Can providers set a minimum price? | The studio sets both the standard and the buddy price, releases only the seats it chooses, and can pause sales. The server rechecks seats when a booking is saved. | [4](#4-business-rules), [10](#10-risks-and-what-is-still-unknown) |
| What commission will you charge, who pays it, and what will you build with? | 10% of each confirmed booking, taken from the studio's share. The stack and versions are in the [README](../README.md). | [5](#5-revenue-features-with-a-number) |
| Who exactly is your last-minute customer? | Young professionals around Katipunan, UP Village and nearby Quezon City. Age, income and frequency are still unmeasured. | [7](#7-customer-supply-and-discovery) |
| Consider a simple way to reopen cancelled slots in Phase 1. | The owner can release more seats, pause a session and resume it. Customer cancellations and refunds are not built. | [4](#4-business-rules) |

## 3. Funnel map

SlotDrop earns only when a visitor reaches a saved booking. No conversion events are tracked yet, so "the number it moves" is what we would measure, not a result.

| Stage | Screen | Page elements used, and why those | Endpoint behind it | The number it moves |
|---|---|---|---|---|
| **Browse** | Home | One-line value proposition and up to three session cards. Three cards, not the full list, so the offer is understood before the visitor has to filter. | `GET /api/slots` | Home visits that open Browse or a session |
| **Browse** | Browse | Session cards, a search box, All / Creative / Active buttons, a line saying how many sessions match, and a Refresh button. Cards, not a table, because each session needs its time, deadline, seats left and price read together. Buttons for the category, not free text, because there are only two categories. The search box and buttons narrow the list that is already loaded, so results change as the visitor types. Previous / Next page controls are in review (PR #63). | `GET /api/slots`. The route also accepts `?q=`, `?category=`, `?page=` and `?limit=`. | Click-through to Detail |
| **Select** | Detail | One session's studio, activity, inclusions, preparation notes, start time, duration, booking deadline and seats left. Shown as a labelled list so the facts that decide a booking are not buried in a paragraph. | `GET /api/slots/:id` | Detail visits that continue to Selection |
| **Select** | Selection | A number field for people, and a summary line: people × price = total, with "Buddy price applied" when it applies. A number field, not a dropdown, because a booking can be for 1 to 100 people. The price comes from the server each time the number changes. No seat is held here. | `GET /api/slots/:id` and `GET /api/pricing/quote`, loaded in parallel | Selections that continue to Checkout |
| **Confirm** | Checkout *(in review, PR #43)* | Labelled name and email fields, a payment dropdown with two simulated options, a checkbox to accept the total, and the Submit button. A dropdown for payment, not free text, because the server accepts only `pay_on_site` and `mock_card`. The checkbox makes the customer agree to the exact total before anything is saved. | `POST /api/bookings` | Checkout completion (each `requestId` counted once) |
| **Save** | Confirmation *(in review, PR #43)* | Booking reference, seats, price per person, saved total and payment choice. The page fetches the booking by its ID, so a refresh shows what the database saved, not a total the browser calculated. | `GET /api/bookings/:id` | Confirmed bookings and average booking value |
| *Manage* | Owner | A form to release or edit seats, a table of saved bookings and five number cards. Forms and tables are kept apart so changing an offer cannot be mistaken for editing a past booking. | `GET /api/owner/catalog`, `GET /api/bookings`, `GET /api/metrics`, `POST` and `PATCH /api/slots` | Seats released and sessions close to full |

## 4. Business rules

Each rule is written the way the owner would say it. Every rule is enforced on the server.

| # | Rule, in plain words | Enforced where (route / function) | What the customer sees when it applies |
|---|---|---|---|
| 1 | "We only sell seats a studio has released in a session that is definitely running." | `POST /api/slots` → `createOffer()` refuses a session not marked as going ahead. `GET /api/slots` → `listSlots()` shows only active, open, confirmed sessions. | Only eligible sessions appear. A link to one that is no longer eligible says "This session is unavailable." |
| 2 | "Booking closes at each session's deadline." | `createOffer()` and `editOffer()` require a deadline that is in the future and before the start. `listSlots()` and `checkBookable()` reject a session past its deadline. | "Book before …" on every card. After the deadline the session leaves the list, and saving returns 409 "This session is no longer open for booking." |
| 3 | "We only show sessions starting in the next 72 hours." | `DISCOVERY_HOURS` in `public/js/business-config.js`, applied by `listSlots()` and `checkBookable()`. | Home says "Next 72 hours". A later session appears once it enters the window. |
| 4 | "The offer must be cheaper than the regular price, and the buddy price cheaper than the offer." | `createOffer()` and `editOffer()`, plus price constraints in `db/schema.sql`. | The regular price is shown beside the offer price on every card. |
| 5 | "The buddy price is for two or more people in one booking." | `priceQuote()` in `server/services/pricing.js`, used by `GET /api/pricing/quote` and `POST /api/bookings`. The tier is saved as `bookings.pricing_type`. | The card says "₱2,565.00 each when 2+ book together". Selection shows "Buddy price applied". Two separate one-person bookings do not combine. |
| 6 | "Nobody can book more seats than we released." | `POST /api/bookings` → `createBooking()` locks the session row and calls `checkBookable()` before saving. `editOffer()` cannot reduce seats below those already booked. | "4 seats left" on the card. Asking for more returns 409 "Only 4 seats are left for this session." and nothing is saved. |
| 7 | "The server sets the price, not the browser." | `bookingRequest()` rejects any field it does not expect, such as `total`. `priceQuote()` recomputes the price, fee and payout in whole centavos. | The card says "Price preview. Rechecked before saving." If the price changed, saving returns 409 "The price for this booking changed. Please review the new total." |
| 8 | "One click, one booking." | Each booking carries a unique `request_id`. `createBooking()` returns the saved receipt for an identical retry and 409 for a reused key with different details. | A lost connection can be retried safely. The customer gets the same confirmation, not a second booking. |
| 9 | "A receipt never changes after it is saved." | `bookings` stores the price, total, commission rate, fee and payout at the time of booking. Editing an offer never updates them. `GET /api/bookings/:id` → `findReceipt()`. | Confirmation shows the price that was accepted, even if today's offer is different. |
| 10 | "We can pause a session, but we cannot cancel one that people have booked." | `PATCH /api/slots/:id` → `editOffer()` returns 409 when a session with confirmed bookings is cancelled, and rechecks the deadline and seats before sales resume. | A paused session leaves the list. Existing confirmations stay valid. Refunds and rebooking are not built. |
| 11 | "We keep 10% of each confirmed booking, out of the studio's share." | `COMMISSION_BASIS_POINTS` in `server/config/business.js`, applied by `priceQuote()` and saved with each booking. | The customer pays the total shown. There is no extra fee line. |

Errors never show a success screen: the API answers 400 for invalid input, 404 for an unknown session or booking, 409 for a seat, price or retry conflict, and 503 when the database is unavailable. Database constraints back these rules up, but the booking transaction is what enforces them.

Not in scope for GC2: account security, real card handling, and syncing with a studio's own calendar.

## 5. Revenue features, with a number

Both examples use the seeded Laro Ceramics session. Laro publishes mug-making + painting at **₱3,000**. Our sample offer is **₱2,700** standard and **₱2,565** per person for two or more, with **4 released seats**. Laro has not approved these offers. The commission is 10% of the accepted amount and comes out of the studio's share. All figures are before SlotDrop's operating costs and the studio's cost of serving an attendee.

| Booking | Customer pays | SlotDrop's 10% | Studio receives |
|---|---:|---:|---:|
| 1 standard seat | ₱2,700 | ₱270 | ₱2,430 |
| 2 standard seats | ₱5,400 | ₱540 | ₱4,860 |
| 2 buddy seats | ₱5,130 | ₱513 | ₱4,617 |

### Feature A: released-seat availability

| Saved in the database | Enforced on the server |
|---|---|
| `slots.capacity`, `starts_at`, `booking_closes_at`, `status`, `runs_as_scheduled`; `bookings.quantity` | `listSlots()` shows only eligible sessions with enough seats left. `createBooking()` locks the session and refuses a full, closed or expired one. |

**Worked example.** A released seat that nobody books earns nothing. Booked at the standard offer, it earns the studio ₱2,430 and SlotDrop ₱270. Now suppose two friends take the buddy price (₱5,130), leaving 2 of the 4 seats. A third customer asks for 3 seats. Without a check we would record ₱7,695 in bookings and ₱769.50 in commission for a group that cannot all be seated. The server refuses the request with 409 and saves nothing.

**So** we count commission only on seats the studio really released, and we would rather refuse a booking than oversell one. Accurate seat counts protect the revenue we earn. They do not prove that demand exists.

### Feature B: buddy pricing

| Saved in the database | Enforced on the server |
|---|---|
| `slots.offer_price_centavos`, optional `slots.buddy_price_centavos`; `bookings.pricing_type`, `unit_price_centavos`, `total_price_centavos`, `platform_fee_centavos` | `priceQuote()` picks the buddy price only for two or more seats in one booking, recomputes the total, and the accepted amounts are saved. |

**Worked example.** The same buddy booking is good or bad for us depending on what would have happened without it.

| Without buddy pricing… | With a 2-seat buddy booking (₱5,130) | Result |
|---|---|---|
| **Both people would have paid the standard price** (₱5,400) | Customers pay **₱270 less** (−5%). SlotDrop's fee falls **₱27**. The studio receives **₱243 less**. | We discounted two sales we already had. |
| **Only one would have come, and the second seat stays empty** (₱2,700) | The booking grows by **₱2,430** (+90%). SlotDrop's fee rises **₱243**. The studio receives **₱2,187 more**. | The second seat is new income, if serving that person costs the studio less than ₱2,187 and nobody else would have bought the seat. |

**Break-even.** A buddy booking that brings a new person adds ₱243 to our fee. One that would have happened anyway at the standard price costs us ₱27. The two cancel out when 1 buddy booking in 10 brings a new person (27 ÷ (243 + 27) = 10%). The studio's break-even is the same 10% before its cost of serving the extra attendee, and higher after it.

**So** buddy pricing pays only when it brings a person who would not have come otherwise, and it needs to do that in more than 1 of every 10 buddy bookings. We keep it optional for each session and let the studio decide, and we do not treat a larger booking as proof of a better result. These are two scenarios, not forecasts: we have no data yet on studio costs, conversion or whether studios would accept the rate.

**Money convention.** Amounts are stored in whole centavos. Fee per seat = round(price per seat × commission basis points ÷ 10,000), then multiplied by the number of seats. Studio payout = total − fee. The quote, the saved booking and the examples above all use this rule.

General discounts are not counted as a third feature.

## 6. What the owner does with the numbers

The example values are after one 2-seat buddy booking on the Laro session.

| Owner number | What it counts | Example | The decision it supports |
|---|---|---|---|
| `bookingCount` | Confirmed bookings, not seats | 1 | Check it against the list of saved bookings. One booking for two people is one sale, not two, so we do not overstate conversions. |
| `platformRevenueCentavos` | The sum of saved commission fees | ₱513 | Compare commission with what it costs to find and support customers. This is not profit, and it is not the total customers paid. |
| `averageOrderValueCentavos` | The average total of a confirmed booking | ₱5,130 | Compare one-person and shared bookings before offering the buddy price on more sessions. A higher average alone does not mean a better margin. |
| `topSellingService` | The activity with the most confirmed seats | Laro mug-making + painting, 2 seats | Look for similar sessions to add, but only once the bookings are real. Seeded examples do not show popularity. |
| `nearlyFullSessionCount` | Open sessions in the next 72 hours with 1–25% of released seats left (sold-out sessions are excluded) | 0, because 2 of 4 seats remain | Ask that studio whether it can release more seats. A nearly full release does not mean the whole class is nearly full. |

**Check.** Add a second booking for one standard seat in the same session. The numbers should become: 2 bookings, ₱783 in fees, ₱3,915 average booking, 3 seats for the top activity, and 1 nearly full session because 1 of 4 seats remains. Paused and expired sessions drop out of the nearly-full count, but their saved bookings still count in the totals. There is no separate card for total sales or seats sold.

## 7. Customer, supply and discovery

### Who we are building for

**Customer.** Young professionals who live, study or work around Katipunan, UP Village and nearby Quezon City, can pay for an occasional leisure activity, and sometimes decide within three days. We would recruit by location, leisure spending and planning habits. Their age range, income, willingness to pay and how often they would book are not yet measured. Students are a secondary group; we do not assume workshops are affordable for them.

**What the customer needs.** To choose a workable activity without checking several calendars and finding out the deadline or materials cost late. So the date and time, branch, duration, included materials, collection requirements, total price and last booking time are all shown before we ask for contact details.

**What the studio needs.** Extra income from a few seats in a class that is running anyway. SlotDrop should sit alongside direct booking. It must not require a studio to run a class that would not otherwise happen, or to discount all its remaining seats.

**Working value proposition.** Find an activity near you happening within 72 hours, compare the studio's price and deadline, and book a released seat. We keep "Empty slot, better price." as the idea, without promising that popular studios always have openings.

### Supply is not the same as demand

A studio may run classes every weekend while one customer does pottery once a month or less. Recurring schedules can refill the catalog. They do not prove weekly use. Painting or dance may give other reasons to come back, but repeat visits across categories are still a hypothesis. We would start with studios that have genuinely recurring spare seats, not simply the best-known names.

### Launch area

Katipunan and UP Village are the first area for finding studios. Cubao, Scout Tobias and Eastwood are separate candidates for expansion. The app filters by stored area names. It does not calculate distance or travel time.

### How sessions are classified

- **Category** is the broad group: creative or active.
- **Activity type** is the main activity: pottery, painting, pilates, dance or other.
- **Technique and inclusions** describe the same activity, for example handbuilding, with painting, materials and firing included.
- **Each slot** is one dated session with one count of released seats.

A mug-making session stays under pottery even when painting is included. A search for "painting" can still find it through its inclusions, and both routes open the same session and use the same seats. We never copy a session into a second category.

### What discovery supports

`GET /api/slots` accepts search text, category, area, date (today, tomorrow, weekend), number of people, activity type, one attribute, sort order and paging. Price sorting uses the per-person price for the chosen number of people. The attributes are a fixed list: beginner, handbuilding, wheel-throwing, painting-included, materials-included. We avoid labels such as "popular" that we cannot support with evidence.

The Browse page loads the eligible sessions once and narrows them in the browser with the search box and the All / Creative / Active buttons. Paging on the page is in review (PR #63). There is no price slider, map filter or studio-created tags. Pilates is supported by the data but has no bookable sessions; crafts, jewelry and printmaking are research only.

## 8. Studio research

Official websites were checked on 29–30 October 2026. A published product shows that a format and price were advertised. It does not show future seats, spare capacity, the studio's consent, or permission to resell. The sample catalog uses real studio names and published facts with source links; its dates, seats, deadlines and offers are simulated. Branch, date, price, inclusions and policies must always be checked together.

### In or near the launch area

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

### Expansion candidates

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

### Reference only

- **Core Pilates.** The published ₱1,150 single-session credit is not a dated class, and the class duration and timetable are not verified. Source: https://corestudio.ph/class-packages
- **Studio Matisse, San Juan** (outside the launch area). Its policy requires reservations at least two days ahead. With a 72-hour discovery window, a 48-hour deadline leaves only 24 hours to sell, and a 72-hour deadline leaves none. This shows how a studio's lead time can rule it out. It is not a partner, and we do not claim it accepts resale. Source: https://studiomatisse.myshopify.com/pages/studio-policies

### Research priority

1. Verify Laro's next dated QC session and Tahanan's recurring schedule.
2. Use Marz to test whether appointment-based crafts fit the model at all.
3. Keep Metals & Gems as a higher-cost comparison until its duration and availability are resolved.

This is our proposed next step, not a ranking backed by bookings.

## 9. Competitors

| Alternative | What it already does | Our response |
|---|---|---|
| **ClassPass Manila** | A named local option for finding fitness and wellness classes. Its partner pages describe selling excess capacity, pricing and inventory tools, and rate protection. These are ClassPass's own claims. | Stay much smaller: a cash price set by the studio, one release of seats, no membership or credits. This is a choice of focus, not proof that we are better. |
| **Studios' own sites** | Laro, Bumi & Ashe and Tahanan already publish products, schedules and policies. Customers can book without a marketplace. | Show near-term details side by side across willing studios. A studio needs extra customers or simpler selling to justify our fee. |
| **FunNow** | A near-term experience-booking service we use as an analogy. We did not confirm that it operates in the Philippines. | We do not claim last-minute booking is new, and we do not present FunNow as a confirmed local competitor. |

Sources: https://classpass.com/search-index/manila | https://classpass.com/partners/faqs | https://www.events.myfunnow.com/whyfunnow-en

ClassPass is a comparison. It is not evidence that our 10% fee, manual seat releases or customer segment will work.

## 10. Risks and what is still unknown

| Risk (from our SWOT and the feedback) | What we do now | What is still unknown |
|---|---|---|
| **Ghost slots and overselling** | A separate release of seats, a booking deadline, a "running as scheduled" flag, pause controls, and a database lock when saving. | There is no sync with the studio's calendar. Our lock cannot stop a seat being sold directly, so the studio must set seats aside or update the count reliably. |
| **A studio refuses to discount or pay the fee** | The studio sets the standard and buddy prices and can pause sales. | No signed partner, no minimum payout, no evidence that 10% is acceptable. We need to ask for the lowest payout and trial conditions a studio would accept. |
| **Discounts replace full-price sales** | Release only a few seats; keep buddy pricing optional; work through both buddy scenarios in [section 5](#5-revenue-features-with-a-number). | We have not measured how many direct sales would be lost or gained. |
| **Deal-only customers who do not return** | Show the session's value, location and inclusions clearly; never promise permanent discounts. | No study of repeat visits or willingness to pay. Pottery is unlikely to be weekly. |
| **Too little suitable supply** | A small area; verify recurring, confirmed sessions and their lead times. | Published catalogs are not a supply pipeline. If too few sessions qualify, we revisit the area or the 72-hour window. We do not invent dates. |
| **Materials, preparation or collection surprises** | Show technique, inclusions, preparation and collection notes on Detail. | Real studio data must be verified before a pilot. Cancellations, refunds and real payment are not built. |

## 11. Studio applications

ClassPass separates submitting business information from setting up a profile, and Klook reviews merchant applications before giving access to listing tools. SlotDrop follows the same order: **Apply → Review → Set up.**

The build has a studio profile page, a validated application form and a saved "pending" status that can be read back. An application records that the applicant says they are authorized. It does not prove it. Applying does not publish a page, give account access or confirm a partnership. Test applications use sample contacts, which are kept private. Real profile ownership and real seat releases need verified onboarding later.

Sources checked 30 October: https://classpass.com/partners/how-it-works | https://merchant.klook.com/introduction
