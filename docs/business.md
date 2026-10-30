# SlotDrop | Business Case and Real-Studio Research

Fran + Kat • Working draft • Updated 30 October 2026 • Internal review: 30 October

Decision to review: launch a small QC catalog of provider-released seats in sessions already going ahead. Prioritize beginner creative workshops; test repeat supply before widening the catalog. Young professionals are the primary customer hypothesis; students are secondary. This is a business proposal supported by published examples, not completed customer or supplier validation.

The shared Google Doc is our research workspace. docs/business.md is the versioned GC2 submission draft. Public development PRs and the complete private reference have different implementation status; neither a researched studio nor a sample booking demonstrates a commercial partnership.

## 1. Positioning, customer and supply

Working value proposition: Find an activity near you happening within 72 hours, compare the provider-set price and deadline, and book a released seat. Keep GC1’s “Empty slot, better price.” as the idea, without promising that popular studios always have openings or that every direct price is higher.

Primary recruitment hypothesis: young professionals who live, study or work around Katipunan, UP Village and nearby Quezon City; can pay for an occasional leisure activity; and sometimes decide within three days. Recruit by location, leisure spending and planning behavior rather than assuming an income level. Actual age distribution, income, willingness to pay and frequency remain unmeasured. Students are a secondary segment, not the basis for assuming workshops are affordable.

Customer job: choose a feasible activity without comparing several disconnected calendars and discovering the cutoff or materials cost late. Show date/time, branch, duration, included materials, collection requirements, total party price and last booking time before asking for contact details.

Provider job: earn incremental proceeds from a small allocation in an already-confirmed class. SlotDrop should complement direct booking. It must not require the studio to create an otherwise unviable class or discount all its remaining inventory.

Supply cadence is different from customer frequency. A studio may run classes every weekend while one customer attends pottery monthly or less. Recurring provider schedules can replenish the catalog; they do not prove weekly customer use. Painting or dance may offer other repeat occasions, but cross-category retention is still a hypothesis. Start with suppliers that can identify genuinely recurring spare inventory, not simply the most attractive brands.

Launch geography is a proposed operating boundary, not a distance search feature. Katipunan/UP Village is the first supplier-search area; Cubao, Scout Tobias and Eastwood are separate QC expansion candidates. The app currently filters stored area names; it does not calculate travel time, geolocation or a radius.

## 2. GC1 traceability and deliberate scope changes

| GC1 anchor | GC2 choice and reason |
| --- | --- |
| Proposal p.1: “a wide range of people”; “quick and cheap service” | Narrow to near-term leisure activities and a local supplier search. This makes a small catalog easier to compare; segment fit still needs evidence. |
| Proposal p.1: “Empty slot, better price.”; p.2: “profit off of cancelled/empty appointment slots.” | Use explicit released-seat allocations and provider-set offer prices. An opening is not a guarantee of attendance or a claim that all popular studios have spare seats. |
| Proposal p.6: “Displays only upcoming slots that are still available.” | Exclude inactive, paused, unconfirmed-to-run, full and expired sessions. Restrict discovery to starts strictly inside the next 72 hours. |
| Proposal pp.4–6: provider posting/editing and booking flow | Owner publishes/edits an allocation; customer selects quantity, confirms and saves a receipt. Four entities are providers, services, slots and bookings, rather than separate databases for roles. |
| Feedback p.1: canvas describes commission and featured placements | Model a 10% commission on the accepted booking amount. Featured placement is deferred; the fee is not partner-approved. |
| Proposal pp.5–7: accounts, integrations and later search | GC2 uses simulated payment and no login, as permitted by its brief. Basic discovery filters move forward to support the required Browse step. Paid add-ons, dynamic price drops, favorites, refunds and real payment/calendar integrations are deferred. |
| Proposal wireframe: temporary hold | No five-minute hold is implemented. Selection is a preview; seats and price are checked again when saving. Explain this before submission rather than showing a false countdown. |

## 3. Discovery structure that matches the build

