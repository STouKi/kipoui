-- Meal photo analyses, counted to cap them per user (POST /api/meals/analyze)
--
-- Each photo costs a Claude call: a user gets at most 15 a day. One row per analysis, written and
-- counted by the API as the service role. No policy: users can neither read nor delete these
-- rows, which would reset their count.
--
-- To run in the Supabase SQL editor.

begin;

create table public.meal_photo_analyses (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index meal_photo_analyses_profile_id_created_at_idx
  on public.meal_photo_analyses (profile_id, created_at);

alter table public.meal_photo_analyses enable row level security;

grant all on public.meal_photo_analyses to service_role;

commit;
