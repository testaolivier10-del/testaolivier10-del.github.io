-- Teacher class integrations (docs/teacher-classes.md, stream C). Named 2026-11d so it sorts after 2026-11c
-- (stream A1). Idempotent. schema.sql carries the same definitions (scripts/test/sql-migration.test.mjs).
--
-- NOT APPLIED to the live database yet. Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run,
-- after 2026-11b-classes.sql (and 2026-11c if it is merged first; nothing here depends on it).
--
-- What it adds:
--   - Reminder emails: a send log (rate limits) and a per-student "stop teacher reminders" list.
--   - Family progress reports: expiring share links (only a hash of the token is kept, no parent emails).
--   - Google Classroom and LTI 1.3 (Canvas, Schoology): the teacher's Google token (encrypted by the Worker
--     before it gets here), the class / assignment / student links to the other system, registered LMS
--     platforms and used launch nonces.
--   - Class Premium quote and purchase order requests.
--   - Teacher scoring of free responses: the student's answer, sent on purpose, and the teacher's points and
--     comment, shown back to the student.
--
-- Shape: like the rest of schema.sql, RLS on with no policies. Tables the Worker alone uses are revoked from
-- anon and authenticated and granted to service_role only; the browser reaches class_frq_work only through
-- the four functions at the end. Every row hangs off a class membership, an assignment, a class or an
-- account with on delete cascade, so leaving a class, deleting it or deleting the account removes it.

-- ---------------------------------------------------------------- reminder emails (Worker only)

create table if not exists public.class_mail_log (
  id         bigserial primary key,
  kind       text not null check (kind in ('remind', 'invite')),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  student_id uuid references auth.users (id) on delete cascade,
  sent_at    timestamptz not null default now()
);
create index if not exists class_mail_log_teacher_idx on public.class_mail_log (teacher_id, kind, sent_at);
create index if not exists class_mail_log_student_idx on public.class_mail_log (student_id, kind, sent_at);
alter table public.class_mail_log enable row level security;

create table if not exists public.class_email_optout (
  student_id uuid primary key references auth.users (id) on delete cascade,
  at         timestamptz not null default now()
);
alter table public.class_email_optout enable row level security;

-- ---------------------------------------------------------------- family progress reports (Worker only)

create table if not exists public.class_report_links (
  token_hash text primary key,
  class_id   uuid not null,
  student_id uuid not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  foreign key (class_id, student_id) references public.class_members (class_id, student_id) on delete cascade
);
create index if not exists class_report_links_member_idx on public.class_report_links (class_id, student_id);
alter table public.class_report_links enable row level security;

-- ---------------------------------------------------------------- Google Classroom and LTI (Worker only)

-- One row per teacher and provider. refresh_enc is AES-GCM ciphertext made by the Worker (CLASS_SECRET);
-- the database never sees the token itself.
create table if not exists public.class_oauth (
  teacher_id    uuid not null references auth.users (id) on delete cascade,
  provider      text not null check (provider in ('google')),
  refresh_enc   text not null,
  account_email text,
  scopes        text,
  created_at    timestamptz not null default now(),
  primary key (teacher_id, provider)
);
alter table public.class_oauth enable row level security;

-- LMS platforms a school registered (issuer + client id from its developer key).
create table if not exists public.lti_platforms (
  id             uuid primary key default gen_random_uuid(),
  issuer         text not null,
  client_id      text not null,
  deployment_ids jsonb not null default '[]'::jsonb,
  auth_url       text not null,
  token_url      text not null,
  jwks_url       text not null,
  label          text,
  registered_by  uuid not null references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (issuer, client_id)
);
alter table public.lti_platforms enable row level security;

-- Launch nonces already used, so a captured launch cannot be replayed (kept a day).
create table if not exists public.lti_nonces (
  nonce      text primary key,
  expires_at timestamptz not null
);
alter table public.lti_nonces enable row level security;

-- A class's course in the other system: a Classroom course id, or an LMS context (platform + context id).
create table if not exists public.class_ext_links (
  class_id    uuid not null references public.classes (id) on delete cascade,
  provider    text not null check (provider in ('google', 'lti')),
  platform_id uuid references public.lti_platforms (id) on delete cascade,
  external_id text not null,
  title       text,
  created_at  timestamptz not null default now(),
  primary key (class_id, provider, external_id)
);
alter table public.class_ext_links enable row level security;

-- An assignment's twin: a Classroom courseWork id, or an LTI AGS line item URL.
create table if not exists public.class_ext_assignments (
  assignment_id uuid not null references public.class_assignments (id) on delete cascade,
  provider      text not null check (provider in ('google', 'lti')),
  platform_id   uuid references public.lti_platforms (id) on delete cascade,
  external_id   text not null,
  course_id     text,
  created_at    timestamptz not null default now(),
  primary key (assignment_id, provider, external_id)
);
alter table public.class_ext_assignments enable row level security;

