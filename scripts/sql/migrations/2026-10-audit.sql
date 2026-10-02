-- The October 2026 site audit, database half (docs/site-audit-2026-10.md,
-- "Payments, security and data", and Fix-first 4 and 9).
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Idempotent like schema.sql: every statement is if-not-exists, create-or-
-- replace, or guarded, so running it twice changes nothing the second time.
-- schema.sql carries the same definitions (scripts/test/sql-migration.test.mjs
-- checks every function here is word for word the one in schema.sql), so a
-- fresh project gets all of this from schema.sql alone.
--
-- What it does, in order:
--   1. Premium passes: a queued pass counts only from its start; a refund
--      re-chains the passes queued behind it and takes back a guarantee it
--      paid for; passes are created by one function under a lock; the
--      order's own time and Polar customer are stored.
--   2. Exam completions stamped by the database, for the pass guarantee.
--   3. The Premium funnel: the browser can no longer count a payment.
--   4. Reminders: push hosts allowlisted, send times clamped, links kept on
--      this site, and a failure counter so a dead row is dropped.
--   5. user_progress and page_views: the DDL and RLS that were never
--      committed, a size cap on progress, and the counter's real column.
--   6. Per-day caps on everything anonymous callers can write.
--   7. EXECUTE revoked from anon and authenticated on every function, and
--      by default on future ones; re-granted only where the browser calls.

-- pgcrypto, for digest() below. Supabase ships it in `extensions`.
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. Premium passes
-- ---------------------------------------------------------------------------

-- When Polar created the order (the refund window is measured from it, not
-- from when this row was written, which the hourly reconcile can do up to 48
-- hours late), Polar's customer id (a second key for the once-per-person
-- refund), and for a guarantee extension, the order whose pass it extends.
alter table public.premium_passes add column if not exists order_created_at timestamptz;
alter table public.premium_passes add column if not exists customer_id text;
alter table public.premium_passes add column if not exists funded_by text;

create index if not exists premium_passes_user_start_idx
  on public.premium_passes (user_id, course, starts_at);

