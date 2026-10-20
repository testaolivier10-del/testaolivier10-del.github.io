-- The AI free-response grader (docs/frq-grader.md, worker/src/frq-grade.js).
-- Named 2026-10l so it sorts after 2026-10k-apenv.sql. NOT APPLIED anywhere
-- yet: the owner applies it when he turns the grader on.
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Idempotent. schema.sql carries the same definitions
-- (scripts/test/sql-migration.test.mjs checks them word for word).
--
-- The Worker works before it is applied in one way only: with FRQ_GRADER
-- off, nothing calls these. With it on and this not applied, frq_grade_take
-- fails, the route answers "try again" and the page keeps the rubric
-- self-score; nothing is graded and nothing is spent.
--
--   frq_grade_daily: one row per student per day, how many AI grades they
--     took, for the cap of 10 a day. Deleted with the account. Worker only.
--   frq_grade_counts: anonymous daily counts per course and grader (claude,
--     backup, none, cached) with Claude's token use, the premium_funnel
--     shape: no user, no browser id. The weekly report reads credit use and
--     the fallback rate from it.
--   frq_grade_take(user, limit): takes one grade atomically; returns how many
--     are left after it, or -1 when none were left. Worker only.
--   frq_grade_give_back(user): returns one when no grader could answer.
--   count_frq_grade(...): adds one to the day's count. Worker only.
--
-- Read (scripts/sql/reports.sql has the full query):
--   select day, grader, sum(n) n, sum(input_tokens) tin, sum(output_tokens) tout
--     from frq_grade_counts where day > current_date - 7 group by 1, 2 order by 1, 2;

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

-- Worker only (service role): never granted to anon or authenticated.
revoke all on function public.frq_grade_take(uuid, integer) from public, anon, authenticated;
revoke all on function public.frq_grade_give_back(uuid) from public, anon, authenticated;
revoke all on function public.count_frq_grade(text, text, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.frq_grade_take(uuid, integer) to service_role;
grant execute on function public.frq_grade_give_back(uuid) to service_role;
grant execute on function public.count_frq_grade(text, text, integer, integer, integer, integer) to service_role;
