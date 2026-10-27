-- SlotDrop GC2 proposed database CONTRACT (not yet wired to Express).
-- Money uses integer centavos (100 = PHP 1.00). All timestamps are timestamptz.
-- For MVP every slot has capacity 1; bookings are simulated.

CREATE TABLE IF NOT EXISTS providers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Quezon City',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES providers(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    original_price_centavos INTEGER NOT NULL CHECK (original_price_centavos > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slots (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES services(id),
    starts_at TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity = 1),
    minimum_price_centavos INTEGER NOT NULL CHECK (minimum_price_centavos >= 0),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','booked','cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discount_tiers (
    id BIGSERIAL PRIMARY KEY,
    min_hours_inclusive INTEGER NOT NULL CHECK (min_hours_inclusive >= 0),
    max_hours_exclusive INTEGER NOT NULL CHECK (max_hours_exclusive > 0),
    discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),
    CHECK (min_hours_inclusive < max_hours_exclusive),
    UNIQUE (min_hours_inclusive, max_hours_exclusive)
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id BIGINT NOT NULL REFERENCES slots(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mock_card','pay_on_site')),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
    original_price_centavos INTEGER NOT NULL CHECK (original_price_centavos > 0),
    tier_discount_percent INTEGER NOT NULL CHECK (tier_discount_percent BETWEEN 0 AND 100),
    final_price_centavos INTEGER NOT NULL CHECK (final_price_centavos >= 0),
    platform_fee_centavos INTEGER NOT NULL CHECK (platform_fee_centavos >= 0),
    provider_payout_centavos INTEGER NOT NULL CHECK (provider_payout_centavos >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (platform_fee_centavos + provider_payout_centavos = final_price_centavos)
);

-- At most one confirmed booking per one-person slot, even with concurrent requests.
CREATE UNIQUE INDEX IF NOT EXISTS one_confirmed_booking_per_slot
  ON bookings(slot_id) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_slots_status_start ON slots(status, starts_at);

CREATE UNIQUE INDEX IF NOT EXISTS one_slot_per_service_time ON slots(service_id, starts_at);
