-- Platform v2 — company benefits & allowances, recognition, support desk,
-- merchant KYC documents. Every table is tenant-scoped.

-- ---------------------------------------------------------------------------
-- Tenant helpers
-- ---------------------------------------------------------------------------
-- True when p_user belongs to the caller's company (caller must have one).
create or replace function public.same_company(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles me
      join public.profiles other on other.company_id = me.company_id
     where me.id = auth.uid() and me.company_id is not null and other.id = p_user)
$$;

-- Colleagues visible to an employee/HR of the same company (name + role only).
create or replace function public.company_directory()
returns table (id uuid, full_name text, email text, role text, department text, avatar_url text)
language sql stable security definer set search_path = '' as $$
  select o.id, coalesce(o.full_name, split_part(o.email, '@', 1)),
         case when me.role = 'HR_ADMIN' then o.email end,
         o.role, o.department, o.avatar_url
    from public.profiles me
    join public.profiles o on o.company_id = me.company_id
   where me.id = auth.uid() and me.company_id is not null
     and o.role in ('EMPLOYEE', 'HR_ADMIN')
   order by 2
$$;

-- ---------------------------------------------------------------------------
-- Benefits policy + allowances (company wallet → employee wallets)
-- ---------------------------------------------------------------------------
create table public.benefit_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category text not null,
  label text not null,
  monthly_amount_usd numeric not null default 0 check (monthly_amount_usd >= 0 and monthly_amount_usd <= 10000),
  active boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid(),
  unique (company_id, category)
);
create trigger set_updated_date before update on public.benefit_policies
  for each row execute function public.set_updated_date();
alter table public.benefit_policies enable row level security;
create policy "benefit_policies: company read" on public.benefit_policies for select to authenticated
  using (company_id = (select public.my_company_id()) or (select public.is_admin()));
create policy "benefit_policies: HR write" on public.benefit_policies for all to authenticated
  using (((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())) or (select public.is_admin()))
  with check (((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())) or (select public.is_admin()));

create table public.allowance_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  employees int not null,
  total_usd numeric not null,
  run_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  unique (company_id, period)
);
alter table public.allowance_runs enable row level security;
create policy "allowance_runs: read" on public.allowance_runs for select to authenticated
  using (((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())) or (select public.is_admin()));

-- HR: distribute this month's allowances to every active employee, funded by
-- the company wallet. Once per month and per company.
create or replace function public.hr_distribute_allowances()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid := public.my_company_id();
  v_period text := to_char(now(), 'YYYY-MM');
  v_per_employee numeric;
  v_count int;
  v_total numeric;
  e record;
  p record;
begin
  if public.my_role() <> 'HR_ADMIN' or v_company is null then
    raise exception 'Réservé aux administrateurs RH' using errcode = '42501';
  end if;
  if exists (select 1 from public.allowance_runs where company_id = v_company and period = v_period) then
    raise exception 'Les allocations de % ont déjà été distribuées', v_period;
  end if;
  select coalesce(sum(monthly_amount_usd), 0) into v_per_employee
    from public.benefit_policies where company_id = v_company and active;
  if v_per_employee <= 0 then raise exception 'Aucune allocation active dans la politique d''avantages'; end if;
  select count(*) into v_count from public.profiles
   where company_id = v_company and role = 'EMPLOYEE' and onboarded;
  if v_count = 0 then raise exception 'Aucun employé actif'; end if;
  v_total := v_per_employee * v_count;

  update public.companies set wallet_balance = wallet_balance - v_total
   where id = v_company and wallet_balance >= v_total;
  if not found then
    raise exception 'Budget insuffisant : % USD requis', v_total using errcode = 'P0001';
  end if;

  for e in select id from public.profiles where company_id = v_company and role = 'EMPLOYEE' and onboarded loop
    update public.profiles set wallet_balance = wallet_balance + v_per_employee where id = e.id;
    for p in select category, label, monthly_amount_usd from public.benefit_policies
              where company_id = v_company and active and monthly_amount_usd > 0 loop
      insert into public.transactions (user_id, company_id, amount, amount_usd, currency, type, status, category,
                                       description, created_by_id)
      values (e.id, v_company, p.monthly_amount_usd, p.monthly_amount_usd, 'USD', 'ALLOCATION', 'COMPLETED',
              p.category, 'Allocation ' || p.label || ' — ' || v_period, auth.uid());
    end loop;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (e.id, 'REWARD', 'Allocations du mois reçues',
            v_per_employee || ' USD crédités par votre entreprise (' || v_period || ').', '/employee?section=wallet', auth.uid());
  end loop;

  insert into public.allowance_runs (company_id, period, employees, total_usd, run_by)
  values (v_company, v_period, v_count, v_total, auth.uid());
  return jsonb_build_object('ok', true, 'period', v_period, 'employees', v_count, 'total_usd', v_total);
