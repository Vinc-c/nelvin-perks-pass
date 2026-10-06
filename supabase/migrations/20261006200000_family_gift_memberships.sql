-- P1 (suite) — family membership and gifted memberships.
--
-- Family: a B2C plan can include `family_seats` extra people. The holder
-- invites them by email; once accepted they get the same access while the
-- holder's membership is active (one family per person).
-- Gift: anyone can buy a B2C membership for someone else (wallet or online
-- payment). A single-use gift code is issued once paid; the recipient redeems
-- it to activate the membership on their own account.

alter table public.plans add column family_seats int not null default 0 check (family_seats between 0 and 10);
update public.plans set family_seats = 2 where code = 'PASS_PREMIUM';
update public.plans set family_seats = 4 where code = 'PASS_VIP';

alter table public.subscriptions drop constraint if exists subscriptions_psp_used_check;
alter table public.subscriptions add constraint subscriptions_psp_used_check check (psp_used in (
  'PADDLE', 'STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'PAYUNIT', 'KORAPAY', 'CAMPAY', 'WALLET', 'MANUAL', 'GIFT'));

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type in (
  'REDEMPTION', 'RECHARGE', 'WITHDRAWAL', 'SUBSCRIPTION', 'PAYOUT', 'ALLOCATION', 'COMPANY_TOPUP',
  'REFERRAL_BONUS', 'REFUND', 'GIFT'));

-- The member's own live B2C membership (null when none).
create or replace function public.live_b2c_subscription(p_user uuid)
returns public.subscriptions language sql stable security definer set search_path = '' as $$
  select s.* from public.subscriptions s
   where s.user_id = p_user and s.company_id is null and s.merchant_id is null and s.status = 'ACTIVE'
     and (s.expires_at is null or s.expires_at > now())
   order by s.expires_at desc nulls first limit 1
$$;
revoke execute on function public.live_b2c_subscription(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Family
-- ---------------------------------------------------------------------------
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email like '%_@_%._%'),
  member_id uuid references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE')),
  created_date timestamptz not null default now(),
  accepted_at timestamptz,
  unique (owner_id, email)
);
create unique index family_members_one_family on public.family_members(member_id) where status = 'ACTIVE';
create index family_members_email_idx on public.family_members(email);
alter table public.family_members enable row level security;
create policy "family_members: owner or invitee read" on public.family_members for select to authenticated
  using (owner_id = (select auth.uid()) or member_id = (select auth.uid())
         or email = lower((select email from public.profiles where id = (select auth.uid())))
         or (select public.is_admin()));
-- Writes go through the functions below.

