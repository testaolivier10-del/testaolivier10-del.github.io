-- Everything the site writes to Supabase that is not a user's own progress.
--
-- Run this once, in the Supabase dashboard -> SQL Editor -> New query. It is
-- idempotent: every statement is create-if-not-exists or create-or-replace, so
-- running it again after an edit is safe and is how you apply a change.
--
-- THE SHAPE EVERY TABLE HERE FOLLOWS
-- ----------------------------------
-- The same one page_views has had since the beginning, because it is the only
-- shape that lets the site write something it can never read back:
--
--   * RLS is ON and there are NO POLICIES AT ALL. In Postgres that means every
--     role reaching the table through the API — anon and authenticated alike —
--     can neither select nor insert. Not "is filtered to its own rows": cannot
--     touch it.
--   * A `security definer` function is therefore the only way in. It runs as
--     its owner rather than as the caller, so it can insert into a table the
--     caller cannot see, and it can only do the one thing it was written to do.
--   * Reading means the SQL editor, where the service role bypasses RLS.
--
-- That is what lets privacy.html promise these cannot be read back from the
-- site, by us or by anyone else, and mean it.
--
-- Who may call each function is the whole security boundary here. Supabase
-- grants EXECUTE on new functions in public to anon and authenticated
-- directly, so the per-function `revoke ... from public` lines below were
-- never enough on their own: the last section of this file (the October 2026
-- audit) revokes EXECUTE from anon and authenticated on every function, stops
-- the default grant, and grants back exactly what the browser calls.

-- ---------------------------------------------------------------------------
-- 1. Question reports — "this question looks wrong"
--
-- sources.html has always promised a way to tell us when a question is wrong,
-- and for a long time there was none: the only address on the site was in the
-- privacy policy. For a bank this size, written against reference material
-- rather than by a committee, a reader who has just answered a question and
-- thinks the key is wrong is the single highest-signal reviewer there is, and
-- they are on the one screen where saying so costs them a tap.
--
-- question_id is the permanent id from nremt/assets/questions.json (or the
-- topic id for an ochem practice item), NOT a position in the file — see
-- nremt/assets/question-ids.js. Reports outlive edits to the bank, so a report
-- that referred to a position would point at a different question by the time
-- anyone read it.
-- ---------------------------------------------------------------------------
create table if not exists public.question_reports (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  course      text not null,
  question_id text not null,
  -- What is wrong with it, from a fixed list the form offers. Free prose is
  -- the `note` and is optional; most reports are one of four things and making
  -- people write a sentence to say so loses most of them.
  reason      text not null,
  note        text,
  -- Resolved / dismissed / still open, set by hand while reading these. No
  -- default beyond 'open' and nothing on the site ever reads it back.
  status      text not null default 'open'
);

create index if not exists question_reports_open_idx
  on public.question_reports (course, question_id)
  where status = 'open';

alter table public.question_reports enable row level security;

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
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug') then
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

