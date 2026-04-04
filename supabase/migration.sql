-- PermitPulse — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- This is idempotent — safe to run multiple times.

-- ─── permits table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permits (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id       text NOT NULL,                     -- e.g. "austin_tx"
  source_permit_id text NOT NULL UNIQUE,             -- e.g. "austin_tx:2026-013207 PP"
  permit_type     text DEFAULT '',
  category        text DEFAULT 'general',            -- hvac, roofing, electrical, etc.
  subcategory     text DEFAULT 'general',            -- changeout, new_construction, etc.
  tags            text[] DEFAULT '{}',               -- all matched trade keywords
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

-- Indexes for the dashboard queries
CREATE INDEX IF NOT EXISTS idx_permits_source_id     ON permits (source_id);
CREATE INDEX IF NOT EXISTS idx_permits_category      ON permits (category);
CREATE INDEX IF NOT EXISTS idx_permits_filed_date    ON permits (filed_date DESC);
CREATE INDEX IF NOT EXISTS idx_permits_zip_code      ON permits (zip_code);
CREATE INDEX IF NOT EXISTS idx_permits_state         ON permits (state);
CREATE INDEX IF NOT EXISTS idx_permits_city           ON permits (city);
CREATE INDEX IF NOT EXISTS idx_permits_source_permit  ON permits (source_permit_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_permits_updated ON permits;
CREATE TRIGGER trg_permits_updated
  BEFORE UPDATE ON permits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ingestion_logs table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id        text,
  source_name      text,
  status           text NOT NULL DEFAULT 'pending',  -- success | partial | error
  permits_fetched  int DEFAULT 0,
  permits_upserted int DEFAULT 0,
  error_message    text,
  completed_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_source_id ON ingestion_logs (source_id, completed_at DESC);

-- ─── profiles table (for onboarding) ──────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  company_name text DEFAULT '',
  industry     text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

-- ─── territories table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS territories (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  zip_code text NOT NULL,
  county   text DEFAULT '',
  state    text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_territories_user ON territories (user_id);

-- ─── permit_views (stars / notes) ─────────────────────────
CREATE TABLE IF NOT EXISTS permit_views (
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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_views ENABLE ROW LEVEL SECURITY;

-- Permits: anyone authenticated can read
DROP POLICY IF EXISTS "Permits are readable by authenticated users" ON permits;
CREATE POLICY "Permits are readable by authenticated users" ON permits
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permits: service role can insert/update (ingestion)
DROP POLICY IF EXISTS "Service role can manage permits" ON permits;
CREATE POLICY "Service role can manage permits" ON permits
  FOR ALL USING (auth.role() = 'service_role');

-- Ingestion logs: service role can manage, authenticated can read
DROP POLICY IF EXISTS "Logs readable by authenticated" ON ingestion_logs;
CREATE POLICY "Logs readable by authenticated" ON ingestion_logs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role can manage logs" ON ingestion_logs;
CREATE POLICY "Service role can manage logs" ON ingestion_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Profiles: users can read/write their own
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Territories: users manage their own
DROP POLICY IF EXISTS "Users manage own territories" ON territories;
CREATE POLICY "Users manage own territories" ON territories
  FOR ALL USING (auth.uid() = user_id);

-- Permit views: users manage their own
DROP POLICY IF EXISTS "Users manage own views" ON permit_views;
CREATE POLICY "Users manage own views" ON permit_views
  FOR ALL USING (auth.uid() = user_id);
