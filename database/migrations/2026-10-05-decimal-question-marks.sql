-- Allow half marks on questions (1.5, 2.5, 3.5, ...).
-- Safe to re-run.

ALTER TABLE questions
  ALTER COLUMN marks TYPE DECIMAL(6,2)
  USING marks::DECIMAL(6,2);

ALTER TABLE tests
  ALTER COLUMN total_marks TYPE DECIMAL(8,2)
  USING total_marks::DECIMAL(8,2);

ALTER TABLE tests
  ALTER COLUMN passing_marks TYPE DECIMAL(8,2)
  USING passing_marks::DECIMAL(8,2);

ALTER TABLE test_results
  ALTER COLUMN total_marks TYPE DECIMAL(8,2)
  USING total_marks::DECIMAL(8,2);

NOTIFY pgrst, 'reload schema';