revoke all on function public.report_question(text, text, text, text) from public;
grant execute on function public.report_question(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Client errors
--
-- 183 pages of hand-written vanilla JS with no bundler and no framework. A
-- typo in one lesson's bootstrap renders an inert page — the text is there,
-- the buttons do nothing, and the only person who knows is the student, who
-- assumes the site is broken and leaves. See assets/errors.js for what is
-- sent and, more importantly, what is not.
--
-- Deliberately not indexed beyond the primary key and the day. This is read a
-- handful of times a week by one person in the SQL editor; paying for indexes
-- on every insert to save that reader four seconds is the wrong trade.
-- ---------------------------------------------------------------------------
create table if not exists public.client_errors (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path       text not null,
  message    text not null,
  source     text,
  line       int,
  col        int,
  stack      text,
  agent      text
);

create index if not exists client_errors_created_idx
  on public.client_errors (created_at desc);

alter table public.client_errors enable row level security;

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

revoke all on function public.report_client_error(text, text, text, int, int, text, text) from public;
grant execute on function public.report_client_error(text, text, text, int, int, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Account deletion
--
-- privacy.html invokes GDPR and CCPA and then asked people to send an email,
-- which is a deletion right in the same sense that a locked door with a
-- doorbell is an exit. This makes it a button.
--
-- It takes no arguments on purpose. auth.uid() is read from the caller's
-- verified JWT, so the function can only ever delete the account of whoever is
-- signed in — there is no id to pass and therefore no id to tamper with, which
-- is the difference between this and every version of it that takes a user id.
--
-- The delete cascades to user_progress via its foreign key to auth.users; the
-- explicit delete below is belt and braces for a database where that key was
-- never added. The reminder tables (sections 4 and 5) cascade the same way.
-- The Premium waitlist (section 6) holds an address rather than a user id, so
-- it is cleared explicitly, by the account's address. The page counter and
-- the report and error tables have no user column at all.
-- ---------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  delete from public.user_progress where id = uid;
  -- The Premium waitlist (section 6) is keyed on an address, not an account,
  -- so it is matched on the account's address. Somebody deleting their
  -- account has asked not to be kept, and a waitlist row is being kept.
  delete from public.premium_waitlist
   where lower(email) = lower((select email from auth.users where id = uid));
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
-- anon is deliberately NOT granted: there is no signed-in user to delete, and
-- the only thing an anonymous caller could achieve is the exception above.
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Study reminders
--
-- The site has a real spaced-repetition scheduler: ochem/assets/mastery-engine.js
-- computes a due date per concept, nremt/practice.html builds a due queue from
-- the same idea, and hub-progress.js keeps a streak and a freeze that bridges
-- one missed day. All of it assumed the student CHOOSES to open the site. A
-- scheduler that knows forty items are due today and has no way to say so is
-- doing half its job, and the day somebody loses a twelve-day streak is very
-- often the last day they open the site at all.
--
-- WHAT IS STORED, AND WHY SO LITTLE
-- ---------------------------------
-- The browser decides everything: whether to remind, when, and what the words
-- say. It writes that decision here and the worker is a dumb courier that
-- delivers what it was handed at the time it was told. That is not laziness —
-- the due counts live in localStorage and never leave it, so a server that
-- decided when to remind would first have to be told everything the student
-- has ever answered. This way it is told a number and a sentence.
--
-- The endpoint is a URL issued by the browser's own push service. It is a
-- capability: anyone holding it can send this browser a notification, which is
-- why this table is locked exactly like the others and the only way to write a
-- row is a function that re-derives the row's identity from the endpoint the
-- caller already proved it has.
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  -- sha256 of the endpoint. The endpoint itself is a credential and a long one;
  -- this gives a stable primary key without making the key the credential.
  id            text primary key,
  created_at    timestamptz not null default now(),
  endpoint      text not null,
  p256dh        text not null,
  auth          text not null,
  -- Deliberately nullable. Reminders work signed out, like everything else
  -- here; an account is for syncing progress, not for being allowed to study.
  user_id       uuid references auth.users(id) on delete cascade,

  -- When to send next, and what to say. Both written by the browser.
  next_send_at  timestamptz,
  title         text not null default 'Time to study',
  body          text not null default 'You have work waiting.',
  url           text not null default '/',

  -- How many sends have gone out since the browser last updated this row. The
  -- worker increments it and stops at MAX_UNANSWERED, so somebody who has
  -- stopped studying gets a few nudges and then silence rather than a daily
  -- notification for the rest of the life of the browser profile.
  unanswered    int not null default 0,
  last_sent_at  timestamptz
);

create index if not exists push_due_idx
  on public.push_subscriptions (next_send_at)
  where next_send_at is not null;

-- Failed sends in a row (worker/src/reminders.js): backs off, deleted at five.
alter table public.push_subscriptions add column if not exists failures integer not null default 0;

alter table public.push_subscriptions enable row level security;

-- Create or update this browser's row. Keyed on the endpoint, which the caller
-- must already hold, so there is no id to guess and no row to reach that you
-- were not already able to send a notification to.
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

revoke all on function public.save_push_subscription(text, text, text, timestamptz, text, text, text) from public;
grant execute on function public.save_push_subscription(text, text, text, timestamptz, text, text, text) to anon, authenticated;

-- Turning reminders off deletes the row rather than flagging it. A switch that
-- leaves the endpoint sitting in a table is not the switch the person thought
-- they were pressing.
create or replace function public.delete_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.push_subscriptions
   where id = encode(extensions.digest(p_endpoint, 'sha256'), 'hex');
end;
$$;

revoke all on function public.delete_push_subscription(text) from public;
grant execute on function public.delete_push_subscription(text) to anon, authenticated;

-- pgcrypto, for digest() above. Supabase ships it; this is here so running
-- this file on a fresh project works.
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 5. Email reminders
--
-- The fallback channel, and it exists for one specific group: iOS Safari only
-- allows notifications for a site added to the home screen, so a large share
-- of the people this site is for cannot receive a push at all. Email reaches
-- them.
--
-- THREE RULES, ALL OF THEM NARROWING
-- ----------------------------------
-- 1. Signed in only. We have no other way to know an address, and asking for
--    one would turn a free tool into a mailing list with a study app attached.
-- 2. Opt in, explicitly, from a switch that says exactly what will arrive.
--    privacy.html used to promise "no product email of any kind" and that
--    promise had to change in the same commit as this table.
-- 3. One click out, with no sign-in. unsub_token is a random secret in the
--    footer link of every message. An unsubscribe that makes somebody log in
--    first is not an unsubscribe.
--
-- The same body the push carries, written by the same browser code. A person
-- with both channels on would get the same sentence twice, which is why the
-- client turns email off when push is working.
-- ---------------------------------------------------------------------------
create table if not exists public.email_reminders (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  email        text not null,
  -- Random, per subscription, and the only thing the unsubscribe link carries.
  -- Not the user id: a link in an email ends up in forwarded threads and
  -- support tickets, and a user id there is a handle on an account.
  unsub_token  text not null default encode(extensions.gen_random_bytes(18), 'hex'),

  next_send_at timestamptz,
  title        text not null default 'Time to study',
  body         text not null default 'You have work waiting.',
  url          text not null default '/',
  unanswered   int not null default 0,
  last_sent_at timestamptz
);

create index if not exists email_reminders_due_idx
  on public.email_reminders (next_send_at)
  where next_send_at is not null;

create unique index if not exists email_reminders_token_idx
  on public.email_reminders (unsub_token);

alter table public.email_reminders add column if not exists failures integer not null default 0;

alter table public.email_reminders enable row level security;

-- Takes no user id, for the same reason delete_own_account() does not: the
-- address and the identity both come from the caller's verified token, so
-- there is nothing to pass and nothing to tamper with. Nobody can sign anybody
-- else up for email from this site.
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

revoke all on function public.save_email_reminder(timestamptz, text, text, text) from public;
grant execute on function public.save_email_reminder(timestamptz, text, text, text) to authenticated;

create or replace function public.delete_email_reminder()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from public.email_reminders where user_id = auth.uid();
end;
$$;

revoke all on function public.delete_email_reminder() from public;
grant execute on function public.delete_email_reminder() to authenticated;

-- The one-click way out, called by the Worker on a GET from an email footer.
-- It takes the token and nothing else, so the link works in any mail client,
-- from any device, with nobody signed in anywhere.
create or replace function public.unsubscribe_email_reminder(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hit int;
begin
  if p_token is null or length(p_token) < 20 then
    return false;
  end if;
  delete from public.email_reminders where unsub_token = p_token;
  get diagnostics hit = row_count;
  return hit > 0;
end;
$$;

revoke all on function public.unsubscribe_email_reminder(text) from public;
-- Called by the Worker with the service role, and by nobody else: a token is a
-- secret, and an endpoint anon can call is an endpoint somebody can walk.

-- ---------------------------------------------------------------------------
-- 6. The Premium waitlist
--
-- Every course is free. Before anything is built to charge for, the site asks
-- whether anyone would pay: a card at the end of a real session, and an email
-- box behind it. docs/premium.md has the plan and assets/premium.js the card.
--
-- Same shape as everything above: RLS on, no policies, one function in. An
-- address is personal data, so it is the one thing here that privacy.html
-- has to name, and delete_own_account() above removes it.
--
-- Anyone can reach this function, so anyone can put any address in it. That
-- is acceptable for a list that is emailed exactly once, at launch, with an
-- unsubscribe link — and it is why it must never be used for anything else.
-- ---------------------------------------------------------------------------
create table if not exists public.premium_waitlist (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  course     text not null,
  email      text not null,
  -- Which card they came from ('results', 'summary'). Tells us which moment
  -- asks well, which is the whole point of asking in more than one place.
  source     text
);

-- One row per address per course. Joining twice is a no-op rather than an
-- error, so the dialog can say "you're on the list" either way.
create unique index if not exists premium_waitlist_course_email_idx
  on public.premium_waitlist (course, lower(email));

alter table public.premium_waitlist enable row level security;

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
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug') then
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

revoke all on function public.join_waitlist(text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text) to anon, authenticated;


-- ===========================================================================
-- PREMIUM PASSES
-- ===========================================================================
-- One row per purchase (or grant). A pass is "Premium for this course until
-- this date"; one-time, never renewing — docs/premium.md says why. Written
-- only by the Worker (worker/src/premium.js) with the service key, when
-- Polar's order.paid webhook arrives, and by hand for grants. RLS on with no
-- policies: the browser reads its own access through my_premium() alone.
-- ---------------------------------------------------------------------------
create table if not exists public.premium_passes (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  course      text not null check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug')),
  pass        text not null,          -- 'nremt-90', 'ochem-semester', 'grant', …
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz not null,
  -- Polar's order id. Unique, so a webhook delivered twice adds one pass.
  order_id    text unique,
  amount_cents integer,
  refunded_at timestamptz
);

create index if not exists premium_passes_user_idx on public.premium_passes (user_id, course);

-- When the Worker's cron sent the one "your pass ends soon" email for this
-- pass (worker/src/premium.js runPassEnding). Set only on the latest pass for
-- a user and course, so it is sent once. Safe to rerun on an existing table.
alter table public.premium_passes add column if not exists ending_reminded_at timestamptz;

alter table public.premium_passes enable row level security;

-- The signed-in user's live access: one row per course, the end of the run
-- of unrefunded passes that has started (see the 2026-10 audit section below).
-- Nothing about anyone else, and nothing without a session.
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

revoke all on function public.my_premium() from public;
grant execute on function public.my_premium() to authenticated;

-- The signed-in user's own purchase history, for account.html: every pass
-- they hold or held, newest first, refunds included. Nothing about anyone else.
create or replace function public.my_purchases()
returns table (course text, pass text, starts_at timestamptz, expires_at timestamptz,
               order_id text, amount_cents integer, refunded_at timestamptz, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.course, p.pass, p.starts_at, p.expires_at, p.order_id, p.amount_cents, p.refunded_at, p.created_at
  from public.premium_passes p
  where p.user_id = auth.uid()
  order by p.created_at desc
  limit 100;
$$;

revoke all on function public.my_purchases() from public;
grant execute on function public.my_purchases() to authenticated;

-- ===========================================================================
-- PREMIUM LEDGER AND PASS-GUARANTEE CLAIMS
-- ===========================================================================
-- premium_ledger: what an email address has used (its one self-serve refund,
-- its one pass guarantee), so deleting and re-creating an account does not
-- reset either. Only a SHA-256 hash of the lower-cased address is kept, with
-- no link to the account, so it stays when the account is deleted. Written
-- and read by the Worker alone (service role): RLS on, no policies.
create table if not exists public.premium_ledger (
  email_key  text not null,
  kind       text not null check (kind in ('refund', 'guarantee')),
  created_at timestamptz not null default now(),
  primary key (email_key, kind)
);

alter table public.premium_ledger enable row level security;

-- premium_guarantee_claims: who claimed the NREMT pass guarantee, with the
-- legal name and state they tested under, so a claim can be checked against
-- the National Registry's public certification lookup. Deleted with the
-- account. Worker only: RLS on, no policies.
create table if not exists public.premium_guarantee_claims (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  legal_name text not null check (length(legal_name) between 3 and 100),
  state      text not null check (length(state) between 2 and 40),
  exam_date  date not null
);

alter table public.premium_guarantee_claims enable row level security;


-- ===========================================================================
-- PREMIUM FUNNEL
-- ===========================================================================
-- Anonymous daily counts of the four Premium steps, so the funnel can be read
-- back from SQL (scripts/sql/reports.sql) without Umami: gate-shown (a free
-- user met a limit), interest (opened the dialog), checkout-start, checkout-
-- paid. One row per day, course and step; no user, no browser id. The usual
-- shape: RLS on, no policies, one security-definer function in.
-- ---------------------------------------------------------------------------
create table if not exists public.premium_funnel (
  day    date not null default current_date,
  course text not null check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug')),
  step   text not null check (step in ('gate-shown', 'limit-hit', 'interest', 'signin-for-checkout', 'checkout-start', 'checkout-paid')),
  n      integer not null default 0,
  primary key (day, course, step)
);

alter table public.premium_funnel enable row level security;

create or replace function public.count_premium_step(p_course text, p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug')
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

-- ---------------------------------------------------------------------------
-- Video link tracking (migrations/2026-10d-ref-tracking.sql)
--
-- Which TikTok, YouTube or Instagram post sent a visitor, and how far they
-- got: visit, sign-in to buy, checkout, paid. A count per day, ref and step;
-- the ref is remembered only in the visitor's own browser (assets/analytics.js).
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

revoke all on function public.track_ref(text, text) from public;
revoke all on function public.track_ref_paid(text) from public, anon, authenticated;
grant execute on function public.track_ref_paid(text) to service_role;

-- ---------------------------------------------------------------------------
-- Question tallies (migrations/2026-10j-question-stats.sql)
--
-- Every answered question, as per-day totals: how often it was answered,
-- how often right, and the seconds spent on it. Which questions are hard,
-- which are probably badly written, what to explain better. No user, browser
-- id or IP; the browser sends batches of up to 25 (assets/analytics.js).
-- ---------------------------------------------------------------------------
create table if not exists public.question_stats (
  day     date not null default current_date,
  course  text not null,
  qid     text not null,
  topic   text not null default '',
  n       integer not null default 0,
  correct integer not null default 0,
  secs    integer not null default 0,
  primary key (day, course, qid)
);

alter table public.question_stats enable row level security;
-- Only the function below and the service role touch it.
revoke all on public.question_stats from anon, authenticated;

create or replace function public.track_answers(p_course text, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_q text;
  v_c integer;
  v_s integer;
  v_t text;
begin
  if p_course is null or p_course !~ '^[a-z]{2,12}$'
     or p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 25 then
    return;
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object' then continue; end if;
    v_q := v_item->>'q';
    v_t := coalesce(v_item->>'t', '');
    if v_q is null or v_q !~ '^[A-Za-z0-9_.:-]{1,64}$' or v_t !~ '^[A-Za-z0-9_.:-]{0,48}$' then continue; end if;
    v_c := case when v_item->>'c' = '1' then 1 else 0 end;
    v_s := case when (v_item->>'s') ~ '^[0-9]{1,3}$' then least((v_item->>'s')::integer, 900) else 0 end;
    if not exists (select 1 from public.question_stats s where s.day = current_date and s.course = p_course and s.qid = v_q)
       and (select count(*) from public.question_stats s where s.day = current_date) >= 50000 then
      continue;
    end if;
    insert into public.question_stats (day, course, qid, topic, n, correct, secs)
    values (current_date, p_course, v_q, v_t, 1, v_c, v_s)
    on conflict (day, course, qid) do update
      set n = question_stats.n + 1,
          correct = question_stats.correct + excluded.correct,
          secs = question_stats.secs + excluded.secs,
          topic = case when excluded.topic <> '' then excluded.topic else question_stats.topic end
     where question_stats.n < 1000000;
  end loop;
end;
$$;

revoke all on function public.track_answers(text, jsonb) from public;
grant execute on function public.track_answers(text, jsonb) to anon, authenticated;



-- ===========================================================================
-- OCTOBER 2026 AUDIT (scripts/sql/migrations/2026-10-audit.sql)
-- ===========================================================================
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

-- p_until was added for fixed-date passes (2026-10b-apbio.sql); the old
-- nine-argument version is dropped so the two cannot coexist as overloads.
drop function if exists public.premium_add_pass(uuid, text, text, integer, text, integer, timestamptz, text, text);

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
  if p_user is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug')
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
-- (my_premium: defined in its section above)

-- ---------------------------------------------------------------------------
-- 2. Exam completions, stamped by the database
--
-- The NREMT pass guarantee needs "two full timed or adaptive exams during the pass".
-- That used to be read from the synced exam history, which the student's
-- own browser writes, dates included. These rows are written only by
-- record_exam_completion(), with the database's clock, at most one per
-- twenty minutes. Deleted with the account (foreign key).
-- ---------------------------------------------------------------------------
create table if not exists public.exam_completions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  course      text not null check (course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug')),
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
  if v_uid is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug')
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
-- (count_premium_step: defined in its section above)

create or replace function public.count_premium_paid(p_course text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug') then
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

-- (save_push_subscription: defined in its section above)

-- (save_email_reminder: defined in its section above)

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

-- (report_question: defined in its section above)

-- (report_client_error: defined in its section above)

-- (join_waitlist: defined in its section above)

-- ---------------------------------------------------------------------------
-- 6b. The AI free-response grader (migrations/2026-10l-frq-grader.sql)
--
-- frq_grade_daily: each student's AI grades today, for the cap of 10 a day;
-- frq_grade_counts: anonymous daily counts per course and grader (claude,
-- backup, none, cached) with Claude's token use. Both Worker only.
-- ---------------------------------------------------------------------------
create table if not exists public.frq_grade_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  n       integer not null default 0,
  primary key (user_id, day)
);

alter table public.frq_grade_daily enable row level security;
revoke all on public.frq_grade_daily from anon, authenticated;

create table if not exists public.frq_grade_counts (
  day          date not null default current_date,
  course       text not null,
  grader       text not null check (grader in ('claude', 'backup', 'none', 'cached')),
  n            integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  primary key (day, course, grader)
);

alter table public.frq_grade_counts enable row level security;
revoke all on public.frq_grade_counts from anon, authenticated;

create or replace function public.frq_grade_take(p_user uuid, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  if p_user is null or p_limit is null or p_limit < 1 then
    return -1;
  end if;
  insert into public.frq_grade_daily (user_id, day, n)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update set n = frq_grade_daily.n + 1
   where frq_grade_daily.n < p_limit
  returning n into v_n;
  if v_n is null then
    return -1;
  end if;
  delete from public.frq_grade_daily where day < current_date - 7;
  return p_limit - v_n;
end;
$$;

create or replace function public.frq_grade_give_back(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.frq_grade_daily set n = n - 1
   where user_id = p_user and day = current_date and n > 0;
end;
$$;

create or replace function public.count_frq_grade(p_course text, p_grader text, p_in integer, p_out integer, p_cache_read integer, p_cache_write integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The Worker sends only its six AP course keys; the shape check keeps a
  -- stray value out without a second course list to maintain.
  if p_course is null or p_course !~ '^ap[a-z]{2,6}$'
     or p_grader is null or p_grader not in ('claude', 'backup', 'none', 'cached') then
    return;
  end if;
  insert into public.frq_grade_counts (day, course, grader, n, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens)
  values (current_date, p_course, p_grader, 1, greatest(coalesce(p_in, 0), 0), greatest(coalesce(p_out, 0), 0),
          greatest(coalesce(p_cache_read, 0), 0), greatest(coalesce(p_cache_write, 0), 0))
  on conflict (day, course, grader) do update
    set n = frq_grade_counts.n + 1,
        input_tokens = frq_grade_counts.input_tokens + excluded.input_tokens,
        output_tokens = frq_grade_counts.output_tokens + excluded.output_tokens,
        cache_read_tokens = frq_grade_counts.cache_read_tokens + excluded.cache_read_tokens,
        cache_write_tokens = frq_grade_counts.cache_write_tokens + excluded.cache_write_tokens;
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
grant execute on function public.track_ref(text, text) to anon, authenticated;
grant execute on function public.track_answers(text, jsonb) to anon, authenticated;

-- Signed in only: each acts on auth.uid() and nothing else.
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.save_email_reminder(timestamptz, text, text, text) to authenticated;
grant execute on function public.delete_email_reminder() to authenticated;
grant execute on function public.my_premium() to authenticated;
grant execute on function public.my_purchases() to authenticated;
grant execute on function public.record_exam_completion(text, integer) to authenticated;

-- Worker only (service role), granted above and to nobody else:
-- unsubscribe_email_reminder, premium_add_pass, premium_refund_order,
-- premium_rechain, count_premium_paid, frq_grade_take, frq_grade_give_back,
-- count_frq_grade.

-- Tables (migrations/2026-10i-table-grants.sql): anon touches no table
-- directly; authenticated only its own user_progress row. The service role
-- (the Worker) keeps everything. RLS was already blocking every row; this
-- also takes away TRUNCATE, which RLS does not cover.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
grant select, insert, update on public.user_progress to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Invite friends (docs/invites.md, migrations/2026-10m-referrals.sql)
--
-- Codes, claims and the rewards they pay. Grants are here rather than in
-- section 7 so the block matches the migration as one piece.
-- ---------------------------------------------------------------------------

create table if not exists public.referral_codes (
  code        text primary key check (code ~ '^[a-z2-9]{8}$'),
  secret_hash text not null,
  user_id     uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  bound_at    timestamptz
);

create index if not exists referral_codes_user_idx on public.referral_codes (user_id);
alter table public.referral_codes enable row level security;

create table if not exists public.referral_claims (
  id             bigint generated always as identity primary key,
  -- Null once the friend deletes the account; the row and its email key stay,
  -- so the same person cannot claim again with a new account.
  friend_id      uuid unique references auth.users (id) on delete set null,
  code           text not null references public.referral_codes (code) on delete cascade,
  email_key      text not null unique,
  course         text,
  claimed_at     timestamptz not null default now(),
  answers        integer not null default 0,
  last_answer_at timestamptz,
  qualified_at   timestamptz,
  welcome_at     timestamptz,
  rewarded_at    timestamptz,
  capped         boolean not null default false
);

create index if not exists referral_claims_code_idx on public.referral_claims (code);
alter table public.referral_claims enable row level security;

create or replace function public.referral_email_key(p_email text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_local text := split_part(v_email, '@', 1);
  v_domain text := split_part(v_email, '@', 2);
begin
  v_local := split_part(v_local, '+', 1);
  if v_domain in ('gmail.com', 'googlemail.com') then
    v_local := replace(v_local, '.', '');
    v_domain := 'gmail.com';
  end if;
  return encode(sha256(convert_to(v_local || '@' || v_domain, 'UTF8')), 'hex');
end;
$$;

create or replace function public.referral_register(p_code text, p_secret text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if p_code is null or p_code !~ '^[a-z2-9]{8}$'
     or p_secret is null or length(p_secret) < 20 or length(p_secret) > 80 then
    return false;
  end if;
  if (select count(*) from public.referral_codes c where c.created_at > now() - interval '1 day') >= 3000 then
    return false;
  end if;
  insert into public.referral_codes (code, secret_hash, user_id, bound_at)
  values (p_code, encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'), v_uid, case when v_uid is null then null else now() end)
  on conflict (code) do nothing;
  return found;
end;
$$;

create or replace function public.referral_my_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.code from public.referral_codes c
   where c.user_id = auth.uid() and auth.uid() is not null
   order by c.created_at, c.code
   limit 1;
$$;

create or replace function public.referral_welcome(p_claim bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select * into r from public.referral_claims c where c.id = p_claim for update;
  if r.id is null or r.friend_id is null or r.course is null or r.welcome_at is not null then
    return;
  end if;
  begin
    perform public.premium_add_pass(
      p_user => r.friend_id, p_course => r.course, p_pass => 'referral-welcome', p_days => 3,
      p_order_id => 'refw:' || r.id, p_funded_by => 'referral');
  exception when others then
    -- Not a course premium_add_pass knows: forget it, so the friend's first
    -- real answer names the course instead.
    if sqlerrm = 'bad pass' then
      update public.referral_claims set course = null where id = r.id;
    end if;
    return;
  end;
  update public.referral_claims set welcome_at = now() where id = r.id;
end;
$$;

create or replace function public.referral_reward(p_claim bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_sharer uuid;
begin
  select c.*, k.user_id as sharer into r
    from public.referral_claims c join public.referral_codes k on k.code = c.code
   where c.id = p_claim
     for update of c;
  if r.id is null or r.qualified_at is null or r.rewarded_at is not null or r.sharer is null or r.course is null then
    return;
  end if;
  v_sharer := r.sharer;
  perform pg_advisory_xact_lock(hashtextextended('referral_reward:' || v_sharer::text, 0));
  if (select count(*) from public.referral_claims c join public.referral_codes k on k.code = c.code
       where k.user_id = v_sharer and c.rewarded_at > now() - interval '365 days') >= 8 then
    update public.referral_claims set capped = true where id = r.id;
    return;
  end if;
  begin
    perform public.premium_add_pass(
      p_user => v_sharer, p_course => r.course, p_pass => 'referral', p_days => 7,
      p_order_id => 'refr:' || r.id, p_funded_by => 'referral');
  exception when others then
    return;
  end;
  update public.referral_claims set rewarded_at = now(), capped = false where id = r.id;
end;
$$;

create or replace function public.referral_adopt(p_code text, p_secret text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
begin
  if v_uid is null or p_code is null or p_secret is null then
    return false;
  end if;
  update public.referral_codes
     set user_id = v_uid, bound_at = now()
   where code = p_code and user_id is null
     and secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex');
  if not found and not exists (select 1 from public.referral_codes c where c.code = p_code and c.user_id = v_uid) then
    return false;
  end if;
  -- Friends who already studied enough while the code was unbound.
  for v_id in
    select c.id from public.referral_claims c
     where c.code = p_code and c.qualified_at is not null and c.rewarded_at is null
     order by c.qualified_at
  loop
    perform public.referral_reward(v_id);
  end loop;
  return true;
end;
$$;

create or replace function public.referral_claim(p_code text, p_course text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user record;
  v_code record;
  v_key text;
  v_id bigint;
begin
  if v_uid is null then
    return 'signed-out';
  end if;
  select u.created_at, u.email into v_user from auth.users u where u.id = v_uid;
  if v_user.email is null then
    return 'no-email';
  end if;
  if v_user.created_at < now() - interval '3 days' then
    return 'not-new';
  end if;
  select * into v_code from public.referral_codes c where c.code = lower(coalesce(p_code, ''));
  if v_code.code is null then
    return 'unknown';
  end if;
  if v_code.user_id = v_uid then
    return 'own-code';
  end if;
  v_key := public.referral_email_key(v_user.email);
  if v_code.user_id is not null
     and public.referral_email_key((select u.email from auth.users u where u.id = v_code.user_id)) = v_key then
    return 'own-code';
  end if;
  if exists (select 1 from public.referral_claims c where c.friend_id = v_uid or c.email_key = v_key) then
    return 'already';
  end if;
  insert into public.referral_claims (friend_id, code, email_key, course)
  values (v_uid, v_code.code, v_key, case when p_course ~ '^[a-z]{2,12}$' then p_course end)
  on conflict do nothing
  returning id into v_id;
  if v_id is null then
    return 'already';
  end if;
  perform public.referral_welcome(v_id);
  return 'claimed';
end;
$$;

create or replace function public.referral_note_answer(p_course text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r record;
begin
  if v_uid is null then
    return null;
  end if;
  select * into r from public.referral_claims c where c.friend_id = v_uid for update;
  if r.id is null then
    return jsonb_build_object('claim', false);
  end if;
  if r.qualified_at is not null then
    return jsonb_build_object('claim', true, 'answers', r.answers, 'need', 20, 'done', true);
  end if;
  -- Nobody answers a question in under two seconds; a script does.
  if r.last_answer_at is not null and r.last_answer_at > now() - interval '2 seconds' then
    return jsonb_build_object('claim', true, 'answers', r.answers, 'need', 20, 'done', false);
  end if;
  update public.referral_claims
     set answers = answers + 1, last_answer_at = now(),
         course = coalesce(course, case when p_course ~ '^[a-z]{2,12}$' then p_course end),
         qualified_at = case when answers + 1 >= 20 then now() end
   where id = r.id
  returning * into r;
  if r.welcome_at is null then
    perform public.referral_welcome(r.id);
  end if;
  if r.qualified_at is not null then
    perform public.referral_reward(r.id);
  end if;
  return jsonb_build_object('claim', true, 'answers', r.answers, 'need', 20, 'done', r.qualified_at is not null);
end;
$$;

create or replace function public.referral_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'code', (select k.code from public.referral_codes k where k.user_id = auth.uid() order by k.created_at, k.code limit 1),
    'joined', count(c.id),
    'studying', count(c.qualified_at),
    'rewarded', count(c.rewarded_at),
    'rewarded_year', count(c.id) filter (where c.rewarded_at > now() - interval '365 days'),
    'waiting', count(c.id) filter (where c.capped and c.rewarded_at is null),
    'cap', 8,
    'days_each', 7)
    from public.referral_codes k
    left join public.referral_claims c on c.code = k.code
   where k.user_id = auth.uid() and auth.uid() is not null;
$$;

revoke all on table public.referral_codes, public.referral_claims from anon, authenticated;
revoke execute on function public.referral_email_key(text) from public, anon, authenticated;
revoke execute on function public.referral_welcome(bigint) from public, anon, authenticated;
revoke execute on function public.referral_reward(bigint) from public, anon, authenticated;
revoke execute on function public.referral_register(text, text) from public;
revoke execute on function public.referral_my_code() from public;
revoke execute on function public.referral_adopt(text, text) from public;
revoke execute on function public.referral_claim(text, text) from public;
revoke execute on function public.referral_note_answer(text) from public;
revoke execute on function public.referral_summary() from public;
grant execute on function public.referral_register(text, text) to anon, authenticated;
grant execute on function public.referral_my_code() to authenticated;
grant execute on function public.referral_adopt(text, text) to authenticated;
grant execute on function public.referral_claim(text, text) to authenticated;
grant execute on function public.referral_note_answer(text) to authenticated;
grant execute on function public.referral_summary() to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Teacher classes (docs/teacher-classes.md, migrations/2026-11b-classes.sql)
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  school       text,
  created_at   timestamptz not null default now()
);
alter table public.teacher_profiles enable row level security;

create table if not exists public.classes (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references auth.users (id) on delete cascade,
  course       text not null,
  name         text not null,
  code         text not null unique,
  unit_order   jsonb not null default '[]'::jsonb,
  current_unit text,
  archived     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists classes_teacher_idx on public.classes (teacher_id);
alter table public.classes enable row level security;

create table if not exists public.class_members (
  class_id   uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  joined_at  timestamptz not null default now(),
  extra_days integer not null default 0,
  extra_time numeric not null default 1,
  summary    jsonb,
  summary_at timestamptz,
  primary key (class_id, student_id)
);
create index if not exists class_members_student_idx on public.class_members (student_id);
alter table public.class_members enable row level security;

create table if not exists public.class_assignments (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  kind       text not null,
  title      text not null,
  spec       jsonb not null default '{}'::jsonb,
  opens_at   timestamptz not null default now(),
  due_at     timestamptz,
  late_until timestamptz,
  required   boolean not null default true,
  students   jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists class_assignments_class_idx on public.class_assignments (class_id);
alter table public.class_assignments enable row level security;

-- Code lookups per account, so codes cannot be guessed by trying many (30 an hour; kept a day).
create table if not exists public.class_code_tries (
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists class_code_tries_idx on public.class_code_tries (user_id, at);
alter table public.class_code_tries enable row level security;

revoke all on table public.teacher_profiles, public.classes, public.class_members, public.class_assignments, public.class_code_tries from anon, authenticated;

-- One more code lookup by this account; false once it has made 30 in the last hour.
create or replace function public.class_code_try()
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  delete from public.class_code_tries where at < now() - interval '1 day';
  if (select count(*) from public.class_code_tries where user_id = auth.uid() and at > now() - interval '1 hour') >= 30 then return false; end if;
  insert into public.class_code_tries (user_id) values (auth.uid());
  return true;
end;
$$;

-- Eight characters from an alphabet with no look-alikes (no 0/O, 1/I/L), from pgcrypto's random bytes.
create or replace function public.class_new_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  abc text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea;
  out text;
  i integer;
begin
  loop
    b := extensions.gen_random_bytes(8);
    out := '';
    for i in 0..7 loop
      out := out || substr(abc, 1 + (get_byte(b, i) % length(abc)), 1);
    end loop;
    exit when not exists (select 1 from public.classes where code = out);
  end loop;
  return out;
end;
$$;

create or replace function public.teach_set_profile(p_name text, p_school text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 60 then return false; end if;
  insert into public.teacher_profiles (user_id, display_name, school)
  values (auth.uid(), btrim(p_name), nullif(btrim(left(coalesce(p_school, ''), 120)), ''))
  on conflict (user_id) do update set display_name = excluded.display_name, school = excluded.school;
  return true;
end;
$$;

create or replace function public.teach_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('name', p.display_name, 'school', p.school)
    from public.teacher_profiles p
   where p.user_id = auth.uid() and auth.uid() is not null;
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
  -- AP® courses only (nremt, ochem and anp keep progress differently).
  if p_course !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|aphug)$' then return null; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 60 then return null; end if;
  if (select count(*) from public.classes where teacher_id = auth.uid() and not archived) >= 30 then return null; end if;
  insert into public.classes (teacher_id, course, name, code, unit_order)
  values (auth.uid(), p_course, btrim(p_name), public.class_new_code(),
          case when jsonb_typeof(p_unit_order) = 'array' then p_unit_order else '[]'::jsonb end)
  returning * into c;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

create or replace function public.teach_my_classes()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'course', c.course, 'name', c.name, 'code', c.code,
           'current_unit', c.current_unit, 'archived', c.archived, 'created_at', c.created_at,
           'members', (select count(*) from public.class_members m where m.class_id = c.id))
           order by c.archived, c.created_at), '[]'::jsonb)
    from public.classes c
   where c.teacher_id = auth.uid() and auth.uid() is not null;
$$;

create or replace function public.teach_update_class(p_class uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classes;
begin
  select * into c from public.classes where id = p_class and teacher_id = auth.uid() and auth.uid() is not null;
  if not found then return null; end if;
  if p_patch ? 'name' and length(btrim(p_patch->>'name')) between 1 and 60 then c.name := btrim(p_patch->>'name'); end if;
  if p_patch ? 'unit_order' and jsonb_typeof(p_patch->'unit_order') = 'array' and jsonb_array_length(p_patch->'unit_order') <= 40 and octet_length((p_patch->'unit_order')::text) <= 2000 then c.unit_order := p_patch->'unit_order'; end if;
  if p_patch ? 'current_unit' then c.current_unit := left(p_patch->>'current_unit', 60); end if;
  if p_patch ? 'archived' then c.archived := coalesce((p_patch->>'archived')::boolean, c.archived); end if;
  if coalesce((p_patch->>'new_code')::boolean, false) then c.code := public.class_new_code(); end if;
  update public.classes set name = c.name, unit_order = c.unit_order, current_unit = c.current_unit,
         archived = c.archived, code = c.code, updated_at = now()
   where id = c.id;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

create or replace function public.teach_delete_class(p_class uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.classes where id = p_class and teacher_id = auth.uid() and auth.uid() is not null;
  return found;
end;
$$;

-- Everything the teacher's page needs in one read: the class, its members
-- with their summaries, and its assignments.
create or replace function public.teach_class_report(p_class uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'class', jsonb_build_object('id', c.id, 'course', c.course, 'name', c.name, 'code', c.code,
                                       'unit_order', c.unit_order, 'current_unit', c.current_unit,
                                       'archived', c.archived, 'created_at', c.created_at),
           'members', coalesce((select jsonb_agg(jsonb_build_object(
                         'id', m.student_id, 'name', m.name, 'joined_at', m.joined_at,
                         'extra_days', m.extra_days, 'extra_time', m.extra_time,
                         'summary', m.summary, 'summary_at', m.summary_at) order by m.name)
                       from public.class_members m where m.class_id = c.id), '[]'::jsonb),
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
                         'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec,
                         'opens_at', a.opens_at, 'due_at', a.due_at, 'late_until', a.late_until,
                         'required', a.required, 'students', a.students, 'created_at', a.created_at) order by a.opens_at desc)
                       from public.class_assignments a where a.class_id = c.id), '[]'::jsonb))
    from public.classes c
   where c.id = p_class and c.teacher_id = auth.uid() and auth.uid() is not null;
$$;

create or replace function public.teach_save_assignment(p_class uuid, p_id uuid, p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then return null; end if;
  if not exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid()) then return null; end if;
  if coalesce(p_data->>'kind', '') not in ('practice', 'review', 'exam', 'frq') then return null; end if;
  if length(coalesce(p_data->>'title', '')) not between 1 and 120 then return null; end if;
  if octet_length(coalesce(p_data->'spec', '{}'::jsonb)::text) > 20000 then return null; end if;
  if p_id is null then
    if (select count(*) from public.class_assignments where class_id = p_class) >= 500 then return null; end if;
    insert into public.class_assignments (class_id, kind, title, spec, opens_at, due_at, late_until, required, students)
    values (p_class, p_data->>'kind', p_data->>'title', coalesce(p_data->'spec', '{}'::jsonb),
            coalesce((p_data->>'opens_at')::timestamptz, now()), (p_data->>'due_at')::timestamptz,
            (p_data->>'late_until')::timestamptz, coalesce((p_data->>'required')::boolean, true),
            case when jsonb_typeof(p_data->'students') = 'array' then p_data->'students' else null end)
    returning id into v_id;
  else
    update public.class_assignments
       set kind = p_data->>'kind', title = p_data->>'title', spec = coalesce(p_data->'spec', '{}'::jsonb),
           opens_at = coalesce((p_data->>'opens_at')::timestamptz, opens_at), due_at = (p_data->>'due_at')::timestamptz,
           late_until = (p_data->>'late_until')::timestamptz, required = coalesce((p_data->>'required')::boolean, true),
           students = case when jsonb_typeof(p_data->'students') = 'array' then p_data->'students' else null end,
           updated_at = now()
     where id = p_id and class_id = p_class
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.teach_delete_assignment(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.class_assignments a
   using public.classes c
   where a.id = p_id and c.id = a.class_id and c.teacher_id = auth.uid() and auth.uid() is not null;
  return found;
end;
$$;

-- Accommodations, or removing a student. p_patch: { extra_days, extra_time, remove }.
create or replace function public.teach_set_member(p_class uuid, p_student uuid, p_patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid() and auth.uid() is not null) then return false; end if;
  if coalesce((p_patch->>'remove')::boolean, false) then
    delete from public.class_members where class_id = p_class and student_id = p_student;
    return found;
  end if;
  update public.class_members
     set extra_days = greatest(0, least(14, coalesce((p_patch->>'extra_days')::integer, extra_days))),
         extra_time = greatest(1, least(3, coalesce((p_patch->>'extra_time')::numeric, extra_time)))
   where class_id = p_class and student_id = p_student;
  return found;
end;
$$;

-- What a student sees before joining: the class and its teacher, nothing else.
create or replace function public.class_preview(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r jsonb;
begin
  if auth.uid() is null or not public.class_code_try() then return null; end if;
  select jsonb_build_object('name', c.name, 'course', c.course, 'teacher', p.display_name) into r
    from public.classes c
    join public.teacher_profiles p on p.user_id = c.teacher_id
   where c.code = upper(btrim(p_code)) and not c.archived;
  return r;
end;
$$;

create or replace function public.class_join(p_code text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classes;
begin
  if auth.uid() is null then return null; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 60 then return null; end if;
  if not exists (select 1 from public.class_members m join public.classes k on k.id = m.class_id where m.student_id = auth.uid() and k.code = upper(btrim(p_code)))
     and not public.class_code_try() then return null; end if;
  select * into c from public.classes where code = upper(btrim(p_code)) and not archived;
  if not found then return null; end if;
  if (select count(*) from public.class_members where class_id = c.id) >= 400 then return null; end if;
  if (select count(*) from public.class_members where student_id = auth.uid()) >= 20 then return null; end if;
  insert into public.class_members (class_id, student_id, name)
  values (c.id, auth.uid(), btrim(p_name))
  on conflict (class_id, student_id) do update set name = excluded.name;
  return jsonb_build_object('id', c.id, 'course', c.course);
end;
$$;

create or replace function public.class_leave(p_class uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.class_members where class_id = p_class and student_id = auth.uid() and auth.uid() is not null;
  return found;
end;
$$;

-- A student's classes, each with the assignments meant for them (all, or a
-- list naming them), their due dates moved by their own extra days.
create or replace function public.class_mine()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'course', c.course, 'name', c.name, 'teacher', p.display_name,
           'unit_order', c.unit_order, 'current_unit', c.current_unit, 'joined_at', m.joined_at,
           'extra_time', m.extra_time,
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
               'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec, 'opens_at', a.opens_at,
               'due_at', a.due_at + make_interval(days => m.extra_days),
               'late_until', a.late_until + make_interval(days => m.extra_days),
               'required', a.required) order by a.due_at nulls last)
             from public.class_assignments a
            where a.class_id = c.id and a.opens_at <= now()
              and (a.students is null or a.students ? m.student_id::text)), '[]'::jsonb))
           order by m.joined_at), '[]'::jsonb)
    from public.class_members m
    join public.classes c on c.id = m.class_id and not c.archived
    left join public.teacher_profiles p on p.user_id = c.teacher_id
   where m.student_id = auth.uid() and auth.uid() is not null;
$$;

-- The student's own summary for one course, into every class of theirs in it.
create or replace function public.class_push(p_course text, p_summary jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if auth.uid() is null or p_summary is null or jsonb_typeof(p_summary) <> 'object' then return 0; end if;
  if octet_length(p_summary::text) > 120000 then return 0; end if;
  update public.class_members m
     set summary = p_summary, summary_at = now()
    from public.classes c
   where m.class_id = c.id and m.student_id = auth.uid() and c.course = p_course and not c.archived;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.class_new_code() from public, anon, authenticated;
revoke execute on function public.class_code_try() from public, anon, authenticated;
revoke execute on function public.teach_set_profile(text, text) from public, anon;
revoke execute on function public.teach_profile() from public, anon;
revoke execute on function public.teach_create_class(text, text, jsonb) from public, anon;
revoke execute on function public.teach_my_classes() from public, anon;
revoke execute on function public.teach_update_class(uuid, jsonb) from public, anon;
revoke execute on function public.teach_delete_class(uuid) from public, anon;
revoke execute on function public.teach_class_report(uuid) from public, anon;
revoke execute on function public.teach_save_assignment(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.teach_delete_assignment(uuid) from public, anon;
revoke execute on function public.teach_set_member(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.class_preview(text) from public, anon;
revoke execute on function public.class_join(text, text) from public, anon;
revoke execute on function public.class_leave(uuid) from public, anon;
revoke execute on function public.class_mine() from public, anon;
revoke execute on function public.class_push(text, jsonb) from public, anon;
grant execute on function public.teach_set_profile(text, text) to authenticated;
grant execute on function public.teach_profile() to authenticated;
grant execute on function public.teach_create_class(text, text, jsonb) to authenticated;
grant execute on function public.teach_my_classes() to authenticated;
grant execute on function public.teach_update_class(uuid, jsonb) to authenticated;
grant execute on function public.teach_delete_class(uuid) to authenticated;
grant execute on function public.teach_class_report(uuid) to authenticated;
grant execute on function public.teach_save_assignment(uuid, uuid, jsonb) to authenticated;
grant execute on function public.teach_delete_assignment(uuid) to authenticated;
grant execute on function public.teach_set_member(uuid, uuid, jsonb) to authenticated;
grant execute on function public.class_preview(text) to authenticated;
grant execute on function public.class_join(text, text) to authenticated;
grant execute on function public.class_leave(uuid) to authenticated;
grant execute on function public.class_mine() to authenticated;
grant execute on function public.class_push(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. Teacher classes v2 (docs/teacher-classes.md, migrations/2026-11c-classes-v2.sql): co-teachers,
-- announcements, copy a class, mastery and exam controls, teacher questions, live mode, departments.
-- Redefines teach_my_classes, teach_update_class, teach_class_report, teach_save_assignment,
-- teach_set_member and class_mine from section 9; the later definitions below are the current ones.
-- ---------------------------------------------------------------------------

alter table public.classes add column if not exists coteach_code text unique;
alter table public.classes add column if not exists dept_shared boolean not null default false;
alter table public.classes add column if not exists dept_stats jsonb;
alter table public.classes add column if not exists dept_stats_at timestamptz;
alter table public.teacher_profiles add column if not exists dept_code text;

create table if not exists public.class_coteachers (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index if not exists class_coteachers_user_idx on public.class_coteachers (user_id);
alter table public.class_coteachers enable row level security;

create table if not exists public.class_announcements (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  author_id  uuid references auth.users (id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists class_announcements_class_idx on public.class_announcements (class_id, created_at);
alter table public.class_announcements enable row level security;

create table if not exists public.class_questions (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  course     text not null,
  topic      text,
  unit       text,
  type       text not null default 'single',
  q          text not null,
  options    jsonb not null,
  correct    integer not null,
  why        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists class_questions_teacher_idx on public.class_questions (teacher_id, course);
alter table public.class_questions enable row level security;
-- topic and unit end up in links on the course pages: ids only.
alter table public.class_questions drop constraint if exists class_questions_slug_check;
alter table public.class_questions add constraint class_questions_slug_check
  check ((topic is null or topic ~ '^[a-z0-9][a-z0-9-]{0,79}$') and (unit is null or unit ~ '^[a-z0-9][a-z0-9-]{0,79}$'));

-- A student's picks on an assignment's teacher questions, recorded once (class_submit).
create table if not exists public.class_submissions (
  assignment_id uuid not null references public.class_assignments (id) on delete cascade,
  student_id    uuid not null references auth.users (id) on delete cascade,
  picks         jsonb not null,
  at            timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
alter table public.class_submissions enable row level security;

create table if not exists public.teach_departments (
  code       text primary key,
  name       text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.teach_departments enable row level security;

create table if not exists public.class_live (
  class_id   uuid primary key references public.classes (id) on delete cascade,
  idx        integer not null default 1,
  item       jsonb not null,
  reveal     boolean not null default false,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.class_live enable row level security;

create table if not exists public.class_live_answers (
  class_id   uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  idx        integer not null,
  pick       integer not null,
  at         timestamptz not null default now(),
  primary key (class_id, student_id, idx)
);
alter table public.class_live_answers enable row level security;

revoke all on table public.class_coteachers, public.class_announcements, public.class_questions, public.class_submissions, public.teach_departments, public.class_live, public.class_live_answers from anon, authenticated;

-- dept_stats as the department may see it: whitelisted numbers and unit keys only, so no name can get in.
create or replace function public.class_clean_stats(s jsonb)
returns jsonb
language sql
immutable
security definer
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'n', case when jsonb_typeof(s->'n') = 'number' then s->'n' end,
    'active7', case when jsonb_typeof(s->'active7') = 'number' then s->'active7' end,
    'assigned', case when jsonb_typeof(s->'assigned') = 'number' then s->'assigned' end,
    'onTime', case when jsonb_typeof(s->'onTime') = 'number' then s->'onTime' end,
    'overall', case when jsonb_typeof(s->'overall') = 'number' then s->'overall' end,
    'current', case when s->>'current' ~ '^[a-z0-9-]{1,40}$' then s->'current' end,
    'order', (select jsonb_agg(e) from (select e from jsonb_array_elements(case when jsonb_typeof(s->'order') = 'array' then s->'order' else '[]'::jsonb end) e
               where e #>> '{}' ~ '^[a-z0-9-]{1,40}$' and jsonb_typeof(e) = 'string' limit 40) x),
    'units', (select jsonb_object_agg(k, v) from (select k, v from jsonb_each(case when jsonb_typeof(s->'units') = 'object' then s->'units' else '{}'::jsonb end) t(k, v)
               where k ~ '^[a-z0-9-]{1,40}$' and jsonb_typeof(v) = 'number' limit 40) y)));
$$;

-- An assignment's student list: null (everyone) or at most 200 uuids. False when it is anything else.
create or replace function public.class_students_ok(p jsonb)
returns boolean
language sql
immutable
security definer
set search_path = public
as $$
  select p is null or jsonb_typeof(p) = 'null'
      or (jsonb_typeof(p) = 'array' and jsonb_array_length(p) <= 200
          and not exists (select 1 from jsonb_array_elements(p) e
                           where jsonb_typeof(e) <> 'string' or e #>> '{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'));
$$;

-- 'owner', 'co' (a co-teacher) or null: what the signed-in account may do in a class.
create or replace function public.class_role(p_class uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when c.teacher_id = auth.uid() then 'owner'
              when exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = auth.uid()) then 'co' end
    from public.classes c
   where c.id = p_class and auth.uid() is not null;
$$;

create or replace function public.teach_my_classes()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'course', c.course, 'name', c.name, 'code', c.code,
           'current_unit', c.current_unit, 'archived', c.archived, 'created_at', c.created_at,
           'role', case when c.teacher_id = auth.uid() then 'owner' else 'co' end, 'teacher', p.display_name,
           'members', (select count(*) from public.class_members m where m.class_id = c.id))
           order by c.archived, c.created_at), '[]'::jsonb)
    from public.classes c
    left join public.teacher_profiles p on p.user_id = c.teacher_id
   where auth.uid() is not null
     and (c.teacher_id = auth.uid() or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = auth.uid()));
$$;

-- p_patch: name, unit_order, current_unit, new_code, dept_stats (any teacher of the class);
-- archived and dept_shared (the owner only).
create or replace function public.teach_update_class(p_class uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classes;
  r text := public.class_role(p_class);
begin
  if r is null then return null; end if;
  select * into c from public.classes where id = p_class;
  if p_patch ? 'name' and length(btrim(p_patch->>'name')) between 1 and 60 then c.name := btrim(p_patch->>'name'); end if;
  if p_patch ? 'unit_order' and jsonb_typeof(p_patch->'unit_order') = 'array' and jsonb_array_length(p_patch->'unit_order') <= 40 and octet_length((p_patch->'unit_order')::text) <= 2000 then c.unit_order := p_patch->'unit_order'; end if;
  if p_patch ? 'current_unit' then c.current_unit := left(p_patch->>'current_unit', 60); end if;
  if r = 'owner' and p_patch ? 'archived' then c.archived := coalesce((p_patch->>'archived')::boolean, c.archived); end if;
  if r = 'owner' and p_patch ? 'dept_shared' then c.dept_shared := coalesce((p_patch->>'dept_shared')::boolean, c.dept_shared); end if;
  if p_patch ? 'dept_stats' and jsonb_typeof(p_patch->'dept_stats') = 'object' and octet_length((p_patch->'dept_stats')::text) <= 4000 then
    c.dept_stats := public.class_clean_stats(p_patch->'dept_stats'); c.dept_stats_at := now();
  end if;
  if coalesce((p_patch->>'new_code')::boolean, false) then c.code := public.class_new_code(); end if;
  update public.classes set name = c.name, unit_order = c.unit_order, current_unit = c.current_unit,
         archived = c.archived, code = c.code, dept_shared = c.dept_shared, dept_stats = c.dept_stats,
         dept_stats_at = c.dept_stats_at, updated_at = now()
   where id = c.id;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

-- Everything the teacher's page needs in one read, for the owner or a co-teacher.
create or replace function public.teach_class_report(p_class uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'class', jsonb_build_object('id', c.id, 'course', c.course, 'name', c.name, 'code', c.code,
                                       'unit_order', c.unit_order, 'current_unit', c.current_unit,
                                       'archived', c.archived, 'created_at', c.created_at,
                                       'role', public.class_role(c.id), 'owner_name', op.display_name,
                                       'coteach_code', case when c.teacher_id = auth.uid() then c.coteach_code end,
                                       'dept_shared', c.dept_shared),
           'coteachers', coalesce((select jsonb_agg(jsonb_build_object('id', t.user_id, 'name', coalesce(tp.display_name, 'Teacher'), 'added_at', t.added_at) order by t.added_at)
                       from public.class_coteachers t left join public.teacher_profiles tp on tp.user_id = t.user_id where t.class_id = c.id), '[]'::jsonb),
           'announcements', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'body', n.body, 'created_at', n.created_at,
                         'author', coalesce(np.display_name, 'Teacher'), 'mine', n.author_id = auth.uid()) order by n.created_at desc)
                       from (select * from public.class_announcements where class_id = c.id order by created_at desc limit 50) n
                       left join public.teacher_profiles np on np.user_id = n.author_id), '[]'::jsonb),
           'members', coalesce((select jsonb_agg(jsonb_build_object(
                         'id', m.student_id, 'name', m.name, 'joined_at', m.joined_at,
                         'extra_days', m.extra_days, 'extra_time', m.extra_time,
                         'summary', m.summary, 'summary_at', m.summary_at) order by m.name)
                       from public.class_members m where m.class_id = c.id), '[]'::jsonb),
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
                         'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec,
                         'opens_at', a.opens_at, 'due_at', a.due_at, 'late_until', a.late_until,
                         'required', a.required, 'students', a.students, 'created_at', a.created_at) order by a.opens_at desc)
                       from public.class_assignments a where a.class_id = c.id), '[]'::jsonb))
    from public.classes c
    left join public.teacher_profiles op on op.user_id = c.teacher_id
   where c.id = p_class and public.class_role(c.id) is not null;
$$;

create or replace function public.teach_save_assignment(p_class uuid, p_id uuid, p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or public.class_role(p_class) is null then return null; end if;
  if coalesce(p_data->>'kind', '') not in ('practice', 'review', 'mastery', 'exam', 'frq') then return null; end if;
  if length(coalesce(p_data->>'title', '')) not between 1 and 120 then return null; end if;
  if octet_length(coalesce(p_data->'spec', '{}'::jsonb)::text) > 20000 then return null; end if;
  if not public.class_students_ok(p_data->'students') then return null; end if;
  if p_id is null then
    if (select count(*) from public.class_assignments where class_id = p_class) >= 500 then return null; end if;
    insert into public.class_assignments (class_id, kind, title, spec, opens_at, due_at, late_until, required, students)
    values (p_class, p_data->>'kind', p_data->>'title', coalesce(p_data->'spec', '{}'::jsonb),
            coalesce((p_data->>'opens_at')::timestamptz, now()), (p_data->>'due_at')::timestamptz,
            (p_data->>'late_until')::timestamptz, coalesce((p_data->>'required')::boolean, true),
            case when jsonb_typeof(p_data->'students') = 'array' then p_data->'students' else null end)
    returning id into v_id;
  else
    update public.class_assignments
       set kind = p_data->>'kind', title = p_data->>'title', spec = coalesce(p_data->'spec', '{}'::jsonb),
           opens_at = coalesce((p_data->>'opens_at')::timestamptz, opens_at), due_at = (p_data->>'due_at')::timestamptz,
           late_until = (p_data->>'late_until')::timestamptz, required = coalesce((p_data->>'required')::boolean, true),
           students = case when jsonb_typeof(p_data->'students') = 'array' then p_data->'students' else null end,
           updated_at = now()
     where id = p_id and class_id = p_class
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Accommodations (any teacher of the class), or removing a student (the owner only).
create or replace function public.teach_set_member(p_class uuid, p_student uuid, p_patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r text := public.class_role(p_class);
begin
  if r is null then return false; end if;
  if coalesce((p_patch->>'remove')::boolean, false) then
    if r <> 'owner' then return false; end if;
    delete from public.class_members where class_id = p_class and student_id = p_student;
    return found;
  end if;
  update public.class_members
     set extra_days = greatest(0, least(14, coalesce((p_patch->>'extra_days')::integer, extra_days))),
         extra_time = greatest(1, least(3, coalesce((p_patch->>'extra_time')::numeric, extra_time)))
   where class_id = p_class and student_id = p_student;
  return found;
end;
$$;

-- A student's classes, each with the assignments meant for them, their due
-- dates moved by their own extra days, and the class's latest announcements.
create or replace function public.class_mine()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'course', c.course, 'name', c.name, 'teacher', p.display_name,
           'unit_order', c.unit_order, 'current_unit', c.current_unit, 'joined_at', m.joined_at,
           'extra_time', m.extra_time,
           'live', exists (select 1 from public.class_live l where l.class_id = c.id),
           'announcements', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'body', n.body, 'created_at', n.created_at) order by n.created_at desc)
             from (select * from public.class_announcements where class_id = c.id order by created_at desc limit 5) n), '[]'::jsonb),
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
               'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec, 'opens_at', a.opens_at,
               'due_at', a.due_at + make_interval(days => m.extra_days),
               'late_until', a.late_until + make_interval(days => m.extra_days),
               'required', a.required) order by a.due_at nulls last)
             from public.class_assignments a
            where a.class_id = c.id and a.opens_at <= now()
              and (a.students is null or a.students ? m.student_id::text)), '[]'::jsonb))
           order by m.joined_at), '[]'::jsonb)
    from public.class_members m
    join public.classes c on c.id = m.class_id and not c.archived
    left join public.teacher_profiles p on p.user_id = c.teacher_id
   where m.student_id = auth.uid() and auth.uid() is not null;
$$;

-- A copy of a class for another period or next year: same course and order,
-- every assignment moved by p_shift_days, no students, a new join code.
create or replace function public.teach_copy_class(p_class uuid, p_name text, p_shift_days integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  src public.classes;
  c public.classes;
  d interval := make_interval(days => greatest(-400, least(400, coalesce(p_shift_days, 0))));
  q public.class_questions;
  qmap jsonb := '{}'::jsonb;
  v_id uuid;
begin
  if auth.uid() is null or public.class_role(p_class) is null then return null; end if;
  if not exists (select 1 from public.teacher_profiles where user_id = auth.uid()) then return null; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 60 then return null; end if;
  if (select count(*) from public.classes where teacher_id = auth.uid() and not archived) >= 30 then return null; end if;
  select * into src from public.classes where id = p_class;
  insert into public.classes (teacher_id, course, name, code, unit_order)
  values (auth.uid(), src.course, btrim(p_name), public.class_new_code(), src.unit_order)
  returning * into c;
  -- Questions another teacher of the source class wrote become the copier's own, so the copy keeps working.
  for q in select distinct on (cq.id) cq.*
             from public.class_assignments a
             cross join lateral jsonb_array_elements_text(case when jsonb_typeof(a.spec->'controls'->'questions') = 'array' then a.spec->'controls'->'questions' else '[]'::jsonb end) qid
             join public.class_questions cq on cq.id::text = qid
            where a.class_id = p_class and cq.teacher_id <> auth.uid() and cq.course = src.course
              and (cq.teacher_id = src.teacher_id or exists (select 1 from public.class_coteachers t where t.class_id = p_class and t.user_id = cq.teacher_id))
  loop
    insert into public.class_questions (teacher_id, course, topic, unit, type, q, options, correct, why)
    values (auth.uid(), q.course, q.topic, q.unit, q.type, q.q, q.options, q.correct, q.why) returning id into v_id;
    qmap := qmap || jsonb_build_object(q.id::text, v_id::text);
  end loop;
  insert into public.class_assignments (class_id, kind, title, spec, opens_at, due_at, late_until, required, students)
  select c.id, a.kind, a.title,
         case when jsonb_typeof(a.spec->'controls'->'questions') = 'array'
              then jsonb_set(a.spec, '{controls,questions}', (select coalesce(jsonb_agg(coalesce(qmap->>e, e)), '[]'::jsonb) from jsonb_array_elements_text(a.spec->'controls'->'questions') e))
              else a.spec end,
         a.opens_at + d, a.due_at + d, a.late_until + d, a.required, null
    from public.class_assignments a where a.class_id = p_class;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

create or replace function public.teach_post_announcement(p_class uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or public.class_role(p_class) is null then return null; end if;
  if p_body is null or length(btrim(p_body)) < 1 or length(p_body) > 1000 then return null; end if;
  if (select count(*) from public.class_announcements where class_id = p_class) >= 300 then
    delete from public.class_announcements where id in (select id from public.class_announcements where class_id = p_class order by created_at limit 1);
  end if;
  insert into public.class_announcements (class_id, author_id, body) values (p_class, auth.uid(), btrim(p_body)) returning id into v_id;
  return v_id;
end;
$$;

-- The author, or the class's owner.
create or replace function public.teach_delete_announcement(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.class_announcements n
   using public.classes c
   where n.id = p_id and c.id = n.class_id and auth.uid() is not null
     and (n.author_id = auth.uid() or c.teacher_id = auth.uid());
  return found;
end;
$$;

-- The owner makes (or remakes) the code a co-teacher joins with.
create or replace function public.teach_coteach_code(p_class uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v text;
begin
  if public.class_role(p_class) is distinct from 'owner' then return null; end if;
  loop
    v := public.class_new_code();
    exit when not exists (select 1 from public.classes where coteach_code = v);
  end loop;
  update public.classes set coteach_code = v, updated_at = now() where id = p_class;
  return v;
end;
$$;

create or replace function public.teach_coteach_join(p_code text)
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
  if not public.class_code_try() then return null; end if;
  select * into c from public.classes where coteach_code = upper(btrim(p_code)) and not archived;
  if not found or c.teacher_id = auth.uid() then return null; end if;
  if (select count(*) from public.class_coteachers where class_id = c.id) >= 10 then return null; end if;
  if (select count(*) from public.class_coteachers where user_id = auth.uid()) >= 30 then return null; end if;
  insert into public.class_coteachers (class_id, user_id) values (c.id, auth.uid()) on conflict do nothing;
  return jsonb_build_object('id', c.id, 'name', c.name, 'course', c.course);
end;
$$;

-- The owner removes a co-teacher; a co-teacher removes themself.
create or replace function public.teach_coteach_remove(p_class uuid, p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  if public.class_role(p_class) is distinct from 'owner' and p_user is distinct from auth.uid() then return false; end if;
  delete from public.class_coteachers where class_id = p_class and user_id = p_user;
  return found;
end;
$$;

-- The teacher's own questions in one course.
create or replace function public.teach_questions(p_course text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'course', q.course, 'topic', q.topic, 'unit', q.unit, 'type', q.type,
           'q', q.q, 'options', q.options, 'correct', q.correct, 'why', q.why, 'updated_at', q.updated_at) order by q.created_at), '[]'::jsonb)
    from public.class_questions q
   where q.teacher_id = auth.uid() and auth.uid() is not null and q.course = p_course;
$$;

-- p_data: { course, topic, unit, q, options: [2..6 strings], correct, why }. Single choice only.
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
  if coalesce(p_data->>'course', '') !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|aphug)$' then return null; end if;
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

create or replace function public.teach_delete_question(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.class_questions where id = p_id and teacher_id = auth.uid() and auth.uid() is not null;
  return found;
end;
$$;

-- Whether a student may see the answers (correct, why) to an assignment's teacher questions now:
-- release 'now' (or none), the student's own due date has passed, or release 'after_submit' (or
-- 'after_due' with no due date) once they have submitted with class_submit.
create or replace function public.class_answers_open(a public.class_assignments, p_extra_days integer, p_submitted boolean)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(a.spec->'controls'->>'release', 'now') not in ('after_submit', 'after_due')
      or (a.due_at is not null and now() > a.due_at + make_interval(days => coalesce(p_extra_days, 0)))
      or (p_submitted and (a.spec->'controls'->>'release' = 'after_submit' or a.due_at is null));
$$;

-- A student's teacher questions for one assignment: only an assignment of a
-- class they are in, that has opened and is meant for them, and only questions
-- written by a teacher of that class. correct and why are left out until
-- class_answers_open says so.
create or replace function public.class_questions_for(p_assignment uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(case when public.class_answers_open(a, m.extra_days, exists (select 1 from public.class_submissions s where s.assignment_id = a.id and s.student_id = m.student_id))
           then jsonb_build_object('id', q.id, 'course', q.course, 'topic', q.topic, 'unit', q.unit, 'type', q.type, 'q', q.q, 'options', q.options, 'correct', q.correct, 'why', q.why)
           else jsonb_build_object('id', q.id, 'course', q.course, 'topic', q.topic, 'unit', q.unit, 'type', q.type, 'q', q.q, 'options', q.options) end), '[]'::jsonb)
    from public.class_assignments a
    join public.classes c on c.id = a.class_id and not c.archived
    join public.class_members m on m.class_id = c.id and m.student_id = auth.uid()
    join public.class_questions q on q.course = c.course
     and jsonb_typeof(a.spec->'controls'->'questions') = 'array'
     and (a.spec->'controls'->'questions') ? q.id::text
     and (q.teacher_id = c.teacher_id or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = q.teacher_id))
   where a.id = p_assignment and auth.uid() is not null and a.opens_at <= now()
     and (a.students is null or a.students ? m.student_id::text);
$$;

-- The student hands in their picks on the assignment's teacher questions, once (a second call changes
-- nothing). p_picks: { <question id>: <option index> }, only ids the assignment lists. Returns
-- { recorded: true, at, answers: [{ id, correct, why }] } when the answers may show (see
-- class_answers_open), else { recorded: true, at }; null when the assignment is not theirs.
create or replace function public.class_submit(p_assignment uuid, p_picks jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.class_assignments;
  m public.class_members;
  ids jsonb;
  v_at timestamptz;
begin
  if auth.uid() is null or p_picks is null or jsonb_typeof(p_picks) <> 'object' or octet_length(p_picks::text) > 8000 then return null; end if;
  select * into a from public.class_assignments where id = p_assignment and opens_at <= now();
  if not found then return null; end if;
  select * into m from public.class_members where class_id = a.class_id and student_id = auth.uid();
  if not found or not (a.students is null or a.students ? auth.uid()::text) then return null; end if;
  if exists (select 1 from public.classes where id = a.class_id and archived) then return null; end if;
  ids := case when jsonb_typeof(a.spec->'controls'->'questions') = 'array' then a.spec->'controls'->'questions' else '[]'::jsonb end;
  if exists (select 1 from jsonb_each(p_picks) e where not ids ? e.key or jsonb_typeof(e.value) <> 'number') then return null; end if;
  insert into public.class_submissions (assignment_id, student_id, picks) values (a.id, auth.uid(), p_picks)
  on conflict (assignment_id, student_id) do nothing;
  select s.at into v_at from public.class_submissions s where s.assignment_id = a.id and s.student_id = auth.uid();
  if not public.class_answers_open(a, m.extra_days, true) then return jsonb_build_object('recorded', true, 'at', v_at); end if;
  return jsonb_build_object('recorded', true, 'at', v_at, 'answers', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'correct', q.correct, 'why', q.why))
    from public.class_questions q join public.classes c on c.id = a.class_id
   where ids ? q.id::text and q.course = c.course
     and (q.teacher_id = c.teacher_id or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = q.teacher_id))), '[]'::jsonb));
