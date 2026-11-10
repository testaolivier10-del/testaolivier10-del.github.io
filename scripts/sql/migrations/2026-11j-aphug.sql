-- AP® Human Geography (course key aphug): the database half of registering the
-- course (docs/aphug-spec.md, Phase 0). Named 2026-11j-aphug.sql so it sorts after
-- 2026-11i-apmicro.sql (AP® Microeconomics), whose course lists it extends:
-- migrations run, and are compared with schema.sql, in file-name order.
-- AP® Microeconomics was not on this branch when this was written, so the lists
-- here end 'apmacro', 'aphug'; when both are merged, add 'apmicro' before
-- 'aphug' here and in schema.sql. NOT APPLIED anywhere yet.
--
-- Run once, BEFORE the AP® Human Geography pass goes on sale: Supabase dashboard ->
-- SQL Editor -> New query -> paste -> Run. Needs every migration before it first.
-- Idempotent: every check constraint is dropped and re-added, every function is
-- create-or-replace, so running it twice changes nothing the second time.
-- schema.sql carries the same definitions (scripts/test/sql-migration.test.mjs
-- checks them word for word).
--
-- What it does:
--   1. Adds 'aphug' to the course check on premium_passes, premium_funnel, exam_completions.
--   2. Adds 'aphug' to every function with a course list: report_question, join_waitlist, count_premium_step, premium_add_pass, record_exam_completion, count_premium_paid,
--      teach_create_class, teach_save_question, free_usage_course_ok.
--      The signatures are unchanged, so the grants from earlier migrations
--      still apply; they are repeated at the end anyway.

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
  add constraint premium_passes_course_check check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug'));

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
  add constraint premium_funnel_course_check check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug'));

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
  add constraint exam_completions_course_check check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug'));

-- ---------------------------------------------------------------------------
-- 2. Functions with a course list
-- ---------------------------------------------------------------------------

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
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug') then
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
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug') then
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
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug')
     or p_step is null or p_step not in ('gate-shown', 'limit-hit', 'interest', 'signin-for-checkout', 'checkout-start') then
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
  if p_user is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug')
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
  if v_uid is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug')
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
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'aphug') then
    return;
  end if;
  insert into public.premium_funnel (course, step, n)
  values (p_course, 'checkout-paid', 1)
  on conflict (day, course, step) do update set n = premium_funnel.n + 1;
end;
$$;



create or replace function public.teach_create_class(p_course text, p_name text, p_unit_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classes;
begin
  if auth.uid() is null then return null; end if;
  if not exists (select 1 from public.teacher_profiles where user_id = auth.uid()) then return null; end if;
  -- The ten AP® courses, EMT (nremt), organic chemistry (ochem) and A&P (anp).
  if p_course !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|aphug|nremt|ochem|anp)$' then return null; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 60 then return null; end if;
  if (select count(*) from public.classes where teacher_id = auth.uid() and not archived) >= 30 then return null; end if;
  insert into public.classes (teacher_id, course, name, code, unit_order)
  values (auth.uid(), p_course, btrim(p_name), public.class_new_code(),
          case when jsonb_typeof(p_unit_order) = 'array' then p_unit_order else '[]'::jsonb end)
  returning * into c;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

create or replace function public.teach_save_question(p_id uuid, p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  n integer;
begin
  if auth.uid() is null then return null; end if;
  if not exists (select 1 from public.teacher_profiles where user_id = auth.uid()) then return null; end if;
  if coalesce(p_data->>'course', '') !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|aphug|nremt|ochem|anp)$' then return null; end if;
  if length(coalesce(p_data->>'q', '')) not between 1 and 2000 then return null; end if;
  if jsonb_typeof(p_data->'options') <> 'array' then return null; end if;
  n := jsonb_array_length(p_data->'options');
  if n not between 2 and 6 or octet_length((p_data->'options')::text) > 4000 then return null; end if;
  if exists (select 1 from jsonb_array_elements(p_data->'options') o where jsonb_typeof(o) <> 'string' or length(o #>> '{}') not between 1 and 500) then return null; end if;
  if jsonb_typeof(p_data->'correct') <> 'number' or (p_data->>'correct') !~ '^[0-5]$' or (p_data->>'correct')::integer >= n then return null; end if;
  if length(coalesce(p_data->>'why', '')) > 2000 then return null; end if;
  if coalesce(p_data->>'topic', '') <> '' and p_data->>'topic' !~ '^[a-z0-9][a-z0-9-]{0,79}$' then return null; end if;
  if coalesce(p_data->>'unit', '') <> '' and p_data->>'unit' !~ '^[a-z0-9][a-z0-9-]{0,79}$' then return null; end if;
  if p_id is null then
    if (select count(*) from public.class_questions where teacher_id = auth.uid()) >= 1000 then return null; end if;
    insert into public.class_questions (teacher_id, course, topic, unit, q, options, correct, why)
    values (auth.uid(), p_data->>'course', nullif(p_data->>'topic', ''), nullif(p_data->>'unit', ''), p_data->>'q',
            p_data->'options', (p_data->>'correct')::integer, nullif(p_data->>'why', ''))
    returning id into v_id;
  else
    update public.class_questions
       set course = p_data->>'course', topic = nullif(p_data->>'topic', ''), unit = nullif(p_data->>'unit', ''), q = p_data->>'q',
           options = p_data->'options', correct = (p_data->>'correct')::integer, why = nullif(p_data->>'why', ''), updated_at = now()
     where id = p_id and teacher_id = auth.uid()
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.free_usage_course_ok(p_course text)
returns boolean language sql immutable as $$
  select p_course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych',
                      'apprecalc', 'apcalcbc', 'apmacro', 'aphug');
$$;

grant execute on function public.report_question(text, text, text, text) to anon, authenticated;
grant execute on function public.join_waitlist(text, text, text) to anon, authenticated;
grant execute on function public.count_premium_step(text, text) to anon, authenticated;
grant execute on function public.record_exam_completion(text, integer) to authenticated;
grant execute on function public.teach_create_class(text, text, jsonb) to authenticated;
grant execute on function public.teach_save_question(uuid, jsonb) to authenticated;
