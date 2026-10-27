# Group 1 API and screen contract

Status on Fran's development branch: health, slot list/detail/create/edit, owner catalog, saved-booking list and metrics are implemented. Janelle's pricing/quote, booking create and booking-by-ID routes remain assigned work. Browser -> own Express API -> PostgreSQL; never browser -> database. JSON field names are camelCase; SQL uses snake_case.

## Required and supporting API routes

| Method | Route | Input | Success | Other codes | Backend owner |
|---|---|---|---|---|---|
| GET | /api/slots | q, category, area, when=today/tomorrow/weekend, people | 200 array, including [] | 400 invalid filter | Fran |
| GET | /api/slots/:id | positive safe integer | 200 detail | 400 malformed, 404 absent | Fran |
| GET | /api/pricing/quote | slotId and quantity | 200 server quote | 400 invalid, 404 absent, 409 unavailable | Janelle |
| POST | /api/bookings | requestId, slotId, quantity, customerName, customerEmail, paymentMethod, expectedTotalCentavos | 201 new receipt, 200 identical retry | 400 invalid, 404 absent, 409 unavailable/price change/key conflict | Janelle |
| GET | /api/bookings/:id | UUID | 200 stored receipt | 400 malformed, 404 absent | Janelle |
| GET | /api/bookings | none | 200 saved demo receipts | generic 500 on failure | Fran |
| GET | /api/metrics | none | 200 five metrics | generic 500 on failure | Fran |
| POST | /api/slots | provider offer/session fields below | 201 created session | 400 invalid, 404 service absent, 409 duplicate | Fran |
| PATCH | /api/slots/:id | offerPriceCentavos, buddyPriceCentavos, capacity, bookingClosesAt or status=open/paused/cancelled | 200 updated offer | 400 invalid, 404 absent, 409 conflict with bookings | Fran |
| GET | /api/owner/catalog | none; fictional owner demo | 200 {services,slots,commissionBasisPoints}; includes paused/expired inventory | generic 500 on failure | Fran (#26) |
| GET | /api/health | none | 200 status ok/app SlotDrop | health does not imply database readiness | Fran |

q matches provider/service names case-insensitively; category is creative/active; area matches a returned area; people is an integer 1-100 and requires enough seats. Unknown ordinary search text returns []; malformed supported filter values return 400. Validate repeated query keys rather than treating an array as a string.

Use one server timestamp and Asia/Manila calendar boundaries per request. today and tomorrow are those local calendar days intersected with the eligible 72 hours window. weekend means the nearest Saturday/Sunday period that has not ended, also intersected with that window; a weekday search can legitimately yield []. Display that honestly; do not silently extend the window. No date filter shows the eligible 72 hours window.

## List/detail shape

A list is a JSON array. Each object has id, serviceId, providerId, providerName, serviceName, category, city, area, durationMinutes, beginnerFriendly, startsAt, bookingClosesAt, capacity, remainingSeats, originalPriceCentavos, offerPriceCentavos, buddyPriceCentavos, discountPercent and status. These prices are PER SEAT. buddyPriceCentavos is null when group pricing is disabled; a non-null rate applies only to quantity >= 2 in a single booking of that session. Never display the buddy rate as the one-person price. Detail additionally returns recurrenceNote and runsAsScheduled. A known full/paused session may return 200 detail with remainingSeats=0 or its status, but selection is disabled. A known expired/closed session can similarly show unavailable; GET quote/POST booking returns 409.

## Quote and money rules

GET /api/pricing/quote?slotId=1&quantity=2 returns slotId, quantity, originalUnitPriceCentavos, offerUnitPriceCentavos, unitPriceCentavos, pricingType, groupSavingsCentavos, totalPriceCentavos, platformFeeCentavos, providerPayoutCentavos, discountPercent, quotedAt.

Selected GC2 model commission: 1000 basis points (10%), centralized in server/config/business.js during implementation. It is deducted from the offer price; no separate customer surcharge. It is the selected MVP rate, not a tested commercial rate.

unitPriceCentavos = quantity >= 2 AND stored buddyPriceCentavos is not null ? buddyPriceCentavos : offerPriceCentavos
pricingType = buddy when that group rate applies; otherwise standard
groupSavingsCentavos = (offerPriceCentavos - unitPriceCentavos) * quantity
unitFee = Math.round(unitPriceCentavos * commissionBasisPoints / 10000)
totalPrice = unitPriceCentavos * quantity
platformFee = unitFee * quantity
providerPayout = totalPrice - platformFee
discountPercent = Math.round((originalUnitPriceCentavos - unitPriceCentavos) * 10000 / originalUnitPriceCentavos) / 100

Integers in centavos only; no floats stored as money. Limit per-seat money to 100,000,000 centavos so quantity <=100 stays safely within BIGINT and JavaScript safe integers.

## Booking request and transaction

Example request:
    {"requestId":"4fcf08df-4279-4254-9560-6c2945375c00","slotId":1,"quantity":2,"customerName":"Demo Customer","customerEmail":"demo@example.com","paymentMethod":"mock_card","expectedTotalCentavos":304000}

Validate name trimmed 1-100 characters, email trimmed max254/basic email shape, UUID requestId, positive safe integer slotId, integer quantity 1-100, paymentMethod mock_card/pay_on_site, expectedTotalCentavos nonnegative safe integer. Card numbers are never collected. Ignore or reject other browser price fields; never use them to calculate the actual price.

On one checked-out PostgreSQL client: BEGIN; find any existing requestId; lock slot row FOR UPDATE; recheck requestId; check eligibility and confirmed seat totals; compute server price; compare expectedTotalCentavos; insert immutable booking snapshot; COMMIT; release. If remaining seats are insufficient return 409 SLOT_UNAVAILABLE before writes. No separate availability counter is updated: the new confirmed booking quantity changes the computed availability in the same transaction.

If the computed total differs from expectedTotalCentavos, rollback with 409 PRICE_CHANGED plus a fresh quote before any booking insert. Frontend displays the amount and requires a new explicit confirmation. The acknowledged total is a consent check, not price authority.

The same requestId and normalized payload returns the original receipt (200), even after the original session stops being eligible. A reused key with a different slot/quantity/customer/payment/acknowledged total returns 409 REQUEST_KEY_CONFLICT. Handle a concurrent unique violation by rollback, then read and compare the saved request, never blindly create another booking. Keep the same key for a network retry; generate a new one for a deliberately changed booking after a conflict.

## Receipts and errors

201/200 booking response contains id, requestId, slotId, quantity, customerName, customerEmail, paymentMethod, status, sessionStartsAt, originalUnitPriceCentavos, offerUnitPriceCentavos, unitPriceCentavos, pricingType, commissionBasisPoints, totalPriceCentavos, platformFeeCentavos, providerPayoutCentavos and createdAt; GET confirmation returns these saved fields plus provider/service labels. Never rebuild confirmation from localStorage. Date/time and money snapshots do not change when an offer is edited.

Error shape: {error:{code,message}}; PRICE_CHANGED also includes quote. Invalid JSON is400; malformed IDs400; valid unknown IDs404; conflicts409; unexpected failures generic500 without SQL/credentials. Oversized JSON bodies return 413 PAYLOAD_TOO_LARGE. The CP0 fallback returns 404 ROUTE_NOT_IMPLEMENTED; malformed JSON returns 400 INVALID_JSON, all using this same nested shape.

## Offer-management inputs

POST /api/slots: serviceId, startsAt, bookingClosesAt, capacity, originalPriceCentavos, offerPriceCentavos, optional buddyPriceCentavos (null disables), runsAsScheduled=true. bookingClosesAt is optional on creation: if omitted, derive it from startsAt minus the service's defaultBookingCutoffMinutes. A provider may set a different explicit cutoff per session. Require now < bookingClosesAt < startsAt when creating; no platform-wide minimum lead time. Return 400 for an invalid cutoff. All per-seat price fields must be positive integers no greater than 100,000,000 centavos, with buddy below offer below original. Provider/location are derived from serviceId, not trusted duplicated fields. Service/provider catalog is seeded for GC2. Validate legitimate regular price manually during onboarding; code checks cannot prove an advertised original price is genuine.

PATCH may change bookingClosesAt under the same slot lock, but it must remain strictly before startsAt. A cutoff in the past closes sales immediately. A future cutoff may reopen sales only when status, capacity and other eligibility rules also permit; old receipts are unaffected. Changing a service's default does not rewrite existing slots. Each service's defaultBookingCutoffMinutes is positive and configured in the seeded catalog for GC2; a self-service catalog editor is deferred. Detail returns defaultBookingCutoffMinutes and the session's actual bookingClosesAt.

PATCH is restricted to the allowlisted offer/capacity/status fields; reject unknown edits. Lock the slot while editing and compare sold seats. No login is required by the brief; this public owner manager is a fictional-data course demonstration, not a production permission system. Real partner/customer data and commercial operation require authenticated ownership.

Commission here is modeled revenue on confirmed demo bookings, not a cash-reconciliation record. Both payment methods are simulated; no payment gateway, settlement or real card collection is implemented.

## Metrics

Only confirmed bookings count:
bookingCount = count of booking records, not seats.
platformRevenueCentavos = sum of saved platform fees, not gross value.
averageOrderValueCentavos = rounded mean of saved total prices; 0 when empty.
topSellingService = null or {serviceId,serviceName,seatsSold}, ranked by sum quantity, tie lowest serviceId.
nearlyFullSessionCount = count of eligible-time, active, open, already-running sessions whose remainingSeats/capacity <=25%, including sold-out sessions. Capacity is only the SlotDrop allocation. Return0 if none.

Optional display of gross booking value is derived separately and must not be labelled SlotDrop revenue.

## Seven screens

| Screen | Planned URL | Frontend owner |
|---|---|---|
| Home | / | Cholo |
| Browse | /browse.html | Kirsten |
| Detail | /detail.html?slotId=1 | Kaithlyn |
| Selection summary | /selection.html?slotId=1 | Kaithlyn |
| Booking form | /checkout.html?slotId=1&quantity=2 | Kaitlyn |
| Confirmation | /confirmation.html?id=UUID | Kaitlyn |
| Owner dashboard and offer manager | /owner.html | Fran |

Each frontend owner implements their own phone layout, loading/empty/error states and API integration. All use Kirsten's shared CSS. No map integration, subscription, credits, waitlist or five-minute hold is included.


## Revenue feature 2: bring-a-friend quantity tier

Provider opts in per session by storing buddyPriceCentavos; null opts out. It must be a positive integer strictly below the normal offer price. Threshold is exactly 2 seats, same session and same transaction; every seat in an eligible booking uses the stored buddy per-person rate. It is NOT a further automatic5% deduction, a promo code or a calculation on the original price. No stacking with other discount features.

The quote and booking service independently select the tier from stored data after checking quantity and capacity. The client cannot choose pricingType or send its own buddy price. For a disabled offer, quantity 2 uses the normal offer rate. Changing from quantity 2 to1 restores the normal rate and requires the customer to see/confirm the revised total.

At session1: original200000, normal offer160000, buddy152000 centavos. Quantity1 -> standard, total160000, fee16000,payout144000. Quantity2 -> buddy,total304000,fee30400,payout273600. Quantity3 -> buddy,total456000,fee45600,payout410400 if capacity permits. A three-seat request when only two remain returns 409 before any write.

PATCH cannot leave a buddy price equal to or above a newly lowered normal offer price; require an explicit compatible buddy update or disable it in that same request. Stored receipts keep their charged price, normal offer snapshot and pricing type after later provider edits.

This implements the brief's listed tiered-pricing feature. Availability/capacity is the separate first revenue feature. Paid activity add-ons belong to the Final Project; no add-on tables, inputs or charges are accepted in GC2.
