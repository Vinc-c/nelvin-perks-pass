-- The previous platform left a full copy of its old source code in the
-- database (table nelvin_source_files). It is not application data and must
-- not be kept: drop it wherever it is (public before the archive migration
-- ran, legacy after).
drop table if exists legacy.nelvin_source_files;
drop table if exists public.nelvin_source_files;
