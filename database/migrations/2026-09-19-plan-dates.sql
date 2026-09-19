-- Admin-managed plan amount lives in `price`.
-- `starts_at` / `ends_at` are the plan access window (optional).
-- Safe to re-run.

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
