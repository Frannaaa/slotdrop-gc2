# Reproduce the CP0 database checks

Run Node 22 or later, then:

    npm ci
    npm run check:sql

The pinned development dependency @electric-sql/pglite 0.5.12 runs PostgreSQL in memory. The checker creates its own disposable instance, reads db/schema.sql and db/seed.sql, and closes it after checking. It never reads DATABASE_URL, connects to a shared database, or changes existing hosted data.

The checks cover fresh schema/seed, eligible sessions, standard/buddy receipt calculations for quantities 1/2/3, duplicate request keys, multiple bookings in one session, invalid rates/quantities/cutoffs, money limits, fee rounding, stored receipts after an offer edit, and safe refusal of repeat seed.

These are SQL contract scenarios. They do not prove HTTP idempotency, transaction-lock behavior under simultaneous clients, external inventory accuracy, or a working booking API. Those checks belong to the later feature implementation.

## Seed lifetime

The schedule is generated from the transaction's NOW() and Asia/Manila calendar dates when seeding. Fresh seeds schedule sessions at 10 AM, 1 PM, 4 PM and 6:30 PM Philippine time across the next two calendar days. Cutoffs use each activity's configured lead time. A database seeded for CP0 will not provide a usable Browse demonstration indefinitely.

For a new local demonstration, create a new disposable database and apply schema and seed there. The files refuse existing tables/data; they are not migrations and do not contain a destructive reset. Never drop a shared database to refresh sample times. In the later implementation, the owner creates new dated sessions through the assigned offer API.

## Hosted PostgreSQL, later checkpoint

Use the host's selected PostgreSQL version and apply the same schema/seed to a new demo database. Record the actual server version and run integration/locking tests there. Passing PGlite checks is not evidence that hosted connectivity or deployment works.