end $$;

-- HR: one-off allocation/bonus to one employee from the company wallet.
create or replace function public.hr_allocate(p_user_id uuid, p_amount_usd numeric, p_label text default 'Bonus')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_company uuid := public.my_company_id();
begin
  if public.my_role() <> 'HR_ADMIN' or v_company is null then
    raise exception 'Réservé aux administrateurs RH' using errcode = '42501';
  end if;
  if p_amount_usd is null or p_amount_usd <= 0 or p_amount_usd > 10000 then raise exception 'Montant invalide'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id and company_id = v_company and role in ('EMPLOYEE', 'HR_ADMIN')) then
    raise exception 'Employé introuvable dans votre entreprise' using errcode = '42501';
  end if;
  update public.companies set wallet_balance = wallet_balance - p_amount_usd
   where id = v_company and wallet_balance >= p_amount_usd;
  if not found then raise exception 'Budget entreprise insuffisant'; end if;
  update public.profiles set wallet_balance = wallet_balance + p_amount_usd where id = p_user_id;
  insert into public.transactions (user_id, company_id, amount, amount_usd, currency, type, status, category, description, created_by_id)
  values (p_user_id, v_company, p_amount_usd, p_amount_usd, 'USD', 'ALLOCATION', 'COMPLETED', 'BONUS',
          left(coalesce(nullif(btrim(p_label), ''), 'Bonus'), 120), auth.uid());
  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (p_user_id, 'REWARD', 'Vous avez reçu une allocation',
          p_amount_usd || ' USD — ' || coalesce(nullif(btrim(p_label), ''), 'Bonus'), '/employee?section=wallet', auth.uid());
  return jsonb_build_object('ok', true);
end $$;

