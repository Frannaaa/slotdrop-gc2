-- Keep simulated practice bookings non-expiring while allowing two distinct
-- fictional date choices for one activity. Existing bookings and slot IDs stay intact.
ALTER TABLE slots ADD COLUMN IF NOT EXISTS demo_variant SMALLINT;
UPDATE slots SET demo_variant = 1
 WHERE starts_at IS NULL AND demo_variant IS NULL;
DROP INDEX IF EXISTS slots_practice_service_idx;
CREATE UNIQUE INDEX IF NOT EXISTS slots_practice_variant_idx
 ON slots(service_id, demo_variant)
 WHERE starts_at IS NULL AND demo_variant IS NOT NULL;
DO $$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conrelid = 'slots'::regclass AND conname = 'slots_demo_variant_check'
 ) THEN
   ALTER TABLE slots ADD CONSTRAINT slots_demo_variant_check
     CHECK (demo_variant IS NULL OR
       (starts_at IS NULL AND demo_variant BETWEEN 1 AND 2));
 END IF;
END $$;
