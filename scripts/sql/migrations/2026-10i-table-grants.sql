-- 2026-10i: table grants and duplicate user_progress policies.
--
-- Supabase gives anon and authenticated every privilege on new tables in
-- public (including TRUNCATE, which RLS does not cover). RLS already blocked
-- every row, and the API never exposes TRUNCATE, so nothing was reachable;
-- this makes the grants say what the site actually does:
--
-- - anon touches no table directly (only the functions granted in schema.sql);
-- - authenticated reads, inserts and updates its own user_progress row
--   (assets/account.js) and nothing else;
-- - the Worker uses the service role, which keeps everything.
--
-- It also drops three dashboard-era user_progress policies ("Users can ...
-- own progress", role public) that duplicated the authenticated ones below.

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
grant select, insert, update on public.user_progress to authenticated;

drop policy if exists "Users can select own progress" on public.user_progress;
drop policy if exists "Users can insert own progress" on public.user_progress;
drop policy if exists "Users can update own progress" on public.user_progress;
