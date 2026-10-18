-- Payment methods offered in the UI now follow the same rule as the Edge
-- Function router (paymentRouter.ts): providers with keys stored in Vault are
-- preferred; when no enabled provider has stored keys, every enabled provider
-- counts, because the Edge Functions fall back to the environment secrets
-- (STRIPE_SECRET_KEY, PAYSTACK_SECRET_KEY…) documented in the README.
-- Before, the checkout was blocked ("paiement non activé") whenever keys lived
-- only in the environment, although the server would have accepted them.
create or replace function public.available_payment_methods()
returns text[] language sql stable security definer set search_path = '' as $$
  with enabled_psp as (
    select methods, (secret_hints <> '{}'::jsonb) as keyed
      from public.psp_providers
     where enabled
  ),
  pool as (
    select methods from enabled_psp
     where keyed or not exists (select 1 from enabled_psp where keyed)
  )
  select coalesce(array_agg(distinct m), '{}')
    from pool, unnest(pool.methods) m
$$;
