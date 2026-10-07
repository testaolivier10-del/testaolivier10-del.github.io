-- AP® Chemistry (course key apchem): the database half of registering the course
-- (docs/apchem-spec.md, the owner checklist). Named 2026-10c so it sorts after
-- 2026-10b-apbio.sql: migrations run, and are compared with schema.sql, in
-- file-name order. NOT APPLIED anywhere yet.
--
-- Run once, BEFORE the AP® Chemistry pass goes on sale: Supabase dashboard ->
-- SQL Editor -> New query -> paste -> Run. Needs 2026-10b-apbio.sql first.
-- Idempotent: every check constraint is dropped and re-added, every function
-- is create-or-replace, so running it twice changes nothing the second time.
-- schema.sql carries the same definitions (scripts/test/sql-migration.test.mjs
-- checks them word for word).
--
-- What it does:
--   1. Adds 'apchem' to the course check on premium_passes, premium_funnel and
--      exam_completions.
--   2. Adds 'apchem' to every function with a course list: report_question,
--      join_waitlist, count_premium_step, premium_add_pass,
--      record_exam_completion, count_premium_paid. premium_add_pass keeps the
--      p_until parameter 2026-10b added (the AP® Chemistry pass, like AP®
--      Biology's, runs through June 30, 2027 whenever it is bought).

-- ---------------------------------------------------------------------------
-- 1. Course checks
-- ---------------------------------------------------------------------------
-- Each table's check on course is dropped whatever it is called (created
-- inline, Postgres named it <table>_course_check), then re-added by that name.

do $$
declare r record;
begin
  for r in select conname from pg_constraint
            where conrelid = 'public.premium_passes'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%course%'
  loop
    execute format('alter table public.premium_passes drop constraint %I', r.conname);
  end loop;
end
$$;
alter table public.premium_passes
  add constraint premium_passes_course_check check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem'));

do $$
declare r record;
begin
  for r in select conname from pg_constraint
            where conrelid = 'public.premium_funnel'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%course%'
  loop
    execute format('alter table public.premium_funnel drop constraint %I', r.conname);
  end loop;
end
$$;
alter table public.premium_funnel
  add constraint premium_funnel_course_check check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem'));

do $$
declare r record;
begin
  for r in select conname from pg_constraint
            where conrelid = 'public.exam_completions'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%course%'
  loop
    execute format('alter table public.exam_completions drop constraint %I', r.conname);
  end loop;
end
$$;
alter table public.exam_completions
  add constraint exam_completions_course_check check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem'));

-- ---------------------------------------------------------------------------
-- 2. and 3. Functions with a course list
-- ---------------------------------------------------------------------------

drop function if exists public.premium_add_pass(uuid, text, text, integer, text, integer, timestamptz, text, text);

