# SlotDrop — GC1 revised concept (post-feedback working draft)

> **Status:** Proposed revision prepared after the GC1 assessment, not the original GC1 submission and not a claim that the instructor has regraded it. Business assumptions and decisions below require Group 3's own review and endorsement. The historic eight-page *Group 3 - GC1.pdf* and two-page *GC1_feedback_grp3.pdf* remain the source of record. The GC2 application and [current business case](business.md) are the implementation reference, not retroactive GC1 deliverables. Public studio facts were checked in October/November 2026; no partnership, unused-seat frequency, conversion rate or customer willingness to pay has been verified.

## I. Business concept brief

**Name and tagline:** **SlotDrop — Empty slot, better price.**

**Concept:** A two-sided, near-term booking marketplace for *released seats in classes that are already scheduled to go ahead*, initially beginner-friendly pottery and creative workshops near Katipunan and neighboring Quezon City areas. A provider explicitly chooses the seats and price to release. Customers can compare the start time, area, released capacity, preparation cutoff, discounted cash price and total for their group before making a simulated GC2 booking. Unlike GC1's broad "popular provider with a cancellation" promise, SlotDrop does **not** guarantee seats at popular studios. A class that regularly sells out may offer no supply.

**Proposed initial customer segment — hypotheses, not market research:**
- **Primary:** Working adults **22–35**, living, studying or working around **Katipunan, UP Village, Teachers Village and nearby QC**; test a **₱35,000–₱80,000 gross monthly income** screening band. They occasionally make a plan within one to three days, enjoy low-commitment creative experiences with a friend or partner, and may consider a **₱2,500–₱3,000** workshop. The age, income, willingness-to-pay and booking frequency are **proposed interview criteria**, not measured facts.
- **Secondary:** University students **18–24** who are interested in social activities and have enough discretionary spending for an offered class. Their lower price ceiling is a potential mismatch: interview them separately before advertising them as the core paying segment.
- **Supply-side customer:** Independent workshop operators offering already-confirmed sessions with specific capacity and preparation cutoffs. Test partners that can reserve a small, credible allocation (**initial hypothesis: 1–4 seats**) without compromising direct reservations. No studio has committed.

**Problem:** The customer has to compare separate studio calendars, dates, prices and availability, often without a convenient same-day or next-few-days view. The studio may finish a confirmed class with seats that could have been sold, but we **do not know how frequently this happens**. A surprise cancellation and an already-underfilled class are different sources of supply; both are only usable if the studio still has enough time to prepare.

**Value for both sides:** A customer sees an eligible, explicit release with its cutoff and an accurate group total; an operator may earn additional proceeds on a seat that would otherwise be unsold. The condition is **incrementality**: a discounted buyer replacing a full-price direct buyer can reduce the studio's return. The marketplace is therefore a pilot hypothesis, not a proven advantage over existing studio websites.

## II. Strategic analysis (two required frameworks)

### A. SWOT with an operational response

| | Evidence or hypothesis | Response / decision rule |
|---|---|---|
| **Strength** | Clear seat count, local creative niche, server-checked group pricing and recorded booking | Demonstrate honest inventory and price/receipt consistency; do not claim supplier exclusivity |
| **Weakness** | No live studio partnerships, no external calendar sync, no measured demand or unfilled-seat rate | Start with one studio, obtain past attendance records and set aside a physically exclusive release allocation |
| **Opportunity** | Studios run recurring workshops and may have some spare seats before a preparation cutoff | Test a narrow four-week release at standard price before introducing buddy discounts |
| **Threat: ghost/double-sold seats** | External direct channels could sell the same seat | Partner must ring-fence the allocated seats and reconcile manually; within SlotDrop, booking locks/checks capacity |
| **Threat: premium provider refuses discount** | A lower public price can dilute brand or direct sales | Provider chooses offer; negotiate a minimum acceptable **net payout** before listing; do not claim the current app automatically enforces a provider-specific floor |
| **Threat: deal-only customers / cannibalization** | A discount could replace direct full-price customers | Track direct + marketplace sales, ask counterfactual intent, test buddy rate selectively, stop if the incremental gain fails to cover discount and servicing costs |
| **Threat: existing booking platforms** | ClassPass already markets excess-inventory optimization; Klook lists local experience bookings | Do not claim that discounting spare capacity is unique; test the narrower local creative-workshop proposition |

