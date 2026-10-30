# API and screen contract

Health, session list/detail/create/edit, the price quote, owner catalog, saved-booking list and metrics are implemented on this branch. Other routes below are planned contracts. JSON uses camelCase; SQL uses snake_case.

## Routes

| Method and path | Input | Success | Errors | Owner |
|---|---|---|---|---|
| GET /api/health | None | 200 {status:"ok",app:"SlotDrop"} | Does not check the database | Fran |
| GET /api/slots | q, category, area, when, people | 200 array, including [] | 400 bad filter | Fran |
| GET /api/slots/:id | Positive safe integer | 200 session | 400 malformed; 404 unknown | Fran |
| POST /api/slots | Session fields below | 201 session | 400 invalid; 404 activity missing; 409 inactive activity or duplicate session | Fran |
| PATCH /api/slots/:id | Allowed edits below | 200 session | 400 invalid; 404 unknown; 409 booked-capacity/cancellation/resumption conflict | Fran |
| GET /api/owner/catalog | None | 200 {services,slots,commissionBasisPoints} | 500 unexpected failure | Fran |
| GET /api/bookings | None | 200 non-contact booking summaries | 500 unexpected failure | Fran |
| GET /api/metrics | None | 200 metrics object | 500 unexpected failure | Fran |
| GET /api/pricing/quote | slotId, quantity | 200 quote | 400 invalid/missing/extra field; 404 unknown; 409 SLOT_UNAVAILABLE | Janelle |
| POST /api/bookings | Booking fields below | Planned 201 created; 200 identical retry | Planned 400/404/409 | Janelle |
| GET /api/bookings/:id | UUID | Planned 200 saved receipt | Planned 400 malformed; 404 unknown | Janelle |

Implemented database routes return 503 DATABASE_UNAVAILABLE when DATABASE_URL is absent from normal server mode. Unexpected failures use 500.

## Discovery and session responses

q is a case-insensitive literal substring of the provider or activity name. category is creative or active. area matches an area name, case-insensitively. people is an integer from 1 to 100. Repeated query keys, unsupported filters and null characters in q or area return 400.

when accepts today, tomorrow or weekend, using Asia/Manila calendar boundaries. The date range is intersected with the strict 72-hour discovery window. On Sunday, weekend still refers to the current weekend. No matching offers returns 200 with [].

The list excludes inactive activities, paused/cancelled sessions, passed cutoffs, sessions not already going ahead, starts outside the window and allocations too small for the requested group.

List and detail use the same session shape:

```text
id, serviceId, providerId, providerName, serviceName, category, city, area,
durationMinutes, beginnerFriendly, startsAt, bookingClosesAt, capacity,
remainingSeats, originalPriceCentavos, offerPriceCentavos, buddyPriceCentavos,
discountPercent, status, serviceActive, recurrenceNote, runsAsScheduled, defaultBookingCutoffMinutes
```

Prices are per seat. discountPercent describes the standard offer versus the regular price. A null buddyPriceCentavos disables buddy pricing. A known unavailable session still returns 200 detail; the customer must not be allowed to book it. serviceActive identifies inactive activities, including when a session is opened through a direct link.

The owner catalog includes paused and expired inventory. Its services include id, providerId, providerName, name, active and defaultBookingCutoffMinutes. Its discoveryHours value comes from the server configuration so the owner page can distinguish future inventory from offers already in discovery.

## Session creation and edits

POST accepts serviceId, startsAt, capacity, originalPriceCentavos, offerPriceCentavos, optional buddyPriceCentavos, optional bookingClosesAt and runsAsScheduled=true. IDs, quantities and prices must be JSON integers; timestamps must be valid ISO dates with a timezone and resolve to a UTC year from 0001 to 9999.

If bookingClosesAt is omitted, derive it from the activity default. Require now < cutoff < start. Providers may create sessions farther than 72 hours ahead; they become discoverable only inside the window. Provider and location come from the activity, not duplicated browser fields.

PATCH accepts only offerPriceCentavos, buddyPriceCentavos, capacity, bookingClosesAt and status=open/paused/cancelled. Lock the session row and count confirmed booked quantities before updating.

