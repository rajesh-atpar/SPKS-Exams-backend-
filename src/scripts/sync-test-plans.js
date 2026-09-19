import '../config/env.js';
import { supabaseAdmin } from '../services/supabaseClient.js';

const TEST_PLANS = [
  {
    name: 'Monthly',
    price: 1,
    currency: 'INR',
    duration: 30,
    features: ['All courses', 'Unlimited tests', 'Premium notes'],
    course_access: ['all'],
    is_active: true
  },
  {
    name: '6 Months',
    price: 2,
    currency: 'INR',
    duration: 180,
    features: ['All courses', 'Unlimited tests', 'Premium notes'],
    course_access: ['all'],
    is_active: true
  },
  {
    name: 'Yearly',
    price: 3,
    currency: 'INR',
    duration: 365,
    features: ['All courses', 'Unlimited tests', 'Premium notes', 'Priority support'],
    course_access: ['all'],
    is_active: true
  }
];

const listPlans = async () => {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('id, name, price, duration, is_active')
    .order('duration');
  if (error) throw error;
  return data || [];
};

const run = async () => {
  const before = await listPlans();
  console.log('before', before.map((plan) => `${plan.name}=${plan.price}`).join(', ') || '(none)');

  await supabaseAdmin
    .from('plans')
    .update({ is_active: false })
    .ilike('name', 'free');

  for (const plan of TEST_PLANS) {
    const existing = before.find((row) => String(row.name).toLowerCase() === plan.name.toLowerCase());
    if (existing) {
      const { error } = await supabaseAdmin
        .from('plans')
        .update({
          price: plan.price,
          currency: plan.currency,
          duration: plan.duration,
          features: plan.features,
          course_access: plan.course_access,
          is_active: true
        })
        .eq('id', existing.id);
      if (error) throw error;
      continue;
    }

    const { error } = await supabaseAdmin.from('plans').insert(plan);
    if (error) throw error;
  }

  const after = await listPlans();
  console.log('after', after.map((plan) => `${plan.name}=${plan.price}`).join(', ') || '(none)');
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
