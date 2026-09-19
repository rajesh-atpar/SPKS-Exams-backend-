-- Test plans for Razorpay Checkout:
-- 1 month ₹1, 6 months ₹2, 1 year ₹3.
-- Safe to re-run.

UPDATE plans
SET
  is_active = false,
  updated_at = NOW()
WHERE lower(name) = 'free';

UPDATE plans
SET
  price = 1,
  currency = 'INR',
  duration = 30,
  features = '["All courses", "Unlimited tests", "Premium notes"]'::jsonb,
  course_access = '["all"]'::jsonb,
  is_active = true,
  updated_at = NOW()
WHERE lower(name) = 'monthly';

UPDATE plans
SET
  price = 3,
  currency = 'INR',
  duration = 365,
  features = '["All courses", "Unlimited tests", "Premium notes", "Priority support"]'::jsonb,
  course_access = '["all"]'::jsonb,
  is_active = true,
  updated_at = NOW()
WHERE lower(name) IN ('yearly', 'annual', '1 year');

INSERT INTO plans (name, price, currency, duration, features, course_access, is_active)
VALUES (
  '6 Months',
  2,
  'INR',
  180,
  '["All courses", "Unlimited tests", "Premium notes"]'::jsonb,
  '["all"]'::jsonb,
  true
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration = EXCLUDED.duration,
  features = EXCLUDED.features,
  course_access = EXCLUDED.course_access,
  is_active = true,
  updated_at = NOW();