- Capacity cannot fall below confirmed seats.
- A new standard offer cannot leave an incompatible buddy rate; update or disable the buddy rate in the same request.
- A passed cutoff can close sales immediately.
- Reopening paused or cancelled inventory requires a future cutoff/start, available allocation, an active activity and a session confirmed to run. Read the current time after acquiring the database lock.
- Cancelling with confirmed bookings returns 409.
- Once the session starts, all offer edits return 409 SESSION_STARTED; the owner controls disable editing.
- Changing the start time is unsupported and returns 400.
- Existing receipt amounts and times stay unchanged.

All per-seat amounts are integers from 1 to 100,000,000 centavos. Require buddy < offer < regular when the buddy rate is enabled. The actual regular price must be checked with the provider; code cannot establish that it is genuine.

## Planned quote and booking contract

The remaining sections define Janelle's integration work; they are not working booking endpoints yet.

GET /api/pricing/quote is implemented in server/services/pricing.js. It accepts only slotId (positive integer) and quantity (1–100), each once. Price fields such as unitPriceCentavos or pricingType in the query return 400. A session that is inactive, paused, cancelled, not confirmed to run, outside the discovery window, past its cutoff or short of seats returns 409 SLOT_UNAVAILABLE. Prices always come from the slots table, never from the browser or published studio prices. POST /api/bookings will reuse the same priceQuote() and checkBookable() functions.

A quote returns slotId, quantity, originalUnitPriceCentavos, offerUnitPriceCentavos, unitPriceCentavos, pricingType, groupSavingsCentavos, totalPriceCentavos, platformFeeCentavos, providerPayoutCentavos, discountPercent and quotedAt.

```text
unitPrice = stored buddy rate when quantity >= 2 and enabled; otherwise standard offer
pricingType = buddy or standard
groupSavings = (standard offer - unitPrice) * quantity
unitFee = Math.round(unitPrice * commissionBasisPoints / 10000)
total = unitPrice * quantity
platformFee = unitFee * quantity
providerPayout = total - platformFee
discountPercent = Math.round((regular - unitPrice) * 10000 / regular) / 100
```

The active model rate is 1000 basis points in server/config/business.js on the development branches. It is deducted from the accepted price, with no customer surcharge. Money is saved in centavos. The server chooses the tier; the client cannot choose a rate or pricingType.

POST /api/bookings accepts requestId, slotId, quantity, customerName, customerEmail, paymentMethod and expectedTotalCentavos. Validate a UUID retry key, quantity 1–100, trimmed name 1–100 characters, trimmed basic email up to 254 characters, mock_card/pay_on_site and a nonnegative safe-integer acknowledged total. Reject unsupported price fields such as total with 400. Do not collect card numbers.

On one checked-out database client:

1. Begin and check for an existing retry key.
2. Lock the slot row, then recheck the key.
3. Recheck eligibility and confirmed seat quantities.
4. Select the stored tier and calculate totals.
5. Compare expectedTotalCentavos before inserting.
6. Insert receipt snapshots, commit and release the client.

Insufficient seats return 409 SLOT_UNAVAILABLE. A changed acknowledged amount returns 409 PRICE_CHANGED with a fresh quote before any insert. The frontend displays the new amount and asks again.

An identical normalized retry returns its original receipt with 200, even after the session closes. Reusing the key with different details returns 409 REQUEST_KEY_CONFLICT. After a concurrent unique-key violation, roll back and compare the saved request rather than creating another booking. Keep the retry key for a network retry; use a new key for a deliberately changed request.

## Saved receipts and metrics

Public POST /api/bookings responses and GET /api/bookings/:id return an explicit saved receipt: id, slotId, quantity, paymentMethod, status, sessionStartsAt, originalUnitPriceCentavos, offerUnitPriceCentavos, unitPriceCentavos, pricingType, commissionBasisPoints, totalPriceCentavos, platformFeeCentavos, providerPayoutCentavos, createdAt, serviceName and providerName. Customer names/emails and requestId remain stored internally for validation and retry matching, but are omitted from all public booking responses. A public owner-list ID must not reveal contacts through receipt readback. Confirmation displays the booking reference and saved activity/amounts, without a guest-name field. Clients retain the retry key they generated; they never recover it from a public receipt.

