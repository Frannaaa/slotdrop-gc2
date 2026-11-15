# API and screen contract

Requests and responses use JSON with camelCase fields. The [schema](schema.md) lists the corresponding PostgreSQL tables.

## Routes

| Method and path | Input | Success | Errors | Owner |
|---|---|---|---|---|
| GET /api/health | None | 200 {status:"ok",app:"SlotDrop"} | 503 if the production database or required tables are unavailable | Fran |
| GET /api/slots | q, category, area, when, people, type, tag, sort, page, limit, view | 200 array, including [] | 400 bad filter | Fran |
| GET /api/slots/:id | Positive safe integer | 200 session | 400 malformed; 404 unknown | Fran |
| POST /api/slots | Session fields below | 201 session | 400 invalid; 404 activity missing; 409 inactive activity or duplicate session | Fran |
| PATCH /api/slots/:id | Allowed edits below | 200 session | 400 invalid; 404 unknown; 409 session started, or capacity/cancellation/resumption conflict | Fran |
| GET /api/owner/catalog | None | 200 {services,slots,commissionBasisPoints,discoveryHours} | 500 unexpected failure | Fran |
| GET /api/bookings | None | 200 non-contact booking summaries | 500 unexpected failure | Fran |
| GET /api/metrics | None | 200 metrics object | 500 unexpected failure | Fran |
| GET /api/pricing/quote | slotId, quantity | 200 quote | 400 invalid/missing/extra field; 404 unknown; 409 SLOT_UNAVAILABLE | Janelle |
| POST /api/bookings | Booking fields below | 201 created; 200 identical retry | 400 invalid; 404 unknown slot; 409 SLOT_UNAVAILABLE/PRICE_CHANGED/REQUEST_KEY_CONFLICT; 429 RATE_LIMITED with Retry-After | Janelle |
| GET /api/bookings/:id | UUID | 200 saved receipt | 400 malformed; 404 BOOKING_NOT_FOUND | Janelle |
| GET /api/activities | Optional q, type, area, tag | 200 sourced research with an offerings array | 400 bad filter | Fran |
| GET /api/providers/:id | Positive safe integer | 200 public studio reference and eligible demo slots | 400 malformed; 404 unknown or legacy fixture | Fran |
| POST /api/provider-applications | Pending application fields | 201 created; 200 identical retry | 400 invalid; 404 unknown referenced studio; 409 conflicting request key | Fran |
| GET /api/provider-applications/:id | UUID | 200 id, status and createdAt | 400 malformed; 404 unknown | Fran |

Database-backed APIs return `503 DATABASE_UNAVAILABLE` for recognized database failures. Unexpected server failures return `500 INTERNAL_ERROR`.

Booking POSTs have a 30-attempt, 60-second limit per client IP. Render uses the address supplied by its public ingress. Other environments use the connected peer. See the [rate-limit contract and evidence](reference/bonus-rate-limit.md).

## Discovery and session responses