-- HR: remove an employee from the company (keeps their personal account).
create or replace function public.hr_remove_employee(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid := public.my_company_id();
begin
  if public.my_role() <> 'HR_ADMIN' or v_company is null then
    raise exception 'Réservé aux administrateurs RH' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then raise exception 'Vous ne pouvez pas vous retirer vous-même'; end if;
  update public.profiles
     set company_id = null, role = 'MEMBER', account_type = 'particulier', department = null
   where id = p_user_id and company_id = v_company and role in ('EMPLOYEE', 'HR_ADMIN');
  if not found then raise exception 'Employé introuvable dans votre entreprise' using errcode = '42501'; end if;
  update public.companies set seats_used = greatest(seats_used - 1, 0) where id = v_company;
  insert into public.notifications (user_id, type, title, body, created_by_id)
  values (p_user_id, 'SYSTEM', 'Accès entreprise retiré',
          'Votre compte reste actif en tant que particulier.', auth.uid());
end $$;

-- HR: set an employee's department (tenant-checked).
create or replace function public.hr_set_department(p_user_id uuid, p_department text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.my_role() <> 'HR_ADMIN' then raise exception 'Réservé aux administrateurs RH' using errcode = '42501'; end if;
  update public.profiles set department = nullif(left(btrim(p_department), 60), '')
   where id = p_user_id and company_id = public.my_company_id();
  if not found then raise exception 'Employé introuvable dans votre entreprise' using errcode = '42501'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Recognition wall (company-scoped kudos)
-- ---------------------------------------------------------------------------
create table public.recognitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  from_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  badge text not null default 'TEAM_PLAYER'
    check (badge in ('TEAM_PLAYER', 'INNOVATOR', 'CUSTOMER_HERO', 'LEADERSHIP', 'GOING_EXTRA_MILE', 'MENTOR')),
  message text not null check (char_length(message) between 3 and 500),
  points int not null default 10,
  created_date timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);
create index recognitions_company_idx on public.recognitions(company_id, created_date desc);
create index recognitions_to_user_idx on public.recognitions(to_user_id);
alter table public.recognitions enable row level security;
create policy "recognitions: company read" on public.recognitions for select to authenticated
  using (company_id = (select public.my_company_id()) or (select public.is_admin()));
create policy "recognitions: colleague insert" on public.recognitions for insert to authenticated
  with check (from_user_id = (select auth.uid())
              and company_id = (select public.my_company_id())
              and (select public.same_company(to_user_id)));
create policy "recognitions: author delete" on public.recognitions for delete to authenticated
  using (from_user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.recognition_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.points := public.setting_numeric('recognition_points', 10)::int;
  new.created_date := now();
  -- Anti-spam: one recognition per colleague per day.
  if exists (select 1 from public.recognitions where from_user_id = new.from_user_id and to_user_id = new.to_user_id
             and created_date > now() - interval '1 day') then
    raise exception 'Vous avez déjà reconnu ce collègue aujourd''hui';
  end if;
  return new;
end $$;
create trigger recognition_before_insert before insert on public.recognitions
  for each row execute function public.recognition_before_insert();

create or replace function public.recognition_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (new.to_user_id, 'REWARD', 'Vous avez été reconnu(e) !',
          coalesce((select full_name from public.profiles where id = new.from_user_id), 'Un collègue') || ' : ' || left(new.message, 140),
          '/recognition-wall', new.from_user_id);
  return new;
end $$;
create trigger recognition_after_insert after insert on public.recognitions
  for each row execute function public.recognition_after_insert();

-- ---------------------------------------------------------------------------
-- Support desk
-- ---------------------------------------------------------------------------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  subject text not null check (char_length(subject) between 3 and 160),
  category text not null default 'OTHER'
    check (category in ('ACCOUNT', 'PAYMENT', 'WALLET', 'OFFER', 'MERCHANT', 'TECHNICAL', 'OTHER')),
  priority text not null default 'NORMAL' check (priority in ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets(user_id, created_date desc);
create index support_tickets_status_idx on public.support_tickets(status, last_message_at desc);
create trigger set_updated_date before update on public.support_tickets
  for each row execute function public.set_updated_date();
alter table public.support_tickets enable row level security;
create policy "support_tickets: read" on public.support_tickets for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "support_tickets: create own" on public.support_tickets for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "support_tickets: update" on public.support_tickets for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.ticket_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.company_id := (select company_id from public.profiles where id = new.user_id);
    new.status := 'OPEN';
    new.assigned_to := null;
    return new;
  end if;
  if public.is_privileged_session() or public.is_admin() then return new; end if;
  -- Owners may only close or reopen their ticket.
  if new.subject is distinct from old.subject or new.category is distinct from old.category
     or new.priority is distinct from old.priority or new.assigned_to is distinct from old.assigned_to
     or new.user_id is distinct from old.user_id or new.company_id is distinct from old.company_id
     or new.status not in ('OPEN', 'CLOSED') then
    raise exception 'Seul le support peut modifier ce ticket' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger ticket_guard before insert or update on public.support_tickets
  for each row execute function public.ticket_guard();

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  is_staff boolean not null default false,
  created_date timestamptz not null default now()
);
create index ticket_messages_ticket_idx on public.ticket_messages(ticket_id, created_date);
alter table public.ticket_messages enable row level security;
create policy "ticket_messages: read" on public.ticket_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id
                 and (t.user_id = (select auth.uid()) or (select public.is_admin()))));
create policy "ticket_messages: write" on public.ticket_messages for insert to authenticated
  with check (author_id = (select auth.uid())
              and exists (select 1 from public.support_tickets t where t.id = ticket_id
                          and (t.user_id = (select auth.uid()) or (select public.is_admin()))));

