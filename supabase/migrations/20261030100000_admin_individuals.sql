-- Super-admin "Individuals" view: every individual member (no company / merchant),
-- with subscription, payment problems and savings, plus a per-member detail.

create or replace function public.admin_list_individuals(p_search text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.created_date desc)
    from (
      select p.id, p.full_name, p.email, p.country, p.phone, p.created_date,
             p.wallet_balance, p.wallet_currency,
             s.plan_type, s.status as sub_status, s.expires_at as sub_expires_at, s.billing_cycle,
             coalesce(t.failed, 0) as failed_payments,
             coalesce(t.pending, 0) as pending_payments,
             t.last_failed_at,
             coalesce(r.saved_usd, 0) as saved_usd,
             coalesce(r.redemptions, 0) as redemptions
      from public.profiles p
      left join lateral (
        select plan_type, status, expires_at, billing_cycle from public.subscriptions
        where user_id = p.id order by created_date desc limit 1
      ) s on true
      left join lateral (
        select count(*) filter (where status = 'FAILED') as failed,
               count(*) filter (where status = 'PENDING') as pending,
               max(created_date) filter (where status = 'FAILED') as last_failed_at
        from public.transactions
        where user_id = p.id and type in ('RECHARGE','SUBSCRIPTION','GIFT')
      ) t on true
      left join lateral (
        select count(*) as redemptions,
               sum(coalesce(discount_applied, 0) + coalesce(cashback_credited, 0)) as saved_usd
        from public.redemptions
        where user_id = p.id and status not in ('GENERATED','EXPIRED','CANCELLED')
      ) r on true
      where p.role = 'MEMBER' and p.company_id is null and p.merchant_id is null
        and (p_search is null or p_search = '' or
             (coalesce(p.full_name,'') || ' ' || coalesce(p.email,'') || ' ' || coalesce(p.country,'')) ilike '%' || p_search || '%')
      limit 500
    ) x
  ), '[]'::jsonb);
end $$;

create or replace function public.admin_individual_detail(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare out jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'profile', (select to_jsonb(p) - 'notif_prefs' from public.profiles p where p.id = p_user),
    'subscriptions', coalesce((select jsonb_agg(to_jsonb(s) order by s.created_date desc)
        from (select id, plan_type, billing_cycle, status, amount, currency, psp_used, started_at, expires_at, cancel_at_period_end, created_date
              from public.subscriptions where user_id = p_user limit 50) s), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_date desc)
        from (select id, type, status, amount, currency, payment_method, psp_reference, description, admin_note, created_date
              from public.transactions where user_id = p_user order by created_date desc limit 100) t), '[]'::jsonb),
    'redemptions', coalesce((select jsonb_agg(to_jsonb(r) order by r.redeemed_at desc nulls last)
        from (select r.id, r.status, r.discount_applied, r.cashback_credited, r.bill_amount, r.bill_currency, r.redeemed_at, r.created_date,
                     o.title as offer_title, m.name as merchant_name
              from public.redemptions r
              left join public.offers o on o.id = r.offer_id
              left join public.merchants m on m.id = r.merchant_id
              where r.user_id = p_user order by r.created_date desc limit 100) r), '[]'::jsonb)
  ) into out;
  return out;
end $$;

revoke all on function public.admin_list_individuals(text) from public, anon;
revoke all on function public.admin_individual_detail(uuid) from public, anon;
grant execute on function public.admin_list_individuals(text) to authenticated;
grant execute on function public.admin_individual_detail(uuid) to authenticated;
