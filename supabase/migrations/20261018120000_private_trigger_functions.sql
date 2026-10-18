-- Trigger functions out of the API
--
-- handle_new_user (creates the profile at signup) and rls_auto_enable (turns on RLS for new
-- tables) run as their owner, and anyone could call them through /rest/v1/rpc (Supabase security
-- advisor). Triggers don't check EXECUTE when they fire: signups keep creating profiles, which a
-- local test confirmed.
--
-- To run in the Supabase SQL editor.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
