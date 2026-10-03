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
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio') then
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
  if p_course not in ('nremt', 'ochem', 'anp', 'apbio') then
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
  course      text not null check (course in ('nremt', 'ochem', 'anp', 'apbio')),
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
  course text not null check (course in ('nremt', 'ochem', 'anp', 'apbio')),
  step   text not null check (step in ('gate-shown', 'interest', 'checkout-start', 'checkout-paid')),
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
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio')
     or p_step is null or p_step not in ('gate-shown', 'interest', 'checkout-start') then
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
  if p_user is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio')
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
-- The NREMT pass guarantee needs "two full timed exams during the pass".
-- That used to be read from the synced exam history, which the student's
-- own browser writes, dates included. These rows are written only by
-- record_exam_completion(), with the database's clock, at most one per
-- twenty minutes. Deleted with the account (foreign key).
-- ---------------------------------------------------------------------------
create table if not exists public.exam_completions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  course      text not null check (course in ('nremt', 'ochem', 'anp', 'apbio')),
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
  if v_uid is null or p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio')
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
  if p_course is null or p_course not in ('nremt', 'ochem', 'anp', 'apbio') then
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