end;
$$;

-- For the teacher's own pages (print, live): every question this class's assignments use, whoever of its
-- teachers wrote it.
create or replace function public.teach_class_questions(p_class uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(distinct jsonb_build_object('id', q.id, 'course', q.course, 'topic', q.topic, 'unit', q.unit, 'type', q.type,
           'q', q.q, 'options', q.options, 'correct', q.correct, 'why', q.why)), '[]'::jsonb)
    from public.classes c
    join public.class_assignments a on a.class_id = c.id and jsonb_typeof(a.spec->'controls'->'questions') = 'array'
    join public.class_questions q on (a.spec->'controls'->'questions') ? q.id::text and q.course = c.course
     and (q.teacher_id = c.teacher_id or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = q.teacher_id))
   where c.id = p_class and public.class_role(p_class) is not null;
$$;

/* ------------------------------------------------------------- live mode */

-- Show a question (a new one each call: the counter moves on and earlier answers stay with their question).
-- p_item: { id, q, options, correct, why, topic }; students never get correct or why before the reveal.
create or replace function public.teach_live_show(p_class uuid, p_item jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v integer;
begin
  if public.class_role(p_class) is null then return null; end if;
  if p_item is null or jsonb_typeof(p_item) <> 'object' or jsonb_typeof(p_item->'options') <> 'array' or octet_length(p_item::text) > 20000 then return null; end if;
  insert into public.class_live (class_id, idx, item) values (p_class, 1, p_item)
  on conflict (class_id) do update set idx = class_live.idx + 1, item = excluded.item, reveal = false, updated_at = now()
  returning idx into v;
  delete from public.class_live_answers where class_id = p_class and idx < v - 50;
  return v;
end;
$$;

create or replace function public.teach_live_reveal(p_class uuid, p_reveal boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.class_role(p_class) is null then return false; end if;
  update public.class_live set reveal = coalesce(p_reveal, true), updated_at = now() where class_id = p_class;
  return found;
end;
$$;

create or replace function public.teach_live_stop(p_class uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.class_role(p_class) is null then return false; end if;
  delete from public.class_live_answers where class_id = p_class;
  delete from public.class_live where class_id = p_class;
  return true;
end;
$$;

-- The teacher's poll (every 2 s while the live view is open): the question and who answered what.
create or replace function public.teach_live_state(p_class uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when l.class_id is null then jsonb_build_object('open', false) else jsonb_build_object(
           'open', true, 'idx', l.idx, 'item', l.item, 'reveal', l.reveal, 'started_at', l.started_at,
           'members', (select count(*) from public.class_members m where m.class_id = p_class),
           'answers', coalesce((select jsonb_agg(jsonb_build_object('id', a.student_id, 'name', m.name, 'pick', a.pick, 'at', a.at) order by a.at)
              from public.class_live_answers a join public.class_members m on m.class_id = a.class_id and m.student_id = a.student_id
             where a.class_id = p_class and a.idx = l.idx), '[]'::jsonb)) end
    from (select 1) one
    left join public.class_live l on l.class_id = p_class
   where public.class_role(p_class) is not null;
$$;

-- The student's poll (every 2 s on /live.html): each of their classes with a session open.
create or replace function public.class_live_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'class_id', c.id, 'class', c.name, 'course', c.course, 'teacher', p.display_name, 'idx', l.idx, 'reveal', l.reveal,
           'item', case when l.reveal then l.item else l.item - 'correct' - 'why' end,
           'mine', (select a.pick from public.class_live_answers a where a.class_id = c.id and a.student_id = auth.uid() and a.idx = l.idx),
           'counts', case when l.reveal then (select coalesce(jsonb_object_agg(x.pick, x.n), '{}'::jsonb)
              from (select a.pick, count(*) n from public.class_live_answers a where a.class_id = c.id and a.idx = l.idx group by a.pick) x) end)
           order by l.updated_at desc), '[]'::jsonb)
    from public.class_members m
    join public.classes c on c.id = m.class_id and not c.archived
    join public.class_live l on l.class_id = c.id
    left join public.teacher_profiles p on p.user_id = c.teacher_id
   where m.student_id = auth.uid() and auth.uid() is not null;
$$;

-- A student's answer to the question showing now; they may change it until the reveal.
create or replace function public.class_live_answer(p_class uuid, p_idx integer, p_pick integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.class_live;
begin
  if auth.uid() is null then return false; end if;
  if not exists (select 1 from public.class_members where class_id = p_class and student_id = auth.uid()) then return false; end if;
  select * into l from public.class_live where class_id = p_class;
  if not found or l.idx <> p_idx or l.reveal then return false; end if;
  if p_pick is null or p_pick < 0 or p_pick >= jsonb_array_length(l.item->'options') then return false; end if;
  insert into public.class_live_answers (class_id, student_id, idx, pick) values (p_class, auth.uid(), p_idx, p_pick)
  on conflict (class_id, student_id, idx) do update set pick = excluded.pick, at = now();
  return true;
end;
$$;

/* ------------------------------------------------------------- departments */

create or replace function public.teach_dept_create(p_name text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v text;
begin
  if auth.uid() is null or not exists (select 1 from public.teacher_profiles where user_id = auth.uid()) then return null; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 80 then return null; end if;
  if (select count(*) from public.teach_departments where created_by = auth.uid()) >= 5 then return null; end if;
  loop
    v := public.class_new_code();
    exit when not exists (select 1 from public.teach_departments where code = v);
  end loop;
  insert into public.teach_departments (code, name, created_by) values (v, btrim(p_name), auth.uid());
  update public.teacher_profiles set dept_code = v where user_id = auth.uid();
  return v;
end;
$$;

create or replace function public.teach_dept_join(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.teacher_profiles where user_id = auth.uid()) then return false; end if;
  if not public.class_code_try() then return false; end if;
  if not exists (select 1 from public.teach_departments where code = upper(btrim(p_code))) then return false; end if;
  -- Switching departments stops sharing: the new department sees a class only once it is shared again.
  if (select dept_code from public.teacher_profiles where user_id = auth.uid()) is distinct from upper(btrim(p_code)) then
    update public.classes set dept_shared = false where teacher_id = auth.uid();
  end if;
  update public.teacher_profiles set dept_code = upper(btrim(p_code)) where user_id = auth.uid();
  return true;
end;
$$;

-- Leaving also stops sharing this teacher's classes.
create or replace function public.teach_dept_leave()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  update public.teacher_profiles set dept_code = null where user_id = auth.uid();
  update public.classes set dept_shared = false where teacher_id = auth.uid();
  return true;
end;
$$;

-- The department: its teachers and the classes they share, with the numbers
-- their own pages wrote (dept_stats: counts and averages, never a student's name).
create or replace function public.teach_dept_view()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('code', d.code, 'name', d.name,
           'teachers', coalesce((select jsonb_agg(tp.display_name order by tp.display_name) from public.teacher_profiles tp where tp.dept_code = d.code), '[]'::jsonb),
           'classes', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'course', c.course, 'teacher', tp.display_name,
                 'mine', c.teacher_id = auth.uid(), 'members', (select count(*) from public.class_members m where m.class_id = c.id),
                 'stats', c.dept_stats, 'stats_at', c.dept_stats_at) order by c.course, tp.display_name, c.name)
               from public.classes c join public.teacher_profiles tp on tp.user_id = c.teacher_id
              where tp.dept_code = d.code and c.dept_shared and not c.archived), '[]'::jsonb))
    from public.teacher_profiles me
    join public.teach_departments d on d.code = me.dept_code
   where me.user_id = auth.uid() and auth.uid() is not null;
