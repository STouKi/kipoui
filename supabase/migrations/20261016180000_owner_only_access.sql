-- Owner-only access to user data
--
-- Until now, the only policy of each table let every signed-in user read, change and delete the
-- rows of every user (profiles, health data, conversations, weigh-ins, subscriptions), and the
-- coach's memory (vecs) was open to anyone with the public anon key, even signed out. Storage
-- was open the same way: chat attachments to every user, avatars to anyone.
--
-- Each row now belongs to its user only. The API keeps working unchanged: it already filters
-- every query by the user and runs it with the user's token, and the Stripe webhook acts as the
-- service role, which RLS doesn't apply to.
--
-- To run in the Supabase SQL editor: it applies entirely or not at all.

begin;

-- Tables linked to a user by profile_id

drop policy if exists "Enable all for authenticated users only" on public.chats;
create policy "Users manage their own chats" on public.chats
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

-- Still written by the API with the user's token at checkout (see the note at the end)
drop policy if exists "Enable all for authenticated users only" on public.customers;
create policy "Users manage their own customer record" on public.customers
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Enable all for authenticated users only" on public.goals;
create policy "Users manage their own goals" on public.goals
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Enable all for authenticated users only" on public.habits;
create policy "Users manage their own habits" on public.habits
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Enable all for authenticated users only" on public.medical_data;
create policy "Users manage their own medical data" on public.medical_data
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Enable all for authenticated users only" on public.physical_data;
create policy "Users manage their own physical data" on public.physical_data
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Enable all for authenticated users only" on public.preferences;
create policy "Users manage their own preferences" on public.preferences
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Enable all for authenticated users only" on public.weight_records;
create policy "Users manage their own weigh-ins" on public.weight_records
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

-- Profiles: created by the handle_new_user trigger, deleted with the auth user
drop policy if exists "Enable all for authenticated users only" on public.profiles;
create policy "Users read their own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Messages: through their conversation
drop policy if exists "Enable all for authenticated users only" on public.messages;
create policy "Users manage the messages of their own chats" on public.messages
  for all to authenticated
  using (exists (
    select 1 from public.chats
    where chats.id = messages.chat_id and chats.profile_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.chats
    where chats.id = messages.chat_id and chats.profile_id = (select auth.uid())
  ));

-- The coach's memory (addResource and getInformation tools)

drop policy if exists "Enable all for authenticated users only" on vecs.resources;
create policy "Users manage their own memories" on vecs.resources
  for all to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Enable all for authenticated users only" on vecs.embeddings;
create policy "Users manage the embeddings of their own memories" on vecs.embeddings
  for all to authenticated
  using (exists (
    select 1 from vecs.resources
    where resources.id = embeddings.resource_id and resources.profile_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from vecs.resources
    where resources.id = embeddings.resource_id and resources.profile_id = (select auth.uid())
  ));

-- These two search functions run as their owner, out of reach of RLS, and anyone could call them
-- to read the memories of every user. Nothing uses them: the coach searches with the
-- 4-argument match_documents, which runs as the caller, so RLS keeps it to the user's memories
revoke execute on function vecs.match_documents(extensions.vector, double precision, integer)
  from public, anon, authenticated;
revoke execute on function vecs.match_embeddings(extensions.vector, double precision, integer)
  from public, anon, authenticated;
revoke execute on function vecs.match_documents(extensions.vector, double precision, integer, uuid)
  from public, anon;
grant execute on function vecs.match_documents(extensions.vector, double precision, integer, uuid)
  to authenticated, service_role;

-- Storage. Files are uploaded by the API with the user's token, so their owner_id is the user.
-- The URLs saved in messages and profiles are signed URLs, which keep working without a policy

-- Chat attachments (photos, PDFs): every signed-in user could list, read, replace and delete
-- the files of every user
drop policy if exists "Allow all operations to authenticated. pdeh8i_0" on storage.objects;
drop policy if exists "Allow all operations to authenticated. pdeh8i_1" on storage.objects;
drop policy if exists "Allow all operations to authenticated. pdeh8i_2" on storage.objects;
drop policy if exists "Allow all operations to authenticated. pdeh8i_3" on storage.objects;
create policy "Users upload chat files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-files');
create policy "Users read their own chat files" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-files' and owner_id = (select auth.uid())::text);
create policy "Users update their own chat files" on storage.objects
  for update to authenticated
  using (bucket_id = 'chat-files' and owner_id = (select auth.uid())::text);
create policy "Users delete their own chat files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-files' and owner_id = (select auth.uid())::text);

-- Avatars, named <user id>-<uuid>.<ext>: anyone, even signed out, could upload any file and list
-- every avatar, and with them the user ids
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Users upload their own avatars" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and starts_with(name, (select auth.uid())::text || '-'));
create policy "Users read their own avatars" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);

commit;

-- Left for later: users can still change their own customers row, subscription status
-- included, because the API writes it with their token at checkout. Closing that requires the
-- API to write it as the service role, then a select-only policy here.
