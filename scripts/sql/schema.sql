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
-- never added. Nothing else in this file is tied to a user at all, so there is
-- nothing else to clean up — which is itself the answer to "what do you keep
-- about me": the page counter and these two tables have no user column.
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
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
-- anon is deliberately NOT granted: there is no signed-in user to delete, and
-- the only thing an anonymous caller could achieve is the exception above.
grant execute on function public.delete_own_account() to authenticated;
