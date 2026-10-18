-- The coach's comment on a meal of the journal (POST /api/meals/:id/comment), shown in the
-- Repas tab and in the meal's details
--
-- To run in the Supabase SQL editor. Adding a nullable column changes nothing for the current
-- API and app.

alter table public.meals
  add column coach_comment text check (char_length(coach_comment) <= 1000);
