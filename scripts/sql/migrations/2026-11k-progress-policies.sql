-- user_progress carried two sets of policies: the first ones, made by hand in
-- the dashboard ("Users can ... own progress", for role public, calling
-- auth.uid() once per row), and the ones schema.sql creates
-- (user_progress_*_own, for authenticated, calling it once per query). Every
-- read and write ran both. The old three are dropped; schema.sql never had
-- them, so the database now matches it (site health 2026-11-10, Supabase
-- performance advisors: auth_rls_initplan, multiple_permissive_policies).
-- Safe to run again.
drop policy if exists "Users can select own progress" on public.user_progress;
drop policy if exists "Users can insert own progress" on public.user_progress;
drop policy if exists "Users can update own progress" on public.user_progress;
