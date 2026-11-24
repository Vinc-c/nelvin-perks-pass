-- Merchant payout rules (min exactly 20 USD by default, quota by plan, optional fee) + super-admin "Money rules" RPCs.

create or replace function public.payout_rules() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_m uuid := public.my_merchant_id(); v_pro boolean := false; v_limit numeric; v_used int := 0;
begin
  if v_m is not null then
    select exists (select 1 from public.subscriptions where merchant_id = v_m and plan_type = 'MERCHANT_PRO'
                    and status in ('ACTIVE','TRIALING') and (expires_at is null or expires_at > now())) into v_pro;
    select count(*) into v_used from public.payout_requests
     where merchant_id = v_m and status <> 'REJECTED' and created_date >= date_trunc('month', now());
  end if;
  v_limit := public.setting_numeric(case when v_pro then 'payout_pro_monthly_limit' else 'payout_basic_monthly_limit' end, 0);
  return jsonb_build_object('enabled', public.setting_numeric('payout_enabled', 1) > 0,
    'min', public.setting_numeric('payout_min_usd', 20), 'max', public.setting_numeric('payout_max_usd', 5000),
    'fee_pct', public.setting_numeric('payout_fee_pct', 0), 'sla_days', public.setting_numeric('payout_sla_days', 3),
    'monthly_limit', v_limit, 'used_this_month', v_used, 'commission_pct', public.setting_numeric('commission_pct', 1));
end $$;

