-- Add skip trace data column to permits
ALTER TABLE permits ADD COLUMN IF NOT EXISTS skip_trace_data jsonb DEFAULT '{}';
