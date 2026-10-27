# SlotDrop GC2 — API contract (CP0)

**Contract status:** proposed at CP0; keep this file consistent with the final code. All routes return JSON. The browser only talks to this Express API; it never talks directly to Postgres.

| Method | Route | Input | Success response | Other codes | Owner |
|---|---|---|---|---|---|
| GET | `/api/slots` | Optional `?q=` or `?category=salon` | `200` JSON array of eligible open slots (possibly `[]`) | `400` invalid query type | Fran |
| GET | `/api/slots/:id` | Numeric slot ID | `200` slot detail object | `404` nonexistent ID; `400` malformed ID | Fran |
| GET | `/api/pricing/quote?slotId=1` | Numeric slot ID | `200` current price preview | `400` missing ID; `404` unknown | Janelle |
| POST | `/api/bookings` | JSON body below | `201` new booking ID + server-priced summary | `400` invalid input; `404` unknown slot; `409` unavailable | Janelle |
| GET | `/api/bookings/:id` | UUID booking ID | `200` saved booking confirmation | `400` malformed ID; `404` unknown | Janelle / Kaitlyn |
| GET | `/api/bookings` | None | `200` JSON array for demo owner screen | — | Fran |
| GET | `/api/metrics` | None | `200` five computed owner metrics | — | Fran |
| GET | `/api/health` | None | `200` health object | — | Fran (skeleton) |

## Common response field names

`GET /api/slots` returns an array (not `{slots: ...}`); each element follows:

```json
{
  "id": 1,
  "providerName": "K-Beauty Studio",
  "serviceName": "Haircut and Blow-Dry",
  "category": "salon",
  "city": "Quezon City",
  "startsAt": "2026-10-29T03:00:00.000Z",
  "originalPriceCentavos": 100000,
  "currentPriceCentavos": 80000,
  "discountPercent": 20,
  "status": "open"
}
```

The shown date and price are illustrative, not live database records. Display startsAt in **Asia/Manila**. The server computes currentPriceCentavos, never accepts it from the browser.

Booking request example:

```json
{
  "slotId": 1,
  "customerName": "Demo Customer",
  "customerEmail": "demo@example.com",
  "paymentMethod": "mock_card"
}
```

The server must calculate the booking price, platform fee and provider payout. It must lock the slot row, save the booking and update the slot within **one database transaction**. No double booking. Booking confirmation is read again from the database using the returned ID; it is not reconstructed from local storage.

`GET /api/metrics` response example field names:

```json
{
  "bookingCount": 0,
  "platformRevenueCentavos": 0,
  "averageOrderValueCentavos": 0,
  "topSellingService": null,
  "nearlyFullServiceCount": 0
}
```

For GC2, booking_count, gross booking values, and platform revenue are **simulated**. Rules and sample prices are proposed, subject to group approval. Provider slot creation is deferred beyond this CP0 contract unless the team obtains instructor clearance and opens a contract-change Issue.


## Contract boundary decisions

- Eligible inventory: service active, slot open, no confirmed booking, and 0 < startsAt-now < 48 hours. Exact 6h uses 20%; exact 24h uses 10%; exact 48h is excluded. Use one server timestamp per request.
- SQL BIGINT may arrive as a string. Serialize numeric API IDs only after safe-integer validation. Malformed/unsafe ID gives 400; a valid absent ID gives 404.
- All money is integer centavos. Round discounted price once, apply the provider floor, round commission once, and set payout = final price minus fee. Show actual savings when the floor changes the tier discount.
- Quote is a preview. Booking recomputes at submission; confirmation reads the saved price snapshot. Surface a price-change notice if preview and current price differ.
- Booking a valid but booked/cancelled/expired/outside-window slot gives 409. An unknown slot gives 404.
- Validate slotId as positive safe integer; customerName trimmed 1-100 characters; customerEmail trimmed, max 254, basic email shape; paymentMethod mock_card or pay_on_site. Ignore or reject browser-supplied money, never use it.
- Planned business errors use {error:{code,message}}. Invalid JSON body gives 400. Unexpected failure gives generic 500 without SQL or credentials.
- Detail adds durationMinutes and minimumPriceCentavos to list fields.
- Quote returns {slotId, originalPriceCentavos, currentPriceCentavos, discountPercent, quotedAt}; unavailable gives 409.
- Booking success/confirmation: {id, slotId, customerName, customerEmail, paymentMethod, status, originalPriceCentavos, finalPriceCentavos, platformFeeCentavos, providerPayoutCentavos, createdAt}, plus provider/service/time labels on readback.
- Metrics use confirmed saved bookings only. platformRevenueCentavos = sum of saved fees; averageOrderValueCentavos = rounded mean of saved final prices, 0 if empty; topSellingService = null or {serviceId,serviceName,bookingCount}, tie by lowest serviceId.
- nearlyFullServiceCount: for each service with at least one non-cancelled slot in the upcoming 48h window, remaining open eligible slots / all non-cancelled slots <= 25%. Booked slots remain in denominator. Count qualifying service groups, return 0 if none.
- Owner bookings returns saved summaries, fictional customer data only. A public demo is not a secure production owner portal.

## Seven screen URLs

| Screen | Planned URL | Owner |
|---|---|---|
| Home | / | Cholo |
| Browse | /browse.html | Kirsten |
| Detail | /detail.html?slotId=1 | Kaithlyn |
| Selection summary | /selection.html?slotId=1 | Kaithlyn |
| Booking form | /checkout.html?slotId=1 | Kaitlyn |
| Confirmation | /confirmation.html?id=UUID | Kaitlyn |
| Owner dashboard | /owner.html | Fran |