create or replace function public.merchant_request_payout(p_amount_usd numeric, p_method text, p_destination text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_merchant uuid := public.my_merchant_id(); v_id uuid; v_rules jsonb; v_amt numeric; v_fee numeric;
begin
  if v_merchant is null then raise exception 'Compte marchand requis' using errcode = '42501'; end if;
  if p_amount_usd is null or p_amount_usd <= 0 then raise exception 'Montant invalide'; end if;
  if p_method not in ('MOBILE_MONEY', 'BANK_TRANSFER') then raise exception 'Méthode invalide'; end if;
  if coalesce(btrim(p_destination), '') = '' then raise exception 'Destination requise'; end if;
  v_amt := round(p_amount_usd, 2);
  v_rules := public.payout_rules();
  if not (v_rules->>'enabled')::boolean then raise exception 'Les demandes de paiement sont temporairement suspendues'; end if;
  if v_amt < (v_rules->>'min')::numeric then raise exception 'Montant minimum de paiement : % USD', v_rules->>'min'; end if;
  if v_amt > (v_rules->>'max')::numeric then raise exception 'Montant maximum par demande : % USD', v_rules->>'max'; end if;
  if (v_rules->>'monthly_limit')::numeric > 0 and (v_rules->>'used_this_month')::numeric >= (v_rules->>'monthly_limit')::numeric then
    raise exception 'Limite de demandes atteinte ce mois-ci (% par mois)', v_rules->>'monthly_limit';
  end if;
  v_fee := round(v_amt * (v_rules->>'fee_pct')::numeric / 100, 2);
  update public.merchants set payout_balance = payout_balance - v_amt
   where id = v_merchant and verified_status = 'VERIFIED' and payout_balance >= v_amt;
  if not found then raise exception 'Solde de paiement insuffisant'; end if;
  insert into public.payout_requests (merchant_id, requested_by, amount_usd, fee_usd, method, destination)
  values (v_merchant, auth.uid(), v_amt, v_fee, p_method, left(btrim(p_destination), 120))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_process_payout(p_id uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.payout_requests%rowtype;
begin
  if not public.has_perm('finance') then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select * into p from public.payout_requests where id = p_id for update;
  if not found or p.status <> 'PENDING' then raise exception 'Demande introuvable ou déjà traitée'; end if;
  update public.payout_requests
     set status = case when p_approve then 'PAID' else 'REJECTED' end,
         admin_note = p_note, processed_by = auth.uid(), processed_at = now()
   where id = p.id;
  if p_approve then
    if p.requested_by is not null then
      insert into public.transactions (user_id, merchant_id, amount, amount_usd, fee_usd, currency, payment_method, type, status,
                                       destination, description, processed_by, processed_at, created_by_id)
      values (p.requested_by, p.merchant_id, p.amount_usd, p.amount_usd, p.fee_usd, 'USD', p.method, 'PAYOUT', 'COMPLETED',
              p.destination, 'Paiement marchand (net ' || (p.amount_usd - p.fee_usd) || ' USD)', auth.uid(), now(), p.requested_by);
    end if;
  else
    update public.merchants set payout_balance = payout_balance + p.amount_usd where id = p.merchant_id;
  end if;
  if p.requested_by is not null then
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (p.requested_by, case when p_approve then 'SYSTEM' else 'ALERT' end,
            case when p_approve then 'Paiement envoyé' else 'Demande de paiement refusée' end,
            case when p_approve then (p.amount_usd - p.fee_usd) || ' USD envoyés vers ' || p.destination
                 else p.amount_usd || ' USD recrédités sur votre solde.' || coalesce(' Motif : ' || p_note, '') end,
            '/merchant-dashboard?section=payout', p.requested_by);
  end if;
  perform public.audit(case when p_approve then 'payout.approve' else 'payout.reject' end, 'payout_requests', p.id::text,
                       jsonb_build_object('amount_usd', p.amount_usd, 'fee_usd', p.fee_usd, 'note', p_note));
end $$;

-- Super-admin: edit the money rules (whitelist + ranges, audited).
create or replace function public.admin_set_money_rules(p_rules jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare k text; v numeric;
  spec jsonb := '{"topup_bonus_enabled":[0,1],"commission_pct":[0,30],"withdrawal_fee_pct":[0,50],"withdrawal_psp_fee_pct":[0,20],
    "withdrawal_psp_fee_fixed_usd":[0,50],"withdrawal_min_usd":[1,10000],"promo_credits_spend_only":[0,1],"payout_enabled":[0,1],
    "payout_min_usd":[1,10000],"payout_max_usd":[1,100000],"payout_basic_monthly_limit":[0,100],"payout_pro_monthly_limit":[0,100],
    "payout_sla_days":[0,30],"payout_fee_pct":[0,30]}';
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  for k in select jsonb_object_keys(p_rules) loop
    if not spec ? k then raise exception 'Règle inconnue : %', k; end if;
    begin v := (p_rules->>k)::numeric; exception when others then raise exception 'Valeur invalide pour %', k; end;
    if v < (spec->k->>0)::numeric or v > (spec->k->>1)::numeric then
      raise exception 'Valeur hors limites pour % (% à %)', k, spec->k->>0, spec->k->>1;
    end if;
    update public.platform_settings set value = to_jsonb(v), updated_by = auth.uid(), updated_date = now() where key = k;
  end loop;
  perform public.audit('money_rules.update', 'platform_settings', null, p_rules);
end $$;

create or replace function public.admin_save_bonus_tier(p_id uuid, p_min_usd numeric, p_type text, p_value numeric, p_active boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if p_id is null then
    insert into public.topup_bonus_tiers (min_usd, bonus_type, bonus_value, active, updated_by)
    values (p_min_usd, p_type, p_value, coalesce(p_active, true), auth.uid()) returning id into v_id;
  else
    update public.topup_bonus_tiers set min_usd = p_min_usd, bonus_type = p_type, bonus_value = p_value,
           active = coalesce(p_active, true), updated_by = auth.uid() where id = p_id returning id into v_id;
    if v_id is null then raise exception 'Palier introuvable'; end if;
  end if;
  perform public.audit('bonus_tier.save', 'topup_bonus_tiers', v_id::text,
                       jsonb_build_object('min_usd', p_min_usd, 'type', p_type, 'value', p_value, 'active', p_active));
  return v_id;
end $$;

create or replace function public.admin_delete_bonus_tier(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  delete from public.topup_bonus_tiers where id = p_id;
  perform public.audit('bonus_tier.delete', 'topup_bonus_tiers', p_id::text, '{}'::jsonb);
end $$;

-- Dashboard figures for the Money rules screen.
create or replace function public.admin_money_summary() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  return jsonb_build_object(
    'commission_30d', coalesce((select sum(commission_usd) from public.transactions where type = 'REDEMPTION' and status = 'COMPLETED' and created_date > now() - interval '30 days'), 0),
    'bonus_granted_30d', coalesce((select sum(bonus_usd) from public.transactions where type = 'RECHARGE' and status = 'COMPLETED' and created_date > now() - interval '30 days'), 0),
    'withdrawal_fees_30d', coalesce((select sum(fee_usd) from public.transactions where type = 'WITHDRAWAL' and status in ('PENDING','COMPLETED') and created_date > now() - interval '30 days'), 0),
    'wallet_total', coalesce((select sum(wallet_balance) from public.profiles), 0),
    'bonus_outstanding', coalesce((select sum(bonus_balance) from public.profiles), 0),
    'merchant_payable', coalesce((select sum(payout_balance) from public.merchants), 0));
end $$;

revoke all on function public.payout_rules(), public.merchant_request_payout(numeric, text, text),
  public.admin_process_payout(uuid, boolean, text), public.admin_set_money_rules(jsonb),
  public.admin_save_bonus_tier(uuid, numeric, text, numeric, boolean), public.admin_delete_bonus_tier(uuid),
  public.admin_money_summary() from public, anon;
grant execute on function public.payout_rules(), public.merchant_request_payout(numeric, text, text),
  public.admin_process_payout(uuid, boolean, text), public.admin_set_money_rules(jsonb),
  public.admin_save_bonus_tier(uuid, numeric, text, numeric, boolean), public.admin_delete_bonus_tier(uuid),
  public.admin_money_summary() to authenticated;

-- Default bonus ladder (editable in Admin → Money rules).
insert into public.topup_bonus_tiers (min_usd, bonus_type, bonus_value) values (50, 'PERCENT', 2), (100, 'PERCENT', 5), (250, 'PERCENT', 8)
on conflict (min_usd) do nothing;