Optional **pagination**: `GET /api/slots?page=1&limit=12`. Both fields are optional; supplying either enables bounded SQL pagination after all search/filter conditions. Default page is 1; default limit is 12; valid page is 1–10000 and limit is 1–50. An invalid, repeated or unsupported parameter returns 400; a page past the end returns 200 with `[]`. The default bookable view returns the full eligible array when both fields are omitted. Browse requests six bookable sessions at a time. The deployed pagination evidence is in [Challenges](challenges.md#pagination).

- `q` searches provider and activity names, primary type, technique and inclusions by case-insensitive literal substring. Blank text is ignored. `area` matches the area name case-insensitively. Both fields accept up to 100 characters and reject null characters.
- `category` accepts `creative` or `active`. `type` accepts `pottery`, `painting`, `pilates`, `dance` or `other`. `tag` accepts `beginner`, `handbuilding`, `wheel-throwing`, `painting-included` or `materials-included`.
- `people` is 1–100. `sort` accepts `soonest`, `price-low` or `price-high`. Price order uses the applicable per-seat tier for the party. Browse exposes search, category and pagination. Invalid, duplicate or unsupported filters return 400.

when accepts today, tomorrow or weekend, using Asia/Manila calendar boundaries. The date range is intersected with the strict 72-hour discovery window. On Sunday, weekend still refers to the current weekend. No matching offers returns 200 with [].

The bookable list requires an active activity, an open offer, a session confirmed to run and enough seats for the requested group. Dated offers require a future start less than 72 hours away and a future booking cutoff. Two startup-created practice offers have no start or cutoff and appear first in the default order. Date filters return scheduled offers only.

`view=closed` lists dated, active, open, confirmed-to-run sessions whose cutoff has passed, including offers that sold out. The `people` filter uses total capacity in this view. Without an explicit sort, the most recent cutoffs appear first. The view always applies pagination. Browse fetches the latest 16 only when someone opens **Closed sessions**. Its cards say “Booking closed” or “Event ended” and link to read-only details. Closed offers still return 409 from a new quote or booking.

List and detail use the same session shape:

```text
id, serviceId, providerId, providerName, serviceName, category, city, area,
activityType, technique, inclusions, preparationNote, cancellationNote, studioReference,
durationMinutes, beginnerFriendly, startsAt, bookingClosesAt, capacity,
remainingSeats, originalPriceCentavos, offerPriceCentavos, buddyPriceCentavos,
discountPercent, status, serviceActive, recurrenceNote, runsAsScheduled, defaultBookingCutoffMinutes
```

Prices are per seat. discountPercent describes the standard offer versus the regular price. A null buddyPriceCentavos disables buddy pricing. A known unavailable session still returns 200 detail; the customer must not be allowed to book it. serviceActive identifies inactive activities, including when a session is opened through a direct link.

Practice offers have `startsAt: null` and `bookingClosesAt: null`. Their receipts have `sessionStartsAt: null`. The optional `studioReference.photo` contains alt text, credit and a link to the listing. Card images are served locally using the reference key. See [photo sources](reference/workshop-photos.md).

The owner catalog includes paused and expired inventory. Its services include id, providerId, providerName, name, active and defaultBookingCutoffMinutes. Its discoveryHours value comes from the server configuration so the owner page can distinguish future inventory from offers already in discovery.

## Session creation and edits

POST accepts serviceId, startsAt, capacity, originalPriceCentavos, offerPriceCentavos, optional buddyPriceCentavos, optional bookingClosesAt and runsAsScheduled=true. IDs, quantities and prices must be JSON integers; timestamps must be valid ISO dates with a timezone and resolve to a UTC year from 0001 to 9999.

If bookingClosesAt is omitted, derive it from the activity default. Require now < cutoff < start. Providers may create sessions farther than 72 hours ahead; they become discoverable only inside the window. Provider and location come from the activity, not duplicated browser fields.

PATCH accepts only offerPriceCentavos, buddyPriceCentavos, capacity, bookingClosesAt and status=open/paused/cancelled. Lock the session row and count confirmed booked quantities before updating.

- Capacity cannot fall below confirmed seats.
- A new standard offer cannot leave an incompatible buddy rate; update or disable the buddy rate in the same request.
- A passed cutoff can close sales immediately.
- Reopening paused or cancelled inventory requires an active activity, confirmation that the session will run and available seats. Dated offers must have a future cutoff and start. The service reads the current time after taking the row lock.
- Practice offers accept price, capacity and status edits. Their dates are set by startup, and a cutoff edit returns 400.
- Cancelling with confirmed bookings returns 409.
- Once the session starts, all offer edits return 409 SESSION_STARTED; the owner controls disable editing.
- Changing the start time is unsupported and returns 400.
- Existing receipt amounts and times stay unchanged.

All per-seat amounts are integers from 1 to 100,000,000 centavos. Require buddy < offer < regular when the buddy rate is enabled. The actual regular price must be checked with the provider; code cannot establish that it is genuine.

## Quote and booking contract

[Pricing](../server/services/pricing.js) and [booking](../server/services/bookings.js) share the same availability check and price quote. `GET /api/pricing/quote` accepts only slotId (positive integer) and quantity (1–100), each once. Price fields such as unitPriceCentavos or pricingType in the query return 400. A session that is inactive, paused, cancelled, not confirmed to run, outside the discovery window, past its cutoff or short of seats returns 409 SLOT_UNAVAILABLE. Prices always come from the slots table, never from the browser or published studio prices. POST /api/bookings reuses the same priceQuote() and checkBookable() functions.

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

The active rate is 1,000 basis points in [server/config/business.js](../server/config/business.js). [business-config.js](../public/js/business-config.js) owns the buddy threshold, tier and total calculation, fee rounding and discount math. Server quotes and browser previews reuse it. The server chooses the tier and fee from the stored prices and configured rate before saving. Money is stored in centavos, and commission is deducted from the studio’s share.

POST /api/bookings accepts requestId, slotId, quantity, customerName, customerEmail, paymentMethod and expectedTotalCentavos. Validate a UUID retry key, quantity 1–100, trimmed name 1–100 characters, trimmed basic email up to 254 characters, mock_card/pay_on_site and a nonnegative safe-integer acknowledged total. Reject unsupported price fields such as total with 400. Do not collect card numbers.

On one checked-out database client:

1. Begin and check for an existing retry key.
2. Lock the slot row, then recheck the key.
3. Recheck eligibility and confirmed seat quantities.
4. Select the stored tier and calculate totals.
5. Compare expectedTotalCentavos before inserting.
6. Insert receipt snapshots, commit and release the client.

Insufficient seats return 409 SLOT_UNAVAILABLE. A changed acknowledged amount returns 409 PRICE_CHANGED with a fresh quote (error.quote) before any insert. The frontend displays the new amount and asks again.

An identical normalized retry returns its original receipt with 200, even after the session closes. Reusing the key with different details returns 409 REQUEST_KEY_CONFLICT. After a concurrent unique-key violation, roll back and compare the saved request rather than creating another booking. Checkout keeps the retry key when a network failure, malformed receipt response or server error leaves the save uncertain. If a later retry is rate-limited, the original key and request body stay available. Confirmation opens after Checkout receives a valid receipt UUID.

## Saved receipts and metrics

Public POST /api/bookings responses and GET /api/bookings/:id return an explicit saved receipt: id, slotId, quantity, paymentMethod, status, sessionStartsAt, originalUnitPriceCentavos, offerUnitPriceCentavos, unitPriceCentavos, pricingType, commissionBasisPoints, totalPriceCentavos, platformFeeCentavos, providerPayoutCentavos, createdAt, serviceName and providerName. Customer names/emails and requestId remain stored internally for validation and retry matching, but are omitted from all public booking responses. A public owner-list ID must not reveal contacts through receipt readback. Confirmation displays the booking reference and saved activity/amounts, without a guest-name field. Clients retain the retry key they generated; they never recover it from a public receipt.

Metrics use confirmed bookings only:

| Field | Calculation |
|---|---|
| bookingCount | Number of booking records, not seats |
| platformRevenueCentavos | Sum of saved commission |
| averageOrderValueCentavos | Rounded mean transaction total; zero when empty |
| topSellingService | {serviceId,serviceName,seatsSold}, ranked by sum of quantity; lowest ID breaks ties; null when empty |
| nearlyFullSessionCount | Active/open/running scheduled or practice offers with 1–25% of released capacity remaining; scheduled offers must still be in their booking window |

Payments are simulated. Platform revenue is modeled commission, not cash collected or total booking value.

## Errors and screens

Errors use {error:{code,message}}. Invalid JSON returns 400 INVALID_JSON; oversized bodies return 413 PAYLOAD_TOO_LARGE. Malformed encoded path parameters return 400 INVALID_PATH. Unsupported JSON charsets or content encodings return 415 UNSUPPORTED_MEDIA_TYPE. Recognized database connection failures return 503 DATABASE_UNAVAILABLE; unexpected SQL/programming errors still return 500. Routes not implemented in the current branch return 404 ROUTE_NOT_IMPLEMENTED. Unexpected messages, SQL and stack traces are not sent to the browser.

| Screen | URL | Frontend owner |
|---|---|---|
| Home | / | Cholo |
| Browse | /browse.html | Kirsten |
| Detail | /detail.html?slotId=1 | Kat |
| Selection | /selection.html?slotId=1 | Kaithlyn |
| Booking form | /checkout.html?slotId=1&quantity=2 | Kaitlyn |
| Confirmation | /confirmation.html?id=UUID | Kaitlyn |
| Owner workspace | /owner.html | Fran |

See the [submission checklist](gc2-submission-gate.md) for current deployment verification.

The owner workspace stops waiting after 15 seconds, including while reading a response body. Read failures allow Refresh data. A save timeout does not trigger an automatic retry; the page asks the owner to refresh and check whether the change was saved.

## Studio research and applications

The published studio catalog comes from `GET /api/activities`. The studio profile adds eligible demo offers via `GET /api/providers/:id`. An application stays pending and the public readback exposes its ID, status and creation time. See [studio catalog](reference/studio-discovery.md) and [provider onboarding](reference/provider-onboarding.md).
