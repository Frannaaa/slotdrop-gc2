DO $$ BEGIN
 CREATE TABLE IF NOT EXISTS provider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE,
  payload_signature TEXT NOT NULL,
  provider_id BIGINT REFERENCES providers(id),
  business_name TEXT NOT NULL,
  website TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  activity_types TEXT[] NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  representative_role TEXT NOT NULL CHECK(representative_role IN ('owner','manager','authorized_representative')),
  authorized BOOLEAN NOT NULL CHECK(authorized),
  demo_acknowledged BOOLEAN NOT NULL CHECK(demo_acknowledged),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(length(business_name) BETWEEN 1 AND 120),
  CHECK(length(website) BETWEEN 1 AND 2048),
  CHECK(length(city) BETWEEN 1 AND 100 AND length(area) BETWEEN 1 AND 100),
  CHECK(length(contact_name) BETWEEN 1 AND 100 AND length(contact_email) BETWEEN 3 AND 254),
  CHECK(cardinality(activity_types) BETWEEN 1 AND 5),
  CHECK(activity_types <@ ARRAY['pottery','painting','pilates','dance','other']::TEXT[])
 );
END $$;