create or replace function public.ticket_message_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare t public.support_tickets%rowtype;
begin
  select * into t from public.support_tickets where id = new.ticket_id;
  update public.ticket_messages set is_staff = public.is_admin() and new.author_id <> t.user_id where id = new.id;
  if public.is_admin() and new.author_id <> t.user_id then
    update public.support_tickets
       set last_message_at = now(), status = case when status = 'OPEN' then 'IN_PROGRESS' else status end,
           assigned_to = coalesce(assigned_to, new.author_id)
     where id = t.id;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'SYSTEM', 'Réponse du support', left(t.subject, 80) || ' : ' || left(new.body, 140),
            '/support-tickets?ticket=' || t.id, new.author_id);
  else
    update public.support_tickets
       set last_message_at = now(), status = case when status in ('RESOLVED', 'CLOSED') then 'OPEN' else status end
     where id = t.id;
  end if;
  return new;
end $$;
create trigger ticket_message_after_insert after insert on public.ticket_messages
  for each row execute function public.ticket_message_after_insert();

-- ---------------------------------------------------------------------------
-- Merchant KYC documents (private storage)
-- ---------------------------------------------------------------------------
create table public.merchant_documents (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  doc_type text not null check (doc_type in ('BUSINESS_REGISTRATION', 'TAX_ID', 'ID_DOCUMENT', 'PROOF_OF_ADDRESS', 'BANK_DETAILS', 'OTHER')),
  file_path text not null,
  file_name text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  uploaded_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index merchant_documents_merchant_idx on public.merchant_documents(merchant_id);
create trigger set_updated_date before update on public.merchant_documents
  for each row execute function public.set_updated_date();
alter table public.merchant_documents enable row level security;
create policy "merchant_documents: read" on public.merchant_documents for select to authenticated
  using (merchant_id = (select public.my_merchant_id()) or (select public.is_admin()));
create policy "merchant_documents: merchant upload" on public.merchant_documents for insert to authenticated
  with check (merchant_id = (select public.my_merchant_id())
              and split_part(file_path, '/', 1) = (select public.my_merchant_id())::text);
create policy "merchant_documents: merchant delete pending" on public.merchant_documents for delete to authenticated
  using ((merchant_id = (select public.my_merchant_id()) and status = 'PENDING') or (select public.is_admin()));
create policy "merchant_documents: admin review" on public.merchant_documents for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.merchant_document_reviewed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    select p.id, case when new.status = 'APPROVED' then 'SYSTEM' else 'ALERT' end,
           case when new.status = 'APPROVED' then 'Document validé' else 'Document refusé' end,
           new.doc_type || coalesce(' — ' || new.review_note, ''), '/kyc-verification', auth.uid()
      from public.profiles p where p.merchant_id = new.merchant_id;
  end if;
  return new;
end $$;
create trigger merchant_document_reviewed before update on public.merchant_documents
  for each row execute function public.merchant_document_reviewed();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-private', 'kyc-private', false, 10485760,
        array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "kyc-private: merchant upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc-private' and (storage.foldername(name))[1] = (select public.my_merchant_id())::text);
create policy "kyc-private: merchant or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'kyc-private' and ((storage.foldername(name))[1] = (select public.my_merchant_id())::text
                                        or (select public.is_admin())));
create policy "kyc-private: merchant or admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'kyc-private' and ((storage.foldername(name))[1] = (select public.my_merchant_id())::text
                                        or (select public.is_admin())));

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke execute on function public.same_company(uuid) from public, anon;
revoke execute on function public.company_directory() from public, anon;
revoke execute on function public.hr_distribute_allowances() from public, anon;
revoke execute on function public.hr_allocate(uuid, numeric, text) from public, anon;
revoke execute on function public.hr_remove_employee(uuid) from public, anon;
revoke execute on function public.hr_set_department(uuid, text) from public, anon;
grant execute on function public.same_company(uuid) to authenticated;
grant execute on function public.company_directory() to authenticated;
grant execute on function public.hr_distribute_allowances() to authenticated;
grant execute on function public.hr_allocate(uuid, numeric, text) to authenticated;
grant execute on function public.hr_remove_employee(uuid) to authenticated;
grant execute on function public.hr_set_department(uuid, text) to authenticated;
