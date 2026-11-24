-- Additive upgrade: existing sessions, bookings and receipt snapshots stay intact.
CREATE TABLE IF NOT EXISTS seat_holds (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id UUID NOT NULL UNIQUE,
 slot_id BIGINT NOT NULL REFERENCES slots(id),
 quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
 expires_at TIMESTAMPTZ NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','converted')),
 booking_id UUID UNIQUE REFERENCES bookings(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK (expires_at > created_at),
 CHECK ((status = 'converted') = (booking_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_active_holds_slot_expiry
 ON seat_holds(slot_id, expires_at) WHERE status = 'active';