-- A student's id in the other system (Classroom userId, or LTI sub on one platform), for grade passback.
create table if not exists public.class_ext_members (
  class_id      uuid not null,
  student_id    uuid not null,
  provider      text not null check (provider in ('google', 'lti')),
  platform_id   uuid references public.lti_platforms (id) on delete cascade,
  external_user text not null,
  created_at    timestamptz not null default now(),
  primary key (class_id, student_id, provider),
  foreign key (class_id, student_id) references public.class_members (class_id, student_id) on delete cascade
);
alter table public.class_ext_members enable row level security;

-- ---------------------------------------------------------------- Class Premium quotes (Worker only)

create table if not exists public.class_quote_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.class_quote_requests enable row level security;

-- ---------------------------------------------------------------- teacher-scored free responses

-- answers: { <part label>: text } as the student sent it. score: { points: { <label>: [bool, ...] },
-- got, of, comment } as the teacher saved it.
create table if not exists public.class_frq_work (
  assignment_id uuid not null references public.class_assignments (id) on delete cascade,
  class_id      uuid not null,
  student_id    uuid not null,
  answers       jsonb not null,
  submitted_at  timestamptz not null default now(),
  score         jsonb,
  scored_at     timestamptz,
  primary key (assignment_id, student_id),
  foreign key (class_id, student_id) references public.class_members (class_id, student_id) on delete cascade
);
alter table public.class_frq_work enable row level security;

revoke all on table public.class_mail_log, public.class_email_optout, public.class_report_links, public.class_oauth,
  public.lti_platforms, public.lti_nonces, public.class_ext_links, public.class_ext_assignments,
  public.class_ext_members, public.class_quote_requests, public.class_frq_work from anon, authenticated;
grant select, insert, update, delete on table public.class_mail_log, public.class_email_optout, public.class_report_links,
  public.class_oauth, public.lti_platforms, public.lti_nonces, public.class_ext_links, public.class_ext_assignments,
  public.class_ext_members, public.class_quote_requests, public.class_frq_work to service_role;
grant usage, select on sequence public.class_mail_log_id_seq to service_role;

-- ---------------------------------------------------------------- Worker-only functions

-- One more email of this kind from this teacher to this student, or false: the student turned teacher
-- reminders off, already got one in the last 20 hours (from any teacher), or the teacher sent 200 today.
create or replace function public.class_mail_take(p_teacher uuid, p_class uuid, p_student uuid, p_kind text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_kind not in ('remind', 'invite') then return false; end if;
  perform pg_advisory_xact_lock(hashtext('class_mail:' || p_teacher::text));
  delete from public.class_mail_log where sent_at < now() - interval '30 days';
  if p_student is not null and exists (select 1 from public.class_email_optout where student_id = p_student) then return false; end if;
  if (select count(*) from public.class_mail_log where teacher_id = p_teacher and kind = p_kind and sent_at > now() - interval '1 day') >= 200 then return false; end if;
  if p_student is not null and exists (select 1 from public.class_mail_log where student_id = p_student and kind = p_kind and sent_at > now() - interval '20 hours') then return false; end if;
  insert into public.class_mail_log (kind, teacher_id, class_id, student_id) values (p_kind, p_teacher, p_class, p_student);
  return true;
end;
$$;

-- The class's members with their account email, for the Worker to send to. Never returned to a browser:
-- the teacher's page does not see students' addresses.
create or replace function public.class_member_emails(p_class uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.student_id, 'name', m.name, 'email', u.email,
                                               'optout', exists (select 1 from public.class_email_optout o where o.student_id = m.student_id))
                            order by m.name), '[]'::jsonb)
    from public.class_members m
    join auth.users u on u.id = m.student_id
   where m.class_id = p_class;
$$;

-- A family report link's data, or null when it is unknown, expired or the student has left the class.
create or replace function public.class_report_get(p_hash text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'class', jsonb_build_object('name', c.name, 'course', c.course, 'unit_order', c.unit_order,
                                       'current_unit', c.current_unit),
           'teacher', p.display_name,
           'student', m.name,
           'expires_at', l.expires_at,
           'summary', case when m.summary is null then null else jsonb_build_object(
                         'v', m.summary->'v', 'at', m.summary->'at', 'items', m.summary->'items',
                         'exams', m.summary->'exams', 'frq', m.summary->'frq', 'done', m.summary->'done') end,
           'assignments', coalesce((select jsonb_agg(jsonb_build_object(
               'id', a.id, 'kind', a.kind, 'title', a.title, 'spec', a.spec, 'opens_at', a.opens_at,
               'due_at', a.due_at + make_interval(days => m.extra_days),
               'late_until', a.late_until + make_interval(days => m.extra_days),
               'required', a.required,
               'teacher_score', (select w.score from public.class_frq_work w where w.assignment_id = a.id and w.student_id = m.student_id))
               order by a.due_at nulls last)
             from public.class_assignments a
            where a.class_id = c.id and a.opens_at <= now()
              and (a.students is null or a.students ? m.student_id::text)), '[]'::jsonb))
    from public.class_report_links l
    join public.class_members m on m.class_id = l.class_id and m.student_id = l.student_id
    join public.classes c on c.id = l.class_id
    left join public.teacher_profiles p on p.user_id = c.teacher_id
   where l.token_hash = p_hash and l.expires_at > now();
