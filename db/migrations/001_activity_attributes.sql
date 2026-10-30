-- Additive and repeatable. Existing bookings, prices, seat allocations and dates are preserved.
DO $$ BEGIN
 ALTER TABLE services ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'other' CHECK (activity_type IN ('pottery','painting','pilates','dance','other'));
 ALTER TABLE services ADD COLUMN IF NOT EXISTS technique TEXT CHECK (technique IN ('handbuilding','wheel-throwing','ceramic-decoration'));
 ALTER TABLE services ADD COLUMN IF NOT EXISTS inclusions TEXT[] NOT NULL DEFAULT '{}' CHECK (inclusions <@ ARRAY['materials','painting','firing','equipment']::TEXT[]);
 ALTER TABLE services ADD COLUMN IF NOT EXISTS preparation_note TEXT NOT NULL DEFAULT '';
 ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_note TEXT NOT NULL DEFAULT 'Course demo: cancellations and rescheduling are unavailable.';
 UPDATE services SET activity_type='pottery', technique='handbuilding', inclusions=ARRAY['materials','painting','firing'], preparation_note='Demo terms: make and decorate a mug. Firing is included; collection timing would be confirmed by the provider.' WHERE name='Beginner Mug Handbuilding' AND activity_type='other';
 UPDATE services SET activity_type='pottery', technique='ceramic-decoration', inclusions=ARRAY['materials','painting','firing'], preparation_note='Demo terms: decorate a ceramic piece. Firing is included; collection timing would be confirmed by the provider.' WHERE name='Ceramic Painting for Beginners' AND activity_type='other';
 UPDATE services SET activity_type='painting', inclusions=ARRAY['materials'], preparation_note='Demo terms: canvas and painting materials included. Wear clothes that can get paint on them.' WHERE name='Beginner Canvas Painting' AND activity_type='other';
 UPDATE services SET activity_type='dance', preparation_note='Demo terms: wear comfortable clothing and shoes; bring your own water.' WHERE name='Beginner Dance Drop-in' AND activity_type='other';
END $$;
