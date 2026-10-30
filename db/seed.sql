-- Real studio references; schedules, allocations, cutoffs and offers are course simulations.
-- Never run this on a populated database. Generated from public/data/real-studio-demo.json.
BEGIN;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM providers) OR EXISTS(SELECT 1 FROM services) OR EXISTS(SELECT 1 FROM slots) OR EXISTS(SELECT 1 FROM bookings) THEN
  RAISE EXCEPTION 'Seed requires an empty demo database; no data changed';
 END IF;
END $$;
INSERT INTO providers(id,name,city,area,reference_key) VALUES
(1,'Laro Ceramics','Quezon City','Katipunan','laro-qc'),
(2,'Bumi & Ashe','Quezon City','Cubao Expo','bumi-cubao'),
(3,'AMT Ceramics','Quezon City','Tandang Sora','amt-qc'),
(4,'Sip & Gogh','Makati','Century City','sip-century'),
(5,'Tahanan Pottery Shop & Studio','Quezon City','Scout Tobias','tahanan-qc');
INSERT INTO services(id,provider_id,name,category,activity_type,technique,inclusions,preparation_note,cancellation_note,duration_minutes,recurrence_note,default_booking_cutoff_minutes,reference_key) VALUES
(1,1,'Mug-making + painting','creative','pottery','handbuilding',ARRAY['materials','painting','firing']::TEXT[],'Leave your piece for glazing/firing; the official page currently estimates collection in about three months.','Course simulation: no real reservation, cancellation or refund is created.',180,'Sample dates only. Published schedule reference: Choose a date/time on the official booking page; no fixed weekly timetable verified.',180,'laro-mug'),
(2,1,'Beginner’s wheel-throwing','creative','pottery','wheel-throwing',ARRAY['materials','firing','equipment']::TEXT[],'Check the official wheel-class inclusions and collection instructions before a real visit.','Course simulation: no real reservation, cancellation or refund is created.',180,'Sample dates only. Published schedule reference: Choose a date/time on the official booking page; no fixed weekly timetable verified.',180,'laro-wheel'),
(3,2,'Mug-making workshop','creative','pottery','handbuilding',ARRAY['materials','painting','firing']::TEXT[],'The official mug package lists a two-hour session. Confirm the exact package/output with the studio; collection follows firing.','Course simulation: no real reservation, cancellation or refund is created.',120,'Sample dates only. Published schedule reference: Official FAQ says slots open every week; exact times require the booking date selector or studio confirmation.',180,'bumi-mug'),
(4,2,'Free Form Pottery + Paint','creative','pottery','handbuilding',ARRAY['materials','painting','firing']::TEXT[],'The official free-form package describes a three-hour session and collection after firing, usually six to eight weeks.','Course simulation: no real reservation, cancellation or refund is created.',180,'Sample dates only. Published schedule reference: Choose an available date/time on the official site or request a custom date; no fixed weekly timetable verified.',180,'bumi-freeform'),
(5,3,'Hand-Building — single session','creative','pottery','handbuilding',ARRAY[]::TEXT[],'The official FAQ lists a three-hour single session. Confirm inclusions and collection directly with AMT.','Course simulation: no real reservation, cancellation or refund is created.',180,'Sample dates only. Published schedule reference: Published FAQ: Fridays, Saturdays and Sundays, 10 AM–1 PM for exploratory single sessions. Reconfirm the chosen date with the studio; availability not verified.',180,'amt-handbuilding'),
(6,3,'Wheel-Throwing Exploratory — single session','creative','pottery','wheel-throwing',ARRAY[]::TEXT[],'The official FAQ lists a three-hour exploratory session. Confirm the selected class and inclusions directly with AMT.','Course simulation: no real reservation, cancellation or refund is created.',180,'Sample dates only. Published schedule reference: Published FAQ: Fridays, Saturdays and Sundays, 10 AM–1 PM for exploratory single sessions. Reconfirm the chosen date with the studio; availability not verified.',180,'amt-wheel'),
(7,4,'Open Session — painting','creative','painting',NULL,ARRAY[]::TEXT[],'The cited painting session includes a complimentary drink and appetizer snacks. Other session themes and terms vary.','Course simulation: no real reservation, cancellation or refund is created.',180,'Sample dates only. Published schedule reference: Specific published example: November 6, 2026, 6–9 PM. Other dates and themes vary; use the official calendar.',60,'sip-open'),
(8,5,'Exploratory Wheel Workshop','creative','pottery','wheel-throwing',ARRAY[]::TEXT[],'Confirm the selected workshop, included materials and collection arrangements with Tahanan.','Course simulation: no real reservation, cancellation or refund is created.',180,'Sample dates only. Published schedule reference: Official overview: Saturdays, 2–5 PM. A recurring pattern is not a confirmed available date.',180,'tahanan-wheel');
WITH base AS (SELECT (date_trunc('day',NOW() AT TIME ZONE 'Asia/Manila')+INTERVAL '1 day') AT TIME ZONE 'Asia/Manila' AS day),
 offers(id,service_id,hours,price,offer,buddy) AS (VALUES
(1,1,10,300000,270000,256500),
(2,1,34,300000,270000,256500),
(3,2,11,320000,288000,273600),
(4,2,35,320000,288000,273600),
(5,3,12,265000,238500,NULL),
(6,3,36,265000,238500,NULL),
(7,4,13,320000,288000,273600),
(8,4,37,320000,288000,273600),
(9,5,14,290000,261000,247950),
(10,5,38,290000,261000,247950),
(11,6,15,290000,261000,NULL),
(12,6,39,290000,261000,NULL),
(13,7,16,140000,126000,119700),
(14,7,40,140000,126000,119700),
(15,8,17,250000,225000,213750),
(16,8,41,250000,225000,213750)) INSERT INTO slots(id,service_id,starts_at,booking_closes_at,capacity,original_price_centavos,offer_price_centavos,buddy_price_centavos)
 SELECT o.id,o.service_id,base.day+make_interval(hours=>o.hours),base.day+make_interval(hours=>o.hours)-make_interval(mins=>s.default_booking_cutoff_minutes),4,o.price,o.offer,o.buddy
 FROM offers o CROSS JOIN base JOIN services s ON s.id=o.service_id ORDER BY o.id;
SELECT setval(pg_get_serial_sequence('providers','id'),(SELECT MAX(id) FROM providers));
SELECT setval(pg_get_serial_sequence('services','id'),(SELECT MAX(id) FROM services));
SELECT setval(pg_get_serial_sequence('slots','id'),(SELECT MAX(id) FROM slots));
COMMIT;
