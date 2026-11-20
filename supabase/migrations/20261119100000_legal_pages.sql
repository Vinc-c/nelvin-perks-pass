-- Editable legal / info pages (Terms, Privacy, Cookies, Refunds, custom pages) with version history
-- and an optional email + in-app notice to every user who has already signed in.
create table if not exists public.legal_pages (
  slug text not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  lang text not null check (lang in ('en','fr')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) <= 100000),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (slug, lang)
);
alter table public.legal_pages enable row level security;
drop policy if exists "legal_pages: public read" on public.legal_pages;
create policy "legal_pages: public read" on public.legal_pages for select using (true);
drop policy if exists "legal_pages: admin delete" on public.legal_pages;
create policy "legal_pages: admin delete" on public.legal_pages for delete using ((select public.is_admin()));
revoke insert, update on public.legal_pages from anon, authenticated;

create table if not exists public.legal_page_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null, lang text not null, version int not null,
  title text not null, body text not null, summary text,
  changed_by uuid, created_date timestamptz not null default now()
);
alter table public.legal_page_versions enable row level security;
drop policy if exists "legal_page_versions: admin read" on public.legal_page_versions;
create policy "legal_page_versions: admin read" on public.legal_page_versions for select using ((select public.is_admin()));
create index if not exists legal_page_versions_slug_idx on public.legal_page_versions (slug, created_date desc);

create or replace function public.legal_notify_count() returns int
language sql stable security definer set search_path = '' as $$
  select case when public.is_admin() then
    (select count(*)::int from public.profiles p join auth.users u on u.id = p.id
      where u.last_sign_in_at is not null and p.email is not null)
  else 0 end
$$;

create or replace function public.admin_publish_legal(p_slug text, p_pages jsonb, p_summary jsonb default '{}'::jsonb, p_notify boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_ver int; v_lang text; v_page jsonb; v_notified int := 0; v_link text; v_title_en text; v_title_fr text;
  r record; v_l text; v_title text; v_body text;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  if p_slug !~ '^[a-z0-9-]{2,60}$' then raise exception 'Slug invalide'; end if;
  if p_pages is null or jsonb_typeof(p_pages) <> 'object' or p_pages = '{}'::jsonb then raise exception 'Aucun contenu'; end if;
  select coalesce(max(version), 0) + 1 into v_ver from public.legal_pages where slug = p_slug;

  for v_lang, v_page in select * from jsonb_each(p_pages) loop
    if v_lang not in ('en','fr') then raise exception 'Langue non supportée : %', v_lang; end if;
    if btrim(coalesce(v_page->>'title','')) = '' or btrim(coalesce(v_page->>'body','')) = '' then
      raise exception 'Titre et contenu requis (%)', v_lang;
    end if;
    insert into public.legal_pages (slug, lang, title, body, version, updated_at, updated_by)
    values (p_slug, v_lang, left(btrim(v_page->>'title'), 200), v_page->>'body', v_ver, now(), auth.uid())
    on conflict (slug, lang) do update
      set title = excluded.title, body = excluded.body, version = excluded.version,
          updated_at = excluded.updated_at, updated_by = excluded.updated_by;
    insert into public.legal_page_versions (slug, lang, version, title, body, summary, changed_by)
    values (p_slug, v_lang, v_ver, left(btrim(v_page->>'title'), 200), v_page->>'body', p_summary->>v_lang, auth.uid());
  end loop;

  if p_notify then
    v_link := case p_slug when 'terms' then '/terms' when 'privacy' then '/privacy' when 'cookies' then '/cookies'
                          when 'refund-policy' then '/refund-policy' else '/page/' || p_slug end;
    select title into v_title_en from public.legal_pages where slug = p_slug and lang = 'en';
    select title into v_title_fr from public.legal_pages where slug = p_slug and lang = 'fr';
    for r in
      select p.id, p.email, p.notif_email, coalesce(p.language, public.email_lang_for(p.country)) as lang
        from public.profiles p join auth.users u on u.id = p.id
       where u.last_sign_in_at is not null and p.email is not null
    loop
      v_l := case when r.lang = 'fr' then 'fr' else 'en' end;
      v_title := case when v_l = 'fr' then coalesce(v_title_fr, v_title_en, p_slug) || ' : mise à jour'
                      else coalesce(v_title_en, v_title_fr, p_slug) || ': updated' end;
      v_body := coalesce(nullif(btrim(p_summary->>v_l), ''), nullif(btrim(p_summary->>case when v_l = 'fr' then 'en' else 'fr' end), ''),
                  case when v_l = 'fr' then 'Nous avons mis à jour ce document.' else 'We have updated this document.' end)
                || case when v_l = 'fr' then E'\n\nConsultez la nouvelle version en ligne.' else E'\n\nRead the new version online.' end;
      -- in-app notice (its trigger also emails users who left email notifications on)
      insert into public.notifications (user_id, type, title, body, link, created_by_id)
      values (r.id, 'SYSTEM', v_title, v_body, v_link, auth.uid());
      -- legal notices reach everyone: users who muted email notifications get the email directly
      if not coalesce(r.notif_email, true) then
        perform public.enqueue_email(r.id, r.email, 'notification',
          jsonb_build_object('title', v_title, 'body', v_body, 'link', v_link, 'type', 'SYSTEM'), v_l);
      end if;
      v_notified := v_notified + 1;
    end loop;
  end if;

  perform public.audit('legal.publish', 'legal_pages', p_slug,
    jsonb_build_object('version', v_ver, 'langs', (select jsonb_agg(k) from jsonb_object_keys(p_pages) k), 'notified', v_notified));
  return jsonb_build_object('version', v_ver, 'notified', v_notified);
end $$;

revoke all on function public.legal_notify_count() from public, anon;
revoke all on function public.admin_publish_legal(text, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.legal_notify_count() to authenticated;
grant execute on function public.admin_publish_legal(text, jsonb, jsonb, boolean) to authenticated;
