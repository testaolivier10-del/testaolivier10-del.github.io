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
-- `revoke ... from public` then `grant execute ... to anon, authenticated` on
-- each function is not ceremony: a `security definer` function is executable
-- by PUBLIC by default, and being deliberate about who may call it is the
-- whole security boundary here.

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
  if p_course not in ('nremt', 'ochem') then
    raise exception 'unknown course';
  end if;
  if p_reason not in ('wrong-answer', 'unclear', 'typo', 'outdated', 'other') then
    raise exception 'unknown reason';
  end if;
  if p_question_id is null or length(p_question_id) > 120 then
    raise exception 'bad question id';
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
begin
  if p_endpoint is null or length(p_endpoint) < 20 or length(p_endpoint) > 1000 then
    raise exception 'bad endpoint';
  end if;
  if p_endpoint not like 'https://%' then
    raise exception 'bad endpoint';
  end if;

  key := encode(extensions.digest(p_endpoint, 'sha256'), 'hex');

  insert into public.push_subscriptions
    (id, endpoint, p256dh, auth, user_id, next_send_at, title, body, url, unanswered)
  values (
    key, p_endpoint, p_p256dh, p_auth, auth.uid(), p_next_send_at,
    left(coalesce(nullif(p_title, ''), 'Time to study'), 80),
    left(coalesce(nullif(p_body, ''), 'You have work waiting.'), 200),
    left(coalesce(nullif(p_url, ''), '/'), 200),
    -- Zeroed on every update, because an update is proof the student came
    -- back: it is written from a page they are looking at.
    0
  )
  on conflict (id) do update set
    p256dh       = excluded.p256dh,
    auth         = excluded.auth,
    user_id      = coalesce(excluded.user_id, public.push_subscriptions.user_id),
    next_send_at = excluded.next_send_at,
    title        = excluded.title,
    body         = excluded.body,
    url          = excluded.url,
    unanswered   = 0;
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
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  select email into addr from auth.users where id = uid;
  if addr is null then
    raise exception 'no address on this account';
  end if;

  insert into public.email_reminders (user_id, email, next_send_at, title, body, url, unanswered)
  values (
    uid, addr, p_next_send_at,
    left(coalesce(nullif(p_title, ''), 'Time to study'), 80),
    left(coalesce(nullif(p_body, ''), 'You have work waiting.'), 200),
    left(coalesce(nullif(p_url, ''), '/'), 200),
    0
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
    unanswered   = 0;
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
  if p_course not in ('nremt', 'ochem') then
    raise exception 'unknown course';
  end if;
  if p_email is null or length(p_email) > 254
     or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'bad email';
  end if;

  insert into public.premium_waitlist (course, email, source)
  values (p_course, btrim(p_email), nullif(left(coalesce(p_source, ''), 40), ''))
  on conflict (course, lower(email)) do nothing;
end;
$$;

revoke all on function public.join_waitlist(text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text) to anon, authenticated;
