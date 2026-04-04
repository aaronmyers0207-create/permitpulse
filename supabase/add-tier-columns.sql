-- Add tier system columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS states text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skip_traces_used int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skip_traces_reset_at timestamptz DEFAULT now();
