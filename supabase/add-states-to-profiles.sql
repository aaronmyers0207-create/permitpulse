-- Add states column to profiles for user's selected operating states
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS states text[] DEFAULT '{}';