$$;

revoke execute on function public.class_role(uuid) from public, anon, authenticated;
revoke execute on function public.class_clean_stats(jsonb) from public, anon, authenticated;
revoke execute on function public.class_students_ok(jsonb) from public, anon, authenticated;
revoke execute on function public.class_answers_open(public.class_assignments, integer, boolean) from public, anon, authenticated;
revoke execute on function public.class_submit(uuid, jsonb) from public, anon;
revoke execute on function public.teach_class_questions(uuid) from public, anon;
grant execute on function public.class_submit(uuid, jsonb) to authenticated;
grant execute on function public.teach_class_questions(uuid) to authenticated;
revoke execute on function public.teach_copy_class(uuid, text, integer) from public, anon;
revoke execute on function public.teach_post_announcement(uuid, text) from public, anon;
revoke execute on function public.teach_delete_announcement(uuid) from public, anon;
revoke execute on function public.teach_coteach_code(uuid) from public, anon;
revoke execute on function public.teach_coteach_join(text) from public, anon;
revoke execute on function public.teach_coteach_remove(uuid, uuid) from public, anon;
revoke execute on function public.teach_questions(text) from public, anon;
revoke execute on function public.teach_save_question(uuid, jsonb) from public, anon;
revoke execute on function public.teach_delete_question(uuid) from public, anon;
revoke execute on function public.class_questions_for(uuid) from public, anon;
revoke execute on function public.teach_live_show(uuid, jsonb) from public, anon;
revoke execute on function public.teach_live_reveal(uuid, boolean) from public, anon;
revoke execute on function public.teach_live_stop(uuid) from public, anon;
revoke execute on function public.teach_live_state(uuid) from public, anon;
revoke execute on function public.class_live_state() from public, anon;
revoke execute on function public.class_live_answer(uuid, integer, integer) from public, anon;
revoke execute on function public.teach_dept_create(text) from public, anon;
revoke execute on function public.teach_dept_join(text) from public, anon;
revoke execute on function public.teach_dept_leave() from public, anon;
revoke execute on function public.teach_dept_view() from public, anon;
grant execute on function public.teach_my_classes() to authenticated;
grant execute on function public.teach_update_class(uuid, jsonb) to authenticated;
grant execute on function public.teach_class_report(uuid) to authenticated;
grant execute on function public.teach_save_assignment(uuid, uuid, jsonb) to authenticated;
grant execute on function public.teach_set_member(uuid, uuid, jsonb) to authenticated;
grant execute on function public.class_mine() to authenticated;
grant execute on function public.teach_copy_class(uuid, text, integer) to authenticated;
grant execute on function public.teach_post_announcement(uuid, text) to authenticated;
grant execute on function public.teach_delete_announcement(uuid) to authenticated;
grant execute on function public.teach_coteach_code(uuid) to authenticated;
grant execute on function public.teach_coteach_join(text) to authenticated;
grant execute on function public.teach_coteach_remove(uuid, uuid) to authenticated;
grant execute on function public.teach_questions(text) to authenticated;
grant execute on function public.teach_save_question(uuid, jsonb) to authenticated;
grant execute on function public.teach_delete_question(uuid) to authenticated;
grant execute on function public.class_questions_for(uuid) to authenticated;
grant execute on function public.teach_live_show(uuid, jsonb) to authenticated;
grant execute on function public.teach_live_reveal(uuid, boolean) to authenticated;
grant execute on function public.teach_live_stop(uuid) to authenticated;
grant execute on function public.teach_live_state(uuid) to authenticated;
grant execute on function public.class_live_state() to authenticated;
grant execute on function public.class_live_answer(uuid, integer, integer) to authenticated;
grant execute on function public.teach_dept_create(text) to authenticated;
grant execute on function public.teach_dept_join(text) to authenticated;
grant execute on function public.teach_dept_leave() to authenticated;
grant execute on function public.teach_dept_view() to authenticated;

