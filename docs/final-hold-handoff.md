# Selection to Checkout: Final hold handoff

Updated November 28, 2026. Current reviewed main: `00feaa5`.

## Owners and status

| Work | Owner | Current status |
| --- | --- | --- |
| Selection hold creation/reuse and navigation | Kat | Kat reports implementation and tests complete. Final code is awaiting PR publication and independent review. |
| Checkout receiving fields, countdown, quote/save and Confirmation | Kaitlyn | Assigned in [issue 97](https://github.com/Frannaaa/slotdrop-gc2/issues/97). Receiving hold code is absent from current main and the published Checkout branch. |
| Home/integration follow-ups and shared-style review coverage | Fran | Chonel's required Home work is complete, merged in PR93 and live. [Home issue 3](https://github.com/Frannaaa/slotdrop-gc2/issues/3) is closed with Chonel's credit retained. |
| Quote/save contract and independent review of Fran's work | Janelle | PR95 merged. Supports API questions and reviews PR96. |
| Shared reservation/error/mobile styling | Kirsten | Fran covers review during Chonel's approved absence. Janelle reviews Fran-authored changes. |

Kat should keep the PR Selection-only. Kaitlyn owns the receiving Checkout/Confirmation changes. Fran covers all remaining Chonel follow-ups and later presentation coordination. No new Home code, video or reflection section is assigned to Chonel. Actual slide assembly remains deferred.

## Browser fields versus API fields

| Field | Selection-to-Checkout URL | Quote query | Booking body |
| --- | --- | --- | --- |
| `slotId` | Yes | Yes | Yes |
| `quantity` | Yes | Yes | Yes |
| `holdId` | Yes | Yes | Yes |
| `expiresAt` | Yes, as a handoff hint | No | No |
| `serverNow` | Yes, as a handoff hint | No | No |

Use `URLSearchParams` for browser navigation. Re-read `GET /api/holds/:id` to verify the session, quantity, effective status, `expiresAt` and `serverNow`. URL timestamps never create or extend a reservation. Calculate the countdown from the server response and elapsed time, then revalidate on reload/return.

Quote is `GET /api/pricing/quote?slotId=&quantity=&holdId=`. It returns `holdId` and `holdExpiresAt`, in addition to the normal quote. The browser's `expiresAt` name differs from the quote's `holdExpiresAt`.

Save is the existing `POST /api/bookings` payload plus the same `holdId`. Do not forward URL timestamps into either API: both reject unsupported fields. A successful held booking returns its persisted hold reference in the receipt.

## Confirmed receiving gap

On main, `checkout.js` calls:

```js
pageParameters(location.search, ["slotId", "quantity"]);
```

The actual shared parser and this whitelist were executed with fixture URL parameters. The ordinary two-field link passed. Adding Kat's three hold fields returned:

> Open a valid link with each field appearing once.

This happens before the API call. It is a parser-level reproduction, not a claim that Kat's unpublished implementation has been tested. Current Checkout also omits `holdId` from quote, pending storage and booking.

## Integration safeguards

- Use the hold-aware quote even if public remaining seats are zero. The server excludes this customer's own matching hold exactly once. Do not refuse a valid held customer based only on public availability.
- Keep one booking `requestId` and exact serialized body across double Confirm, rate-limit retry, reload and uncertain-result retry.
- Scope pending storage and its validator to session, quantity and hold identity. A replacement hold for the same session/quantity must not restore an old hold's payload.
- A known expired hold cannot start a new booking. Show its reason and a clear action back to Selection, which owns creating/reusing a replacement reservation. Avoid both screens creating another hold.
- If a POST result is uncertain, retain and allow replay of its exact request even after the displayed deadline. The server checks an already-saved request before expiry, so this recovers its original receipt rather than creating another booking.
- Preserve PRICE_CHANGED re-acceptance, successful `location.replace`, receipt Refresh and legacy hold-free receipts.
- Validate/display the saved `holdId` for held receipts. Clear pending state only after a verified receipt or a definitive rejection.

## Joint acceptance check

| Scenario | Expected result |
| --- | --- |
| Kat's five-field link | Checkout loads and preserves that hold through quote, save and receipt |
| Customer holds the whole allocation | Public remaining is zero, but their valid held quote/save succeeds |
| Refresh/Back/return | Existing expiry and identity survive; no extra hold is created |
| Expired, mismatched, released, converted or unknown hold | Named recovery state; a known rejection creates no booking |
| Rapid Confirm/retry | One booking, one saved ID, availability counted once |
| Save succeeds but response is lost, then deadline passes | Exact same-request retry recovers the original receipt |
| New hold for the same session/quantity | No stale payload from the old hold |
| PRICE_CHANGED, receipt Refresh, 320/390 px | Existing correctness and usable layout remain intact |

Kat/Kaitlyn review each other's PRs. Fran runs the joint browser/HTTP checks after both are published and integrated. Until then, do not mark the visible USP complete.

## Current internal targets, PHT

- Kat: publish the ready Selection PR tonight, November 28, with test commands/results and AI disclosure.
- Kaitlyn: Checkout/Confirmation PR by November 29, noon.
- Kat: receiving-PR review by November 29, 2 PM. Kaitlyn reviews Selection once it is published.
- Janelle: independent PR96 review by November 29, 2 PM.
- Fran: integrated tinker/four-proof checks by November 29, 8 PM, after reviews and CI.
- Two full timed rehearsals plus Q&A remain November 30; final submission remains December 1, 11:59 PM.

These are team finishing targets, not additional instructor deliverables.

## Source rules

- [Checkout and its current whitelist](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/public/js/checkout.js)
- [Shared parser](https://github.com/Frannaaa/slotdrop-gc2/blob/00feaa5f8186f3d98db9470ba9acd228d02ee91d/public/js/customer-common.js)
- [Route contract](routes.md)
- [Hold service](../server/services/holds.js)
- [Pricing service](../server/services/pricing.js)
- [Booking service](../server/services/bookings.js)