-- Move every pass that has not started yet so the queue has no gaps and no
-- overlaps: the first starts when the running pass ends (or now, if none is
-- running), each next one when the previous ends. Each keeps its length.
-- Called after a refund; safe to run by hand for one user and course.
create or replace function public.premium_rechain(p_user uuid, p_course text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cursor timestamptz;
  v_len interval;
  r record;
begin
  select max(p.expires_at) into v_cursor
    from public.premium_passes p
   where p.user_id = p_user and p.course = p_course and p.refunded_at is null
     and p.starts_at <= now() and p.expires_at > now();
  v_cursor := coalesce(v_cursor, now());
  for r in
    select p.id, p.starts_at, p.expires_at
      from public.premium_passes p
     where p.user_id = p_user and p.course = p_course and p.refunded_at is null
       and p.starts_at > now()
     order by p.starts_at, p.id
  loop
    v_len := r.expires_at - r.starts_at;
    update public.premium_passes
       set starts_at = v_cursor, expires_at = v_cursor + v_len
     where id = r.id;
    v_cursor := v_cursor + v_len;
  end loop;
end;
$$;

-- The one way a pass is created (worker/src/premium.js: purchases from the
-- webhook and the reconcile, and guarantee extensions). Under a per-user
-- advisory lock, so the webhook and the reconcile landing on the same order,
-- or a purchase racing a guarantee claim, cannot both read "the latest pass
-- ends on X" and stack two passes on the same days. A known order id is a
-- no-op, so a redelivered webhook adds nothing.
create or replace function public.premium_add_pass(
  p_user uuid,
  p_course text,
  p_pass text,
  p_days integer,
  p_order_id text default null,
  p_amount_cents integer default null,
  p_order_created_at timestamptz default null,
  p_customer_id text default null,
  p_funded_by text default null
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
  if p_user is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp')
     or p_pass is null or p_days is null or p_days < 1 or p_days > 400 then
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
  insert into public.premium_passes
    (user_id, course, pass, starts_at, expires_at, order_id, amount_cents,
     order_created_at, customer_id, funded_by)
  values
    (p_user, p_course, p_pass, v_start, v_end, p_order_id, p_amount_cents,
     coalesce(p_order_created_at, now()), p_customer_id, p_funded_by);
  return jsonb_build_object('inserted', true, 'starts_at', v_start, 'expires_at', v_end);
end;
$$;

-- A full refund (Polar's order.refunded, the self-serve refund, a lost
-- dispute). Marks the order's pass refunded, takes back a guarantee
-- extension it paid for (or, for an extension recorded before funded_by
-- existed, one left with no unrefunded bought pass at all), then re-chains
-- what was queued behind it. Before this, two passes plus one refund, or a
-- guarantee plus a refund, kept up to 180 days for one payment or none.
-- Returns how many bought passes it marked (0 when already refunded).
create or replace function public.premium_refund_order(p_order_id text, p_at timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_course text;
  v_changed integer;
begin
  select p.user_id, p.course into v_user, v_course
    from public.premium_passes p where p.order_id = p_order_id;
  if v_user is null then
    return 0;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('premium_passes:' || v_user::text, 0));
  update public.premium_passes p
     set refunded_at = p_at
   where p.order_id = p_order_id and p.refunded_at is null;
  get diagnostics v_changed = row_count;
  update public.premium_passes g
     set refunded_at = p_at
   where g.user_id = v_user and g.course = v_course and g.pass = 'guarantee'
     and g.refunded_at is null
     and (g.funded_by = p_order_id
          or (g.funded_by is null and not exists (
                select 1 from public.premium_passes b
                 where b.user_id = v_user and b.course = v_course
                   and b.order_id is not null and b.refunded_at is null)));
  perform public.premium_rechain(v_user, v_course);
  return v_changed;
end;
$$;

-- The signed-in user's live access: per course, the end of the run of
-- unrefunded passes that has already started. A pass queued for later counts
-- from its own start (it used to count at once: max(expires_at) over every
-- pass), and a run of back-to-back passes reports its last day so the
-- browser does not lock between two of them. Nothing about anyone else.
create or replace function public.my_premium()
returns table (course text, expires_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_course text;
  v_end timestamptz;
  v_next timestamptz;
  i integer;
begin
  if v_uid is null then
    return;
  end if;
  for v_course in
    select distinct p.course from public.premium_passes p
     where p.user_id = v_uid and p.refunded_at is null
       and p.starts_at <= now() and p.expires_at > now()
  loop
    select max(p.expires_at) into v_end from public.premium_passes p
     where p.user_id = v_uid and p.course = v_course and p.refunded_at is null
       and p.starts_at <= now() and p.expires_at > now();
    for i in 1..50 loop
      select max(p.expires_at) into v_next from public.premium_passes p
       where p.user_id = v_uid and p.course = v_course and p.refunded_at is null
         and p.starts_at <= v_end + interval '1 minute' and p.expires_at > v_end;
      exit when v_next is null;
      v_end := v_next;
    end loop;
    course := v_course;
    expires_at := v_end;
    return next;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Exam completions, stamped by the database
--
-- The NREMT pass guarantee needs "two full timed exams during the pass".
-- That used to be read from the synced exam history, which the student's
-- own browser writes, dates included. These rows are written only by
-- record_exam_completion(), with the database's clock, at most one per
-- twenty minutes. Deleted with the account (foreign key).
-- ---------------------------------------------------------------------------
create table if not exists public.exam_completions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  course      text not null check (course in ('nremt', 'ochem', 'anp')),
  questions   integer not null check (questions between 1 and 300),
  finished_at timestamptz not null default now()
);

create index if not exists exam_completions_user_idx
  on public.exam_completions (user_id, course, finished_at desc);

alter table public.exam_completions enable row level security;

create or replace function public.record_exam_completion(p_course text, p_questions integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp')
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

-- ---------------------------------------------------------------------------
-- 3. The Premium funnel
--
-- checkout-paid is counted by the Worker when Polar's webhook records a
-- payment (count_premium_paid, service role only). A browser can still count
-- the three steps it actually sees, capped per day so a script cannot make
-- the numbers meaningless.
-- ---------------------------------------------------------------------------
create or replace function public.count_premium_step(p_course text, p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp')
     or p_step is null or p_step not in ('gate-shown', 'interest', 'checkout-start') then
    return;
  end if;
  insert into public.premium_funnel (course, step, n)
  values (p_course, p_step, 1)
  on conflict (day, course, step) do update set n = premium_funnel.n + 1
   where premium_funnel.n < 100000;
end;
$$;

create or replace function public.count_premium_paid(p_course text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp') then
    return;
  end if;
  insert into public.premium_funnel (course, step, n)
  values (p_course, 'checkout-paid', 1)
  on conflict (day, course, step) do update set n = premium_funnel.n + 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Reminders
--
-- Anyone could insert a push row with any https URL and a next_send_at in
-- 1970, and a row whose sends kept failing kept its slot at the front of the
-- queue forever. Now: the endpoint must belong to a real browser push
-- service; the time is clamped to [now, now + 8 days]; the link is a path on
-- this site; and the Worker counts failures, backs off, and deletes the row
-- after five (worker/src/reminders.js and email.js).
-- ---------------------------------------------------------------------------
alter table public.push_subscriptions add column if not exists failures integer not null default 0;
alter table public.email_reminders add column if not exists failures integer not null default 0;

create or replace function public.save_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_next_send_at timestamptz,
  p_title text,
  p_body text,
  p_url text
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  key text;
  v_next timestamptz;
  v_url text;
begin
  if p_endpoint is null or length(p_endpoint) < 20 or length(p_endpoint) > 1000 then
    raise exception 'bad endpoint';
  end if;
  -- The push services browsers actually use: Chrome/Edge/Opera (FCM),
  -- Firefox (Mozilla autopush), Safari (Apple), legacy Edge (WNS).
  if p_endpoint !~ '^https://(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/' then
    raise exception 'bad endpoint';
  end if;
  if p_p256dh is null or length(p_p256dh) > 200 or p_auth is null or length(p_auth) > 100 then
    raise exception 'bad keys';
  end if;

  key := encode(extensions.digest(p_endpoint, 'sha256'), 'hex');

  -- At most this many new browsers a day; an existing row can always update.
  if not exists (select 1 from public.push_subscriptions s where s.id = key)
     and (select count(*) from public.push_subscriptions s
           where s.created_at > now() - interval '1 day') >= 2000 then
    return;
  end if;

  v_next := case when p_next_send_at is null then null
                 else least(greatest(p_next_send_at, now()), now() + interval '8 days') end;
  -- A path on this site, never another site: the notification opens it.
  v_url := case when p_url ~ '^/([^/\\]|$)' then left(p_url, 200) else '/' end;

  insert into public.push_subscriptions
    (id, endpoint, p256dh, auth, user_id, next_send_at, title, body, url, unanswered, failures)
  values (
    key, p_endpoint, p_p256dh, p_auth, auth.uid(), v_next,
    left(coalesce(nullif(p_title, ''), 'Time to study'), 80),
    left(coalesce(nullif(p_body, ''), 'You have work waiting.'), 200),
    v_url,
    -- Zeroed on every update, because an update is proof the student came
    -- back: it is written from a page they are looking at.
    0, 0
  )
  on conflict (id) do update set
    p256dh       = excluded.p256dh,
    auth         = excluded.auth,
    user_id      = coalesce(excluded.user_id, public.push_subscriptions.user_id),
    next_send_at = excluded.next_send_at,
    title        = excluded.title,
    body         = excluded.body,
    url          = excluded.url,
    unanswered   = 0,
    failures     = 0;
end;
$$;

create or replace function public.save_email_reminder(
  p_next_send_at timestamptz,
  p_title text,
  p_body text,
  p_url text
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  addr text;
  v_next timestamptz;
  v_url text;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  select email into addr from auth.users where id = uid;
  if addr is null then
    raise exception 'no address on this account';
  end if;

  v_next := case when p_next_send_at is null then null
                 else least(greatest(p_next_send_at, now()), now() + interval '8 days') end;
  v_url := case when p_url ~ '^/([^/\\]|$)' then left(p_url, 200) else '/' end;

  insert into public.email_reminders (user_id, email, next_send_at, title, body, url, unanswered, failures)
  values (
    uid, addr, v_next,
    left(coalesce(nullif(p_title, ''), 'Time to study'), 80),
    left(coalesce(nullif(p_body, ''), 'You have work waiting.'), 200),
    v_url,
    0, 0
  )
  on conflict (user_id) do update set
    -- The address is re-read from auth.users every time rather than trusted
    -- from the row: somebody who changes their email should not keep getting
    -- mail at the old one.
    email        = excluded.email,
    next_send_at = excluded.next_send_at,
    title        = excluded.title,
    body         = excluded.body,
    url          = excluded.url,
    unanswered   = 0,
    failures     = 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. user_progress and page_views
--
-- Both tables predate this file and lived only in the dashboard. This is
-- their shape as the site uses it (assets/account.js), created only where
-- missing, so it changes nothing on the live project except what follows
-- each table.
-- ---------------------------------------------------------------------------

-- One row per account: { v: 2, ns: { hub, nremt, ochem, anp } }. The
-- browser reads and writes its own row directly, so RLS here has policies
-- (own row only), unlike every write-only table in schema.sql.
create table if not exists public.user_progress (
  id         uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists user_progress_select_own on public.user_progress;
create policy user_progress_select_own on public.user_progress
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists user_progress_insert_own on public.user_progress;
create policy user_progress_insert_own on public.user_progress
  for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists user_progress_update_own on public.user_progress;
create policy user_progress_update_own on public.user_progress
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke all on public.user_progress from anon;

-- Progress is a few hundred KB at most; 2 MB keeps one account from turning
-- the table into free storage. NOT VALID: checked on every write from now
-- on, without failing the migration over a row that is already larger.
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'user_progress_data_size'
                    and conrelid = 'public.user_progress'::regclass) then
    alter table public.user_progress
      add constraint user_progress_data_size check (octet_length(data::text) <= 2000000) not valid;
  end if;
end;
$$;

-- The anonymous page counter: one row per path per day. RLS on, no
-- policies; track_pageview() is the only way in (scripts/sql/pageviews.sql
-- reads it from the SQL editor).
create table if not exists public.page_views (
  path  text not null,
  day   date not null default current_date,
  views integer not null default 0,
  primary key (path, day)
);

-- An early version named the column `count`; everything here says views.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'page_views' and column_name = 'count')
     and not exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'page_views' and column_name = 'views') then
    alter table public.page_views rename column count to views;
  end if;
end;
$$;

-- What ON CONFLICT (path, day) below needs, whatever the live key is.
create unique index if not exists page_views_path_day_idx on public.page_views (path, day);

alter table public.page_views enable row level security;

-- ---------------------------------------------------------------------------
-- 6. Per-day caps on what anonymous callers can write
--
-- These functions are reachable by anyone who can open the site. Validation
-- already kept each row small; the caps keep the number of rows small too,
-- so a script cannot fill a table or bury the real reports. Over the cap
-- the call does nothing (no error: the page has nothing useful to say).
-- ---------------------------------------------------------------------------
create index if not exists question_reports_created_idx on public.question_reports (created_at);
create index if not exists premium_waitlist_created_idx on public.premium_waitlist (created_at);

-- The counter accepts only paths the site could have: lower-case, folders of
-- letters, digits and dashes, ending in a page or a slash. At most 1,500
-- distinct paths a day (the site has under 900 pages); 662 junk paths had
-- already been recorded.
drop function if exists public.track_pageview(text);
create function public.track_pageview(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := lower(coalesce(p_path, ''));
begin
  if length(v_path) > 120 or v_path !~ '^/([a-z0-9-]+/)*([a-z0-9_-]+(\.[a-z0-9-]+)*\.html)?$' then
    return;
  end if;
  if not exists (select 1 from public.page_views v where v.path = v_path and v.day = current_date)
     and (select count(*) from public.page_views v where v.day = current_date) >= 1500 then
    return;
  end if;
  insert into public.page_views (path, day, views)
  values (v_path, current_date, 1)
  on conflict (path, day) do update set views = page_views.views + 1
   where page_views.views < 100000;
end;
$$;

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
  if p_course not in ('nremt', 'ochem', 'anp') then
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

create or replace function public.report_client_error(
  p_path text,
  p_message text,
  p_source text default null,
  p_line int default null,
  p_column int default null,
  p_stack text default null,
  p_agent text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_message is null or length(btrim(p_message)) = 0 then
    return;
  end if;
  -- 2,000 a day. A real bug on a busy page reports the same thing hundreds
  -- of times; past this the rows add nothing but cost.
  if (select count(*) from public.client_errors e
       where e.created_at > now() - interval '1 day') >= 2000 then
    return;
  end if;

  -- Truncation, not rejection. A report that is slightly too long is still a
  -- report; refusing it would lose the bug to protect a column width. The
  -- client truncates too — this is the half that does not run on the attacker's
  -- machine.
  insert into public.client_errors (path, message, source, line, col, stack, agent)
  values (
    left(coalesce(p_path, ''), 200),
    left(p_message, 300),
    left(coalesce(p_source, ''), 200),
    p_line,
    p_column,
    left(coalesce(p_stack, ''), 600),
    left(coalesce(p_agent, ''), 200)
  );
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
  if p_course not in ('nremt', 'ochem', 'anp') then
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

-- ---------------------------------------------------------------------------
-- 7. Who may call what
--
-- Supabase grants EXECUTE on every new function in `public` to anon and
-- authenticated directly (default privileges), so the `revoke ... from
-- public` lines schema.sql always had removed nothing: every function,
-- including the Worker-only ones, was callable by anyone with the site's
-- publishable key (Fix-first 9). Revoke from everyone, stop granting by
-- default, then grant back exactly what the browser calls. The service role
-- (the Worker, the SQL editor) keeps everything.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges revoke execute on functions from public;
grant execute on all functions in schema public to service_role;

-- Anyone on the site, signed in or not.
grant execute on function public.track_pageview(text) to anon, authenticated;
grant execute on function public.report_question(text, text, text, text) to anon, authenticated;
grant execute on function public.report_client_error(text, text, text, int, int, text, text) to anon, authenticated;
grant execute on function public.save_push_subscription(text, text, text, timestamptz, text, text, text) to anon, authenticated;
grant execute on function public.delete_push_subscription(text) to anon, authenticated;
grant execute on function public.join_waitlist(text, text, text) to anon, authenticated;
grant execute on function public.count_premium_step(text, text) to anon, authenticated;

-- Signed in only: each acts on auth.uid() and nothing else.
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.save_email_reminder(timestamptz, text, text, text) to authenticated;
grant execute on function public.delete_email_reminder() to authenticated;
grant execute on function public.my_premium() to authenticated;
grant execute on function public.my_purchases() to authenticated;
grant execute on function public.record_exam_completion(text, integer) to authenticated;

-- Worker only (service role), granted above and to nobody else:
-- unsubscribe_email_reminder, premium_add_pass, premium_refund_order,
-- premium_rechain, count_premium_paid.
