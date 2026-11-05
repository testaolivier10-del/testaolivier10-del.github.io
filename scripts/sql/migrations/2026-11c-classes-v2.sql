-- Teacher classes v2 (docs/teacher-classes.md, "v2 build", stream A1). Named
-- 2026-11c so it runs after 2026-11b-classes.sql, whose tables it extends.
-- Idempotent. schema.sql carries the same definitions at its end
-- (scripts/test/sql-migration.test.mjs checks them word for word; the
-- behaviour is checked against PGlite in scripts/test/classes-v2-sql.test.mjs
-- when @electric-sql/pglite is installed). NOT APPLIED anywhere yet.
--
-- Run once, after 2026-11b-classes.sql: Supabase dashboard -> SQL Editor ->
-- New query -> paste -> Run. The teacher page works before it is applied:
-- the new calls fail and the new panels say so.
--
-- What it adds:
--   - co-teachers: a second teacher joins a class with its co-teacher code and
--     gets the same rights minus every delete (class, assignments, removing
--     students) and minus archiving and managing co-teachers.
--   - mastery assignments (kind 'mastery') and exam controls in spec.controls
--     (the course engines enforce them; the database only stores them).
--   - copy a class (assignments shifted by a number of days, no students).
--   - class announcements, shown to students through class_mine.
--   - a teacher-written question bank (class_questions); students read only
--     the questions of an assignment they have (class_questions_for).
--   - live mode: one open session per class, the teacher polls
--     teach_live_state and students poll class_live_state (no Realtime).
--   - departments: a teacher joins one department by code and may share a
--     class's numbers (no student names: the owner's page writes a small
--     dept_stats object) with the other teachers in it.
--
-- Shape, as in 2026-11b: RLS on every table, no policies, nothing granted on
-- tables; only the functions below are granted to authenticated, and each one
-- checks auth.uid().

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
  if coalesce(p_data->>'course', '') !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro)$' then return null; end if;
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
