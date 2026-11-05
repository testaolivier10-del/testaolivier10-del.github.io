-- Google Classroom without the classroom.profile.emails scope (docs/teacher-classes.md, "Google Classroom").
-- Named 2026-11f so it runs after 2026-11d-classes-integrations.sql, whose class_ext_links it extends.
-- Idempotent. schema.sql carries the same definitions (section 13; scripts/test/sql-migration.test.mjs
-- checks them word for word). NOT APPLIED anywhere yet.
--
-- Run once, after 2026-11d-classes-integrations.sql: Supabase dashboard -> SQL Editor -> New query -> paste
-- -> Run. Until it runs, "Check the roster" and "Post the join link in Classroom" answer "Something went
-- wrong" (the functions below do not exist yet); nothing else changes.
--
-- What it adds, both for the Worker only (service role):
--   class_google_matches  which class members signed in to LevlPrep with the Google account a Classroom
--                         roster lists (auth.identities, provider 'google': provider_id, or the sub in
--                         identity_data, equals the Classroom userId). Returns member ids, names and that
--                         Google id; never an email, never to a browser.
--   class_announce_take   at most one "Post the join link in Classroom" per class every 10 minutes
--                         (class_ext_links.announced_at).
-- Classroom invites by email are gone; class_mail_log keeps its 'invite' kind (old rows age out in 30 days).

alter table public.class_ext_links add column if not exists announced_at timestamptz;

-- The members of a class whose Google sign-in is one of the Classroom user ids given, with that id.
create or replace function public.class_google_matches(p_class uuid, p_users text[])
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.student_id, 'name', m.name, 'google', g.gid) order by m.name), '[]'::jsonb)
    from public.class_members m
    cross join lateral (
      select case when i.provider_id = any (p_users) then i.provider_id else i.identity_data->>'sub' end as gid
        from auth.identities i
       where i.user_id = m.student_id
         and i.provider = 'google'
         and (i.provider_id = any (p_users) or i.identity_data->>'sub' = any (p_users))
       limit 1
    ) g
   where m.class_id = p_class
     and cardinality(p_users) between 1 and 2000;
$$;

-- True (and the time noted) when the class's linked Classroom course may get a join-link announcement now:
-- none in the last 10 minutes. False when it is too soon or the class has no linked course.
create or replace function public.class_announce_take(p_class uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.class_ext_links
     set announced_at = now()
   where class_id = p_class
     and provider = 'google'
     and (announced_at is null or announced_at < now() - interval '10 minutes');
  return found;
end;
$$;

revoke execute on function public.class_google_matches(uuid, text[]) from public, anon, authenticated;
revoke execute on function public.class_announce_take(uuid) from public, anon, authenticated;
grant execute on function public.class_google_matches(uuid, text[]) to service_role;
grant execute on function public.class_announce_take(uuid) to service_role;
