-- Create the public Storage bucket used for lesson PDFs, notes, and images.
-- Also adds lessons.pdf_url / pdf_path and reloads PostgREST.
-- Safe to re-run.

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS pdf_path TEXT;
NOTIFY pgrst, 'reload schema';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  26214400,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read uploads'
  ) THEN
    CREATE POLICY "Public read uploads"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public insert uploads'
  ) THEN
    CREATE POLICY "Public insert uploads"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public update uploads'
  ) THEN
    CREATE POLICY "Public update uploads"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public delete uploads'
  ) THEN
    CREATE POLICY "Public delete uploads"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'uploads');
  END IF;
END $$;

SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'uploads';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name IN ('pdf_url', 'pdf_path')
ORDER BY column_name;
