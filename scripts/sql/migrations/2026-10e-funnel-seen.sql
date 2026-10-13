-- Count a locked Premium card only when a person actually sees it (2026-10-13).
-- Named 2026-10e so it sorts after 2026-10d-ref-tracking.sql. Idempotent.
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- The site works before it is applied (the new step is simply not counted);
-- schema.sql carries the same definitions (scripts/test/sql-migration.test.mjs).
--
-- Why: assets/premium.js used to count "gate-shown" whenever a page drew a
-- locked card, so dashboards and lesson pages that render one on load (and
-- crawlers) inflated the funnel: 759 "paywall views" in a week against 3
-- people opening Premium. The browser now counts a card only when half of it
-- has been on screen for a second after the visitor interacted with the page,
-- and splits two steps:
--   limit-hit   the student ran into a real limit (daily questions, free exam);
--   gate-shown  any other locked feature they looked at.
-- Numbers before 2026-10-13 are not comparable with numbers after it.

do $$
declare r record;
begin
  for r in select conname from pg_constraint
            where conrelid = 'public.premium_funnel'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%step%'
  loop
    execute format('alter table public.premium_funnel drop constraint %I', r.conname);
  end loop;
end
$$;
alter table public.premium_funnel
  add constraint premium_funnel_step_check
  check (step in ('gate-shown', 'limit-hit', 'interest', 'signin-for-checkout', 'checkout-start', 'checkout-paid'));

create or replace function public.count_premium_step(p_course text, p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem')
     or p_step is null or p_step not in ('gate-shown', 'limit-hit', 'interest', 'signin-for-checkout', 'checkout-start') then
    return;
  end if;
  insert into public.premium_funnel (course, step, n)
  values (p_course, p_step, 1)
  on conflict (day, course, step) do update set n = premium_funnel.n + 1
   where premium_funnel.n < 100000;
end;
$$;

revoke all on function public.count_premium_step(text, text) from public;
grant execute on function public.count_premium_step(text, text) to anon, authenticated;

create or replace function public.track_ref(p_ref text, p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text := lower(coalesce(p_ref, ''));
begin
  if not (v_ref ~ '^(tt|yt|ig)-[a-z0-9-]{1,40}$' or v_ref in ('push', 'email', 'share'))
     or p_step is null
     or p_step not in ('visit', 'gate-shown', 'limit-hit', 'interest', 'signin-for-checkout', 'checkout-start') then
    return;
  end if;
  if not exists (select 1 from public.ref_events e where e.day = current_date and e.ref = v_ref and e.step = p_step)
     and (select count(*) from public.ref_events e where e.day = current_date) >= 2000 then
    return;
  end if;
  insert into public.ref_events (day, ref, step, n)
  values (current_date, v_ref, p_step, 1)
  on conflict (day, ref, step) do update set n = ref_events.n + 1
   where ref_events.n < 100000;
end;
$$;

revoke all on function public.track_ref(text, text) from public;
grant execute on function public.track_ref(text, text) to anon, authenticated;