$$;

-- "Stop teacher reminders" from the link in a reminder email.
create or replace function public.class_email_stop(p_student uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from auth.users where id = p_student) then return false; end if;
  insert into public.class_email_optout (student_id) values (p_student) on conflict (student_id) do nothing;
  return true;
end;
$$;

-- ---------------------------------------------------------------- free responses (browser)

-- A student sends their answer to a free-response assignment of theirs. Resending replaces it and clears any
-- score, so the teacher scores what is there now.
create or replace function public.class_frq_submit(p_assignment uuid, p_answers jsonb)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  a record;
begin
  if auth.uid() is null or p_answers is null or jsonb_typeof(p_answers) <> 'object' then return false; end if;
  if octet_length(p_answers::text) > 20000 then return false; end if;
  select x.id, x.class_id into a
    from public.class_assignments x
    join public.class_members m on m.class_id = x.class_id and m.student_id = auth.uid()
    join public.classes c on c.id = x.class_id and not c.archived
   where x.id = p_assignment and x.kind = 'frq' and x.opens_at <= now()
     and (x.students is null or x.students ? auth.uid()::text);
  if a.id is null then return false; end if;
  insert into public.class_frq_work (assignment_id, class_id, student_id, answers)
    values (a.id, a.class_id, auth.uid(), p_answers)
  on conflict (assignment_id, student_id) do update
    set answers = excluded.answers, submitted_at = now(), score = null, scored_at = null;
  return true;
end;
$$;

-- The student's own sent answers and what the teacher gave them.
create or replace function public.class_frq_mine()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('assignment', w.assignment_id, 'class', w.class_id,
                                               'submitted_at', w.submitted_at, 'score', w.score, 'scored_at', w.scored_at)
                            order by w.submitted_at desc), '[]'::jsonb)
    from public.class_frq_work w
   where w.student_id = auth.uid() and auth.uid() is not null;
$$;

-- Every answer sent for one of the teacher's assignments.
create or replace function public.teach_frq_work(p_assignment uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('student', w.student_id, 'answers', w.answers, 'submitted_at', w.submitted_at,
                                               'score', w.score, 'scored_at', w.scored_at)
                            order by w.submitted_at), '[]'::jsonb)
    from public.class_frq_work w
    join public.class_assignments a on a.id = w.assignment_id
    join public.classes c on c.id = a.class_id
   where w.assignment_id = p_assignment and c.teacher_id = auth.uid() and auth.uid() is not null;
$$;

-- The teacher's points and comment on one answer. p_score = { points: { label: [bool...] }, got, of, comment }.
create or replace function public.teach_frq_score(p_assignment uuid, p_student uuid, p_score jsonb)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  s jsonb;
begin
  if auth.uid() is null or p_score is null or jsonb_typeof(p_score) <> 'object' then return false; end if;
  if jsonb_typeof(p_score->'points') <> 'object' or jsonb_typeof(p_score->'got') <> 'number' or jsonb_typeof(p_score->'of') <> 'number' then return false; end if;
  if (p_score->>'got')::numeric < 0 or (p_score->>'got')::numeric > (p_score->>'of')::numeric or (p_score->>'of')::numeric > 100 then return false; end if;
  if octet_length(p_score::text) > 6000 then return false; end if;
  s := jsonb_build_object('points', p_score->'points', 'got', p_score->'got', 'of', p_score->'of',
                          'comment', left(coalesce(p_score->>'comment', ''), 2000));
  update public.class_frq_work w set score = s, scored_at = now()
    from public.class_assignments a
    join public.classes c on c.id = a.class_id
   where w.assignment_id = p_assignment and w.student_id = p_student and a.id = w.assignment_id
     and c.teacher_id = auth.uid();
  return found;
end;
$$;

revoke execute on function public.class_mail_take(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.class_member_emails(uuid) from public, anon, authenticated;
revoke execute on function public.class_report_get(text) from public, anon, authenticated;
revoke execute on function public.class_email_stop(uuid) from public, anon, authenticated;
revoke execute on function public.class_frq_submit(uuid, jsonb) from public, anon;
revoke execute on function public.class_frq_mine() from public, anon;
revoke execute on function public.teach_frq_work(uuid) from public, anon;
revoke execute on function public.teach_frq_score(uuid, uuid, jsonb) from public, anon;
grant execute on function public.class_mail_take(uuid, uuid, uuid, text) to service_role;
grant execute on function public.class_member_emails(uuid) to service_role;
grant execute on function public.class_report_get(text) to service_role;
grant execute on function public.class_email_stop(uuid) to service_role;
grant execute on function public.class_frq_submit(uuid, jsonb) to authenticated;
grant execute on function public.class_frq_mine() to authenticated;
grant execute on function public.teach_frq_work(uuid) to authenticated;
grant execute on function public.teach_frq_score(uuid, uuid, jsonb) to authenticated;
