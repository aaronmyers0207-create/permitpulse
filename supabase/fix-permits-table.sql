-- Fix: Drop and recreate the permits table with correct schema
-- The old table was missing columns like issued_date, subcategory, tags, state, etc.
-- Since no permits have been synced yet, this is safe to run.

DROP TABLE IF EXISTS permit_views CASCADE;
DROP TABLE IF EXISTS permits CASCADE;
DROP TABLE IF EXISTS ingestion_logs CASCADE;

-- ─── permits table ─────────────────────────────────────────
CREATE TABLE permits (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id       text NOT NULL,
  source_permit_id text NOT NULL UNIQUE,
  permit_type     text DEFAULT '',
  category        text DEFAULT 'general',
  subcategory     text DEFAULT 'general',
  tags            text[] DEFAULT '{}',
  address         text NOT NULL,
  city            text DEFAULT '',
  state           text DEFAULT '',
  zip_code        text DEFAULT '',
  county          text DEFAULT '',
  applicant_name  text DEFAULT '',
  contractor_name text DEFAULT '',
  contractor_license text DEFAULT '',
  description     text DEFAULT '',
  estimated_value numeric DEFAULT 0,
  filed_date      date,
  issued_date     date,
  status          text DEFAULT 'active',
  latitude        double precision,
  longitude       double precision,
  raw_data        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_permits_source_id     ON permits (source_id);
CREATE INDEX idx_permits_category      ON permits (category);
CREATE INDEX idx_permits_filed_date    ON permits (filed_date DESC);
CREATE INDEX idx_permits_zip_code      ON permits (zip_code);
CREATE INDEX idx_permits_state         ON permits (state);
CREATE INDEX idx_permits_city          ON permits (city);
CREATE INDEX idx_permits_source_permit ON permits (source_permit_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_permits_updated
  BEFORE UPDATE ON permits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ingestion_logs table ──────────────────────────────────
CREATE TABLE ingestion_logs (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id        text,
  source_name      text,
  status           text NOT NULL DEFAULT 'pending',
  permits_fetched  int DEFAULT 0,
  permits_upserted int DEFAULT 0,
  error_message    text,
  completed_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_logs_source_id ON ingestion_logs (source_id, completed_at DESC);

-- ─── permit_views (stars / notes) ─────────────────────────
CREATE TABLE permit_views (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permit_id  uuid REFERENCES permits(id) ON DELETE CASCADE,
  starred    boolean DEFAULT false,
  notes      text,
  viewed_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, permit_id)
);

-- ─── RLS policies ──────────────────────────────────────────
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permits are readable by authenticated users" ON permits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage permits" ON permits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Logs readable by authenticated" ON ingestion_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage logs" ON ingestion_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users manage own views" ON permit_views
  FOR ALL USING (auth.uid() = user_id);
