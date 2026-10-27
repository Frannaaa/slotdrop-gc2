# SlotDrop: GC2 business tables (CP0 draft)

Sources: Group 3 - GC1.pdf and GC1_feedback_grp3.pdf. Existing generated draft retained as proposals for human review. The assignment requires the team to own its business reasoning; review and rewrite rationale in your own words before merging. New rates and market assumptions are not validated decisions.

## Assumptions to confirm with the group

- Initial launch hypothesis: price-sensitive students and young professionals (approximately ages 18–35) looking for salon/spa appointments around Quezon City/Katipunan. This narrows GC1's very broad target; **not validated demand**.
- Booking inventory: provider-posted upcoming appointments within 48 hours. The GC2 demo will start with synthetic seeded slots; this is **not a live partner network**.
- Pricing: illustrative 10% off at 24–48h, 20% at 6–24h, and 30% below 6h; provider minimum price overrides any too-low discount.
- Monetization hypothesis: SlotDrop receives 12% of the *discounted* booking price. Real payments and sponsored listings are deferred.

## GC1 traceability

| GC1 item | What GC1 proposed | GC2 implementation / change |
|---|---|---|
| Target market | Last-minute price-sensitive customers; appointment providers with idle slots | QC/Katipunan focus **hypothesis**, browsable sample salon and spa deals |
| Problem | Providers lose value from late cancellations; consumers struggle to find convenient near-term appointments | Browse only eligible open future slots; booking makes slot unavailable |
| Value proposition | **“Empty slot, better price.”** | Home copy; original/current price comparison and booking confirmation |
| Revenue model | Commission on successful bookings; sponsored featured spots in future | Proposed 12% commission computed and stored on server; sponsored placement deferred |
| Core features | Slot manager, marketplace, simulated booking, schedules | Seeded provider appointments, marketplace, booking & owner saved-booking list; provider self-service and login deferred |

## Browse → Select → Confirm → Save funnel

| Stage | Screen / element | API | Metric moved and why |
|---|---|---|---|
| Browse | Searchable cards show original/current price and time until slot | GET /api/slots | Browse-to-detail clicks; transparent prices invite consideration |
| Select | Detail and summary show provider, appointment and price | GET /api/slots/:id; GET /api/pricing/quote | Detail-to-selection rate; avoid booking ambiguity |
| Confirm | Customer details + mock payment, field-level errors | POST /api/bookings | Checkout completion; concise required fields reduce drop-off |
| Save | Database-backed confirmation with booking ID | GET /api/bookings/:id | Completed bookings, average order value; no false confirmations |

## Business rules (plain-language wording)

| Owner says | Enforced where | Customer experience |
|---|---|---|
| Only advertise appointments happening within 48 hours that haven't already been booked. | GET /api/slots | No expired or booked appointment shown |
| We can sell each one-person appointment only once. | POST /api/bookings + PostgreSQL row lock/index | Second booking attempt gets 409 and retry prompt |
| Never discount below a provider's accepted minimum. | Shared server pricing function | Actual price/savings displayed, even if smaller than advertised tier |
| When a customer confirms, keep the agreed price for their receipt. | Booking creation + bookings table | Confirmation shows server-stored price |
| SlotDrop charges a proposed 12% commission on a confirmed booking, never the original list price. | Shared server pricing function + bookings table | Owner view separates gross booking value and commission |
| Never trust a price sent by the browser. | POST /api/bookings | Server recomputes and validates |

## Two revenue features, with worked numbers

1. **Availability filtering / inventory counter.** Suppose a provider posts 3 one-person appointment slots. After one is confirmed, 2 remain available; another attempt for that same booked time is refused. This supports reliable inventory, but it does not guarantee that a slot posted here is also available in the provider's external calendar. *Conclusion:* SlotDrop must validate provider inventory or add synchronization before claiming guaranteed availability.
2. **Time-based discount / provider price floor.** A ₱1,000 haircut 4 hours away qualifies for a 30% discount (₱700), but the provider's price floor is ₱750. The customer pays **₱750**, actual savings **25%**. Proposed 12% commission = **₱90**; provider receives **₱660 before service costs**. *Conclusion:* A price floor protects the provider but the platform still needs evidence the booking would not have sold at full price; it cannot assume this is all incremental revenue.

## Five owner metrics → operational decisions

| Metric | Owner decision |
|---|---|
| Number of bookings | Are last-minute deals actually converting? If low, revise discovery and slot mix. |
| Platform revenue (commissions, not gross sales) | Does commission income justify acquiring and supporting providers? |
| Average order value | Are discounted deals too cheap for the commission to cover operating costs? |
| Top-selling service | Which provider/service category should we recruit more of? |
| Services almost full / scarce slots | Which category has insufficient upcoming supply? |

## GC1 feedback addressed, with unresolved risks

- **Narrow market.** Start with a localized segment, but validate age, location, and actual customer demand.
- **Commission missing from GC1.** Add a proposed 12% provider-paid commission; verify unit economics later.
- **Ghost slots.** Internal double-booking checks are planned; external calendar discrepancies are still a risk. The MVP must not claim real partner synchronization.
- **Premium providers.** Minimum accepted price prevents involuntary below-floor sales.
- **Popular providers rarely have empty slots.** Position SlotDrop as near-term, discounted discovery rather than promising access to fully booked premium providers.
- **Competition.** GC1 feedback cites Fresha, ClassPass, and HotelTonight as comparison examples. Local Philippine alternatives and providers still require independent research for the Final Project.


## Exact GC1 anchors

| Source | Short wording from GC1 | Contract treatment |
|---|---|---|
| p.1 name/tagline | "Empty slot, better price." | Home proposition |
| p.1 category | "bookings that are last-minute in nature" | Proposed 48-hour window, not specified in GC1 |
| p.2 provider value | "profit off of cancelled/empty appointment slots" | Persist booking and reduce availability |
| p.6 flow | Customer selects "Book Now" | Detail and selection lead to booking form |

## Human decisions to record before approval

After discussing, record the actual decision, names and date here. Do not pre-fill acceptance. Confirm segment, 12% commission, who bears it, tier boundaries and the meaning of provider floor.

Current contract treats minimum_price_centavos as a CUSTOMER-PRICE floor. A PHP750 floor at 12% commission yields PHP660 to provider before costs. It does not guarantee PHP750 NET to provider. If the team intends a net floor, change the contract first.

GC1 feedback did not approve 12%; it asked for a rate. The 18-35 segment, 48h window and discount tiers are also proposals. Retaining them requires the team's own rationale.
