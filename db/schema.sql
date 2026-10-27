-- Group 1 SlotDrop CP0 contract: fictional recurring leisure sessions.
-- This is a fresh-schema proposal, not a migration for an existing database.
-- Money is integer PHP centavos; timestamps use TIMESTAMPTZ.
BEGIN;
CREATE TABLE providers (
 id BIGSERIAL PRIMARY KEY,
 name TEXT NOT NULL,
 city TEXT NOT NULL,
 area TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE services (
 id BIGSERIAL PRIMARY KEY,
 provider_id BIGINT NOT NULL REFERENCES providers(id),
 name TEXT NOT NULL,
 category TEXT NOT NULL CHECK (category IN ('creative','active')),
 duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
 recurrence_note TEXT NOT NULL,
 beginner_friendly BOOLEAN NOT NULL DEFAULT TRUE,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE slots (
 id BIGSERIAL PRIMARY KEY,
 service_id BIGINT NOT NULL REFERENCES services(id),
 starts_at TIMESTAMPTZ NOT NULL,
 booking_closes_at TIMESTAMPTZ NOT NULL,
 -- Only seats allocated to SlotDrop; not the venue's complete class capacity.
 capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 100),
 original_price_centavos INTEGER NOT NULL CHECK (original_price_centavos > 0),
 -- Manually approved CUSTOMER price per seat, before platform commission.
 offer_price_centavos INTEGER NOT NULL CHECK (offer_price_centavos > 0),
 status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paused','cancelled')),
 runs_as_scheduled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK (booking_closes_at < starts_at),
 CHECK (offer_price_centavos < original_price_centavos),
 UNIQUE (service_id, starts_at)
);
CREATE TABLE bookings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 -- Stable client retry key; never used as authority for prices or stock.
 request_id UUID NOT NULL UNIQUE,
 slot_id BIGINT NOT NULL REFERENCES slots(id),
 quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
 customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) BETWEEN 1 AND 100),
 customer_email TEXT NOT NULL CHECK (length(customer_email) BETWEEN 3 AND 254),
 payment_method TEXT NOT NULL CHECK (payment_method IN ('mock_card','pay_on_site')),
 status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
 -- Immutable receipt fields; later offer edits do not rewrite a saved booking.
 session_starts_at TIMESTAMPTZ NOT NULL,
 original_unit_price_centavos INTEGER NOT NULL CHECK (original_unit_price_centavos > 0),
 unit_price_centavos INTEGER NOT NULL CHECK (unit_price_centavos > 0),
 commission_basis_points INTEGER NOT NULL CHECK (commission_basis_points BETWEEN 0 AND 10000),
 total_price_centavos BIGINT NOT NULL CHECK (total_price_centavos > 0),
 platform_fee_centavos BIGINT NOT NULL CHECK (platform_fee_centavos >= 0),
 provider_payout_centavos BIGINT NOT NULL CHECK (provider_payout_centavos >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK (unit_price_centavos < original_unit_price_centavos),
 CHECK (total_price_centavos = unit_price_centavos::BIGINT * quantity),
 CHECK (platform_fee_centavos + provider_payout_centavos = total_price_centavos)
);
CREATE INDEX idx_slots_status_start ON slots(status, starts_at);
CREATE INDEX idx_confirmed_bookings_slot ON bookings(slot_id) WHERE status = 'confirmed';
COMMIT;
-- Capacity across booking rows is enforced by a transaction locking the slot.
-- DO NOT restore the old one-confirmed-booking-per-slot index: seats are shareable.