create or replace function public.family_invite(p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.subscriptions%rowtype;
  v_seats int;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_me public.profiles%rowtype;
  v_target uuid;
begin
  select * into v_me from public.profiles where id = auth.uid();
  if not found then raise exception 'Non connecté' using errcode = '42501'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Email invalide'; end if;
  if v_email = lower(v_me.email) then raise exception 'Vous êtes déjà le titulaire'; end if;
  if exists (select 1 from public.family_members where member_id = auth.uid() and status = 'ACTIVE') then
    raise exception 'Seul le titulaire de l''abonnement peut inviter';
  end if;
  s := public.live_b2c_subscription(auth.uid());
  if s.id is null then raise exception 'Un abonnement actif est nécessaire pour inviter votre famille'; end if;
  select family_seats into v_seats from public.plans where code = s.plan_type;
  if coalesce(v_seats, 0) = 0 then raise exception 'Votre plan n''inclut pas de membres de la famille : passez à un plan supérieur'; end if;
  if (select count(*) from public.family_members where owner_id = auth.uid()) >= v_seats then
    raise exception 'Toutes les places famille de votre plan sont utilisées (%)', v_seats;
  end if;
  insert into public.family_members (owner_id, email) values (auth.uid(), v_email);
  select id into v_target from public.profiles where lower(email) = v_email;
  if v_target is not null then
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (v_target, 'SYSTEM', 'Invitation famille',
            coalesce(v_me.full_name, v_me.email) || ' vous invite à partager son abonnement Nelvin.', '/billing-settings', auth.uid());
  end if;
  return jsonb_build_object('ok', true, 'has_account', v_target is not null);
end $$;

create or replace function public.family_accept(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare f public.family_members%rowtype;
begin
  select * into f from public.family_members
   where id = p_id and status = 'PENDING'
     and email = lower((select email from public.profiles where id = auth.uid()))
   for update;
  if not found then raise exception 'Invitation introuvable'; end if;
  if f.owner_id = auth.uid() then raise exception 'Invitation invalide'; end if;
  if exists (select 1 from public.family_members where member_id = auth.uid() and status = 'ACTIVE') then
    raise exception 'Vous faites déjà partie d''une famille : quittez-la d''abord';
  end if;
  update public.family_members set status = 'ACTIVE', member_id = auth.uid(), accepted_at = now() where id = f.id;
  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (f.owner_id, 'SYSTEM', 'Invitation acceptée',
          (select coalesce(full_name, email) from public.profiles where id = auth.uid()) || ' a rejoint votre abonnement famille.',
          '/billing-settings', auth.uid());
  return jsonb_build_object('ok', true);
end $$;

-- Owner removes a person / cancels an invitation; member leaves or declines.
create or replace function public.family_remove(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare f public.family_members%rowtype;
begin
  select * into f from public.family_members where id = p_id;
  if not found then raise exception 'Introuvable'; end if;
  if not (f.owner_id = auth.uid() or f.member_id = auth.uid()
          or f.email = lower((select email from public.profiles where id = auth.uid()))
          or public.is_admin()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  delete from public.family_members where id = f.id;
end $$;

-- Is this member covered by a family membership right now?
create or replace function public.family_coverage(p_user uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('owner_id', f.owner_id, 'owner_name', coalesce(p.full_name, p.email),
                            'plan', s.plan_type, 'expires_at', s.expires_at)
    from public.family_members f
    join public.profiles p on p.id = f.owner_id
    cross join lateral public.live_b2c_subscription(f.owner_id) s
    join public.plans pl on pl.code = s.plan_type and pl.family_seats > 0
   where f.member_id = p_user and f.status = 'ACTIVE' and s.id is not null
   limit 1
$$;
revoke execute on function public.family_coverage(uuid) from public, anon, authenticated;
grant execute on function public.family_coverage(uuid) to service_role;

create or replace function public.my_family()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'seats', (select pl.family_seats from public.plans pl where pl.code = (public.live_b2c_subscription(auth.uid())).plan_type),
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'email', f.email, 'status', f.status,
                                                             'name', p.full_name, 'accepted_at', f.accepted_at)
                                          order by f.created_date)
                          from public.family_members f left join public.profiles p on p.id = f.member_id
                         where f.owner_id = auth.uid()), '[]'::jsonb),
    'covered_by', public.family_coverage(auth.uid()),
    'membership_id', (select f.id from public.family_members f where f.member_id = auth.uid() and f.status = 'ACTIVE'),
    'invitations', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'owner_name', coalesce(p.full_name, p.email)))
                              from public.family_members f join public.profiles p on p.id = f.owner_id
                             where f.status = 'PENDING'
                               and f.email = lower((select email from public.profiles where id = auth.uid()))), '[]'::jsonb)
  )
$$;

revoke execute on function public.family_invite(text), public.family_accept(uuid), public.family_remove(uuid), public.my_family() from public, anon;
grant execute on function public.family_invite(text), public.family_accept(uuid), public.family_remove(uuid), public.my_family() to authenticated;

-- ---------------------------------------------------------------------------
-- Gifts
-- ---------------------------------------------------------------------------
create table public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan_code text not null references public.plans(code),
  billing_cycle text not null default 'MONTHLY' check (billing_cycle in ('MONTHLY', 'ANNUAL')),
  purchaser_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text check (recipient_email is null or recipient_email = lower(btrim(recipient_email))),
  recipient_name text,
  message text check (char_length(message) <= 500),
  status text not null default 'PENDING_PAYMENT' check (status in ('PENDING_PAYMENT', 'AVAILABLE', 'REDEEMED', 'CANCELLED')),
  transaction_id uuid references public.transactions(id) on delete set null,
  amount_usd numeric not null default 0,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  expires_at timestamptz not null default now() + interval '1 year',
  created_date timestamptz not null default now()
);
create index gift_cards_purchaser_idx on public.gift_cards(purchaser_id);
create index gift_cards_recipient_idx on public.gift_cards(recipient_email);
alter table public.gift_cards enable row level security;
create policy "gift_cards: purchaser, recipient or admin" on public.gift_cards for select to authenticated
  using (purchaser_id = (select auth.uid()) or redeemed_by = (select auth.uid())
         or (status <> 'PENDING_PAYMENT' and recipient_email = lower((select email from public.profiles where id = (select auth.uid()))))
         or (select public.is_admin()));

