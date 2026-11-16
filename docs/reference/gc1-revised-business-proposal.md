# SlotDrop | Revised GC1 business proposal (post-feedback)

**Working strategic revision, 16 November 2026.** This is a post-feedback reformulation of Group 3's original **“SLOTDROP BUSINESS PROPOSAL” (GC1)**. It preserves the original premise, **“Empty slot, better price,”** while correcting assumptions identified in the GC1 feedback. It is not a claim that the original GC1 submission was rewritten retroactively or that studio partnerships, customer demand, or profit have been proven. The implemented GC2 design and validation evidence are documented separately in [`docs/business.md`](../business.md), [`docs/challenges.md`](../challenges.md), and the two-page summary.

## 1. What changed, and why

| Original GC1 idea / feedback | Revised business decision | GC2 evidence or next validation |
|---|---|---|
| Broad last-minute appointment marketplace; unclear customer segment | Narrow the initial market to **22–35-year-old working adults near Katipunan / UP Village / Teachers Village** who sometimes want a near-term leisure activity. Students remain secondary; age and willingness to pay are **hypotheses**, not research findings. | Browse prioritizes studio, area, time, seats and peso prices. Interview target customers before expansion. |
| “Empty slot, better price” and “lost appointment is still lost money” | Sell only an **explicitly released allocation** in a class the studio has already confirmed will run, rather than presuming that every cancellation or unsold appointment can be resold. | PostgreSQL slots have released capacity, session status and cutoff; the server verifies availability. Request four weeks of studio sales and capacity records. |
| Commission and featured placements named but not specified | Model **10% per confirmed booking** deducted from the studio payout. Defer paid placements until platform discovery and supplier trust exist. | The quoting and booking services save the 10% fee and studio payout in centavos. No signed commercial contract yet. |
| Popular studios assumed to have empty inventory | Focus first on **one pottery supplier**, then only on providers with recurring verified spare seats before preparation cutoffs. | Research includes Laro Ceramics, Bumi & Ashe, Tahanan, AMT and Sip & Gogh, but public listings do not prove available capacity. |
| “Booking giants” not identified | Compare **Klook, ClassPass, direct studio booking, and Fresha**, and treat social discovery and other activities as indirect substitutes. | SlotDrop must win on verified near-term supply, transparent final peso price, bookable seat count and deadline, **not merely being a booking marketplace**. |
| Roles and database model blended | Build the database around **providers, services, slots, bookings** (and optional provider applications), not one database for each actor. | Four linked booking entities, persisted receipt details, and Owner metrics are in GC2. |
| Wireframe suggested five-minute holds | **Do not claim a hold.** Selection displays a quote; booking confirms and atomically saves seats only after server revalidation. | Booking service enforces stock, prices and request idempotency. |

## 2. Value proposition and customer/provider jobs

**Customer job.** Find a feasible, near-term workshop without chasing separate social pages, calendars and final-price disclosures. In one flow: compare available dates, provider, location, inclusions, seat availability, booking cutoff and full party price; select a group size; complete a simulated booking; receive a retrievable reference.

**Provider job.** Earn incremental contribution from otherwise vacant capacity in a class already going ahead, while controlling the released allocation, cutoff, prices, and ability to pause new sales. The provider's economics matter more than a large discount headline: selling a seat that would have remained empty creates incremental proceeds, but moving a buyer who would have booked directly to a discounted channel can destroy margin.

**Product promise.** A localized, provider-controlled discovery and booking experience: **“Empty slot, better price.”** Initial geographic focus is QC; Cubao and other locations are testable adjacent supply, not a declared radius search.

## 3. Commercial model and worked economics

**Published reference:** Laro Ceramics mug-making workshop at **₱3,000**. **Demo assumptions:** regular-price reference ₱3,000, standard offer **₱2,700** per seat, optional two-person buddy rate **₱2,565** per seat, and **10% commission**. Prices, quantities and all bookings below are course simulations. Studio servicing cost of ₱500 per attendee is an explicit assumption.

| Scenario | Customer booking total | SlotDrop 10% gross fee | Studio payout before attendance costs |
|---|---:|---:|---:|
| One standard seat | ₱2,700 | ₱270 | ₱2,430 |
| Two standard seats | ₱5,400 | ₱540 | ₱4,860 |
| Two buddy seats | ₱5,130 | ₱513 | ₱4,617 |

**Release-seat economics.** If the seat would otherwise stay empty, the studio's modeled marginal contribution is **₱2,430 - ₱500 = ₱1,930**. If that buyer would otherwise have paid ₱3,000 directly, studio gross proceeds fall from ₱3,000 to ₱2,430: **₱570 less** even before considering channel/service cost differences. Thus seat availability *alone* is insufficient; the marketplace must demonstrate incremental buyers.