Classify the activity once, then describe its attributes. services.category is the broad creative/active grouping; services.activity_type is the primary activity: pottery, painting, pilates, dance or other. Technique and inclusions describe the same service without creating duplicate inventory. Each slot is one dated session with one released-seat counter.

Current customer shortcuts: All, Pottery and Canvas painting. Unsupported or unverified supply does not get an empty shortcut. All is a view, not a stored type. Pilates is supported by the data contract and researched as a possible category, but no bookable Pilates supply is claimed. Crafts/jewelry/printmaking remain research prospects; they are not implemented navigation tabs.

Example: a mug-making session remains pottery even when painting is included. Store handbuilding as its technique and painting/materials/firing as inclusions. A painting search may find it through its attributes; both paths open the same slot ID and consume the same seats. Do not copy the session into a second category.

Implemented discovery contract: search text, broad category, area, date choice, people, primary type, one approved attribute and sort. Date controls cover today, tomorrow and weekend within the 72-hour boundary; the default is all eligible upcoming sessions. Price sorting uses the effective per-person rate for the selected party. There is no price-range slider, map-distance filter or public tag creation.

Approved attribute keys are beginner, handbuilding, wheel-throwing, painting-included and materials-included. These are controlled descriptive filters, not claims such as popular or solo-friendly without evidence. A provider-facing free-tag editor and multi-select tag semantics are future work.

## 4. Customer funnel and implementation status

| Step / screen | Control and why it fits | Route / intended measure |
| --- | --- | --- |
| Discover / Home | A short introduction, Browse link and up to three eligible featured sessions help a visitor understand the offer before narrowing it. | GET /api/slots. Future measure: eligible Home visits that open Browse or Detail. |
| Browse | Cards plus search, date, area, people and activity filters support comparison. Show total party price and per-person rate together. | GET /api/slots with validated filters. Future measure: Browse visits that open a session. |
| Select / Detail | Show the specific branch, start, deadline, duration, inclusions, preparation and available allocation. A link continues with the same slotId. | GET /api/slots/:id. Future measure: eligible Detail visits reaching Selection. |
| Select / Selection | Quantity selector and fresh server quote show the rate and full booking amount; no seat is reserved here. | GET /api/pricing/quote. Future measure: valid selections reaching Checkout. |
| Confirm / Checkout | Labeled fictional contact fields, simulated payment choices and an explicit total acceptance prevent ambiguous submission. | POST /api/bookings. Future measure: valid Checkout attempts saved successfully; count each requestId once. |
| Save / Confirmation | Fetch by returned booking ID so refresh displays the saved receipt, not a browser-calculated success screen. | GET /api/bookings/:id. Measure from saved confirmed receipts; no event conversion rate is currently collected. |
| Manage / Owner | Separate forms for releasing/editing seats and tables for saved bookings and five metrics support allocation decisions. | GET /api/owner/catalog, GET /api/bookings, GET /api/metrics; POST/PATCH /api/slots. |

Status on 31 October: #27/#28 (database/session/offer APIs), #36 (shared helper) and Janelle's quote #40 are merged. #29/#34 have integration commits awaiting Janelle's recheck; #32 research, this business draft #37 and catalog/application #39 remain unmerged. Home #35 needs Kirsten's review after updating its branch. The private reference does not replace members' own code, reviews or individual gates.

## 5. Rules, enforcement and customer result

