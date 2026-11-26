# Final API refusals and server-total evidence

Captured 2026-11-24T18:24:22.965Z.

These are actual local HTTP responses from Fran's backend build, using a disposable PGlite database. They are not live Render captures or final release sign-off. Refresh them on the integrated build before submission.

Regenerate with `node tools/capture-final-api-evidence.mjs`. [Raw requests and responses](evidence/final-api.json).

## Accepted-total contract and the brief

The general Final brief gives HTTP 201 for an ignored, incorrect browser total. SlotDrop uses `expectedTotalCentavos` as the amount the customer agreed to pay. Changing it returns HTTP 409 `PRICE_CHANGED` and a fresh server quote, with nothing saved. The supplied GC2 feedback explicitly praises refusing a stale price rather than charging a different amount. We retain that behavior and show it here as a documented difference from the generic 201 example, not a claimed 201 pass. After explicit acceptance of the fresh quote, the follow-up request below returns 201 and its stored receipt is read by ID and matched in Owner. Unsupported price fields remain refused.

### 1 Invalid quantity

POST /api/bookings

Request:

```json
{
  "requestId": "39d4b74b-80d0-4a77-86af-e71369474bd3",
  "slotId": 1,
  "quantity": 0,
  "customerName": "Final API fixture",
  "customerEmail": "final.fixture@example.com",
  "paymentMethod": "mock_card",
  "expectedTotalCentavos": 160000
}
```

Actual HTTP 400:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "quantity is outside the allowed range."
  }
}
```

Saved bookings before/after: 0/0.

### 2 Missing customerName

POST /api/bookings

Request:

```json
{
  "requestId": "39d4b74b-80d0-4a77-86af-e71369474bd3",
  "slotId": 1,
  "quantity": 1,
  "customerEmail": "final.fixture@example.com",
  "paymentMethod": "mock_card",
  "expectedTotalCentavos": 160000
}
```

Actual HTTP 400:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Provide customerName."
  }
}
```

Saved bookings before/after: 0/0.

### 3 More seats than allocated

POST /api/bookings

Request:

```json
{
  "requestId": "39d4b74b-80d0-4a77-86af-e71369474bd3",
  "slotId": 1,
  "quantity": 5,
  "customerName": "Final API fixture",
  "customerEmail": "final.fixture@example.com",
  "paymentMethod": "mock_card",
  "expectedTotalCentavos": 760000
}
```

Actual HTTP 409:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "Only 4 seats are left for this session."
  }
}
```

Saved bookings before/after: 0/0.

### 4 Wrong accepted total

POST /api/bookings

Request:

```json
{
  "requestId": "39d4b74b-80d0-4a77-86af-e71369474bd3",
  "slotId": 1,
  "quantity": 1,
  "customerName": "Final API fixture",
  "customerEmail": "final.fixture@example.com",
  "paymentMethod": "mock_card",
  "expectedTotalCentavos": 1
}
```

Actual HTTP 409:

```json
{
  "error": {
    "code": "PRICE_CHANGED",
    "message": "The price for this booking changed. Please review the new total.",
    "quote": {
      "slotId": 1,
      "quantity": 1,
      "originalUnitPriceCentavos": 200000,
      "offerUnitPriceCentavos": 160000,
      "unitPriceCentavos": 160000,
      "pricingType": "standard",
      "groupSavingsCentavos": 0,
      "totalPriceCentavos": 160000,
      "platformFeeCentavos": 16000,
      "providerPayoutCentavos": 144000,
      "discountPercent": 20,
      "quotedAt": "2026-11-24T18:24:22.705Z"
    }
  }
}
```

Saved bookings before/after: 0/0.

### 5 Unknown product/session

GET /api/slots/999999

Actual HTTP 404:

```json
{
  "error": {
    "code": "SLOT_NOT_FOUND",
    "message": "Session not found."
  }
}
```

Saved bookings before/after: 0/0.

### 6 Search with no matches

GET /api/slots?q=no-such-final-fixture-workshop

Actual HTTP 200:

```json
[]
```

Saved bookings before/after: 0/0.

## Explicit acceptance and saved readback

### Accepted fresh server quote

POST /api/bookings

Request:

```json
{
  "requestId": "39d4b74b-80d0-4a77-86af-e71369474bd3",
  "slotId": 1,
  "quantity": 1,
  "customerName": "Final API fixture",
  "customerEmail": "final.fixture@example.com",
  "paymentMethod": "mock_card",
  "expectedTotalCentavos": 160000
}
```

Actual HTTP 201:

```json
{
  "id": "bc337390-14e1-406f-a56b-4a4b8ae2311d",
  "slotId": 1,
  "quantity": 1,
  "paymentMethod": "mock_card",
  "status": "confirmed",
  "serviceName": "Beginner Mug Handbuilding",
  "providerName": "Demo Clay Corner",
  "sessionStartsAt": "2026-11-26T02:00:00.000Z",
  "demoVariant": null,
  "originalUnitPriceCentavos": 200000,
  "offerUnitPriceCentavos": 160000,
  "unitPriceCentavos": 160000,
  "pricingType": "standard",
  "commissionBasisPoints": 1000,
  "totalPriceCentavos": 160000,
  "platformFeeCentavos": 16000,
  "providerPayoutCentavos": 144000,
  "createdAt": "2026-11-24T18:24:22.852Z"
}
```

Saved bookings before/after: 0/1.

### Read saved receipt by ID

GET /api/bookings/bc337390-14e1-406f-a56b-4a4b8ae2311d

Actual HTTP 200:

```json
{
  "id": "bc337390-14e1-406f-a56b-4a4b8ae2311d",
  "slotId": 1,
  "quantity": 1,
  "paymentMethod": "mock_card",
  "status": "confirmed",
  "serviceName": "Beginner Mug Handbuilding",
  "providerName": "Demo Clay Corner",
  "sessionStartsAt": "2026-11-26T02:00:00.000Z",
  "demoVariant": null,
  "originalUnitPriceCentavos": 200000,
  "offerUnitPriceCentavos": 160000,
  "unitPriceCentavos": 160000,
  "pricingType": "standard",
  "commissionBasisPoints": 1000,
  "totalPriceCentavos": 160000,
  "platformFeeCentavos": 16000,
  "providerPayoutCentavos": 144000,
  "createdAt": "2026-11-24T18:24:22.852Z"
}
```

Saved bookings before/after: 1/1.

### Matching Owner booking

GET /api/bookings

Actual HTTP 200:

```json
[
  {
    "id": "bc337390-14e1-406f-a56b-4a4b8ae2311d",
    "slotId": 1,
    "quantity": 1,
    "status": "confirmed",
    "sessionStartsAt": "2026-11-26T02:00:00.000Z",
    "originalUnitPriceCentavos": 200000,
    "offerUnitPriceCentavos": 160000,
    "pricingType": "standard",
    "unitPriceCentavos": 160000,
    "commissionBasisPoints": 1000,
    "totalPriceCentavos": 160000,
    "platformFeeCentavos": 16000,
    "providerPayoutCentavos": 144000,
    "createdAt": "2026-11-24T18:24:22.852Z",
    "serviceName": "Beginner Mug Handbuilding",
    "providerName": "Demo Clay Corner"
  }
]
```

Saved bookings before/after: 1/1.

## Hold API evidence

Create, read, release and expiry request bodies are in the raw evidence. Expiry uses an injected server clock advanced by ten minutes, rather than waiting on a browser timer. Booking conversion and the countdown UI are separate teammate handoffs and are not demonstrated by these captures.