-- ---------------------------------------------------------------------------
-- 11. Teacher class integrations (docs/teacher-classes.md stream C, migrations/2026-11d-classes-integrations.sql)
-- ---------------------------------------------------------------------------

create table if not exists public.class_coteachers (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index if not exists class_coteachers_user_idx on public.class_coteachers (user_id);
alter table public.class_coteachers enable row level security;

-- ---------------------------------------------------------------- reminder emails (Worker only)

create table if not exists public.class_mail_log (
  id         bigserial primary key,
  kind       text not null check (kind in ('remind', 'invite')),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  student_id uuid references auth.users (id) on delete cascade,
  recipient  text,
  sent_at    timestamptz not null default now()
);
create index if not exists class_mail_log_teacher_idx on public.class_mail_log (teacher_id, kind, sent_at);
create index if not exists class_mail_log_student_idx on public.class_mail_log (student_id, kind, sent_at);
create index if not exists class_mail_log_recipient_idx on public.class_mail_log (recipient, kind, sent_at);
alter table public.class_mail_log enable row level security;

create table if not exists public.class_email_optout (
  student_id uuid primary key references auth.users (id) on delete cascade,
  at         timestamptz not null default now()
);
alter table public.class_email_optout enable row level security;

-- "Stop" pressed in an invite (someone who may have no account): a SHA-256 of the lower-cased address only.
create table if not exists public.class_email_optout_addr (
  email_hash text primary key,
  at         timestamptz not null default now()
);
alter table public.class_email_optout_addr enable row level security;

-- ---------------------------------------------------------------- family progress reports (Worker only)

create table if not exists public.class_report_links (
  token_hash text primary key,
  class_id   uuid not null,
  student_id uuid not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  foreign key (class_id, student_id) references public.class_members (class_id, student_id) on delete cascade
);
create index if not exists class_report_links_member_idx on public.class_report_links (class_id, student_id);
alter table public.class_report_links enable row level security;

-- ---------------------------------------------------------------- Google Classroom and LTI (Worker only)

-- One row per teacher and provider. refresh_enc is AES-GCM ciphertext made by the Worker (CLASS_SECRET);
-- the database never sees the token itself.
create table if not exists public.class_oauth (
  teacher_id    uuid not null references auth.users (id) on delete cascade,
  provider      text not null check (provider in ('google')),
  refresh_enc   text not null,
  account_email text,
  scopes        text,
  created_at    timestamptz not null default now(),
  primary key (teacher_id, provider)
);
alter table public.class_oauth enable row level security;

-- LMS platforms a school registered (issuer + client id from its developer key).
create table if not exists public.lti_platforms (
  id             uuid primary key default gen_random_uuid(),
  issuer         text not null,
  client_id      text not null,
  deployment_ids jsonb not null default '[]'::jsonb,
  auth_url       text not null,
  token_url      text not null,
  jwks_url       text not null,
  label          text,
  status         text not null default 'pending' check (status in ('pending', 'active')),
  registered_by  uuid not null references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (issuer, client_id)
);
alter table public.lti_platforms enable row level security;

-- Launch nonces already used, so a captured launch cannot be replayed (kept a day).
create table if not exists public.lti_nonces (
  nonce      text primary key,
  expires_at timestamptz not null
);
alter table public.lti_nonces enable row level security;

-- A class's course in the other system: a Classroom course id, or an LMS context (platform + context id).
create table if not exists public.class_ext_links (
  class_id    uuid not null references public.classes (id) on delete cascade,
  provider    text not null check (provider in ('google', 'lti')),
  platform_id uuid references public.lti_platforms (id) on delete cascade,
  external_id text not null,
  title       text,
  created_at  timestamptz not null default now(),
  primary key (class_id, provider, external_id)
);
alter table public.class_ext_links enable row level security;

-- An assignment's twin: a Classroom courseWork id, or an LTI AGS line item URL.
create table if not exists public.class_ext_assignments (
  assignment_id uuid not null references public.class_assignments (id) on delete cascade,
  provider      text not null check (provider in ('google', 'lti')),
  platform_id   uuid references public.lti_platforms (id) on delete cascade,
  external_id   text not null,
  course_id     text,
  created_at    timestamptz not null default now(),
  primary key (assignment_id, provider, external_id)
);
alter table public.class_ext_assignments enable row level security;

-- A student's id in the other system (Classroom userId, or LTI sub on one platform), for grade passback.
create table if not exists public.class_ext_members (
  class_id      uuid not null,
  student_id    uuid not null,
  provider      text not null check (provider in ('google', 'lti')),
  platform_id   uuid references public.lti_platforms (id) on delete cascade,
  external_user text not null,
  created_at    timestamptz not null default now(),
  primary key (class_id, student_id, provider),
  foreign key (class_id, student_id) references public.class_members (class_id, student_id) on delete cascade
);
alter table public.class_ext_members enable row level security;

-- ---------------------------------------------------------------- Class Premium quotes (Worker only)

create table if not exists public.class_quote_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.class_quote_requests enable row level security;

-- ---------------------------------------------------------------- teacher-scored free responses

-- answers: { <part label>: text } as the student sent it. score: { points: { <label>: [bool, ...] },
-- got, of, comment } as the teacher saved it.
create table if not exists public.class_frq_work (
  assignment_id uuid not null references public.class_assignments (id) on delete cascade,
  class_id      uuid not null,
  student_id    uuid not null,
  answers       jsonb not null,
  submitted_at  timestamptz not null default now(),
  score         jsonb,
  scored_at     timestamptz,
  primary key (assignment_id, student_id),
  foreign key (class_id, student_id) references public.class_members (class_id, student_id) on delete cascade
);
alter table public.class_frq_work enable row level security;

revoke all on table public.class_coteachers from anon, authenticated;
grant select, insert, update, delete on table public.class_coteachers to service_role;
revoke all on table public.class_mail_log, public.class_email_optout, public.class_email_optout_addr, public.class_report_links, public.class_oauth,
  public.lti_platforms, public.lti_nonces, public.class_ext_links, public.class_ext_assignments,
  public.class_ext_members, public.class_quote_requests, public.class_frq_work from anon, authenticated;
grant select, insert, update, delete on table public.class_mail_log, public.class_email_optout, public.class_email_optout_addr, public.class_report_links,
  public.class_oauth, public.lti_platforms, public.lti_nonces, public.class_ext_links, public.class_ext_assignments,
  public.class_ext_members, public.class_quote_requests, public.class_frq_work to service_role;
grant usage, select on sequence public.class_mail_log_id_seq to service_role;

-- ---------------------------------------------------------------- Worker-only functions

-- One more email of this kind from this teacher, or false. A reminder (p_student): not to a student who turned
-- teacher reminders off or got one in the last 20 hours from any teacher. An invite (p_recipient, the SHA-256 of
-- the lower-cased address): not to an address that pressed stop, or was invited in the last 7 days by anyone.
-- Either kind: at most 200 a day per teacher.
create or replace function public.class_mail_take(p_teacher uuid, p_class uuid, p_student uuid, p_kind text, p_recipient text default null)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_kind not in ('remind', 'invite') then return false; end if;
  if p_kind = 'remind' and p_student is null then return false; end if;
  if p_kind = 'invite' and (p_recipient is null or p_recipient !~ '^[0-9a-f]{64}$') then return false; end if;
  perform pg_advisory_xact_lock(hashtext('class_mail:' || p_teacher::text));
  if p_student is not null and exists (select 1 from public.class_email_optout where student_id = p_student) then return false; end if;
  if p_recipient is not null and exists (select 1 from public.class_email_optout_addr where email_hash = p_recipient) then return false; end if;
  if (select count(*) from public.class_mail_log where teacher_id = p_teacher and kind = p_kind and sent_at > now() - interval '1 day') >= 200 then return false; end if;
  if p_student is not null and exists (select 1 from public.class_mail_log where student_id = p_student and kind = p_kind and sent_at > now() - interval '20 hours') then return false; end if;
  if p_recipient is not null and exists (select 1 from public.class_mail_log where recipient = p_recipient and kind = p_kind and sent_at > now() - interval '7 days') then return false; end if;
  insert into public.class_mail_log (kind, teacher_id, class_id, student_id, recipient) values (p_kind, p_teacher, p_class, p_student, p_recipient);
  return true;
end;
$$;

-- The housekeeping the Worker's cron runs hourly: the 30-day mail log, expired report links, used launch nonces.
create or replace function public.class_purge()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  delete from public.class_mail_log where sent_at < now() - interval '30 days';
  delete from public.class_report_links where expires_at < now();
  delete from public.lti_nonces where expires_at < now();
$$;

-- The class's members with their account email, for the Worker to send to. Never returned to a browser:
-- the teacher's page does not see students' addresses.
create or replace function public.class_member_emails(p_class uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.student_id, 'name', m.name, 'email', u.email,
                                               'optout', exists (select 1 from public.class_email_optout o where o.student_id = m.student_id)
                                                         or exists (select 1 from public.class_email_optout_addr a
                                                                     where a.email_hash = encode(sha256(convert_to(lower(btrim(u.email)), 'UTF8')), 'hex')))
                            order by m.name), '[]'::jsonb)
    from public.class_members m
    join auth.users u on u.id = m.student_id
   where m.class_id = p_class;