| Plain-language rule | Enforcement / persistence | Customer result |
| --- | --- | --- |
| Only sell a released allocation in an already-going-ahead session. | listSlots() / server/services/discovery.js; slot status, runs_as_scheduled and service active flag. | Ineligible sessions are excluded from discovery; a public product listing alone cannot make one eligible. |
| Respect each session’s deadline. | Service default cutoff minutes produces a slot deadline; createOffer()/editOffer() validate it. Slot override is allowed. | Different studios can need different lead times. The default is not a universal minimum. |
| Only discover sessions starting inside the next 72 hours. | listSlots(); future start and future cutoff required. Offer creation may schedule farther ahead. | A valid future session appears only when it enters the window; exactly 72 hours ahead is outside it. |
| Standard and buddy prices must be valid provider-set offers. | createOffer()/editOffer(), SQL price constraints; standard < regular, optional buddy < standard. | Invalid or negative offers are refused; buddy is optional. |
| Buddy means two or more seats in one booking for one session. | Janelle’s quote/save service contract; saved pricing_type and unit price. Private reference enforces this. | Two separate one-person bookings do not combine automatically. Browser totals cannot select their own rate. |
| Never sell more seats than remain. | Booking transaction must lock the slot and recheck confirmed quantities; editOffer() cannot shrink below already sold seats. | Insufficient seats return 409 without saving. Allocation describes SlotDrop seats, not total room capacity. |
| Recompute price and fee on the server. | One pricing service, integer centavos; persist quantity, selected unit price, total, commission rate, fee and provider payout. | If the accepted total changes, return 409 PRICE_CHANGED and require fresh acceptance. |
| Retry one booking, rather than creating another. | Unique request_id plus identical-payload retry contract; conflicting reuse returns 409. | A lost response can be retried using the same key. Save is the reservation point; there is no hold. |
| Keep old receipts stable when offers change. | Offer edits never update saved booking amounts; receipt is read by ID. | Confirmation reflects the purchased price, not today’s offer. |
| Pause sales without pretending existing bookings disappeared. | Owner edit controls; confirmed bookings prevent cancelling their session; reopening rechecks eligibility. | Pausing stops new discovery. Customer refunds/rebooking are not implemented. |
| Return useful HTTP errors. | 400 invalid input, 404 absent session/receipt, 409 stock/price/request conflict, 503 unavailable DB; 201 newly saved booking. | An error must not display a successful receipt. Official booking routes still require Janelle’s implementation and review. |

DB constraints support the rules but do not replace transactional booking checks. Main must receive the reviewed implementations before the team calls the official flow complete. Scope does not include production account security, real card handling or synchronization with a studio’s direct calendar.

## 6. Two revenue features and worked conclusions

Feature A — availability: a released allocation, strict deadline and booking-time stock check make a sellable seat reliable. This supports commission income only when a booking is genuinely incremental. Feature B — tiered pricing: optional buddy pricing encourages a shared booking; the server selects the tier and stores its effect. General discounts alone are not being counted as a third custom feature.

Classroom model: Laro Ceramics advertises its mug-making + painting activity at ₱3,000. The course sample uses that reference price, a simulated standard offer of ₱2,700, an optional simulated buddy rate of ₱2,565 per person and four sample released seats. These offers are not approved by Laro. Commission is 10% of the accepted amount, deducted from provider proceeds; it is not an extra customer fee. All figures below are before platform operating costs and provider attendance costs.

| Booking | Customer total | Platform fee | Provider proceeds |
| --- | --- | --- | --- |
| 1 standard seat | ₱2,700 | ₱270 | ₱2,430 |
| 2 standard seats | ₱5,400 | ₱540 | ₱4,860 |
| 2 buddy seats | ₱5,130 | ₱513 | ₱4,617 |

If both people would have booked at the standard offer, buddy pricing saves customers ₱270 but reduces platform fees by ₱27 and provider proceeds by ₱243. So do not enable it merely to report a higher party size; it makes this unchanged attendance less valuable.

If the alternative is one standard booking and one empty seat, two buddy seats add ₱2,430 in sales, ₱243 in platform fee and ₱2,187 in provider proceeds. So the extra attendee is beneficial to this provider only when incremental materials, labor and related costs are below ₱2,187, and the offer does not displace other direct sales. No provider cost or acceptance data has been collected.

After the two-seat buddy booking, two of four allocated seats remain. A request for three must fail without adding a booking. So allocation checks protect the promise and avoid collecting commission on an impossible booking. Correct inventory is operational support for revenue, not proof of demand.

Money convention: store whole centavos. Fee per seat = round(unit price × commission basis points / 10,000); multiply that rounded fee by quantity. Payout = total − fee. Keep quote, save, schema documentation and examples consistent with this rounding rule.

## 7. Owner dashboard: five numbers, five decisions

