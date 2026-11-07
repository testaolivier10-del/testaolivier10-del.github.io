-- 2026-11g: question tallies accept course keys up to 12 letters.
-- track_answers() refused '^[a-z]{2,8}$' course keys longer than 8, so AP® Precalculus (apprecalc, 9
-- letters) never reached question_stats (question audit 2026-11-06). assets/analytics.js answer() had the
-- same limit and now takes 2 to 12 letters too. Same function otherwise.

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
