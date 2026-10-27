-- Email language: English is the main language. French only for francophone
-- countries, Swahili for Tanzania, Arabic for Egypt. Accepts ISO codes and the
-- canonical French country names stored in profiles.country.
create or replace function public.email_lang_for(p_country text) returns text
language sql immutable set search_path = '' as $$
  select case
    when lower(btrim(coalesce(p_country, ''))) in (
      'fr','cm','ci','sn','ml','bf','ne','tg','bj','gn','ga','cg','cd','cf','td','dz','tn','ma','mg','bi','dj','km','mr','ht',
      'cameroun','côte d''ivoire','cote d''ivoire','sénégal','senegal','mali','burkina faso','niger','togo','bénin','benin',
      'guinée','guinee','gabon','congo','république du congo','république démocratique du congo','rdc',
      'république centrafricaine','tchad','algérie','algerie','tunisie','maroc','madagascar','burundi','djibouti',
      'comores','mauritanie','france','belgique','suisse'
    ) then 'fr'
    when lower(btrim(coalesce(p_country, ''))) in ('tz','tanzanie') then 'sw'
    when lower(btrim(coalesce(p_country, ''))) in ('eg','égypte','egypte','sa','ae') then 'ar'
    else 'en' end;
$$;