Metrics use confirmed bookings only:

| Field | Calculation |
|---|---|
| bookingCount | Number of booking records, not seats |
| platformRevenueCentavos | Sum of saved commission |
| averageOrderValueCentavos | Rounded mean transaction total; zero when empty |
| topSellingService | {serviceId,serviceName,seatsSold}, ranked by sum of quantity; lowest ID breaks ties; null when empty |
| nearlyFullSessionCount | Eligible-time active/open/running sessions with 1–25% of released capacity remaining; sold-out sessions are excluded |

Payments are simulated. Platform revenue is modeled commission, not cash collected or total booking value.

## Errors and screens

Errors use {error:{code,message}}. Invalid JSON returns 400 INVALID_JSON; oversized bodies return 413 PAYLOAD_TOO_LARGE. Malformed encoded path parameters return 400 INVALID_PATH. Unsupported JSON charsets or content encodings return 415 UNSUPPORTED_MEDIA_TYPE. Recognized database connection failures return 503 DATABASE_UNAVAILABLE; unexpected SQL/programming errors still return 500. Routes not implemented in the current branch return 404 ROUTE_NOT_IMPLEMENTED. Unexpected messages, SQL and stack traces are not sent to the browser.

| Screen | URL | Frontend owner |
|---|---|---|
| Home | / | Cholo |
| Browse | /browse.html | Kirsten |
| Detail | /detail.html?slotId=1 | Kaithlyn |
| Selection | /selection.html?slotId=1 | Kaithlyn |
| Booking form | /checkout.html?slotId=1&quantity=2 | Kaitlyn |
| Confirmation | /confirmation.html?id=UUID | Kaitlyn |
| Owner workspace | /owner.html | Fran |

Other than the owner workspace, customer screens remain team implementation work in these PRs. Each page needs loading, empty, error and phone states. No login or real payment is required for GC2.

The owner workspace stops waiting after 15 seconds, including while reading a response body. Read failures allow Refresh data. A save timeout does not trigger an automatic retry; the page asks the owner to refresh and check whether the change was saved.

## Released-seat discovery contract (Issue #33)

The customer journey starts at `/browse.html` and stays in the app through saving a booking and reading it back by ID. Studio research is supporting material, not a substitute for the transaction funnel.

GET /api/slots keeps q/category/area/when/people and adds optional type (pottery, painting, pilates, dance, other), tag (beginner, handbuilding, wheel-throwing, painting-included, materials-included) and sort (soonest, price-low, price-high). Unsupported/duplicate/bad enum filters return 400. Sort uses the effective per-seat tier for the requested party; results still obey dates, provider cutoffs, confirmed-to-run state and remaining allocation. Search matches provider/activity plus explicit type, technique and inclusions. A secondary search match does not duplicate a session ID.

Slot list and Detail add activityType, technique, inclusions (array), preparationNote and cancellationNote. These are stored service attributes, not arbitrary public tags. The existing quote and receipt contracts do not change. Cards may preview the stored standard/buddy tier, but quote and save remain server-authoritative.

Primary UI controls are When, Area and People, with optional activity shortcuts and search/category/attribute/sort under More filters. Show selected party total, per-person price, actual cutoff, duration and remaining seats. A ceramic painting session has primary type pottery but can match a painting search; use Canvas painting as the narrower painting-type label. Do not force a category choice before showing results.

Whitespace-only q is intentionally ignored; the 100-character limit applies to the raw query value. Metadata search matches each field or inclusion separately and omits the placeholder activity type other. The discovery window is defined once in public/js/business-config.js and re-exported by server/config/business.js. Startup/shutdown diagnostics report safe error codes, not raw database messages.

## Studio research

`GET /api/activities` returns sourced studio references, not live inventory. See `docs/studio-discovery.md`. The booking API remains `/api/slots`.
