-- Class readiness (docs/teacher-classes.md, "Class Premium" and "Hide scores"). Idempotent; run after 2026-11k.
--
-- 1. Hide scores: a class setting. With it on, the student's My class view shows what is done and what is
--    missing, not the scores (assets/class/class-view.js). The teacher's pages are unchanged.
-- 2. Class Premium: a teacher buys seats for one class; every covered member (and the class's teachers) has
--    Premium for the class's course until the pass ends. Written only by the Worker (worker/src/class-premium.js)
--    when Polar's order.paid arrives; my_premium() counts it, so the site, the vault and the free limits follow.

alter table public.classes add column if not exists hide_scores boolean not null default false;

-- One row per paid order. Seats add up across a class's live rows. RLS on, no policies: reached through the
-- functions below only.
create table if not exists public.class_premium (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  class_id     uuid not null references public.classes (id) on delete cascade,
  buyer_id     uuid references auth.users (id) on delete set null,
  seats        integer not null check (seats between 1 and 400),
  expires_at   timestamptz not null,
  order_id     text unique,
  amount_cents integer,
  refunded_at  timestamptz
);
create index if not exists class_premium_class_idx on public.class_premium (class_id);
alter table public.class_premium enable row level security;
revoke all on public.class_premium from anon, authenticated;

-- Seats a class holds right now, and when the longest live order ends.
create or replace function public.class_premium_state(p_class uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'seats', coalesce(sum(p.seats), 0),
           'expires_at', max(p.expires_at),
           'members', (select count(*) from public.class_members m where m.class_id = p_class))
    from public.class_premium p
   where p.class_id = p_class and p.refunded_at is null and p.expires_at > now();
$$;

-- When this user's class cover for a course ends, or null. A member is covered when they are among the first
-- N to have joined (N = the class's seats); the owner and co-teachers are covered without a seat.
create or replace function public.class_premium_until(p_user uuid, p_course text)
returns timestamptz language sql stable security definer set search_path = public as $$
  select max((st->>'expires_at')::timestamptz)
    from public.classes c
   cross join lateral public.class_premium_state(c.id) st
   where c.course = p_course and not c.archived
     and (st->>'seats')::integer > 0
     and (c.teacher_id = p_user
          or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = p_user)
          or exists (select 1 from public.class_members me
                      where me.class_id = c.id and me.student_id = p_user
                        and (select count(*) from public.class_members o
                              where o.class_id = c.id
                                and (o.joined_at, o.student_id) <= (me.joined_at, me.student_id)) <= (st->>'seats')::integer));
$$;

-- The Worker records a paid order. Answers { inserted, seats, expires_at }; inserted is false for an order it has.
create or replace function public.class_premium_add(p_class uuid, p_buyer uuid, p_seats integer, p_until timestamptz,
                                                    p_order_id text, p_amount_cents integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if p_seats is null or p_seats < 1 or p_seats > 400 or p_until is null
     or not exists (select 1 from public.classes where id = p_class) then
    return null;
  end if;
  insert into public.class_premium (class_id, buyer_id, seats, expires_at, order_id, amount_cents)
  values (p_class, p_buyer, p_seats, p_until, p_order_id, p_amount_cents)
  on conflict (order_id) do nothing
  returning id into v_id;
  return jsonb_build_object('inserted', v_id is not null, 'seats', p_seats, 'expires_at', p_until);
end;
$$;

-- A full refund of a class order. Returns how many rows it marked.
create or replace function public.class_premium_refund(p_order_id text, p_at timestamptz default now())
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.class_premium set refunded_at = p_at where order_id = p_order_id and refunded_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- The teacher's own view of it (any teacher of the class).
create or replace function public.teach_class_premium(p_class uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.class_role(p_class) is null then null else public.class_premium_state(p_class) end;
$$;

revoke all on function public.class_premium_state(uuid) from public, anon, authenticated;
revoke all on function public.class_premium_until(uuid, text) from public, anon, authenticated;
revoke all on function public.class_premium_add(uuid, uuid, integer, timestamptz, text, integer) from public, anon, authenticated;
revoke all on function public.class_premium_refund(text, timestamptz) from public, anon, authenticated;
revoke all on function public.teach_class_premium(uuid) from public, anon;
grant execute on function public.class_premium_state(uuid) to service_role;
grant execute on function public.class_premium_until(uuid, text) to service_role;
grant execute on function public.class_premium_add(uuid, uuid, integer, timestamptz, text, integer) to service_role;
grant execute on function public.class_premium_refund(text, timestamptz) to service_role;
grant execute on function public.teach_class_premium(uuid) to authenticated;

-- my_premium(): the user's own passes as before, plus class cover. One row per course, the later end.
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
  v_class timestamptz;
  i integer;
begin
  if v_uid is null then
    return;
  end if;
  for v_course in
    select distinct p.course from public.premium_passes p
     where p.user_id = v_uid and p.refunded_at is null
       and p.starts_at <= now() and p.expires_at > now()
    union
    select distinct c.course from public.classes c
     where not c.archived
       and (c.teacher_id = v_uid
            or exists (select 1 from public.class_coteachers t where t.class_id = c.id and t.user_id = v_uid)
            or exists (select 1 from public.class_members m where m.class_id = c.id and m.student_id = v_uid))
       and exists (select 1 from public.class_premium cp
                    where cp.class_id = c.id and cp.refunded_at is null and cp.expires_at > now())
  loop
    select max(p.expires_at) into v_end from public.premium_passes p
     where p.user_id = v_uid and p.course = v_course and p.refunded_at is null
       and p.starts_at <= now() and p.expires_at > now();
    if v_end is not null then
      for i in 1..50 loop
        select max(p.expires_at) into v_next from public.premium_passes p
         where p.user_id = v_uid and p.course = v_course and p.refunded_at is null
           and p.starts_at <= v_end + interval '1 minute' and p.expires_at > v_end;
        exit when v_next is null;
        v_end := v_next;
      end loop;
    end if;
    v_class := public.class_premium_until(v_uid, v_course);
    if v_class is not null and (v_end is null or v_class > v_end) then v_end := v_class; end if;
    if v_end is not null then
      course := v_course;
      expires_at := v_end;
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.my_premium() from public;
grant execute on function public.my_premium() to authenticated;

-- p_patch: name, unit_order, current_unit, new_code, dept_stats, hide_scores (any teacher of the class);
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
  if p_patch ? 'hide_scores' and jsonb_typeof(p_patch->'hide_scores') = 'boolean' then c.hide_scores := (p_patch->>'hide_scores')::boolean; end if;
  if r = 'owner' and p_patch ? 'archived' then c.archived := coalesce((p_patch->>'archived')::boolean, c.archived); end if;
  if r = 'owner' and p_patch ? 'dept_shared' then c.dept_shared := coalesce((p_patch->>'dept_shared')::boolean, c.dept_shared); end if;
  if p_patch ? 'dept_stats' and jsonb_typeof(p_patch->'dept_stats') = 'object' and octet_length((p_patch->'dept_stats')::text) <= 4000 then
    c.dept_stats := public.class_clean_stats(p_patch->'dept_stats'); c.dept_stats_at := now();
  end if;
  if coalesce((p_patch->>'new_code')::boolean, false) then c.code := public.class_new_code(); end if;
  update public.classes set name = c.name, unit_order = c.unit_order, current_unit = c.current_unit,
         archived = c.archived, code = c.code, dept_shared = c.dept_shared, dept_stats = c.dept_stats,
         dept_stats_at = c.dept_stats_at, hide_scores = c.hide_scores, updated_at = now()
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
                                       'dept_shared', c.dept_shared, 'hide_scores', c.hide_scores,
                                       'premium', public.class_premium_state(c.id)),
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
           'extra_time', m.extra_time, 'hide_scores', c.hide_scores,
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
