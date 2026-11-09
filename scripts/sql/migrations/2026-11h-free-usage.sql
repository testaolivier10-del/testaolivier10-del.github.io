-- Free limits counted on the server for signed-in users (docs/premium-vault.md, "Free limits").
-- The browser keeps its own count, as before, for everyone; for a signed-in free user it also
-- reports here and reads back the larger of the two, so clearing site data, another browser or
-- another device no longer resets the 15 a day or the one free exam. Signed-out visitors keep the
-- browser count only (owner, 2026-11-08).
--
-- kind 'q'    questions shown today (day = the browser's local date, Y-M-D as assets/premium.js writes it)
-- kind 'exam' the one free timed exam (day = '')
-- kind 'cat'  NREMT's one free adaptive exam (day = '')

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
                      'apprecalc', 'apcalcbc', 'apmacro');
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
