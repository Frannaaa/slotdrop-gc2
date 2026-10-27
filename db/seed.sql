-- Synthetic, proposed demo inventory. No named real provider is a partner.
-- Run only on a NEW database after schema.sql. Existing data is preserved on refusal.
BEGIN;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM providers) OR EXISTS (SELECT 1 FROM services)
 OR EXISTS (SELECT 1 FROM slots) OR EXISTS (SELECT 1 FROM bookings) THEN
  RAISE EXCEPTION 'Seed requires an empty demo database; no data changed';
 END IF;
END $$;
-- Explicit IDs avoid assuming an untouched sequence in an empty database.
INSERT INTO providers(id,name,city,area) VALUES
 (1,'Demo Clay Corner','Quezon City','Katipunan'),
 (2,'Demo Color Room','Quezon City','UP Village'),
 (3,'Demo Move Studio','Quezon City','Katipunan');
INSERT INTO services(id,provider_id,name,category,duration_minutes,recurrence_note) VALUES
 (1,1,'Beginner Mug Handbuilding','creative',120,'Fictional demo: recurring weekly sessions'),
 (2,1,'Ceramic Painting for Beginners','creative',90,'Fictional demo: recurring weekly sessions'),
 (3,2,'Beginner Canvas Painting','creative',120,'Fictional demo: recurring weekly sessions'),
 (4,3,'Beginner Dance Drop-in','active',60,'Fictional demo: recurring weekly sessions');
-- Eight independently bookable sessions inside 72 hours immediately after seeding.
-- Every session is already going ahead; allocation is only the seats released here.
INSERT INTO slots(id,service_id,starts_at,booking_closes_at,capacity,original_price_centavos,offer_price_centavos) VALUES
 (1,1,NOW()+INTERVAL '5 hours', NOW()+INTERVAL '3 hours',4,200000,160000),
 (2,2,NOW()+INTERVAL '12 hours',NOW()+INTERVAL '10 hours',6,120000,95000),
 (3,3,NOW()+INTERVAL '25 hours',NOW()+INTERVAL '23 hours',5,150000,120000),
 (4,4,NOW()+INTERVAL '30 hours',NOW()+INTERVAL '28 hours',8,60000,45000),
 (5,1,NOW()+INTERVAL '45 hours',NOW()+INTERVAL '43 hours',3,200000,170000),
 (6,2,NOW()+INTERVAL '50 hours',NOW()+INTERVAL '48 hours',5,120000,100000),
 (7,3,NOW()+INTERVAL '60 hours',NOW()+INTERVAL '58 hours',4,150000,125000),
 (8,4,NOW()+INTERVAL '70 hours',NOW()+INTERVAL '68 hours',6,60000,50000);
SELECT setval(pg_get_serial_sequence('providers','id'), (SELECT MAX(id) FROM providers));
SELECT setval(pg_get_serial_sequence('services','id'), (SELECT MAX(id) FROM services));
SELECT setval(pg_get_serial_sequence('slots','id'), (SELECT MAX(id) FROM slots));
COMMIT;
