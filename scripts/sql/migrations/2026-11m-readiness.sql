-- 2026-11m: readiness accuracy (docs/progress-profile.md).
--
--   question_difficulty(course): every question with 20 or more answers and how many were right, for the
--     readiness model's live difficulty (worker /qdiff, cached a day). Anonymous tallies only, as question_stats
--     already is; called by the worker with the service role.
--   exam_outcomes: the optional "how did your exam go?" answer after exam day (worker /outcome), with what the
--     estimate said then, so the estimate can be checked against real results. No user, browser id or IP: the
--     course, the answer, the prediction and its range, how many answers it rested on and days since the exam.
--     RLS on, no grants: only the service role writes or reads it.

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
