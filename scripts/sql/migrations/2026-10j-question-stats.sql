-- Question tallies: every answered question as per-day totals (answered,
-- right, seconds), so the site can see which questions are hard and which are
-- probably wrong. Named 2026-10j so it sorts after 2026-10i-table-grants.sql.
-- Idempotent. schema.sql carries the same definitions
-- (scripts/test/sql-migration.test.mjs checks them word for word).
--
-- The site works before it is applied (the calls just do nothing).
--
--   question_stats: one row per day, course and question id. No user, browser
--     id or IP. RLS on and no table grants (2026-10i): only the function and
--     the service role touch it.
--   track_answers(course, items): the browser's only way in, a batch of up to
--     25 answers {q, c, s, t}; malformed items are skipped, at most 50,000
--     rows a day.
--
-- Read, for example the hardest questions this week with at least 10 answers:
--   select course, qid, topic, sum(n) n, round(100.0 * sum(correct) / sum(n)) pct_right,
--          round(sum(secs)::numeric / sum(n)) avg_secs
--     from question_stats where day > current_date - 7
--    group by 1, 2, 3 having sum(n) >= 10 order by pct_right limit 25;

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
  if p_course is null or p_course !~ '^[a-z]{2,8}$'
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

