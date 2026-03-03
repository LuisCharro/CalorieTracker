-- Seed user food history for testing intelligent food suggestions

-- Insert breakfast foods
INSERT INTO user_food_history (user_id, food_name, brand_name, quantity, unit, nutrition, meal_type, logged_at)
VALUES 
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Oatmeal', NULL, 150, 'g', '{"calories": 150, "protein": 5, "carbohydrates": 27, "fat": 3}'::jsonb, 'breakfast', NOW() - INTERVAL '1 day'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Greek Yogurt', 'Chobani', 170, 'g', '{"calories": 120, "protein": 15, "carbohydrates": 8, "fat": 0}'::jsonb, 'breakfast', NOW() - INTERVAL '2 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Banana', NULL, 120, 'g', '{"calories": 105, "protein": 1, "carbohydrates": 27, "fat": 0}'::jsonb, 'breakfast', NOW() - INTERVAL '3 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Eggs', NULL, 100, 'g', '{"calories": 155, "protein": 13, "carbohydrates": 1, "fat": 11}'::jsonb, 'breakfast', NOW() - INTERVAL '4 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Toast', NULL, 30, 'g', '{"calories": 80, "protein": 3, "carbohydrates": 15, "fat": 1}'::jsonb, 'breakfast', NOW() - INTERVAL '5 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Coffee', NULL, 250, 'ml', '{"calories": 5, "protein": 0, "carbohydrates": 0, "fat": 0}'::jsonb, 'breakfast', NOW() - INTERVAL '1 day'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Protein Shake', 'Optimum Nutrition', 300, 'ml', '{"calories": 160, "protein": 30, "carbohydrates": 5, "fat": 2}'::jsonb, 'breakfast', NOW() - INTERVAL '6 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Granola', NULL, 50, 'g', '{"calories": 200, "protein": 4, "carbohydrates": 35, "fat": 5}'::jsonb, 'breakfast', NOW() - INTERVAL '7 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Orange', NULL, 130, 'g', '{"calories": 60, "protein": 1, "carbohydrates": 15, "fat": 0}'::jsonb, 'breakfast', NOW() - INTERVAL '8 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Cereal', 'Kelloggs', 40, 'g', '{"calories": 150, "protein": 3, "carbohydrates": 30, "fat": 1}'::jsonb, 'breakfast', NOW() - INTERVAL '9 days');

-- Insert lunch foods
INSERT INTO user_food_history (user_id, food_name, brand_name, quantity, unit, nutrition, meal_type, logged_at)
VALUES 
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Chicken Breast', NULL, 200, 'g', '{"calories": 330, "protein": 62, "carbohydrates": 0, "fat": 7}'::jsonb, 'lunch', NOW() - INTERVAL '1 day'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Rice', NULL, 150, 'g', '{"calories": 195, "protein": 4, "carbohydrates": 45, "fat": 0}'::jsonb, 'lunch', NOW() - INTERVAL '2 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Salad', NULL, 200, 'g', '{"calories": 40, "protein": 2, "carbohydrates": 8, "fat": 0}'::jsonb, 'lunch', NOW() - INTERVAL '3 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Grilled Chicken', NULL, 180, 'g', '{"calories": 280, "protein": 52, "carbohydrates": 0, "fat": 6}'::jsonb, 'lunch', NOW() - INTERVAL '4 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Quinoa', NULL, 120, 'g', '{"calories": 180, "protein": 6, "carbohydrates": 32, "fat": 3}'::jsonb, 'lunch', NOW() - INTERVAL '5 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Turkey Sandwich', NULL, 200, 'g', '{"calories": 320, "protein": 25, "carbohydrates": 35, "fat": 10}'::jsonb, 'lunch', NOW() - INTERVAL '6 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Vegetable Soup', NULL, 300, 'ml', '{"calories": 120, "protein": 4, "carbohydrates": 20, "fat": 3}'::jsonb, 'lunch', NOW() - INTERVAL '7 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Tuna', NULL, 150, 'g', '{"calories": 200, "protein": 45, "carbohydrates": 0, "fat": 1}'::jsonb, 'lunch', NOW() - INTERVAL '8 days');

-- Insert dinner foods
INSERT INTO user_food_history (user_id, food_name, brand_name, quantity, unit, nutrition, meal_type, logged_at)
VALUES 
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Salmon', NULL, 200, 'g', '{"calories": 400, "protein": 40, "carbohydrates": 0, "fat": 22}'::jsonb, 'dinner', NOW() - INTERVAL '1 day'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Pasta', NULL, 200, 'g', '{"calories": 280, "protein": 10, "carbohydrates": 56, "fat": 2}'::jsonb, 'dinner', NOW() - INTERVAL '2 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Steak', NULL, 200, 'g', '{"calories": 540, "protein": 48, "carbohydrates": 0, "fat": 36}'::jsonb, 'dinner', NOW() - INTERVAL '3 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Vegetables', NULL, 150, 'g', '{"calories": 60, "protein": 3, "carbohydrates": 12, "fat": 0}'::jsonb, 'dinner', NOW() - INTERVAL '4 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Sweet Potato', NULL, 150, 'g', '{"calories": 130, "protein": 2, "carbohydrates": 30, "fat": 0}'::jsonb, 'dinner', NOW() - INTERVAL '5 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Grilled Fish', NULL, 180, 'g', '{"calories": 250, "protein": 45, "carbohydrates": 0, "fat": 8}'::jsonb, 'dinner', NOW() - INTERVAL '6 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Soup', NULL, 350, 'ml', '{"calories": 180, "protein": 8, "carbohydrates": 25, "fat": 5}'::jsonb, 'dinner', NOW() - INTERVAL '7 days');

-- Insert snack foods
INSERT INTO user_food_history (user_id, food_name, brand_name, quantity, unit, nutrition, meal_type, logged_at)
VALUES 
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Apple', NULL, 180, 'g', '{"calories": 95, "protein": 0, "carbohydrates": 25, "fat": 0}'::jsonb, 'snack', NOW() - INTERVAL '1 day'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Almonds', NULL, 30, 'g', '{"calories": 170, "protein": 6, "carbohydrates": 6, "fat": 15}'::jsonb, 'snack', NOW() - INTERVAL '2 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Protein Bar', 'Quest', 60, 'g', '{"calories": 190, "protein": 21, "carbohydrates": 21, "fat": 8}'::jsonb, 'snack', NOW() - INTERVAL '3 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Peanut Butter', NULL, 30, 'g', '{"calories": 190, "protein": 8, "carbohydrates": 7, "fat": 16}'::jsonb, 'snack', NOW() - INTERVAL '4 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Rice Cakes', NULL, 20, 'g', '{"calories": 70, "protein": 1, "carbohydrates": 15, "fat": 0}'::jsonb, 'snack', NOW() - INTERVAL '5 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Dark Chocolate', 'Lindt', 30, 'g', '{"calories": 170, "protein": 2, "carbohydrates": 13, "fat": 12}'::jsonb, 'snack', NOW() - INTERVAL '6 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Cottage Cheese', NULL, 150, 'g', '{"calories": 120, "protein": 14, "carbohydrates": 5, "fat": 5}'::jsonb, 'snack', NOW() - INTERVAL '7 days'),
  ('8fb4b86d-2dc0-47a6-9d9b-c3817a933cf9', 'Hummus', NULL, 50, 'g', '{"calories": 80, "protein": 3, "carbohydrates": 8, "fat": 4}'::jsonb, 'snack', NOW() - INTERVAL '8 days');
