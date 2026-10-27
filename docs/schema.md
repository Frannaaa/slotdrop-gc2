# Group 1 data contract

Four entities: providers -> services -> slots -> bookings. Exact SQL is db/schema.sql. All data is fictional; this contract does not claim partner availability.

| Entity | Responsibility |
|---|---|
| providers | Business name and manually entered city/area |
| services | Activity, category, duration, beginner suitability and recurrence note |
| slots | One dated session, provider-set regular/offer prices, released seats and cutoff |
| bookings | Quantity, customer demo details, retry key and immutable receipt/fee snapshots |

A slot is now a group session. capacity is seats allocated exclusively to SlotDrop, not the studio's total capacity. seatsBooked = SUM(quantity) for confirmed bookings. remainingSeats = capacity - seatsBooked. Do not store a second mutable remaining-seats counter. Serialize and validate BIGINT IDs and money totals as safe integers at API boundaries; pg commonly returns BIGINT as a string.

Eligibility: active service, open slot, session already going ahead, startsAt strictly after now and strictly before now+72h, now strictly before bookingClosesAt, remainingSeats > 0. At exactly 72h or at the cutoff the offer is unavailable.

The price is a provider-entered CUSTOMER price per seat. No automatic tiers or minimum-price field remains. Show the provider the fee and net payout before saving an offer. Automated discounts and negotiated payout floors are deferred. The server validates 0 < offer price < legitimate original price and derives savings.

A booking transaction locks the slot, rechecks confirmed seat totals, recalculates prices, checks acknowledged total and writes the receipt. A unique request_id prevents duplicate retry bookings; it does not replace capacity validation. The old one-confirmed-booking-per-slot index has been removed because multiple customers can fill one session.

Limit owner edits: capacity cannot fall below sold seats; pause blocks new bookings without deleting existing ones; changes to offer price affect future bookings only; changing start time or cancelling a session with confirmed bookings returns 409 in this MVP. Customer cancellation/refunds and external-calendar synchronization are deferred.

SQL was executed in an ephemeral PGlite0.5.12 PostgreSQL18.6 engine for author checks; no hosted database is connected. Fresh-schema files are not migrations. schema.sql deliberately refuses existing tables instead of pretending CREATE IF NOT EXISTS upgrades an old schema. Use a new disposable demo database. Seed is one-shot and refuses existing data; no destructive reset is supplied. Seeded sessions expire after 72h and do not prove recurring real-world supply.