**Buddy-pricing economics.** Relative to two standard seats, a buddy booking reduces the customer's total by ₱270, platform fees by ₱27, and studio payout by ₱243. Relative to *one* standard seat and one unused seat, the buddy booking increases customer spend by ₱2,430, platform fee by **₱243**, and provider payout by **₱2,187**. With an assumed extra-attendee cost of ₱500, the studio gains **₱1,687** when the buddy rate adds a genuinely incremental guest; it loses ₱243 where both would have bought standard anyway. That yields a modeled studio break-even incremental-buddy share of **243/(243+1687) ≈ 12.6%**. Those thresholds depend on real studio costs and substitution rates, which have not been measured.

## 4. MVP scope and customer journey

1. **Discover:** Home and Browse use server-side discovery of workshops, grouped sessions, search/filter/sort and remaining seats. Dated listings begin within the next 72 hours and respect provider-set cutoffs; undated, explicitly labeled practice offers exist only for grading.
2. **Decide:** Detail displays the selected session's branch, inclusions, preparation, availability, price and deadline. Selection obtains a fresh server quote for the requested party size; only groups of at least two receive an offered buddy rate.
3. **Confirm:** Checkout validates fictional customer details, a simulated payment choice and the accepted quote. The server recomputes price, locks inventory, refuses overselling and saves a unique idempotent booking receipt.
4. **Verify:** Confirmation reads the same stored booking by ID. Owner sees the saved bookings, five required metrics and the separate open-release utilization insight, plus controls for future releases.

**Deferred:** Actual partner accounts and contracts, real payment processing, settlement/refunds, live provider calendar integration, consumer accounts, holds, paid placements, alerts, ratings and recommendation algorithms. The GC2 course demo does not reserve seats with any real studio.

## 5. Market comparison and differentiation

| Alternative | Existing value | SlotDrop's narrower hypothesis to prove |
|---|---|---|
| **Studio-direct booking** | Original studio relationship, full-price control and calendar | Bring incremental buyers for *explicitly released* seats rather than replace direct full-price bookings. |
| **Klook** | Discovery of local experiences including pottery | More specific near-term QC allocations with visible time, cutoff, seat count and full peso amount. |
| **ClassPass** | Established capacity-based distribution and partner terms | A transparent direct cash price and simple workshop-focused supplier trial, if payout and customer acquisition work. |
| **Fresha** | Broader salon/appointment software and booking | Focused leisure workshops and a tightly defined release window rather than another universal appointment app. |
| **Social pages / Maps / leisure alternatives** | Customer discovery and alternative uses of free time | Convert verified spare workshop availability to a short, complete booking flow. |

This is **not** a claim of a unique capacity resale concept: competitors also distribute excess capacity. The differentiator must be experimentally established at the proposed niche, supply cadence, price, trust and payout.

## 6. Four-week pilot and decisions

Start with one pottery provider and collect four weeks of class capacity, sold and empty seats, actual attendee-servicing costs, booking cutoffs, and existing direct-channel sales. Set a minimum acceptable payout and confirm that each sample class is already going ahead. Release a small allocation at standard offer price in weeks 1–2; A/B test the optional buddy rate on comparable sessions in weeks 3–4. Reconcile all bookings manually against the studio calendar before relying on any automated sync.

**Illustrative pilot, not a forecast:** 16 already-scheduled classes × 4 released seats = **64** released seats. Assume **24 standard seats plus 8 buddy-priced seats** (4 buddy bookings), yielding **32 booked seats in 28 bookings**, **₱85,320** customer bookings, **₱8,532** gross SlotDrop fees, and **₱76,788** provider payout. If attendee costs are ₱500 per head, eight buyers would otherwise have booked directly, coordination costs ₱2,500, per-booking support costs ₱50, and outreach/ops cost ₱6,000, the modeled studio incremental contribution is **₱38,288** and SlotDrop operating surplus **₱1,132** before taxes, founder labor, payment fees and refunds.

**Decision gates:** expand only if (a) spare inventory is consistent, (b) partner confirmation and stock reconciliation prevent double sales, (c) the studio's *incremental* contribution remains positive after cannibalization and service costs, (d) the platform's commission covers genuine customer acquisition and support costs, and (e) customers can finish a trustworthy journey. Otherwise narrow scope, renegotiate the release price/cutoff, or stop the pilot.

## 7. Proven vs unproven

**Demonstrated in GC2:** server-side discovery, quote and booking, persistent PostgreSQL receipts, stock/cutoff checks, Owner metrics, seeded source-backed workshop references, API and browser evidence documented in the repo.

**Not demonstrated:** commercial partnerships, actual available seats from studio calendars, cohort conversion, demand uplift, incremental customers, supplier profitability, refund/payment behavior, repeat purchase or paid marketing ROI. The pilot figures above must not be presented as achieved revenue.

**Working references:** Original GC1 proposal, instructor feedback as paraphrased in [`docs/business.md`](../business.md), [detailed studio and competitor sources](business-research-appendix.md), and [implemented GC2 business model](../business.md). The full code, route and challenge evidence are retained in the SlotDrop group repository.