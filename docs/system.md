# SlotDrop system and data flow

This diagram describes the currently merged server architecture. Checkout and Confirmation customer pages are still in PR #43 as of November 8; this is a **source-derived design/code trace**, not a claim that the public browser flow has been deployed or tested. No real customer booking or studio reservation is created.

```mermaid
flowchart LR
  Browser[HTML/CSS/JS browser] -->|fetch JSON| API[Express routes]
  API --> Validation[Validation & business services]
  Validation --> Repo[SQL repositories]
  Repo --> DB[(PostgreSQL)]
  DB --> Repo
  Repo --> Validation
  Validation --> API
  API -->|JSON| Browser
```

## Transaction: choose, quote, save, read back

| Hop | Code location | Behavior |
|---|---|---|
| 1. Browse | `public/js/home.js` and, when delivered, the assigned Browse page → `GET /api/slots` | Requests date/area/people-filtered eligible slots |
| 2. Discover | `server/routes/slots.js` → `listSlots()` in `server/services/discovery.js` → `server/repositories/slots.js` | Filters active sessions, future cutoff, remaining released seats and discovery window; returns JSON |
| 3. Choose | `public/js/detail.js` and `public/js/selection.js` | Fetches detail and quantity-aware quote; displays the selected session and party price |
| 4. Quote | `server/routes/pricing.js` → `server/services/pricing.js` | Validates session and quantity; selects standard or buddy tier stored in DB, never browser money |
| 5. Submit | **Pending merge:** `public/js/checkout.js` in PR #43 → `request('/api/bookings', {method:'POST', ...})` in `public/js/customer-common.js` | Creates a stable UUID requestId, retains retry payload on uncertainty and sends fictional guest details/acknowledged total; page must still prevent a second submit after accepted success |
| 6. Route | `server/routes/bookings.js` → `createBooking()` in `server/services/bookings.js` | Validates allowed fields, UUID, quantity, fictional contact fields and payment choice |
| 7. Transaction | `createBooking()`, `checkBookable()`, `priceQuote()` | Checks existing requestId; locks `slots` row with `SELECT ... FOR UPDATE`; rechecks available seats and eligibility after lock; recomputes tier/fee/total and checks expectedTotalCentavos |
| 8. Database save | `createBooking()` → SQL `INSERT INTO bookings ... RETURNING id` | Stores accepted price, time, quantity, fee and provider proceeds as immutable snapshots; commits atomic booking. Same normalized requestId returns existing receipt (HTTP 200), new booking HTTP 201 |
| 9. Receipt readback | `GET /api/bookings/:id` → `findReceipt()` | Reads saved receipt by UUID from PostgreSQL. Public payload omits private guest contact information and retry key |
| 10. Confirmation | **Pending merge:** `public/js/confirmation.js` in PR #43 | Fetches receipt again by ID and renders saved booking reference, activity, seats and total—not a browser-only success message |
| 11. Owner | `GET /api/bookings`, `GET /api/metrics` → `public/js/owner.js` | Reads saved booking list and five metrics from persisted confirmed bookings; a two-seat order counts as one booking |

All money is modeled in PHP centavos. The active commission setting lives in `server/config/business.js`; quote and booking both derive totals on the server. The selected quantity is **not** reserved when merely viewing Detail/Selection; save is the transaction that reduces remaining seats. The code derives remaining seats from released capacity minus confirmed booking quantities rather than persisting a mutable display counter.

## Owner offer-management path

1. `public/js/owner.js` sends `POST /api/slots` or `PATCH /api/slots/:id`; edits send only changed fields.
2. `server/routes/slots.js` calls `createOffer()` or `editOffer()` in `server/services/offers.js`.
3. The service validates cutoff/price/capacity, locks the relevant activity or slot and refuses edits conflicting with confirmed seats.
4. `server/repositories/slots.js` returns the updated offer and available-seat count.
5. Owner refreshes catalog, metrics and saved bookings. Prior confirmed receipts are not rewritten by later offers.

## Evidence required in Challenge 2

**Not yet collected from the final public deployment.** One group member must open DevTools Network on the actual submitted group URL, complete a fictional booking and record the **actual** request method, URL, body, status, response, browser file/function, route/service/database statements and rendered receipt. Attach a **hand-drawn** diagram or photo in `docs/challenges.md` and note date/commit. The architecture diagram above does not replace that recording.