$$;

-- A family report link's data, or null when it is unknown, expired or the student has left the class.
create or replace function public.class_report_get(p_hash text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'class', jsonb_build_object('name', c.name, 'course', c.course, 'unit_order', c.unit_order,
                                       'current_unit', c.current_unit),
           'teacher', p.display_name,
           'student', m.name,
           'expires_at', l.expires_at,
           'summary', case when m.summary is null then null else jsonb_build_object(
                         'v', m.summary->'v', 'at', m.summary->'at', 'items', m.summary->'items',
                         'exams', m.summary->'exams', 'frq', m.summary->'frq', 'done', m.summary->'done') end,
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
               'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec, 'opens_at', a.opens_at,
               'due_at', a.due_at + make_interval(days => m.extra_days),
               'late_until', a.late_until + make_interval(days => m.extra_days),
               'required', a.required,
               'teacher_score', (select w.score from public.class_frq_work w where w.assignment_id = a.id and w.student_id = m.student_id))
               order by a.due_at nulls last)
             from public.class_assignments a
            where a.class_id = c.id and a.opens_at <= now()
              and (a.students is null or a.students ? m.student_id::text)), '[]'::jsonb))
    from public.class_report_links l
    join public.class_members m on m.class_id = l.class_id and m.student_id = l.student_id
    join public.classes c on c.id = l.class_id
    left join public.teacher_profiles p on p.user_id = c.teacher_id
   where l.token_hash = p_hash and l.expires_at > now();
