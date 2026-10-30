# Database schema

The SQL is in [db/schema.sql](../db/schema.sql). It defines four tables:

| Table | Stores |
|---|---|
| providers | Business name, city and area |
| services | Activity, provider, category, duration, recurrence note, active status and default booking lead time |
| slots | Dated session, actual booking deadline, released capacity, regular/offer/buddy prices and status |
| bookings | Quantity, demo customer details, retry key, status and saved time/price/fee fields |

Relationships: providers → services → slots → bookings. One session can have several bookings.

## Seats and availability

capacity is the allocation released to SlotDrop, not the venue's total capacity.

```text
seatsBooked = sum of confirmed booking quantities
remainingSeats = capacity - seatsBooked
```

There is no separate remaining-seats counter. Booking and capacity edits must lock the same slots row before checking quantities. Owner edits already do this in the development PRs; the booking transaction still needs integration. SQL constraints alone do not enforce capacity across all booking rows.

Discovery requires an active activity, an open session that will run, a start after now but before now + 72 hours, a cutoff after now, and enough remaining seats. At the cutoff or exactly 72 hours away, the offer is excluded.

## Cutoffs

services.default_booking_cutoff_minutes is positive. Creation uses it when no explicit bookingClosesAt is supplied. Each slot saves its resolved deadline, strictly before its start. A later change to an activity default does not rewrite existing sessions.

A provider may set a different deadline for a particular session. There is no platform-wide minimum lead time.

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

The API accepts price, capacity, cutoff and status edits. It rejects unknown fields, including start-time changes, with 400. Cancelling a session with confirmed bookings or reducing capacity below confirmed seats returns 409. Reopening paused or cancelled inventory requires a future cutoff/start, an active activity, available allocation and a session confirmed to run.

## Seed and setup

[db/seed.sql](../db/seed.sql) creates three fictional providers, four activities and eight sessions on the next two Philippine calendar days. Session times are 10 AM, 1 PM, 4 PM and 6:30 PM, with activity-specific cutoffs.

Schema creation refuses existing tables. Seeding refuses existing data. Neither script resets a shared database or migrates an older schema. Restarting the app preserves saved rows and does not refresh their timestamps.

PostgreSQL 16 was tested in CI. PGlite 0.5.12 is used for the explicit local demo and SQL checks. Public database hosting is not yet configured.


## Explicit activity attributes and safe upgrade

services adds activity_type (pottery/painting/pilates/dance/other), optional technique (handbuilding/wheel-throwing/ceramic-decoration), inclusions TEXT[] (materials/painting/firing/equipment), preparation_note and cancellation_note. Defaults preserve unknown facts rather than deriving them from free-form user tags. Category remains creative/active for broad reporting.

Fresh schema and seed contain these fields. Existing databases use db/migrations/001_activity_attributes.sql through server/repositories/migrations.js. Configured production startup and the persistent local demo apply this additive, repeatable upgrade before serving. Only the known fictional activity names with type=other receive demo metadata. Existing session dates, allocated seats, prices, saved receipts and customized notes are preserved. Never rerun seed.sql to apply this change.

## Real reference and application extension

Migrations 002–003 add nullable unique reference keys and a fifth table, provider_applications. It stores private sample contact/representation fields, optional reference-provider FK, retry key/signature, pending/approved/declined status and created time. Public status contains only UUID/status/time. An application never edits a provider or grants access. Fresh seed: five real reference providers, eight activities, sixteen sample allocations. Existing databases install this catalog additively; old receipts and dates stay unchanged. Known synthetic fixtures remain only for historical records and regression tests.
