-- Synthetic development seed data for CalorieTracker MVP
-- KEEP ONLY FAKE/NON-PRODUCTION DATA
-- Do not commit real user data to this file

-- Insert sample user
INSERT INTO users (id, email, display_name, preferences, onboarding_complete, onboarding_completed_at, created_at, last_login_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@example.com',
  'Development User',
  '{"timezone": "Europe/Zurich", "units": "metric"}'::jsonb,
  true,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 hour'
) ON CONFLICT (email) DO NOTHING;

-- Insert consent history for sample user
INSERT INTO consent_history (id, user_id, consent_type, consent_given, consent_version, metadata, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'privacy_policy', true, '1.0.0', '{"ip": "127.0.0.1"}'::jsonb, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'terms_of_service', true, '1.0.0', '{"ip": "127.0.0.1"}'::jsonb, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000001', 'analytics', false, '1.0.0', '{}'::jsonb, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000001', 'marketing', false, '1.0.0', '{}'::jsonb, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert sample goals
INSERT INTO goals (id, user_id, goal_type, target_value, is_active, start_date, end_date, created_at, updated_at)
VALUES 
  ('22222222-2222-2222-2222-222222222001', '00000000-0000-0000-0000-000000000001', 'daily_calories', 2000, true, CURRENT_DATE, NULL, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT DO NOTHING;

-- Insert notification settings
INSERT INTO notification_settings (id, user_id, channels, reminder_times, timezone, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333001',
  '00000000-0000-0000-0000-000000000001',
  '["email", "push"]'::jsonb,
  '["08:00", "12:00", "18:00"]'::jsonb,
  'Europe/Zurich',
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Insert sample food logs for the last 3 days
INSERT INTO food_logs (id, user_id, food_name, brand_name, quantity, unit, meal_type, nutrition, logged_at, created_at, updated_at, is_deleted)
VALUES 
  -- Today
  ('44444444-4444-4444-4444-444444444001', '00000000-0000-0000-0000-000000000001', 'Oatmeal', NULL, 100, 'g', 'breakfast', '{"calories": 389, "protein": 16.9, "carbohydrates": 66.3, "fat": 6.9}'::jsonb, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', false),
  ('44444444-4444-4444-4444-444444444002', '00000000-0000-0000-0000-000000000001', 'Banana', NULL, 1, 'piece', 'breakfast', '{"calories": 105, "protein": 1.3, "carbohydrates": 27, "fat": 0.3}'::jsonb, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', false),
  ('44444444-4444-4444-4444-444444444003', '00000000-0000-0000-0000-000000000001', 'Grilled Chicken Salad', NULL, 300, 'g', 'lunch', '{"calories": 320, "protein": 35, "carbohydrates": 12, "fat": 14}'::jsonb, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', false),
  ('44444444-4444-4444-4444-444444444004', '00000000-0000-0000-0000-000000000001', 'Apple', NULL, 1, 'piece', 'snack', '{"calories": 95, "protein": 0.5, "carbohydrates": 25, "fat": 0.3}'::jsonb, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', false),
  
  -- Yesterday
  ('44444444-4444-4444-4444-444444444005', '00000000-0000-0000-0000-000000000001', 'Greek Yogurt', 'Brand A', 150, 'g', 'breakfast', '{"calories": 100, "protein": 17, "carbohydrates": 6, "fat": 0.7}'::jsonb, NOW() - INTERVAL '32 hours', NOW() - INTERVAL '32 hours', NOW() - INTERVAL '32 hours', false),
  ('44444444-4444-4444-4444-444444444006', '00000000-0000-0000-0000-000000000001', 'Pasta with Tomato Sauce', NULL, 350, 'g', 'dinner', '{"calories": 450, "protein": 14, "carbohydrates": 75, "fat": 10}'::jsonb, NOW() - INTERVAL '28 hours', NOW() - INTERVAL '28 hours', NOW() - INTERVAL '28 hours', false),
  
  -- Day before yesterday
  ('44444444-4444-4444-4444-444444444007', '00000000-0000-0000-0000-000000000001', 'Scrambled Eggs', NULL, 2, 'eggs', 'breakfast', '{"calories": 182, "protein": 12.6, "carbohydrates": 1.1, "fat": 13.6}'::jsonb, NOW() - INTERVAL '56 hours', NOW() - INTERVAL '56 hours', NOW() - INTERVAL '56 hours', false),
  ('44444444-4444-4444-4444-444444444008', '00000000-0000-0000-0000-000000000001', 'Salmon Fillet', NULL, 150, 'g', 'dinner', '{"calories": 208, "protein": 22, "carbohydrates": 0, "fat": 13}'::jsonb, NOW() - INTERVAL '52 hours', NOW() - INTERVAL '52 hours', NOW() - INTERVAL '52 hours', false)
ON CONFLICT DO NOTHING;

-- Insert sample processing activities
INSERT INTO processing_activities (id, user_id, activity_type, data_categories, purpose, legal_basis, metadata, created_at)
VALUES 
  ('55555555-5555-5555-5555-555555555001', '00000000-0000-0000-0000-000000000001', 'food_logging', '["food_logs", "nutrition_data"]', 'Track daily food intake for calorie management', 'contract', '{"source": "user_input"}'::jsonb, NOW() - INTERVAL '1 day'),
  ('55555555-5555-5555-5555-555555555002', '00000000-0000-0000-0000-000000000001', 'goal_tracking', '["goals", "food_logs"]', 'Track progress toward calorie goals', 'contract', '{"source": "user_input"}'::jsonb, NOW() - INTERVAL '1 day'),
  ('55555555-5555-5555-5555-555555555003', NULL, 'consent_management', '["consent_history"]', 'Manage user consent preferences', 'legal_obligation', '{"purpose": "GDPR compliance"}'::jsonb, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert sample security events
INSERT INTO security_events (id, event_type, severity, user_id, ip_hash, user_agent, details, created_at)
VALUES 
  ('66666666-6666-6666-6666-666666666001', 'login_success', 'low', '00000000-0000-0000-0000-000000000001', 'a1b2c3d4e5f6', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"method": "email"}'::jsonb, NOW() - INTERVAL '1 hour'),
  ('66666666-6666-6666-6666-666666666002', 'login_success', 'low', '00000000-0000-0000-0000-000000000001', 'a1b2c3d4e5f6', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"method": "email"}'::jsonb, NOW() - INTERVAL '25 hours'),
  ('66666666-6666-6666-6666-666666666003', 'consent_withdrawn', 'medium', '00000000-0000-0000-0000-000000000001', 'a1b2c3d4e5f6', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"consent_type": "marketing"}'::jsonb, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;