$$;

-- "Stop teacher reminders" from the link in a reminder email.
create or replace function public.class_email_stop(p_student uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from auth.users where id = p_student) then return false; end if;
  insert into public.class_email_optout (student_id) values (p_student) on conflict (student_id) do nothing;
  return true;
end;
$$;

-- "Stop" from an invite: by address hash, since the person may have no account.
create or replace function public.class_email_stop_addr(p_hash text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  insert into public.class_email_optout_addr (email_hash) values (p_hash) on conflict (email_hash) do nothing;
  return true;
end;
$$;

-- ---------------------------------------------------------------- free responses (browser)

-- A student sends their answer to a free-response assignment of theirs. Resending replaces it and clears any
-- score, so the teacher scores what is there now.
create or replace function public.class_frq_submit(p_assignment uuid, p_answers jsonb)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  a record;
begin
  if auth.uid() is null or p_answers is null or jsonb_typeof(p_answers) <> 'object' then return false; end if;
  if octet_length(p_answers::text) > 20000 then return false; end if;
  select x.id, x.class_id into a
    from public.class_assignments x
    join public.class_members m on m.class_id = x.class_id and m.student_id = auth.uid()
    join public.classes c on c.id = x.class_id and not c.archived
   where x.id = p_assignment and x.kind = 'frq' and x.opens_at <= now()
     and (x.students is null or x.students ? auth.uid()::text);
  if a.id is null then return false; end if;
  insert into public.class_frq_work (assignment_id, class_id, student_id, answers)
    values (a.id, a.class_id, auth.uid(), p_answers)
  on conflict (assignment_id, student_id) do update
    set answers = excluded.answers, submitted_at = now(), score = null, scored_at = null;
  return true;
end;
$$;

-- The student's own sent answers and what the teacher gave them.
create or replace function public.class_frq_mine()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('assignment', w.assignment_id, 'class', w.class_id,
                                               'submitted_at', w.submitted_at, 'score', w.score, 'scored_at', w.scored_at)
                            order by w.submitted_at desc), '[]'::jsonb)
    from public.class_frq_work w
   where w.student_id = auth.uid() and auth.uid() is not null;
$$;

-- Every answer sent for an assignment in a class the caller teaches (owner or co-teacher).
create or replace function public.teach_frq_work(p_assignment uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('student', w.student_id, 'answers', w.answers, 'submitted_at', w.submitted_at,
                                               'score', w.score, 'scored_at', w.scored_at)
                            order by w.submitted_at), '[]'::jsonb)
    from public.class_frq_work w
    join public.class_assignments a on a.id = w.assignment_id
    join public.classes c on c.id = a.class_id
   where w.assignment_id = p_assignment and auth.uid() is not null
     and (c.teacher_id = auth.uid() or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = auth.uid()));
$$;

-- The teacher's (owner's or co-teacher's) points and comment on one answer. p_score = { points: { label: [bool...] }, got, of, comment }.
create or replace function public.teach_frq_score(p_assignment uuid, p_student uuid, p_score jsonb)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  s jsonb;
begin
  if auth.uid() is null or p_score is null or jsonb_typeof(p_score) <> 'object' then return false; end if;
  if jsonb_typeof(p_score->'points') <> 'object' or jsonb_typeof(p_score->'got') <> 'number' or jsonb_typeof(p_score->'of') <> 'number' then return false; end if;
  if (p_score->>'got')::numeric < 0 or (p_score->>'got')::numeric > (p_score->>'of')::numeric or (p_score->>'of')::numeric > 100 then return false; end if;
  if octet_length(p_score::text) > 6000 then return false; end if;
  s := jsonb_build_object('points', p_score->'points', 'got', p_score->'got', 'of', p_score->'of',
                          'comment', left(coalesce(p_score->>'comment', ''), 2000));
  update public.class_frq_work w set score = s, scored_at = now()
    from public.class_assignments a
    join public.classes c on c.id = a.class_id
   where w.assignment_id = p_assignment and w.student_id = p_student and a.id = w.assignment_id
     and (c.teacher_id = auth.uid() or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = auth.uid()));
  return found;
end;
$$;

revoke execute on function public.class_mail_take(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.class_purge() from public, anon, authenticated;
revoke execute on function public.class_email_stop_addr(text) from public, anon, authenticated;
revoke execute on function public.class_member_emails(uuid) from public, anon, authenticated;
revoke execute on function public.class_report_get(text) from public, anon, authenticated;
revoke execute on function public.class_email_stop(uuid) from public, anon, authenticated;
revoke execute on function public.class_frq_submit(uuid, jsonb) from public, anon;
revoke execute on function public.class_frq_mine() from public, anon;
revoke execute on function public.teach_frq_work(uuid) from public, anon;
revoke execute on function public.teach_frq_score(uuid, uuid, jsonb) from public, anon;
grant execute on function public.class_mail_take(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.class_purge() to service_role;
grant execute on function public.class_email_stop_addr(text) to service_role;
grant execute on function public.class_member_emails(uuid) to service_role;
grant execute on function public.class_report_get(text) to service_role;
grant execute on function public.class_email_stop(uuid) to service_role;
grant execute on function public.class_frq_submit(uuid, jsonb) to authenticated;
grant execute on function public.class_frq_mine() to authenticated;
grant execute on function public.teach_frq_work(uuid) to authenticated;
grant execute on function public.teach_frq_score(uuid, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 12. Teacher classes for EMT (nremt), organic chemistry (ochem) and A&P (anp) (docs/teacher-classes.md
-- stream B, migrations/2026-11e-classes-courses.sql). Redefines teach_create_class (section 9) and
-- teach_save_question (section 10) with the three courses added to the course check; the definitions
-- below are the current ones.
-- ---------------------------------------------------------------------------

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
  if p_course !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|apmicro|aphug|nremt|ochem|anp)$' then return null; end if;
  if p_name is null or length(btrim(p_name)) < 1 or length(p_name) > 60 then return null; end if;
  if (select count(*) from public.classes where teacher_id = auth.uid() and not archived) >= 30 then return null; end if;
  insert into public.classes (teacher_id, course, name, code, unit_order)
  values (auth.uid(), p_course, btrim(p_name), public.class_new_code(),
          case when jsonb_typeof(p_unit_order) = 'array' then p_unit_order else '[]'::jsonb end)
  returning * into c;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

-- p_data: { course, topic, unit, q, options: [2..6 strings], correct, why }. Single choice only.
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
  if coalesce(p_data->>'course', '') !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|apmicro|aphug|nremt|ochem|anp)$' then return null; end if;
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

-- create or replace keeps the grants; restated so the file stands on its own.
revoke execute on function public.teach_create_class(text, text, jsonb) from public, anon;
revoke execute on function public.teach_save_question(uuid, jsonb) from public, anon;
grant execute on function public.teach_create_class(text, text, jsonb) to authenticated;
grant execute on function public.teach_save_question(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 13. Google Classroom without Classroom emails (docs/teacher-classes.md, migrations/2026-11f-classes-google-ids.sql).
-- Roster students are matched by their Google sign-in id (auth.identities), not by address; the join link is
-- posted as a Classroom announcement, at most once every 10 minutes per class. Both functions are Worker only.
-- ---------------------------------------------------------------------------

alter table public.class_ext_links add column if not exists announced_at timestamptz;

-- The members of a class whose Google sign-in is one of the Classroom user ids given, with that id.
create or replace function public.class_google_matches(p_class uuid, p_users text[])
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.student_id, 'name', m.name, 'google', g.gid) order by m.name), '[]'::jsonb)
    from public.class_members m
    cross join lateral (
      select case when i.provider_id = any (p_users) then i.provider_id else i.identity_data->>'sub' end as gid
        from auth.identities i
       where i.user_id = m.student_id
         and i.provider = 'google'
         and (i.provider_id = any (p_users) or i.identity_data->>'sub' = any (p_users))
       limit 1
    ) g
   where m.class_id = p_class
     and cardinality(p_users) between 1 and 2000;
$$;

-- True (and the time noted) when the class's linked Classroom course may get a join-link announcement now:
-- none in the last 10 minutes. False when it is too soon or the class has no linked course.
create or replace function public.class_announce_take(p_class uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.class_ext_links
     set announced_at = now()
   where class_id = p_class
     and provider = 'google'
     and (announced_at is null or announced_at < now() - interval '10 minutes');
  return found;
end;
$$;

revoke execute on function public.class_google_matches(uuid, text[]) from public, anon, authenticated;
revoke execute on function public.class_announce_take(uuid) from public, anon, authenticated;
grant execute on function public.class_google_matches(uuid, text[]) to service_role;
grant execute on function public.class_announce_take(uuid) to service_role;

-- Free limits counted on the server for signed-in users (2026-11h-free-usage.sql, docs/premium-vault.md).
create table if not exists public.free_usage (
  user_id    uuid not null references auth.users(id) on delete cascade,
  course     text not null,
  kind       text not null check (kind in ('q', 'exam', 'cat')),
  day        text not null default '',
  used       integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, course, kind, day)
);
alter table public.free_usage enable row level security;
revoke all on public.free_usage from anon, authenticated;

create or replace function public.free_usage_course_ok(p_course text)
returns boolean language sql immutable as $$
  select p_course in ('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych',
                      'apprecalc', 'apcalcbc', 'apmacro', 'apmicro', 'aphug');
$$;

-- A local date the browser may claim: within a day of the server's, either way (time zones).
create or replace function public.free_usage_day_ok(p_day text)
returns boolean language plpgsql immutable as $$
declare d date;
begin
  if p_day is null or p_day !~ '^\d{4}-\d{1,2}-\d{1,2}$' then return false; end if;
  begin d := to_date(p_day, 'YYYY-MM-DD'); exception when others then return false; end;
  return abs(d - (now() at time zone 'utc')::date) <= 1;
