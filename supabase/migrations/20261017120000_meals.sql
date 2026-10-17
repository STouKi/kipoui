-- Meal journal (iOS app, Repas tab)
--
-- One row per meal, with the foods the analysis recognized (items) and the totals computed from
-- them by the API. Meal photos are only sent to the AI for the analysis: they aren't stored.
--
-- To run in the Supabase SQL editor: it applies entirely or not at all.

begin;

create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type public.meal_type not null,
  name text not null check (char_length(name) between 1 and 120),
  -- [{ name, quantity, kcal, protein_g, carbs_g, fat_g }], as estimated by the analysis
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  kcal integer not null check (kcal between 0 and 20000),
  protein_g numeric(6, 1) not null default 0 check (protein_g >= 0),
  carbs_g numeric(6, 1) not null default 0 check (carbs_g >= 0),
  fat_g numeric(6, 1) not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now()
);

create index meals_profile_id_eaten_at_idx on public.meals (profile_id, eaten_at);

-- Like every table linked to a user: each meal belongs to its user only
alter table public.meals enable row level security;
create policy "Users manage their own meals" on public.meals
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

grant select, insert, update, delete on public.meals to authenticated;
grant all on public.meals to service_role;

commit;
