-- Subscriptions bought in the iOS app (App Store in-app purchase, through RevenueCat)
--
-- They sit next to the Stripe ones (subscription_status...) in the user's customers row: the
-- coach is open when either is active. RevenueCat notifies POST /api/revenuecat/webhook, and the
-- API writes these columns as the service role, like the Stripe ones (users only read their row).
-- Every user gets at most one customers row, which the API now upserts on profile_id.
--
-- To run in the Supabase SQL editor: it applies entirely or not at all.

begin;

alter table public.customers
  add column app_store_status text check (app_store_status in ('active', 'trialing', 'expired')),
  -- The end of the current period (grace period included): access stops there without renewal
  add column app_store_expires_at timestamptz,
  add column app_store_will_renew boolean,
  add column app_store_product_id text;

alter table public.customers
  add constraint customers_profile_id_key unique (profile_id);

commit;