create or replace function public.report_question(
  p_course text,
  p_question_id text,
  p_reason text,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Validated here rather than trusted from the browser. This function is
  -- reachable by anyone who can open the site, so the only things that stop it
  -- becoming a free text-storage service are these bounds.
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem') then
    raise exception 'unknown course';
  end if;
  if p_reason not in ('wrong-answer', 'unclear', 'typo', 'outdated', 'other') then
    raise exception 'unknown reason';
  end if;
  if p_question_id is null or length(p_question_id) > 120 then
    raise exception 'bad question id';
  end if;
  -- 500 reports a day in all, and 10 a day about any one question.
  if (select count(*) from public.question_reports r
       where r.created_at > now() - interval '1 day') >= 500
     or (select count(*) from public.question_reports r
          where r.course = p_course and r.question_id = p_question_id
            and r.created_at > now() - interval '1 day') >= 10 then
    return;
  end if;

  insert into public.question_reports (course, question_id, reason, note)
  values (p_course, p_question_id, p_reason, nullif(left(coalesce(p_note, ''), 1000), ''));
end;
$$;

create or replace function public.join_waitlist(
  p_course text,
  p_email text,
  p_source text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem') then
    raise exception 'unknown course';
  end if;
  if p_email is null or length(p_email) > 254
     or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'bad email';
  end if;
  -- 500 sign-ups a day; past that it is not people.
  if (select count(*) from public.premium_waitlist w
       where w.created_at > now() - interval '1 day') >= 500 then
    return;
  end if;

  insert into public.premium_waitlist (course, email, source)
  values (p_course, btrim(p_email), nullif(left(coalesce(p_source, ''), 40), ''))
  on conflict (course, lower(email)) do nothing;
end;
$$;

create or replace function public.count_premium_step(p_course text, p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem')
     or p_step is null or p_step not in ('gate-shown', 'interest', 'checkout-start') then
    return;
  end if;
  insert into public.premium_funnel (course, step, n)
  values (p_course, p_step, 1)
  on conflict (day, course, step) do update set n = premium_funnel.n + 1
   where premium_funnel.n < 100000;
end;
$$;

create or replace function public.premium_add_pass(
  p_user uuid,
  p_course text,
  p_pass text,
  p_days integer,
  p_order_id text default null,
  p_amount_cents integer default null,
  p_order_created_at timestamptz default null,
  p_customer_id text default null,
  p_funded_by text default null,
  p_until timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest timestamptz;
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_user is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem')
     or p_pass is null or p_days is null or p_days < 1 or p_days > 400
     or (p_until is not null and p_until > now() + interval '400 days') then
    raise exception 'bad pass';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('premium_passes:' || p_user::text, 0));
  if p_order_id is not null
     and exists (select 1 from public.premium_passes p where p.order_id = p_order_id) then
    return jsonb_build_object('inserted', false);
  end if;
  select max(p.expires_at) into v_latest
    from public.premium_passes p
   where p.user_id = p_user and p.course = p_course and p.refunded_at is null;
  v_start := greatest(now(), coalesce(v_latest, now()));
  v_end := v_start + make_interval(days => p_days);
  -- A fixed-date pass (p_until, e.g. AP® Biology's "through June 30, 2027")
  -- runs at least to its date, whenever it was bought.
  if p_until is not null and p_until > v_end then
    v_end := p_until;
  end if;
  insert into public.premium_passes
    (user_id, course, pass, starts_at, expires_at, order_id, amount_cents,
     order_created_at, customer_id, funded_by)
  values
    (p_user, p_course, p_pass, v_start, v_end, p_order_id, p_amount_cents,
     coalesce(p_order_created_at, now()), p_customer_id, p_funded_by);
  return jsonb_build_object('inserted', true, 'starts_at', v_start, 'expires_at', v_end);
end;
$$;

create or replace function public.record_exam_completion(p_course text, p_questions integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem')
     or p_questions is null or p_questions < 1 or p_questions > 300 then
    return false;
  end if;
  -- A full exam takes far longer than this. Two finishes closer together are
  -- one exam reported twice, or a script.
  if exists (select 1 from public.exam_completions e
              where e.user_id = v_uid and e.course = p_course
                and e.finished_at > now() - interval '20 minutes') then
    return false;
  end if;
  if (select count(*) from public.exam_completions e
       where e.user_id = v_uid and e.finished_at > now() - interval '1 day') >= 12 then
    return false;
  end if;
  insert into public.exam_completions (user_id, course, questions)
  values (v_uid, p_course, p_questions);
  return true;
end;
$$;

create or replace function public.count_premium_paid(p_course text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem') then
    return;
  end if;
  insert into public.premium_funnel (course, step, n)
  values (p_course, 'checkout-paid', 1)
  on conflict (day, course, step) do update set n = premium_funnel.n + 1;
end;
$$;

-- The grants. create or replace keeps a function's grants; premium_add_pass
-- is new (one more argument), so it gets the service role's again and nobody
-- else's (Worker only, as in 2026-10-audit.sql).
revoke all on function public.premium_add_pass(uuid, text, text, integer, text, integer, timestamptz, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.premium_add_pass(uuid, text, text, integer, text, integer, timestamptz, text, text, timestamptz) to service_role;
grant execute on function public.report_question(text, text, text, text) to anon, authenticated;
grant execute on function public.join_waitlist(text, text, text) to anon, authenticated;
grant execute on function public.count_premium_step(text, text) to anon, authenticated;
grant execute on function public.record_exam_completion(text, integer) to authenticated;
