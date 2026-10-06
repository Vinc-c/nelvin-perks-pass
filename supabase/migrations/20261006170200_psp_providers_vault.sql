-- Platform v2 — PSP configuration managed by super admins.
--
-- Non-secret settings live in public.psp_providers (admin-only RLS).
-- API keys are stored encrypted in Supabase Vault and are WRITE-ONLY from the
-- app: admins can set/replace/clear them, but the browser only ever sees a
-- masked hint (••••1234). Edge Functions read them with the service role
-- through public.get_psp_secrets().

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'supabase_vault')
     and exists (select 1 from pg_available_extensions where name = 'supabase_vault') then
    create extension supabase_vault with schema vault;
  end if;
end $$;

create table public.psp_providers (
  id text primary key check (id in ('stripe', 'paystack', 'flutterwave', 'paddle', 'payunit', 'korapay')),
  display_name text not null,
  enabled boolean not null default false,
  live_mode boolean not null default false,
  public_key text,
  priority int not null default 100,
  methods text[] not null default '{}',
  region text,
  notes text,
  secret_hints jsonb not null default '{}'::jsonb,
  last_test_at timestamptz,
  last_test_ok boolean,
  last_test_message text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_date timestamptz not null default now()
);
create trigger set_updated_date before update on public.psp_providers
  for each row execute function public.set_updated_date();
alter table public.psp_providers enable row level security;
create policy "psp_providers: admin read" on public.psp_providers for select to authenticated
  using ((select public.is_admin()));
create policy "psp_providers: admin update" on public.psp_providers for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.psp_providers (id, display_name, priority, methods, region) values
  ('stripe', 'Stripe', 10, array['CARD', 'APPLE_PAY', 'GOOGLE_PAY'], 'Global / MENA'),
  ('paystack', 'Paystack', 20, array['CARD', 'BANK_TRANSFER'], 'Afrique de l''Ouest'),
  ('flutterwave', 'Flutterwave', 30, array['MOBILE_MONEY', 'CARD'], 'Pan-Afrique'),
  ('payunit', 'Payunit', 40, array['MOBILE_MONEY', 'CARD'], 'CEMAC'),
  ('paddle', 'Paddle', 50, array['CARD', 'BANK_TRANSFER'], 'Global (B2B, Merchant of Record)'),
  ('korapay', 'Korapay', 60, array['CARD', 'BANK_TRANSFER'], 'Afrique de l''Ouest');

-- Which secret fields each PSP accepts.
create or replace function public.psp_secret_fields(p_provider text)
returns text[] language sql immutable set search_path = '' as $$
  select case p_provider
    when 'stripe' then array['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
    when 'paystack' then array['PAYSTACK_SECRET_KEY']
    when 'flutterwave' then array['FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_WEBHOOK_HASH']
    when 'paddle' then array['PADDLE_API_KEY', 'PADDLE_WEBHOOK_SECRET']
    when 'payunit' then array['PAYUNIT_API_KEY', 'PAYUNIT_API_USERNAME', 'PAYUNIT_API_PASSWORD']
    when 'korapay' then array['KORAPAY_SECRET_KEY']
    else array[]::text[] end
$$;

-- Admin: set (or clear with an empty value) one PSP secret.
create or replace function public.admin_set_psp_secret(p_provider text, p_field text, p_value text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text := 'psp.' || p_provider || '.' || p_field;
  v_id uuid;
  v_value text := btrim(coalesce(p_value, ''));
  v_hints jsonb;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if not (p_field = any (public.psp_secret_fields(p_provider))) then
    raise exception 'Champ % non valide pour %', p_field, p_provider using errcode = '22023';
  end if;

  select id into v_id from vault.secrets where name = v_name;
  if v_value = '' then
    if v_id is not null then delete from vault.secrets where id = v_id; end if;
    update public.psp_providers
       set secret_hints = secret_hints - p_field, updated_by = auth.uid()
     where id = p_provider returning secret_hints into v_hints;
    perform public.audit('psp.secret.clear', 'psp_providers', p_provider, jsonb_build_object('field', p_field));
  else
    if length(v_value) > 4096 then raise exception 'Valeur trop longue'; end if;
    if v_id is null then
      perform vault.create_secret(v_value, v_name, 'Nelvin PSP secret');
    else
      perform vault.update_secret(v_id, v_value);
    end if;
    update public.psp_providers
       set secret_hints = secret_hints || jsonb_build_object(p_field,
             case when length(v_value) > 8 then '••••' || right(v_value, 4) else '••••' end),
           updated_by = auth.uid(), last_test_at = null, last_test_ok = null, last_test_message = null
     where id = p_provider returning secret_hints into v_hints;
    perform public.audit('psp.secret.set', 'psp_providers', p_provider, jsonb_build_object('field', p_field));
  end if;
  return v_hints;
end $$;

-- Service role only: decrypted secrets of one PSP as {FIELD: value}.
create or replace function public.get_psp_secrets(p_provider text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(substr(name, length('psp.' || p_provider || '.') + 1), decrypted_secret), '{}'::jsonb)
    from vault.decrypted_secrets
   where name like 'psp.' || p_provider || '.%'
$$;

-- Service role only: enabled providers in priority order (no secrets).
create or replace function public.active_psp_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'live_mode', live_mode, 'public_key', public_key,
                                               'methods', methods, 'has_secret', secret_hints <> '{}'::jsonb)
                            order by priority), '[]'::jsonb)
    from public.psp_providers
   where enabled
$$;

-- Anyone signed in: which payment methods are currently available.
create or replace function public.available_payment_methods()
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct m), '{}')
    from public.psp_providers, unnest(methods) m
   where enabled and secret_hints <> '{}'::jsonb
$$;

-- Admin changes on provider settings are audited.
create or replace function public.audit_psp_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.enabled is distinct from old.enabled or new.live_mode is distinct from old.live_mode
     or new.priority is distinct from old.priority or new.public_key is distinct from old.public_key then
    perform public.audit('psp.update', 'psp_providers', new.id,
      jsonb_build_object('enabled', new.enabled, 'live_mode', new.live_mode, 'priority', new.priority));
  end if;
  return new;
end $$;
create trigger audit_psp_update after update on public.psp_providers
  for each row execute function public.audit_psp_update();

revoke execute on function public.get_psp_secrets(text) from public, anon, authenticated;
revoke execute on function public.active_psp_config() from public, anon, authenticated;
grant execute on function public.get_psp_secrets(text) to service_role;
grant execute on function public.active_psp_config() to service_role;
revoke execute on function public.admin_set_psp_secret(text, text, text) from public, anon;
grant execute on function public.admin_set_psp_secret(text, text, text) to authenticated;
revoke execute on function public.available_payment_methods() from public, anon;
grant execute on function public.available_payment_methods() to authenticated;