### B. Business Model Canvas

| Block | Revised proposed model |
|---|---|
| Customer segments | QC working adults seeking spontaneous creative plans; independent class studios with confirmed sessions and potentially unused released capacity; students as exploratory secondary |
| Value proposition | For customers: nearby, clearly priced and bookable released seats. For studios: a possible incremental-sale channel while preserving control of allocation and cutoff |
| Channels | Studio co-posts, neighborhood community groups, organic search and local creator content; compare these with acquisition cost |
| Relationships | Clear confirmation/reference for customers; studio self-service release/pause and transparent financial split; human reconciliation for initial partners |
| Revenue streams | **Proposed 10% commission** on a confirmed booking, deducted from studio payout; no listing fee in GC2. Paid placements are **deferred**, not modeled as current revenue |
| Key activities | Recruit/verify partners, check released inventory, publish eligible offers, quote and save simulated bookings, reconcile bookings, measure incrementality |
| Key resources | Participating studio inventory/permission, API-backed catalog, database and dependable transaction logic, relevant neighborhood demand |
| Key partners | One willing local studio first; later other creative workshop operators. A researched studio is **not** automatically a partner |
| Cost structure | Hosting, customer acquisition, support, reconciliation, onboarding and payment fees if real payments are later added; no measured CAC or margin has been established |

## III. Competitor and substitute analysis

Competition is defined by the **customer job** (find and book a creative activity soon) and the **studio job** (fill a confirmed class without eroding direct revenue).

