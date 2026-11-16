-- An undated practice offer has no start or booking cutoff.
DO $$ BEGIN
 ALTER TABLE slots
  ALTER COLUMN starts_at DROP NOT NULL,
  ALTER COLUMN booking_closes_at DROP NOT NULL;
 IF NOT EXISTS (
  SELECT 1 FROM pg_constraint
  WHERE conrelid = 'slots'::regclass AND conname = 'slots_schedule_pair_check'
 ) THEN
  ALTER TABLE slots ADD CONSTRAINT slots_schedule_pair_check
   CHECK ((starts_at IS NULL) = (booking_closes_at IS NULL));
 END IF;
 ALTER TABLE bookings ALTER COLUMN session_starts_at DROP NOT NULL;
 -- Migration 005 owns the per-service/per-choice practice uniqueness index.
END $$;
