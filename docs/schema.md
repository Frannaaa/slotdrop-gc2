# Database schema

The SQL is in [db/schema.sql](../db/schema.sql). It defines six tables:

| Table | Stores |
|---|---|
| providers | Business name, city, area and stable source reference key |
| `services` | Activity and provider FK, category, type, technique, inclusions, preparation and cancellation notes, beginner flag, duration, recurrence, active status and default cutoff lead time |
| `slots` | Activity FK, start and cutoff, released capacity, regular/offer/buddy prices, sale status and confirmation that the session will run. Undated practice offers have two null dates. |
| bookings | Quantity, private demo customer details/retry key, status and saved time/price/fee fields |
| seat_holds | Unique retry key, session FK, quantity, server expiry, state and optional unique saved-booking FK |
| provider_applications | Private demo contact/representation details, optional referenced provider, unique retry key and review status |

The booking path is `providers` → `services` → `slots` → `bookings`, with one-to-many relationships at each step. A pending application may optionally refer to a provider.

## Seats and availability

capacity is the allocation released to SlotDrop, not the venue's total capacity.

```text
seatsBooked = sum of confirmed booking quantities
seatsHeld = sum of hold quantities where status is active and expires_at > server time
remainingSeats = capacity - seatsBooked - seatsHeld
```

There is no separate remaining-seats counter. Holds, bookings and capacity edits lock the same slots row before checking quantities. `slotSelect()` in the slot repository owns the shared count. SQL constraints alone do not enforce capacity across rows.

Discovery requires an active activity, an open offer, confirmation that the session will run and enough released seats. Scheduled offers also require a start after now but before now + 72 hours and a cutoff after now. Undated practice offers can be booked without those time checks.

## Cutoffs

services.default_booking_cutoff_minutes is positive. Scheduled offer creation uses it when no explicit bookingClosesAt is supplied. Each scheduled slot saves its resolved deadline, strictly before its start. Changing the activity default does not rewrite session deadlines.

A provider may set a different deadline for a particular session. The grading offers use a null start and cutoff, enforced as a pair. A partial unique index allows a stable `demo_variant` of 1 or 2 per activity, preserving the two fictional date choices. Their saved receipts have a null `session_starts_at`.

## Prices and receipts

Money uses integer PHP centavos. Per-seat values range from 1 to 100,000,000 centavos. Standard offer < regular price; a non-null buddy price must be below the standard offer.

bookings stores the regular price, standard offer, charged rate, pricing type, quantity, commission rate, total, fee, payout and session time. SQL checks that:

- standard pricing uses the saved standard offer;
- buddy pricing has quantity ≥ 2 and a lower charged rate;
- total = charged rate × quantity;
- fee = rounded per-seat commission × quantity;
- fee + provider payout = total.

The booking service must also select the correct stored rate; the receipt constraints do not choose it. Later owner edits leave saved booking money and time unchanged.

request_id is unique. It prevents duplicate keys at the database level; the booking API must still compare an identical retry with a conflicting reused key.

BIGINT IDs and totals must be converted to safe JSON integers. PostgreSQL's pg driver can return them as strings.

## Owner edits

The API accepts price, capacity, cutoff and status edits. Start changes and cutoff edits for practice offers return 400. Cancelling a session with confirmed bookings or active holds, or reducing capacity below their combined quantity, returns 409. Reopening requires an active activity, confirmation that the session will run and at least one available seat. Scheduled offers also require a future booking cutoff.

## Seed and setup

[db/seed.sql](../db/seed.sql) creates five real studio reference records, eight activities and sixteen sample sessions on the next two Philippine calendar days. Published prices and durations have official sources; session dates, released seats, default lead times and discounts are simulated.

`bootstrapDatabase()` runs schema creation and seeding in one transaction for an empty database. A database with all four booking tables goes through additive upgrades at application startup, including migration 003 if it predates studio applications. Startup stops if only some booking tables exist. Restarting preserves saved rows and their timestamps.

Render connects to a persistent Neon PostgreSQL database. CI verifies PostgreSQL 16. The [README stack](../README.md#stack) lists the local demo and runtime versions.


## Explicit activity attributes and safe upgrade

services adds activity_type (pottery/painting/pilates/dance/other), optional technique (handbuilding/wheel-throwing/ceramic-decoration), inclusions TEXT[] (materials/painting/firing/equipment), preparation_note and cancellation_note. Defaults preserve unknown facts rather than deriving them from free-form user tags. Category remains creative/active for broad reporting.

Fresh schema and seed contain these fields. Existing databases use db/migrations/001_activity_attributes.sql through server/repositories/migrations.js. Configured production startup and the persistent local demo apply this additive, repeatable upgrade before serving. Only the known fictional activity names with type=other receive demo metadata. Existing session dates, allocated seats, prices, saved receipts and customized notes are preserved. Never rerun seed.sql to apply this change.

## Reference and application upgrades

Migration 002 adds unique nullable `reference_key` values to providers and services. `ensureReferenceCatalog()` adds any missing source-backed records at startup and can add future sample allocations for active reference activities whose existing sessions are no longer bookable. Historical bookings and session dates are preserved. Known legacy fixture services are deactivated for customer discovery. Migration 003 adds `provider_applications` without deleting data. The provider FK is optional because a new studio may not have a reference page. Applications are pending; they cannot update providers, create accounts or publish offers. Public readback exposes only application UUID, status and received time. Contacts, retry keys and signatures remain private.

[Migration 004](../db/migrations/004_practice_sessions.sql) permits paired null dates on practice offers and a null session date on their receipts. Catalog startup creates three practice offers if absent. It keeps the original dates, seat totals and receipt snapshots of existing rows.


## Final seat-hold upgrade

[Migration 006](../db/migrations/006_seat_holds.sql) adds `seat_holds` without rewriting old sessions or receipts. It stores UUID `id`, unique UUID `request_id`, `slot_id`, positive `quantity`, `created_at`, `expires_at`, `status` and an optional unique `booking_id`. A database check requires a saved booking relation exactly when status is `converted`. `expires_at` must be later than creation.

The API stores the earlier of ten minutes and the current booking cutoff. Undated practice sessions have no cutoff, but each individual hold still expires. No timer process or deletion is required to restore availability: the shared slot query ignores inactive and expired rows at the server's current time. Expired rows remain available for readback and retry comparisons.

The own-hold exclusion argument in `findSlot()` is internal. Booking conversion must validate and lock the matching hold before using it, then update the hold and booking together. That conversion is Janelle's pending integration work. [API and handoff](routes.md#seat-holds-and-teammate-handoff).