| Actual metric | Definition / worked value | Decision and limit |
| --- | --- | --- |
| bookingCount | Confirmed transactions, not seats. After one 2-seat buddy booking: 1. | Check saved orders against transactions. A two-person order is not two conversions. |
| platformRevenueCentavos | Sum of stored confirmed booking fees. Example: ₱513. | Use as gross commission, then compare with acquisition/support costs; it is not profit or gross booking value. |
| averageOrderValueCentavos | Mean full confirmed booking total. Example: ₱5,130. | Compare single and shared order value before expanding buddy offers; order value alone says nothing about margin. |
| topSellingService | Most confirmed seats by service. Example: Laro Mug-making + painting, 2 seats. | Consider similar supply only after real bookings; seeded examples do not establish popularity. |
| nearlyFullSessionCount | Eligible open sessions with 1–25% of released seats remaining; excludes sold-out. Example: 2/4 remain → 0. | Ask a provider whether more allocation is actually available. Do not interpret released allocation as whole-class occupancy. |

Reconciliation check: add a second booking for one standard seat in the same four-seat session. Expected totals are 2 bookings, ₱783 platform fees, ₱3,915 average order value, 3 seats for the top service and 1 nearly-full session because 1/4 remains. Paused/expired sessions leave the nearly-full set; their saved confirmed receipts still contribute to booking totals. No gross-sales or seats-sold KPI card is currently implemented separately.

## 8. Real-studio evidence register

Official sources were checked on 29–30 October 2026 as stated below. Published products prove that a format and price were advertised; they do not prove future seats, supplier consent, spare capacity or permission to resell. The private course catalog now uses real studio identities and published activity facts with source links. Dates, released seats, cutoffs, offers, payments and reservations remain explicitly simulated; this does not establish a partnership. Historical synthetic records remain unchanged. Branch, date, price type, inclusions and policies must be checked together.

A1 — Laro Ceramics, 219 Katipunan Avenue, Blue Ridge A, QC. Mug making + painting is ₱3,000 for three hours; clay/tools, painting, glazing and firing are described. The product offers QC/BGC branch selection, so do not transfer a BGC date to Katipunan. Collection is approximately three months, not same-day take-home. Wheel throwing at ₱3,200 and the three-hour single-session duration were rechecked on the official product/collection pages on 30 October; dated branch availability remains unverified. Fit: local beginner format and companion occasion. Unknown: exact next eligible date, allocated seats, cutoff, costs and partnership.

Sources: https://laro-ceramics.com/products/mug-making-class-manila | https://laro-ceramics.com/collections/pottery-classes-laro-ceramics

A2 — Marz Today, 44 Matimtiman Street, Teachers Village, QC. Beginner stamp carving is advertised from ₱2,500. Booking is by appointment; workshop capacity is up to five, while open events can host up to ten. Do not treat the latter as workshop seats. Fit: local craft prospect. Risk: an appointment made on demand may not be an already-going-ahead session. Kat must establish dated group sessions and their release rules first.

Sources: https://shop.marz.today/collections/workshops | https://marz.today/booking/

A3 — Metals & Gems, White Plains/Katipunan Extension, QC; address retained from 28 October contact research pending recheck. Gem-to-Jewelry is ₱5,000 per person per piece, including silver and stone. The current product description says 2.5–3 hours, while its FAQ says approximately five hours: duration is unresolved. Sold-out labels and cart controls coexist; neither proves a dated opening. Fit: premium craft/cost comparison, not current bookable supply.

Sources: https://www.metalsandgems.com.ph/products/gem-to-jewelry-workshop | https://www.metalsandgems.com.ph/pages/contact-us

B1 — Bumi & Ashe, Cubao Expo candidate; the site also offers Makati, so confirm the selected branch. Mug making shows ₱2,650 sale / ₱3,200 regular, a two-hour class, painting and firing. The FAQ gives 6–8 weeks for collection. The page’s one-mug description conflicts with FAQ wording about three pieces, so confirm the exact package. Mixed sold-out/cart indicators do not establish availability. The free-form + paint product was rechecked on 30 October at ₱3,200 for three hours. Wheel products remain separate research and are not added to booking samples. Fit: creative supply expansion, with collection and schedule constraints.

