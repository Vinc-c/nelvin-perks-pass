-- Integrations vault: third-party service keys (Resend, Gemini, Anthropic, Twilio, custom) managed by super admins.
-- Same model as the PSP vault: secrets live encrypted in Supabase Vault and are WRITE-ONLY from the app
-- (the browser only ever sees a masked hint and a rotation date). Edge Functions read them with the service role.
create table if not exists public.integrations (
  id text primary key check (id ~ '^[a-z][a-z0-9_]{1,30}$'),
  display_name text not null,
  category text not null check (category in ('email','ai','messaging','other')),
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,          -- non-secret settings only (sender, model...)
  secret_hints jsonb not null default '{}'::jsonb,    -- {FIELD: {"hint": "••••1234", "at": iso}}
  last_test_at timestamptz,
  last_test_ok boolean,
  last_test_message text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_date timestamptz not null default now()
);
alter table public.integrations enable row level security;
drop policy if exists integrations_admin_read on public.integrations;
create policy integrations_admin_read on public.integrations for select to authenticated using ((select public.is_admin()));
-- no insert/update/delete policies: writes only through the functions below.

insert into public.integrations (id, display_name, category) values
  ('resend', 'Resend (transactional email)', 'email'),
  ('gemini', 'Google Gemini (AI assistant)', 'ai'),
  ('anthropic', 'Anthropic Claude (AI assistant)', 'ai'),
  ('twilio', 'Twilio (SMS / WhatsApp)', 'messaging'),
  ('custom', 'Other services (custom keys)', 'other')
on conflict (id) do nothing;

create or replace function public.integration_secret_ok(p_id text, p_field text) returns boolean
language sql immutable set search_path = '' as $$
  select case p_id
    when 'resend' then p_field = 'RESEND_API_KEY'
    when 'gemini' then p_field = 'GEMINI_API_KEY'
    when 'anthropic' then p_field = 'ANTHROPIC_API_KEY'
    when 'twilio' then p_field in ('TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN')
    when 'custom' then p_field ~ '^[A-Z][A-Z0-9_]{2,59}$'
    else false end
$$;

create or replace function public.integration_config_ok(p_id text, p_key text) returns boolean
language sql immutable set search_path = '' as $$
  select case p_id
    when 'resend' then p_key = 'EMAIL_FROM'
    when 'gemini' then p_key = 'GEMINI_MODEL'
    when 'anthropic' then p_key = 'ANTHROPIC_MODEL'
    when 'twilio' then p_key in ('TWILIO_FROM','TWILIO_WHATSAPP_FROM')
    else false end
$$;

-- Super admin: set (or clear with an empty value) one secret.
create or replace function public.admin_set_integration_secret(p_id text, p_field text, p_value text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text := 'int.' || p_id || '.' || p_field;
  v_value text := btrim(coalesce(p_value, ''));
  v_vid uuid; v_hints jsonb; v_had boolean;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if not exists (select 1 from public.integrations where id = p_id) then raise exception 'Service inconnu'; end if;
  if not public.integration_secret_ok(p_id, p_field) then raise exception 'Champ % non valide pour %', p_field, p_id using errcode = '22023'; end if;
  if v_value ~ '[\x00-\x1f\x7f]' then raise exception 'Caractères non autorisés'; end if;
  select id into v_vid from vault.secrets where name = v_name;
  select secret_hints <> '{}'::jsonb into v_had from public.integrations where id = p_id;
  if v_value = '' then
    if v_vid is not null then delete from vault.secrets where id = v_vid; end if;
    update public.integrations set secret_hints = secret_hints - p_field, updated_by = auth.uid(),
      enabled = case when (secret_hints - p_field) = '{}'::jsonb and id <> 'custom' then false else enabled end
     where id = p_id returning secret_hints into v_hints;
    perform public.audit('integration.secret.clear', 'integrations', p_id, jsonb_build_object('field', p_field));
  else
    if length(v_value) > 4096 then raise exception 'Valeur trop longue'; end if;
    if p_id = 'custom' and v_vid is null and (select count(*) from vault.secrets where name like 'int.custom.%') >= 25 then
      raise exception 'Maximum 25 clés personnalisées';
    end if;
    if v_vid is null then perform vault.create_secret(v_value, v_name, 'Nelvin integration secret');
    else perform vault.update_secret(v_vid, v_value); end if;
    update public.integrations
       set secret_hints = secret_hints || jsonb_build_object(p_field, jsonb_build_object(
             'hint', case when length(v_value) > 8 then '••••' || right(v_value, 4) else '••••' end, 'at', now())),
           enabled = case when not v_had then true else enabled end,   -- first key switches the service on
           updated_by = auth.uid(), last_test_at = null, last_test_ok = null, last_test_message = null
     where id = p_id returning secret_hints into v_hints;
    perform public.audit('integration.secret.set', 'integrations', p_id, jsonb_build_object('field', p_field));
  end if;
  return v_hints;
end $$;

-- Super admin: enable/disable and non-secret settings.
create or replace function public.admin_update_integration(p_id text, p_enabled boolean, p_config jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare k text; v jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if not exists (select 1 from public.integrations where id = p_id) then raise exception 'Service inconnu'; end if;
  if p_config is not null then
    if jsonb_typeof(p_config) <> 'object' then raise exception 'Configuration invalide'; end if;
    for k in select jsonb_object_keys(p_config) loop
      if not public.integration_config_ok(p_id, k) then raise exception 'Réglage % non valide pour %', k, p_id; end if;
      if jsonb_typeof(p_config->k) <> 'string' or length(p_config->>k) > 200 then raise exception 'Valeur invalide pour %', k; end if;
      if nullif(btrim(p_config->>k), '') is not null then v := v || jsonb_build_object(k, btrim(p_config->>k)); end if;
    end loop;
  end if;
  update public.integrations set enabled = coalesce(p_enabled, enabled), config = case when p_config is null then config else v end,
         updated_by = auth.uid() where id = p_id;
  perform public.audit('integration.update', 'integrations', p_id, jsonb_build_object('enabled', p_enabled, 'config_keys', (select coalesce(jsonb_agg(x), '[]') from jsonb_object_keys(coalesce(v,'{}')) x)));
end $$;

-- Service role only: {enabled, config, secrets} of one integration.
create or replace function public.get_integration_runtime(p_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'enabled', coalesce((select enabled from public.integrations where id = p_id), false),
    'config', coalesce((select config from public.integrations where id = p_id), '{}'::jsonb),
    'secrets', coalesce((select jsonb_object_agg(substr(name, length('int.' || p_id || '.') + 1), decrypted_secret)
                           from vault.decrypted_secrets where name like 'int.' || p_id || '.%'), '{}'::jsonb))
$$;

-- Any signed-in user: is a service connected? (booleans only: used to show/hide features.)
create or replace function public.integration_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(id, enabled and secret_hints <> '{}'::jsonb), '{}'::jsonb) from public.integrations
$$;

revoke all on function public.integration_secret_ok(text,text), public.integration_config_ok(text,text) from public, anon, authenticated;
revoke all on function public.admin_set_integration_secret(text,text,text), public.admin_update_integration(text,boolean,jsonb) from public, anon;
grant execute on function public.admin_set_integration_secret(text,text,text), public.admin_update_integration(text,boolean,jsonb) to authenticated;
revoke all on function public.get_integration_runtime(text) from public, anon, authenticated;
grant execute on function public.get_integration_runtime(text) to service_role;
revoke all on function public.integration_status() from public, anon;
grant execute on function public.integration_status() to authenticated;
