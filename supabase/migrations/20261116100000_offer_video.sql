-- Optional short looping video shown in the sponsored reel on the member Home.
alter table public.offers add column if not exists video_url text;