Sources: https://bumiandashe.com/products/mug-making-workshop-1 | https://bumiandashe.com/collections/workshops-1

B2 — Tahanan Pottery, 27 Scout Tobias Street, QC. The official overview lists exploratory wheel at ₱2,500 and Saturday 2–5 PM; handbuilding is listed Sunday 9:30 AM–12:30 PM. These are published schedule patterns, not confirmed inventory for a specific coming weekend. Fit: a recurring supply hypothesis. Check the dated product, cutoff and actual allocation.

Source: https://tahananpottery.ph/collections/pottery-classes-workshops

B3 — Sip & Gogh Eastwood, QC. Keep branch/date/price as a verification task. The earlier official FAQ research directs customers to the branch calendar; no current Eastwood price is asserted here. Fit: a separate painting occasion. Do not reuse another branch’s price or call an old calendar current.

Source: https://sipandgogh.com/faqs

B4 — AMT Ceramics, Tandang Sora, QC. The official FAQ advertises handbuilding and wheel exploratory single sessions at ₱2,900 each, Fridays/Saturdays/Sundays 10 AM–1 PM. The sample catalog includes both three-hour activities. A recurring pattern does not confirm a specific date, spare capacity, inclusions or a cutoff. Source: https://amtceramics.com/pages/faqs .

B5 — Sip & Gogh Century Mall, Makati, separate from the Eastwood prospect. Its published Open Session on 6 November 2026 is ₱1,400, 6–9 PM. This provides a painting price/duration example; it does not prove a QC offering or an eligible live session. The private sample has simulated dates and is not that official reservation. Source: https://www.sipandgogh.com/branches/century-mall/sessions/12100 .

Core Pilates remains a research-only reference: the published ₱1,150 single-session credit is not a dated class reservation, and the exact class duration/timetable has not been verified. Source: https://corestudio.ph/class-packages .

Policy counterexample — Studio Matisse, San Juan, outside the initial catchment. Its published policy requires reservations at least two days ahead. A 72-hour discovery window and 48-hour deadline leave a theoretical 24-hour sales window; a 72-hour-or-longer deadline leaves none. This illustrates operational fit, not a QC partner or a claim that the provider accepts resale.

Source: https://studiomatisse.myshopify.com/pages/studio-policies

Research priority: verify Laro’s next dated QC session and Tahanan’s recurring scheduled supply first; use Marz to test whether appointment-based crafts fit the model at all. Keep Metals & Gems as a higher-cost counterexample until duration and availability are resolved. This priority is our proposed next action, not a supplier ranking validated by bookings.

## 9. Competitors and the reason to choose SlotDrop

| Alternative | What it already does / implication | SlotDrop’s proposed response |
| --- | --- | --- |
| ClassPass Manila | A named local alternative for fitness/wellness discovery. Its partner material describes excess-capacity distribution, pricing/inventory tools and rate protection; these are the platform’s own claims. | Keep the manual GC2 offer much smaller: transparent provider-set cash price, one released allocation, no membership or credit wallet. This is a focus choice, not proven superiority. |
| Studio-direct sites | Laro, Bumi and Tahanan already publish products, schedules and policies; customers can book without a new marketplace. | Offer comparable near-term details across willing studios. A provider needs incremental customers or simpler distribution to justify a fee. |
| FunNow | Near-term experience-booking analogy. Philippine coverage was not established in this research. | Do not claim that last-minute booking is novel or present FunNow as a verified Philippine competitor. |

Sources: https://classpass.com/search-index/manila | https://classpass.com/partners/faqs | https://www.events.myfunnow.com/whyfunnow-en . ClassPass is a comparison, not evidence that SlotDrop’s 10% fee, manual inventory or customer segment will work.

## 10. Risks, controls and what remains unknown

