-- Additive migration for existing SPKS databases.
-- Safe to re-run. Does not drop data.
-- New installs can skip this and use database/schema.sql instead.

ALTER TABLE videos ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_videos_group ON videos(group_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'video_lectures'
  ) THEN
    ALTER TABLE video_lectures ADD COLUMN IF NOT EXISTS group_id UUID;
    CREATE INDEX IF NOT EXISTS idx_video_lectures_group ON video_lectures(group_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_updated_at ON platform_settings;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON platform_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO platform_settings (key, value) VALUES
  ('help_contact', '{"phone":"+91 00000 00000","whatsapp":"+91 00000 00000","hours":"Mon–Sat, 9:00 AM – 6:00 PM IST","email":"support@spksexams.com","address":""}')
ON CONFLICT (key) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_course_slug ON groups(course_id, slug);
CREATE INDEX IF NOT EXISTS idx_tests_group ON tests(group_id);
CREATE INDEX IF NOT EXISTS idx_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_test ON test_results(test_id);

INSERT INTO groups (course_id, name, slug, description, is_active, display_order)
SELECT c.id, v.name, v.slug, v.description, true, v.display_order
FROM courses c
JOIN (
  VALUES
    ('tnpsc', 'Group 1', 'group-1', 'TNPSC Group 1 practice tests', 1),
    ('tnpsc', 'Group 2', 'group-2', 'TNPSC Group 2 practice tests', 2),
    ('tnpsc', 'Group 3', 'group-3', 'TNPSC Group 3 practice tests', 3),
    ('tnpsc', 'Group 4', 'group-4', 'TNPSC Group 4 practice tests', 4),
    ('tnpsc', 'Others', 'others', 'Other TNPSC practice tests', 5),
    ('rrb', 'Group D', 'group-d', 'RRB Group D practice tests', 1),
    ('rrb', 'Others', 'others', 'NTPC, JE and ALP practice tests', 2),
    ('tnusrb', 'SI', 'si', 'TNUSRB Sub-Inspector practice tests', 1),
    ('tnusrb', 'PC', 'pc', 'TNUSRB Police Constable practice tests', 2)
) AS v(course_slug, name, slug, description, display_order)
  ON c.slug = v.course_slug
WHERE NOT EXISTS (
  SELECT 1 FROM groups g WHERE g.course_id = c.id AND g.slug = v.slug
);
