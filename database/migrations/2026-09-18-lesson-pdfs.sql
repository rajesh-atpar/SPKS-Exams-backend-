-- Additive migration for existing SPKS databases.
-- Safe to re-run. Does not drop data.
-- Adds lesson PDF storage so admin can upload/replace PDFs and the app can view them inline.

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Reload PostgREST so UPDATE ... pdf_url works immediately.
NOTIFY pgrst, 'reload schema';