| Risk from the business case / feedback | Current control | Remaining commercial gap |
| --- | --- | --- |
| Ghost slots / external overselling | Dedicated release allocation, future cutoff, runs-as-scheduled flag, pause controls and a transaction lock for saves. | No external calendar sync. A supplier must ring-fence seats or update allocation reliably; locking our database cannot stop direct-channel sales. |
| Provider refuses discounts or fee | Provider chooses standard/buddy prices and can pause sales. | No signed partner, cost floor or 10% acceptance evidence. Ask minimum net payout and trial conditions. |
| Discount cannibalizes full-price demand | Release a limited allocation; buddy optional; work through the two-person counterfactual. | No measured direct-channel displacement or incremental demand. |
| Deal-only customers / weak repeat use | Clear session value, location and inclusions; avoid promising permanent discounts. | No retention or willingness-to-pay study; pottery need not be weekly. |
| Thin or unsuitable supply | Small geography; verify recurring, already-confirmed sessions and prep deadlines. | Published workshop catalogs are not a supplier pipeline. If too few eligible sessions exist, revisit geography/window rather than fabricate dates. |
| Materials/prep or collection mismatch | Display technique, inclusions, preparation and collection notes. | Real-provider data must be verified before a pilot; no real cancellations/refunds or payment handling is implemented. |

## 11. Fran + Kat: execution, decisions and handoff

By the 30 October internal review, Fran confirms or revises the proposed target/geography, keeps the pricing/cutoff rules aligned with code, verifies the worked calculations and carries the approved case into docs/business.md. Fran coordinates the API dependencies and real teammate review; a polished Doc alone does not complete GC2.

Kat verifies the supplier register against the exact selected branch and product. For each prospect record: source URL; checked date; branch/address; activity; standard versus sale price; duration; dated session versus recurring schedule; preparation cutoff; included materials; collection time; cancellation/reschedule terms; contradictions; and what remains unknown. State what was checked, rather than writing only “verified.” No outreach is claimed or sent by this draft.

Both decide whether the evidence supports the launch premise. Proposed interview questions: Which classes already run regularly? How many allocated seats were unused across recent sessions? Can seats be ring-fenced from direct sales? What is the last feasible booking time? What is the incremental cost per attendee? What net payout would justify a trial? Would two buddy seats be incremental or replace two standard sales? Record answers and dates if interviews actually occur; leave unanswered fields explicit.

Before a real pilot, require a willing provider, one dated confirmed-to-run session, an agreed dedicated allocation, verified price/inclusions/deadline and a positive provider contribution after marginal costs. These are proposed go/no-go checks, not completed results. If the evidence fails, change the offer or supplier scope; do not convert unknowns into favorable claims.

Course handoff: Oct 30 shared styling/layout and business review; Nov 1 first working code PR target; Nov 4 deployed database-backed Browse checkpoint; Nov 7 internal connected-flow target; Nov 9 final submission at 11:59 PM Philippine time. Oct 30, Nov 1 and Nov 7 are internal targets. Nov 4 and Nov 9 are course checkpoints.

Submit substantive docs/business.md plus the required concise business-summary PDF; this research Doc and the brand book serve different purposes. Documentation-only PRs do not count as a member’s three code PRs. Preserve specific real reviews and merges across the grading windows. Kat’s completed research and the group’s reasoning still need their authors’ confirmation; no interview, profitability or submission approval is implied.

Official repository: https://github.com/Frannaaa/slotdrop-gc2 | Versioned business draft: https://github.com/Frannaaa/slotdrop-gc2/blob/main/docs/business.md


## Studio application, separate from verified supply

ClassPass separates submission of business information from onboarding a profile; Klook reviews merchant applications before access to listing tools. SlotDrop follows Apply → Review → Set up. The private build has an independent studio reference page, a validated application form and DB-backed pending-status readback. It records authorization as an attestation, not proof; it does not publish a page, grant account access or verify a partnership. Use sample contacts, keep them private, and retain the same request key after an uncertain save. Public profile ownership and real inventory need later verified onboarding. Sources checked 30 October: https://classpass.com/partners/how-it-works | https://merchant.klook.com/introduction .
