# Entity schema contract

Exact columns and constraints are in db/schema.sql. Five entities: providers -> services -> slots -> bookings, plus discount_tiers. API fields are camelCase; SQL columns are snake_case.

- providers: id, name, category, city, created_at.
- services: id, provider_id FK, name, category, duration_minutes > 0, original_price_centavos > 0, active, created_at.
- slots: id, service_id FK, starts_at timestamptz, capacity fixed at 1, minimum_price_centavos >= 0, status open/booked/cancelled, created_at. Unique service/start time.
- discount_tiers: id, min_hours_inclusive, max_hours_exclusive, discount_percent 0-100. Seed: 0-6h 30%, 6-24h 20%, 24-48h 10%.
- bookings: UUID id, slot_id FK, synthetic customer details, simulated payment method, status, original/tier/final price snapshots, commission/payout and timestamp. One confirmed booking per slot; final price = fee + payout.

## Invariants for application validation

Service active; floor <= original price; tier intervals non-overlapping and covering eligible times. Simple SQL checks do not enforce these cross-row/table rules. Validate them in seed review and any future rule editing. Availability queries check both status and absence of confirmed booking.

## Seed policy

Use a new empty demo database. Apply schema.sql then seed.sql. Seed is one-shot and refuses populated tables. Do not clear shared data to refresh expired times. Slots expire after 48h; use a fresh demo database or a reviewed refresh plan.

CP0 merges this design. SQL has not been executed during package preparation; execute on selected PostgreSQL version before CP1 and record actual outcomes.
