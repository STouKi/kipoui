-- Customers: read only for their user
--
-- The customers row holds the subscription status that unlocks the coach. Users could change it
-- themselves through Supabase's API (set it to 'active' without paying), because the API wrote it
-- with their token at checkout. The API now writes it as the service role, after checking with
-- Stripe (createCustomer and updateCustomer in customerRepository.ts), like the Stripe webhook.
--
-- Run it only once that API change is deployed to production: before, checkout would fail.

begin;

drop policy if exists "Users manage their own customer record" on public.customers;
create policy "Users read their own customer record" on public.customers
  for select to authenticated
  using ((select auth.uid()) = profile_id);

commit;
