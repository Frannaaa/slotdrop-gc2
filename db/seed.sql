-- Group assignment: Fran. See docs/ownership-and-execution.md.
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
INSERT INTO services(id,provider_id,name,category,duration_minutes,recurrence_note,default_booking_cutoff_minutes) VALUES
 (1,1,'Beginner Mug Handbuilding','creative',120,'Fictional demo: recurring weekly sessions',180),
 (2,1,'Ceramic Painting for Beginners','creative',90,'Fictional demo: recurring weekly sessions',120),
 (3,2,'Beginner Canvas Painting','creative',120,'Fictional demo: recurring weekly sessions',60),
 (4,3,'Beginner Dance Drop-in','active',60,'Fictional demo: recurring weekly sessions',30);
-- Explicit sample attributes, not researched real-studio promises.
UPDATE services SET activity_type='pottery', technique='handbuilding', inclusions=ARRAY['materials','painting','firing'], preparation_note='Demo terms: make and decorate a mug. Firing is included; collection timing would be confirmed by the provider.' WHERE id=1;
UPDATE services SET activity_type='pottery', technique='ceramic-decoration', inclusions=ARRAY['materials','painting','firing'], preparation_note='Demo terms: decorate a ceramic piece. Firing is included; collection timing would be confirmed by the provider.' WHERE id=2;
UPDATE services SET activity_type='painting', inclusions=ARRAY['materials'], preparation_note='Demo terms: canvas and painting materials included. Wear clothes that can get paint on them.' WHERE id=3;
UPDATE services SET activity_type='dance', preparation_note='Demo terms: wear comfortable clothing and shoes; bring your own water.' WHERE id=4;
-- Activity lead times are fictional examples (180/120/60/30 minutes), not real studio policies.
-- Schedule fictional sessions at realistic Philippine daytime/evening hours.
-- Next-day base keeps every fresh seed inside 72 hours, with future cutoffs.
WITH schedule AS (
 SELECT (date_trunc('day', NOW() AT TIME ZONE 'Asia/Manila') + INTERVAL '1 day') AT TIME ZONE 'Asia/Manila' AS base
), offers(id,service_id,lead_time,capacity,original_price,offer_price,buddy_price) AS (
 VALUES
 (1,1,INTERVAL '10 hours',4,200000,160000,152000),
 (2,2,INTERVAL '13 hours',6,120000,95000,90000),
 (3,3,INTERVAL '16 hours',5,150000,120000,NULL),
 (4,4,INTERVAL '18 hours 30 minutes',8,60000,45000,42000),
 (5,1,INTERVAL '34 hours',3,200000,170000,NULL),
 (6,2,INTERVAL '37 hours',5,120000,100000,95000),
 (7,3,INTERVAL '40 hours',4,150000,125000,NULL),
 (8,4,INTERVAL '42 hours 30 minutes',6,60000,50000,NULL)
)
INSERT INTO slots(id,service_id,starts_at,booking_closes_at,capacity,original_price_centavos,offer_price_centavos,buddy_price_centavos)
 SELECT o.id,o.service_id,schedule.base+o.lead_time,
 schedule.base+o.lead_time-make_interval(mins=>s.default_booking_cutoff_minutes),
 o.capacity,o.original_price,o.offer_price,o.buddy_price
 FROM offers o CROSS JOIN schedule JOIN services s ON s.id=o.service_id
 ORDER BY o.id;
SELECT setval(pg_get_serial_sequence('providers','id'), (SELECT MAX(id) FROM providers));
SELECT setval(pg_get_serial_sequence('services','id'), (SELECT MAX(id) FROM services));
SELECT setval(pg_get_serial_sequence('slots','id'), (SELECT MAX(id) FROM slots));
COMMIT;

