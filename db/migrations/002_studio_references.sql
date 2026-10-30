-- Preserve legacy IDs and receipts; references belong to new real-business records.
DO $$ BEGIN
ALTER TABLE providers ADD COLUMN IF NOT EXISTS reference_key TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reference_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS providers_reference_key_idx ON providers(reference_key);
CREATE UNIQUE INDEX IF NOT EXISTS services_reference_key_idx ON services(reference_key);
END $$;
