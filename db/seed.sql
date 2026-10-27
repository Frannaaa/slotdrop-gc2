BEGIN;
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM providers) OR EXISTS (SELECT 1 FROM services)
 OR EXISTS (SELECT 1 FROM slots) OR EXISTS (SELECT 1 FROM bookings)
 OR EXISTS (SELECT 1 FROM discount_tiers) THEN
 RAISE EXCEPTION 'Seed requires an empty demo database; no data changed';
END IF;
END $$;
-- Demo-only synthetic data; do NOT run on a database that already contains orders.
-- Execute db/schema.sql first. Uses a clean fresh database and next-day time slots.
INSERT INTO providers (name, category, city) VALUES
('K-Beauty Studio', 'salon', 'Quezon City'),
('QuickGlow Wellness', 'spa', 'Quezon City'),
('Katipunan Cuts', 'salon', 'Quezon City');

INSERT INTO services (provider_id, name, category, duration_minutes, original_price_centavos) VALUES
(1, 'Haircut and Blow-Dry', 'salon', 60, 100000),
(1, 'Hair Treatment', 'salon', 90, 160000),
(2, 'Shoulder and Back Massage', 'spa', 60, 140000),
(3, 'Basic Haircut', 'salon', 45, 70000);

INSERT INTO discount_tiers (min_hours_inclusive, max_hours_exclusive, discount_percent) VALUES
(0,6,30), (6,24,20), (24,48,10);

-- Use positive hour offsets so demos still have real upcoming slots right after seeding.
INSERT INTO slots (service_id, starts_at, minimum_price_centavos, status) VALUES
(1, NOW() + INTERVAL '4 hours', 75000, 'open'),
(1, NOW() + INTERVAL '12 hours', 75000, 'open'),
(2, NOW() + INTERVAL '20 hours', 115000, 'open'),
(2, NOW() + INTERVAL '30 hours', 115000, 'open'),
(3, NOW() + INTERVAL '5 hours', 95000, 'open'),
(3, NOW() + INTERVAL '15 hours', 95000, 'open'),
(4, NOW() + INTERVAL '25 hours', 50000, 'open'),
(4, NOW() + INTERVAL '40 hours', 50000, 'open');

COMMIT;