| Category | Verified alternative | Why it matters | What we must demonstrate |
|---|---|---|---|
| **Direct / closest marketplace alternative** | [Klook Philippines — Wabi Sabi pottery workshop listing](https://www.klook.com/en-PH/activity/116888-pottery-workshop-wabi-sabi/) | A consumer can discover pottery classes through an existing experience marketplace. The listing is Philippine-based; availability of a purchasable pass on the reviewed page was **not confirmed** | A QC-focused released-seat offer with a transparent cash price and a genuinely bookable near-term slot, not merely another listing |
| **Direct adjacent class-capacity model** | [ClassPass Manila](https://classpass.com/search-index/manila) and [ClassPass partner policies](https://classpass.com/partners/faqs) | ClassPass already advertises monetizing empty class inventory with a payout floor and inventory tools, mainly in fitness/wellness. The underlying spare-seat business model is **not unique** | Evidence of a useful niche in creative workshops and supplier proceeds, without pretending to have better technology at GC2 |
| **Indirect / strongest channel substitute** | [Laro Ceramics direct booking](https://laro-ceramics.com/products/mug-making-class-manila), plus Bumi & Ashe / Tahanan direct sites | Customers can already book a studio without paying an intermediary; studios may prefer to keep all booking revenue and own the relationship | Show **incremental new customers** or easier discovery, not just an imposed commission |
| **Indirect adjacent booking competitor** | [Fresha Philippine salon bookings](https://www.fresha.com/lp/en/bt/beauty-salons/in/philippines) | Philippine beauty/salon bookings and booking-management alternatives demonstrate that the broad original GC1 appointment concept faces established competitors; not evidence of QC pottery inventory | Keep the GC2 market narrow rather than claiming to beat salon marketplaces |
| **Auxiliary discovery channels** | Studio Instagram / Facebook accounts and Google Maps / search | A customer may discover an activity and contact the studio directly; the provider can market without SlotDrop. These compete for *attention and discovery*, not as identical booking products | Make session comparison/price/cutoff information meaningfully easier than visiting many pages or sending DMs |
| **Auxiliary leisure-budget substitutes** | A cinema date, café outing, free neighborhood event or at-home craft | Customers can spend a discretionary afternoon differently even when they have no interest in workshop booking | Test whether the experience, convenience and final out-of-pocket price justify choosing a workshop |

**Reference analogies, not verified closest Philippine competitors:** HotelTonight (unused hotel inventory), FunNow (near-term activities; Philippine operation unconfirmed). We can learn from their mechanisms without saying they directly compete for QC studio seats.

**Competitive conclusion to test:** SlotDrop's defensible opportunity is *not* "we invented last-minute discounts." It may be a small, location-specific, reliable released-seat channel that shows a peso price and allows studio-controlled allocations. A partner should only join if it earns enough incremental net proceeds to offset the commission, discounts and extra attendee costs.

## IV. Monetization, core features and stack (missing as standalone sections in GC1)

### Monetization and a worked trade-off

The **proposed** platform commission is **10% of the accepted simulated booking amount**, paid by the **studio** through a deduction from its payout. It is not an extra customer surcharge. Example seeded Laro mug-making session:

| Booking outcome | Customer pays | SlotDrop commission | Studio receives before attendance cost |
|---|---:|---:|---:|
| 1 standard seat (₱2,700) | ₱2,700 | ₱270 | ₱2,430 |
| 2 standard seats (₱2,700 each) | ₱5,400 | ₱540 | ₱4,860 |
| 2 buddy seats (₱2,565 each) | ₱5,130 | ₱513 | ₱4,617 |

If both customers would have paid the standard price, the buddy rate loses the studio **₱243** and SlotDrop **₱27**. If only one would have bought a standard seat, then a buddy pair adds **₱2,187 studio payout before the extra attendee cost** and **₱243 platform fees** compared with that one standard buyer. This is why a discount must be tested for incrementality; bigger bookings alone are not proof of profit. An assumed ₱500 marginal attendee cost is a **sensitivity assumption**, not a known studio expense.

**Price control / discount floor:** During a real pilot, the studio would set its minimum acceptable net payout before publication. In the GC2 build the Owner sets the regular, offer and optional buddy prices, and the server enforces valid price ordering. **There is no automatic per-studio minimum-payout policy**; it would require an explicit later feature and agreement.

### Provider and platform financial feasibility (specific test scenario)

The studio's own [Laro mug-making price of ₱3,000](https://laro-ceramics.com/products/mug-making-class-manila) is the **publicly observed anchor**. Our ₱2,700 standard, ₱2,565 buddy and 10% commission are **simulated GC2 business assumptions**, not a supplier quote. A three-hour class already scheduled to run is assumed to have **₱500 additional cost per attendee**, allocated hypothetically across clay/consumables (₱180), glazing/firing (₱170), cleaning/packing (₱100) and handling (₱50). Without studio cost records, we must test ₱300/₱500/₱800 instead of claiming ₱500 is factual. Instructor/rent already committed to a confirmed class are not charged a second time; if the class needs our attendance to go ahead, all added fixed costs must be counted.

| Sale | Net payout to studio | After ₱500 added-seat cost | Decision consequence |
|---|---:|---:|---|
| Direct at ₱3,000 | ₱3,000 | ₱2,500 | Strongest contribution if buyer would book direct |
| SlotDrop standard at ₱2,700 | ₱2,430 | ₱1,930 | **+₱1,930** if the seat was otherwise empty; **−₱570** if a direct sale was displaced |
| SlotDrop buddy at ₱2,565/person | ₱2,308.50 | ₱1,808.50 | Could add a second attendee, but gives up **₱691.50** versus a diverted full-price direct sale |

A **purely hypothetical** four-week pilot with **16 confirmed sessions**, **four released seats each**, and **50% sold** has 32 marketplace seats: 24 standard seats and eight buddy seats (28 bookings). That creates **₱85,320 customer gross value, ₱8,532 SlotDrop fees, ₱76,788 studio payout**, and **₱60,788 studio contribution after 32 × ₱500 attendance costs**. If eight of the 32 attendees would otherwise have paid ₱3,000 direct, deduct their **₱20,000** baseline direct contribution plus **₱2,500** assumed manual studio reconciliation: modeled provider gain **₱38,288** relative to no SlotDrop. On the platform side, **₱8,532 − 28 × ₱50 assumed support − ₱6,000 assumed acquisition/operating budget = ₱1,132** pilot surplus *before* taxes, real payment costs, founder labor, refunds and scaling. It is **not net profit** or a forecast. The model needs roughly **27 seats (42% of the released 64)** just to cover that ₱6,000 platform budget at the assumed sales mix and cost rates.

**Business-model benchmarking:** [Laro's own website](https://laro-ceramics.com/) already advertises friends savings **up to ₱500/person**, so SlotDrop's buddy offer is **not guaranteed to win on price**. [ClassPass](https://classpass.com/partners/blog/classpass-payouts-pricing-policies-rates) offers a customer credit subscription with negotiated minimum partner payouts and demand-sensitive inventory; **there is no verified standard Philippine commission to copy**. [Fresha](https://www.fresha.com/for-business/salon/best-salon-software) combines business software with a published **20% one-time new-marketplace-client commission** model and does not charge marketplace commission for returning/direct customers, subject to local terms; unlike this, SlotDrop's proposed **10% applies to repeat bookings too**. [Klook](https://merchant.klook.com/introduction) provides broad experience distribution and merchant inventory/booking tools, but no standard local workshop commission was verified. The *mechanisms* are the benchmarks; their fees, scope, customers and services are not perfectly comparable.

**Group decision to validate:** Sign a real partner only after obtaining its marginal cost, minimum acceptable after-fee payout, evidence of per-session spare seats and an agreed non-duplicated allocation. Pilot the standard offer first and enable the buddy tier only when it measurably creates extra paid seats across **direct and marketplace** channels. The [GC2 business case](business.md#provider-unit-economics-and-four-week-pilot-scenario-assumptions-not-actual-studio-financials) contains full assumptions, sensitivity and per-platform comparison. These proposed decision rules require Group 3's own review and do not assert that a pilot has run.

### Core features by release

| GC2 scope / current simulation | Final Project / not built |
|---|---|
| Home → Browse → Detail → Selection → Checkout → Confirmation, API-driven discovery, quotes and simulated payment selection | Login and roles, real payment capture/refunds, provider contract/verification |
| Owner release/edit/pause/resume, chosen capacity/deadline, stock and 10% commission computation | Multi-channel calendar synchronization, customer cancellations with eligible seat reopen, notifications and saved customer schedules |
| PostgreSQL saved bookings and receipt readback, idempotent retry, no overselling, five Owner metrics | Admin moderation, advanced revenue analytics, real customer acquisition and conversion tracking |
| Search and category filters; bounded server pagination | Personalized recommendations, automated dynamic price drops, paid placements |

**Correction to original GC1 wireframe:** the pictured five-minute reservation hold was dropped. No seat is actually reserved until a validated server transaction commits a booking.

### Named technology stack

- **Frontend:** Browser-rendered HTML5, CSS and JavaScript, using Fetch to call the API, with responsive phone-width layouts. React is a **future migration**, not a GC2 requirement.
- **Backend:** Node.js and Express APIs; server validates requests and recomputes accepted price and seat availability.
- **Database:** PostgreSQL (development/test uses isolated PGlite where appropriate) with entity tables **providers, services, slots and bookings**, plus related application data. No separate customer/provider/admin copies of slots.
- **Persistence/hosting:** PostgreSQL hosted separately from the public Node/Express deployment; runtime configuration provided through secret environment variables rather than stored in Git.
- **Testing/collaboration:** Postman/Newman, browser DevTools, GitHub PR reviews and CI.
- **Deferred integrations:** Supabase/social login (if selected later), PayMongo/Xendit (if selected later), map/geolocation, email/SMS and provider calendar sync. These are **proposals, not connected GC2 services**.

## V. Product architecture and one end-to-end information flow

**Single entity-oriented data model:** Provider owns activities/services; a service has scheduled or practice *slots*; a slot has released capacity, quote rules, cutoff and status; bookings each point to one slot and preserve the accepted amount, fee, payout, party size and idempotency key. This replaces original GC1's role-based databases, which duplicated slot data.

1. **Offer:** Owner creates a slot and assigns released seats, prices, start/cutoff and a confirmed-to-run flag. The API validates the input, then saves a real database row.
2. **Discover:** Home/Browse requests eligible slots from Express. The database applies availability, booking cutoff and released-capacity rules; paginated Browse reads bounded pages.
3. **Quote:** Detail/Selection asks the server for a quote for a chosen party size. Buddy price applies to parties of two or more when offered. The displayed total is only a preview.
4. **Save:** Checkout POSTs fictional guest information, accepted quote and a stable request ID. Express validates fields, locks the slot row, checks remaining seats and cutoff, recomputes the total and writes the booking **atomically**.
5. **Confirm:** Confirmation GETs the saved receipt by ID. Refresh gets the same stored price/fee. Owner GETs saved booking summaries and the five metrics.
6. **Fail safely:** A stale total or unavailable slot returns an explicit error; a valid retry cannot create an extra booking. No real money moves in GC2.

**Trust boundary:** The browser is not the source of truth for stock, prices or fees. There is no external studio calendar integration: real commercial operation would first require a ring-fenced allocation and direct studio reconciliation.

## VI. Phased roadmap and wireframe completion

| Priority | GC2 MVP and demonstration | Later Final Project |
|---|---|---|
| Provider | Release/edit/pause/resume a few seats; no external sync | Verified partner registration, signed availability rules, floor payouts and calendar sync |
| Customer | Browse/list, Detail, Selection, Checkout, Confirmation on mobile; immutable simulated receipt | Accounts, real checkout/refunds, eligible cancellation/rebooking, saved schedules, alerts |
| Control | Five Owner metrics, real database and rejected overbooking | Partner-level fill rate, financial reconciliations, moderation and permissions |

**Required screens and what each must show:** Home (one-line promise and CTA), Browse (bookable listings with real counts/prices), **Detail (new compared with GC1: date, location, inclusions, provider and deadline)**, Selection/Checkout (party size, total and clear agreement), Confirmation (persistent receipt number), **Owner/Admin (offers, bookings and five metrics)**. The original GC1 proposal attached Marketplace, Provider and Confirmation mockups only. The omitted Detail and Admin views should be represented by new annotated screenshots/wireframes in the revised proposal; this document is a functional specification, **not a substitute for those images**.

**Recommended evidence to obtain before a real pilot:** One studio's four weeks of capacity and sales, exact cutoffs and marginal cost per attendee; ~10–15 target-customer discovery interviews and a separate student sample; an agreed ring-fenced allocation; and side-by-side direct + SlotDrop sales to test cannibalization. These are **proposed research steps**, not completed interviews or agreements.

---

### Post-feedback change log (for the group's review)

| GC1 assessment gap | Draft correction |
|---|---|
| Demographic and psychographic target too broad | Narrow QC age/location/affordability profile with unverified hypotheses |
| No named competitors, SWOT risks untreated | Named Klook/ClassPass/direct sites/Fresha and direct/indirect/auxiliary channels, plus specific risk response |
| Missing monetization, features, tech stack | Explicit 10% studio-paid deduction, conditional economics, built/deferred feature matrix and stack |
| Role-based duplicated stores, unclear flow | Single entity-based PostgreSQL model and six-step quote/save/readback flow |
| Missing Detail and Admin wireframes | Screen specification provided; **actual annotated wireframe images remain for the team to supply** |
| Overpromise of guaranteed popular appointments / five-minute hold | Released seats in already-running classes only, no pre-booking hold |
| Partners/supply evidence missing | Four-week pilot with go/no-go checks; no fabricated partners or demand statistics |

**Sources consulted:** Original *Group 3 - GC1.pdf* (eight pages); original *GC1_feedback_grp3.pdf* (two pages); [ClassPass partner FAQs](https://classpass.com/partners/faqs); [Klook's Philippine Wabi Sabi listing](https://www.klook.com/en-PH/activity/116888-pottery-workshop-wabi-sabi/); [Fresha Philippine listings](https://www.fresha.com/lp/en/bt/beauty-salons/in/philippines); [Laro's published class](https://laro-ceramics.com/products/mug-making-class-manila); [SlotDrop's implemented GC2 business case](business.md). Group members should verify external sources and endorse business judgments before submission.