end;
$$;

-- Today's question counts and the exam flags, per course: {"apbio": {"q": 7, "exam": 1}, ...}
create or replace function public.free_usage_get(p_day text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return '{}'::jsonb; end if;
  return coalesce((
    select jsonb_object_agg(course, kinds) from (
      select course, jsonb_object_agg(kind, used) as kinds
        from public.free_usage
       where user_id = v_uid and (kind <> 'q' or day = p_day)
       group by course) x), '{}'::jsonb);
end;
$$;

-- Adds n to a counter and returns its new value (exams are a flag: 1 once spent). Null when refused.
create or replace function public.free_usage_add(p_course text, p_kind text, p_day text, p_n integer)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_day text := case when p_kind = 'q' then p_day else '' end;
  v_used integer;
begin
  if v_uid is null or not public.free_usage_course_ok(p_course) or p_kind not in ('q', 'exam', 'cat')
     or (p_kind = 'cat' and p_course <> 'nremt') or p_n is null or p_n < 1 or p_n > 30 then
    return null;
  end if;
  if p_kind = 'q' and not public.free_usage_day_ok(p_day) then return null; end if;
  insert into public.free_usage as f (user_id, course, kind, day, used)
  values (v_uid, p_course, p_kind, v_day, case when p_kind = 'q' then p_n else 1 end)
  on conflict (user_id, course, kind, day) do update
    set used = case when p_kind = 'q' then least(f.used + p_n, 1000) else 1 end, updated_at = now()
  returning used into v_used;
  -- Old days are never read again.
  delete from public.free_usage where user_id = v_uid and kind = 'q' and day <> v_day and updated_at < now() - interval '3 days';
  return v_used;
end;
$$;

revoke all on function public.free_usage_get(text) from public, anon;
revoke all on function public.free_usage_add(text, text, text, integer) from public, anon;
revoke all on function public.free_usage_course_ok(text) from public, anon, authenticated;
revoke all on function public.free_usage_day_ok(text) from public, anon, authenticated;
grant execute on function public.free_usage_get(text) to authenticated;
grant execute on function public.free_usage_add(text, text, text, integer) to authenticated;
-- 2026-11m: readiness accuracy (docs/progress-profile.md, migration 2026-11m-readiness.sql).
create or replace function public.question_difficulty(p_course text)
returns table (qid text, n bigint, correct bigint)
language sql
stable
security definer
set search_path = public
as $$
  select qid, sum(n)::bigint, sum(correct)::bigint
    from public.question_stats
   where course = p_course
   group by qid
  having sum(n) >= 20;
$$;
revoke all on function public.question_difficulty(text) from public, anon, authenticated;
grant execute on function public.question_difficulty(text) to service_role;

create table if not exists public.exam_outcomes (
  id        bigint generated always as identity primary key,
  at        timestamptz not null default now(),
  course    text not null check (course ~ '^[a-z]{2,12}$'),
  result    text not null check (result in ('pass', 'fail', 'later', '1', '2', '3', '4', '5')),
  predicted numeric,
  lo        numeric,
  hi        numeric,
  band      smallint check (band between 1 and 5),
  answers   integer not null default 0 check (answers >= 0),
  days      integer check (days between 0 and 400)
);
alter table public.exam_outcomes enable row level security;
revoke all on public.exam_outcomes from public, anon, authenticated;
grant insert, select on public.exam_outcomes to service_role;


-- Class readiness: hide scores and Class Premium (2026-11l-class-ready.sql, docs/teacher-classes.md).
alter table public.classes add column if not exists hide_scores boolean not null default false;

-- One row per paid order. Seats add up across a class's live rows. RLS on, no policies: reached through the
-- functions below only.
create table if not exists public.class_premium (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  class_id     uuid not null references public.classes (id) on delete cascade,
  buyer_id     uuid references auth.users (id) on delete set null,
  seats        integer not null check (seats between 1 and 400),
  expires_at   timestamptz not null,
  order_id     text unique,
  amount_cents integer,
  refunded_at  timestamptz
);
create index if not exists class_premium_class_idx on public.class_premium (class_id);
alter table public.class_premium enable row level security;
revoke all on public.class_premium from anon, authenticated;

-- Seats a class holds right now, and when the longest live order ends.
create or replace function public.class_premium_state(p_class uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'seats', coalesce(sum(p.seats), 0),
           'expires_at', max(p.expires_at),
           'members', (select count(*) from public.class_members m where m.class_id = p_class))
    from public.class_premium p
   where p.class_id = p_class and p.refunded_at is null and p.expires_at > now();
$$;

-- When this user's class cover for a course ends, or null. A member is covered when they are among the first
-- N to have joined (N = the class's seats); the owner and co-teachers are covered without a seat.
create or replace function public.class_premium_until(p_user uuid, p_course text)
returns timestamptz language sql stable security definer set search_path = public as $$
  select max((st->>'expires_at')::timestamptz)
    from public.classes c
   cross join lateral public.class_premium_state(c.id) st
   where c.course = p_course and not c.archived
     and (st->>'seats')::integer > 0
     and (c.teacher_id = p_user
          or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = p_user)
          or exists (select 1 from public.class_members me
                      where me.class_id = c.id and me.student_id = p_user
                        and (select count(*) from public.class_members o
                              where o.class_id = c.id
                                and (o.joined_at, o.student_id) <= (me.joined_at, me.student_id)) <= (st->>'seats')::integer));
$$;

-- The Worker records a paid order. Answers { inserted, seats, expires_at }; inserted is false for an order it has.
create or replace function public.class_premium_add(p_class uuid, p_buyer uuid, p_seats integer, p_until timestamptz,
                                                    p_order_id text, p_amount_cents integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if p_seats is null or p_seats < 1 or p_seats > 400 or p_until is null
     or not exists (select 1 from public.classes where id = p_class) then
    return null;
  end if;
  insert into public.class_premium (class_id, buyer_id, seats, expires_at, order_id, amount_cents)
  values (p_class, p_buyer, p_seats, p_until, p_order_id, p_amount_cents)
  on conflict (order_id) do nothing
  returning id into v_id;
  return jsonb_build_object('inserted', v_id is not null, 'seats', p_seats, 'expires_at', p_until);
end;
$$;

-- A full refund of a class order. Returns how many rows it marked.
create or replace function public.class_premium_refund(p_order_id text, p_at timestamptz default now())
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.class_premium set refunded_at = p_at where order_id = p_order_id and refunded_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- The teacher's own view of it (any teacher of the class).
create or replace function public.teach_class_premium(p_class uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.class_role(p_class) is null then null else public.class_premium_state(p_class) end;
$$;

revoke all on function public.class_premium_state(uuid) from public, anon, authenticated;
revoke all on function public.class_premium_until(uuid, text) from public, anon, authenticated;
revoke all on function public.class_premium_add(uuid, uuid, integer, timestamptz, text, integer) from public, anon, authenticated;
revoke all on function public.class_premium_refund(text, timestamptz) from public, anon, authenticated;
revoke all on function public.teach_class_premium(uuid) from public, anon;
grant execute on function public.class_premium_state(uuid) to service_role;
grant execute on function public.class_premium_until(uuid, text) to service_role;
grant execute on function public.class_premium_add(uuid, uuid, integer, timestamptz, text, integer) to service_role;
grant execute on function public.class_premium_refund(text, timestamptz) to service_role;
grant execute on function public.teach_class_premium(uuid) to authenticated;

-- my_premium(): the user's own passes as before, plus class cover. One row per course, the later end.
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
  v_class timestamptz;
  i integer;
begin
  if v_uid is null then
    return;
  end if;
  for v_course in
    select distinct p.course from public.premium_passes p
     where p.user_id = v_uid and p.refunded_at is null
       and p.starts_at <= now() and p.expires_at > now()
    union
    select distinct c.course from public.classes c
     where not c.archived
       and (c.teacher_id = v_uid
            or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = v_uid)
            or exists (select 1 from public.class_members m where m.class_id = c.id and m.student_id = v_uid))
       and exists (select 1 from public.class_premium cp
                    where cp.class_id = c.id and cp.refunded_at is null and cp.expires_at > now())
  loop
    select max(p.expires_at) into v_end from public.premium_passes p
     where p.user_id = v_uid and p.course = v_course and p.refunded_at is null
       and p.starts_at <= now() and p.expires_at > now();
    if v_end is not null then
      for i in 1..50 loop
        select max(p.expires_at) into v_next from public.premium_passes p
         where p.user_id = v_uid and p.course = v_course and p.refunded_at is null
           and p.starts_at <= v_end + interval '1 minute' and p.expires_at > v_end;
        exit when v_next is null;
        v_end := v_next;
      end loop;
    end if;
    v_class := public.class_premium_until(v_uid, v_course);
    if v_class is not null and (v_end is null or v_class > v_end) then v_end := v_class; end if;
    if v_end is not null then
      course := v_course;
      expires_at := v_end;
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.my_premium() from public;
grant execute on function public.my_premium() to authenticated;

-- p_patch: name, unit_order, current_unit, new_code, dept_stats, hide_scores (any teacher of the class);
-- archived and dept_shared (the owner only).
create or replace function public.teach_update_class(p_class uuid, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classes;
  r text := public.class_role(p_class);
begin
  if r is null then return null; end if;
  select * into c from public.classes where id = p_class;
  if p_patch ? 'name' and length(btrim(p_patch->>'name')) between 1 and 60 then c.name := btrim(p_patch->>'name'); end if;
  if p_patch ? 'unit_order' and jsonb_typeof(p_patch->'unit_order') = 'array' and jsonb_array_length(p_patch->'unit_order') <= 40 and octet_length((p_patch->'unit_order')::text) <= 2000 then c.unit_order := p_patch->'unit_order'; end if;
  if p_patch ? 'current_unit' then c.current_unit := left(p_patch->>'current_unit', 60); end if;
  if p_patch ? 'hide_scores' and jsonb_typeof(p_patch->'hide_scores') = 'boolean' then c.hide_scores := (p_patch->>'hide_scores')::boolean; end if;
  if r = 'owner' and p_patch ? 'archived' then c.archived := coalesce((p_patch->>'archived')::boolean, c.archived); end if;
  if r = 'owner' and p_patch ? 'dept_shared' then c.dept_shared := coalesce((p_patch->>'dept_shared')::boolean, c.dept_shared); end if;
  if p_patch ? 'dept_stats' and jsonb_typeof(p_patch->'dept_stats') = 'object' and octet_length((p_patch->'dept_stats')::text) <= 4000 then
    c.dept_stats := public.class_clean_stats(p_patch->'dept_stats'); c.dept_stats_at := now();
  end if;
  if coalesce((p_patch->>'new_code')::boolean, false) then c.code := public.class_new_code(); end if;
  update public.classes set name = c.name, unit_order = c.unit_order, current_unit = c.current_unit,
         archived = c.archived, code = c.code, dept_shared = c.dept_shared, dept_stats = c.dept_stats,
         dept_stats_at = c.dept_stats_at, hide_scores = c.hide_scores, updated_at = now()
   where id = c.id;
  return jsonb_build_object('id', c.id, 'code', c.code);
end;
$$;

-- Everything the teacher's page needs in one read, for the owner or a co-teacher.
create or replace function public.teach_class_report(p_class uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'class', jsonb_build_object('id', c.id, 'course', c.course, 'name', c.name, 'code', c.code,
                                       'unit_order', c.unit_order, 'current_unit', c.current_unit,
                                       'archived', c.archived, 'created_at', c.created_at,
                                       'role', public.class_role(c.id), 'owner_name', op.display_name,
                                       'coteach_code', case when c.teacher_id = auth.uid() then c.coteach_code end,
                                       'dept_shared', c.dept_shared, 'hide_scores', c.hide_scores,
                                       'premium', public.class_premium_state(c.id)),
           'coteachers', coalesce((select jsonb_agg(jsonb_build_object('id', t.user_id, 'name', coalesce(tp.display_name, 'Teacher'), 'added_at', t.added_at) order by t.added_at)
                       from public.class_coteachers t left join public.teacher_profiles tp on tp.user_id = t.user_id where t.class_id = c.id), '[]'::jsonb),
           'announcements', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'body', n.body, 'created_at', n.created_at,
                         'author', coalesce(np.display_name, 'Teacher'), 'mine', n.author_id = auth.uid()) order by n.created_at desc)
                       from (select * from public.class_announcements where class_id = c.id order by created_at desc limit 50) n
                       left join public.teacher_profiles np on np.user_id = n.author_id), '[]'::jsonb),
           'members', coalesce((select jsonb_agg(jsonb_build_object(
                         'id', m.student_id, 'name', m.name, 'joined_at', m.joined_at,
                         'extra_days', m.extra_days, 'extra_time', m.extra_time,
                         'summary', m.summary, 'summary_at', m.summary_at) order by m.name)
                       from public.class_members m where m.class_id = c.id), '[]'::jsonb),
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
                         'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec,
                         'opens_at', a.opens_at, 'due_at', a.due_at, 'late_until', a.late_until,
                         'required', a.required, 'students', a.students, 'created_at', a.created_at) order by a.opens_at desc)
                       from public.class_assignments a where a.class_id = c.id), '[]'::jsonb))
    from public.classes c
    left join public.teacher_profiles op on op.user_id = c.teacher_id
   where c.id = p_class and public.class_role(c.id) is not null;
$$;

create or replace function public.class_mine()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'course', c.course, 'name', c.name, 'teacher', p.display_name,
           'unit_order', c.unit_order, 'current_unit', c.current_unit, 'joined_at', m.joined_at,
           'extra_time', m.extra_time, 'hide_scores', c.hide_scores,
           'live', exists (select 1 from public.class_live l where l.class_id = c.id),
           'announcements', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'body', n.body, 'created_at', n.created_at) order by n.created_at desc)
             from (select * from public.class_announcements where class_id = c.id order by created_at desc limit 5) n), '[]'::jsonb),
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
               'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec, 'opens_at', a.opens_at,
               'due_at', a.due_at + make_interval(days => m.extra_days),
               'late_until', a.late_until + make_interval(days => m.extra_days),
               'required', a.required) order by a.due_at nulls last)
             from public.class_assignments a
            where a.class_id = c.id and a.opens_at <= now()
              and (a.students is null or a.students ? m.student_id::text)), '[]'::jsonb))
           order by m.joined_at), '[]'::jsonb)
    from public.class_members m
    join public.classes c on c.id = m.class_id and not c.archived
    left join public.teacher_profiles p on p.user_id = c.teacher_id
   where m.student_id = auth.uid() and auth.uid() is not null;
$$;
