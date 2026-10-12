-- Video link tracking: which TikTok, YouTube or Instagram post sent a visitor,
-- and how far that visitor got (visit, sign-in to buy, checkout, paid).
-- Named 2026-10d so it sorts after 2026-10c-apchem.sql. Idempotent.
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- The site works before it is applied (the calls just do nothing); the counts
-- start the moment it is. schema.sql carries the same definitions
-- (scripts/test/sql-migration.test.mjs checks them word for word).
--
-- What it does:
--   1. ref_events: one row per day, ref and step, holding a count. No user,
--      browser id or IP, the same shape as premium_funnel and page_views.
--   2. track_ref(ref, step): the browser's only way in. Refs are the tags the
--      site already accepts (assets/analytics.js): tt-, yt-, ig- plus a topic,
--      or push, email, share. At most 2,000 rows a day.
--   3. track_ref_paid(ref): the Worker's, called from the paid webhook, so a
--      sale is counted where payment is a fact, never by a browser.
--   4. count_premium_step also accepts 'signin-for-checkout', the step between
--      choosing a pass and paying for a signed-out buyer.

-- ---------------------------------------------------------------------------
-- 1. The table
-- ---------------------------------------------------------------------------
create table if not exists public.ref_events (
  day  date not null default current_date,
  ref  text not null,
  step text not null,
  n    integer not null default 0,
  primary key (day, ref, step)
);

alter table public.ref_events enable row level security;

-- ---------------------------------------------------------------------------
-- 2. The browser counter
-- ---------------------------------------------------------------------------
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
     or p_step not in ('visit', 'gate-shown', 'interest', 'signin-for-checkout', 'checkout-start') then
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

-- ---------------------------------------------------------------------------
-- 3. The paid counter (Worker only)
-- ---------------------------------------------------------------------------
create or replace function public.track_ref_paid(p_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text := lower(coalesce(p_ref, ''));
begin
  if not (v_ref ~ '^(tt|yt|ig)-[a-z0-9-]{1,40}$' or v_ref in ('push', 'email', 'share')) then
    return;
  end if;
  insert into public.ref_events (day, ref, step, n)
  values (current_date, v_ref, 'paid', 1)
  on conflict (day, ref, step) do update set n = ref_events.n + 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. The funnel step for signed-out buyers
-- ---------------------------------------------------------------------------
-- The table's step check is dropped whatever it is called, then re-added.
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
  check (step in ('gate-shown', 'interest', 'signin-for-checkout', 'checkout-start', 'checkout-paid'));

create or replace function public.count_premium_step(p_course text, p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem')
     or p_step is null or p_step not in ('gate-shown', 'interest', 'signin-for-checkout', 'checkout-start') then
    return;
  end if;
  insert into public.premium_funnel (course, step, n)
  values (p_course, p_step, 1)
  on conflict (day, course, step) do update set n = premium_funnel.n + 1
   where premium_funnel.n < 100000;
end;
$$;

-- ---------------------------------------------------------------------------
-- The grants
-- ---------------------------------------------------------------------------
revoke all on function public.track_ref(text, text) from public;
grant execute on function public.track_ref(text, text) to anon, authenticated;
revoke all on function public.track_ref_paid(text) from public, anon, authenticated;
grant execute on function public.track_ref_paid(text) to service_role;
grant execute on function public.count_premium_step(text, text) to anon, authenticated;
