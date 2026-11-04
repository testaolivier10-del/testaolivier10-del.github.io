-- Teacher classes (docs/teacher-classes.md). Named 2026-11b so it sorts after
-- 2026-11a. Idempotent. schema.sql carries the same definitions
-- (scripts/test/sql-migration.test.mjs checks them word for word).
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- The site works before it is applied: /teach/ and /join.html call these, get
-- an error back and say classes are not open yet.
--
-- Owner decisions (2026-11-04):
--   - Teacher accounts are free, no verification. A class is one course.
--   - A student joins with a code, signed in, after a notice of what the
--     teacher sees. Under 13s cannot join (asked on the join page, not stored).
--   - The teacher sees that course only: scores, mastery, completion, last
--     active, misses and flags. No streaks, no minutes.
--   - Leaving a class deletes the membership row, and with it the summary the
--     teacher could read. Deleting an account cascades the same way.
--
-- Shape: every table is reached only through the functions below (RLS on, no
-- policies, no grants), like the rest of schema.sql. The student's browser
-- builds a small summary of its own progress in the class's course
-- (assets/class/class-model.js) and class_push writes it into each of its
-- memberships in that course; the teacher's page reads the summaries with
-- teach_class_report and works everything out from them.

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
  if p_course !~ '^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro)$' then return null; end if;
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