create or replace function public._gift_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  v text := '';
begin
  for j in 0..11 loop v := v || substr(v_alphabet, (get_byte(v_bytes, j) % 32) + 1, 1); end loop;
  return 'GIFT-' || substr(v, 1, 4) || '-' || substr(v, 5, 4) || '-' || substr(v, 9, 4);
end $$;
revoke execute on function public._gift_code() from public, anon, authenticated;

-- Marks a paid gift as available and notifies both people.
create or replace function public._issue_gift(p_transaction_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  g public.gift_cards%rowtype;
  v_recipient uuid;
  v_plan text;
begin
  update public.gift_cards set status = 'AVAILABLE'
   where transaction_id = p_transaction_id and status = 'PENDING_PAYMENT'
  returning * into g;
  if not found then
    select * into g from public.gift_cards where transaction_id = p_transaction_id;
    return jsonb_build_object('gift_code', g.code);
  end if;
  select name into v_plan from public.plans where code = g.plan_code;
  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (g.purchaser_id, 'SYSTEM', 'Cadeau prêt',
          'Votre abonnement ' || v_plan || ' à offrir est prêt. Code : ' || g.code, '/billing-settings', g.purchaser_id);
  if g.recipient_email is not null then
    select id into v_recipient from public.profiles where lower(email) = g.recipient_email;
    if v_recipient is not null then
      insert into public.notifications (user_id, type, title, body, link, created_by_id)
      values (v_recipient, 'REWARD', 'On vous offre Nelvin !',
              (select coalesce(full_name, email) from public.profiles where id = g.purchaser_id) ||
              ' vous offre un abonnement ' || v_plan || '. Activez-le depuis Abonnement.', '/billing-settings', g.purchaser_id);
    end if;
  end if;
  return jsonb_build_object('gift_code', g.code);
end $$;
revoke execute on function public._issue_gift(uuid) from public, anon, authenticated;

-- Service role (create-checkout, purpose GIFT): reserve the gift for a pending payment.
create or replace function public.create_pending_gift(
  p_user uuid, p_transaction_id uuid, p_plan_code text, p_cycle text,
  p_recipient_email text, p_recipient_name text, p_message text, p_amount_usd numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_code text := public._gift_code();
begin
  insert into public.gift_cards (code, plan_code, billing_cycle, purchaser_id, recipient_email, recipient_name, message,
                                 transaction_id, amount_usd)
  values (v_code, p_plan_code, p_cycle, p_user, nullif(lower(btrim(coalesce(p_recipient_email, ''))), ''),
          nullif(left(btrim(coalesce(p_recipient_name, '')), 80), ''), nullif(left(btrim(coalesce(p_message, '')), 500), ''),
          p_transaction_id, p_amount_usd);
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.create_pending_gift(uuid, uuid, text, text, text, text, text, numeric) from public, anon, authenticated;
grant execute on function public.create_pending_gift(uuid, uuid, text, text, text, text, text, numeric) to service_role;

create or replace function public.gift_buy_with_wallet(
  p_plan_code text, p_cycle text default 'MONTHLY', p_recipient_email text default null,
  p_recipient_name text default null, p_message text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pl public.plans%rowtype;
  v_price numeric;
  v_tx uuid;
begin
  if auth.uid() is null then raise exception 'Non connecté' using errcode = '42501'; end if;
  select * into pl from public.plans where code = p_plan_code and active and audience = 'B2C';
  if not found then raise exception 'Seuls les abonnements particuliers peuvent être offerts'; end if;
  if p_cycle not in ('MONTHLY', 'ANNUAL') then raise exception 'Cycle invalide'; end if;
  v_price := case when p_cycle = 'ANNUAL' then pl.price_annual else pl.price_monthly end;
  if v_price <= 0 then raise exception 'Plan gratuit : rien à offrir'; end if;
  update public.profiles set wallet_balance = wallet_balance - v_price where id = auth.uid() and wallet_balance >= v_price;
  if not found then return jsonb_build_object('ok', false, 'error', 'Solde wallet insuffisant'); end if;
  insert into public.transactions (user_id, amount, amount_usd, currency, payment_method, type, status,
                                   plan_code, billing_cycle, description, created_by_id)
  values (auth.uid(), v_price, v_price, 'USD', 'WALLET', 'GIFT', 'COMPLETED', pl.code, p_cycle,
          'Abonnement offert : ' || pl.name, auth.uid())
  returning id into v_tx;
  perform public.create_pending_gift(auth.uid(), v_tx, pl.code, p_cycle, p_recipient_email, p_recipient_name, p_message, v_price);
  return jsonb_build_object('ok', true) || public._issue_gift(v_tx);
end $$;

create or replace function public.gift_redeem(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  g public.gift_cards%rowtype;
  v_email text := lower((select email from public.profiles where id = auth.uid()));
  v_res jsonb;
begin
  if auth.uid() is null then raise exception 'Non connecté' using errcode = '42501'; end if;
  select * into g from public.gift_cards where code = upper(btrim(coalesce(p_code, ''))) for update;
  if not found or g.status = 'PENDING_PAYMENT' then raise exception 'Code cadeau invalide'; end if;
  if g.status = 'REDEEMED' then raise exception 'Ce code cadeau a déjà été utilisé'; end if;
  if g.status = 'CANCELLED' or g.expires_at < now() then raise exception 'Ce code cadeau a expiré'; end if;
  if g.recipient_email is not null and g.recipient_email <> v_email then
    raise exception 'Ce cadeau est destiné à une autre adresse email';
  end if;
  v_res := public._activate_subscription(auth.uid(), g.plan_code, g.billing_cycle, 0, 'GIFT');
  update public.gift_cards set status = 'REDEEMED', redeemed_by = auth.uid(), redeemed_at = now() where id = g.id;
  if g.purchaser_id <> auth.uid() then
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (g.purchaser_id, 'SYSTEM', 'Cadeau activé',
            (select coalesce(full_name, email) from public.profiles where id = auth.uid()) || ' a activé l''abonnement que vous avez offert.',
            '/billing-settings', auth.uid());
  end if;
  return v_res;
end $$;

revoke execute on function public.gift_buy_with_wallet(text, text, text, text, text), public.gift_redeem(text) from public, anon;
grant execute on function public.gift_buy_with_wallet(text, text, text, text, text), public.gift_redeem(text) to authenticated;

-- complete_payment now also issues paid gifts.
create or replace function public.complete_payment(p_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  t public.transactions%rowtype;
  v_usd numeric;
  v_balance numeric;
  v_extra jsonb := '{}'::jsonb;
begin
  select * into t from public.transactions where psp_reference = p_reference for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Transaction introuvable'); end if;
  if t.status = 'COMPLETED' then
    return jsonb_build_object('ok', true, 'status', 'already_completed', 'type', t.type, 'transactionId', t.id);
  end if;
  if t.status <> 'PENDING' then
    return jsonb_build_object('ok', false, 'error', 'Transaction non éligible (' || t.status || ')');
  end if;

  v_usd := coalesce(t.amount_usd, public.to_usd(t.amount, t.currency));
  update public.transactions set status = 'COMPLETED', amount_usd = v_usd where id = t.id;

  if t.type = 'RECHARGE' then
    update public.profiles set wallet_balance = wallet_balance + v_usd where id = t.user_id
    returning wallet_balance into v_balance;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'RECHARGE', 'Recharge confirmée',
            'Votre wallet a été rechargé de ' || t.amount || ' ' || t.currency || '.', '/wallet-activity', t.user_id);
  elsif t.type = 'COMPANY_TOPUP' then
    update public.companies set wallet_balance = wallet_balance + v_usd where id = t.company_id
    returning wallet_balance into v_balance;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'RECHARGE', 'Wallet entreprise crédité',
            t.amount || ' ' || t.currency || ' ajoutés au budget avantages.', '/hr?section=benefits', t.user_id);
  elsif t.type = 'SUBSCRIPTION' then
    v_extra := public._activate_subscription(t.user_id, t.plan_code, coalesce(t.billing_cycle, 'MONTHLY'), v_usd,
                                             split_part(t.psp_reference, '-', 2));
  elsif t.type = 'GIFT' then
    v_extra := public._issue_gift(t.id);
  else
    raise exception 'Type de paiement non pris en charge: %', t.type;
  end if;

  return jsonb_build_object('ok', true, 'status', 'completed', 'type', t.type, 'balance', v_balance,
                            'amount', t.amount, 'currency', t.currency, 'amount_usd', v_usd,
                            'transactionId', t.id) || v_extra;
end $$;
