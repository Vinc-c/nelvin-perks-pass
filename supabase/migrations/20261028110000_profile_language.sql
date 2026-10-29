-- The member's chosen interface language, so emails and other channels follow it.
alter table public.profiles add column if not exists language text
  check (language is null or language in ('en','fr','sw','ar','yo'));

create or replace function public.set_my_language(p_lang text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_lang not in ('en','fr','sw','ar','yo') then raise exception 'Unsupported language' using errcode = '22023'; end if;
  update public.profiles set language = p_lang where id = auth.uid();
end $$;
revoke execute on function public.set_my_language(text) from public, anon;
grant execute on function public.set_my_language(text) to authenticated;

-- Every queued email (welcome, reminders, notifications) uses the language the
-- member chose in the app, when they chose one.
create or replace function public.email_outbox_apply_language()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_lang text;
begin
  if new.user_id is not null then
    select language into v_lang from public.profiles where id = new.user_id;
    if v_lang is not null then new.lang := v_lang; end if;
  end if;
  return new;
end $$;
create trigger email_outbox_apply_language before insert on public.email_outbox
  for each row execute function public.email_outbox_apply_language();
