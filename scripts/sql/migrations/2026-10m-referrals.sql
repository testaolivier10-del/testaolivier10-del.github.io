-- Invite friends (docs/invites.md). Named 2026-10m so it sorts after the
-- 2026-10l migrations. Idempotent. schema.sql carries the same definitions
-- (scripts/test/sql-migration.test.mjs checks them word for word).
--
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- The site works before it is applied: assets/invite.js calls these, gets an
-- error back and does nothing (links still go out, without a reward).
--
-- Owner decisions (2026-10-29):
--   - Anyone can share, signed in or not. Each browser makes its own code,
--     8 characters, with a secret only that browser holds; signing in later
--     binds the code to the account (referral_adopt needs the secret, so a
--     friend who saw the link cannot take the code over).
--   - The friend gets 3 days of Premium in the course of the link when a new
--     account (made within 3 days) claims the code. A homepage link has no
--     course; then the gift lands on the course of the friend's first answer.
--   - The sharer gets 7 days of Premium in that course once the friend has
--     answered 20 questions, at most 8 rewards in any 365 days. A reward
--     earned while the code is still unbound is paid when it is bound.
--   - One claim per person: per account, and per email address normalized
--     (case, +tags, Gmail dots), so aliases and a deleted-and-remade account
--     do not claim twice. A code never pays its own owner.
--
-- No course list here on purpose: premium_add_pass already refuses an unknown
-- course, so adding a course never needs this file redefined.
--
-- Read, for example:
--   select count(*) claims, count(qualified_at) studying, count(rewarded_at) rewarded,
--          count(*) filter (where capped) capped from referral_claims;

create table if not exists public.referral_codes (
  code        text primary key check (code ~ '^[a-z2-9]{8}$'),
  secret_hash text not null,
  user_id     uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  bound_at    timestamptz
);

create index if not exists referral_codes_user_idx on public.referral_codes (user_id);
alter table public.referral_codes enable row level security;

create table if not exists public.referral_claims (
  id             bigint generated always as identity primary key,
  -- Null once the friend deletes the account; the row and its email key stay,
  -- so the same person cannot claim again with a new account.
  friend_id      uuid unique references auth.users (id) on delete set null,
  code           text not null references public.referral_codes (code) on delete cascade,
  email_key      text not null unique,
  course         text,
  claimed_at     timestamptz not null default now(),
  answers        integer not null default 0,
  last_answer_at timestamptz,
  qualified_at   timestamptz,
  welcome_at     timestamptz,
  rewarded_at    timestamptz,
  capped         boolean not null default false
);

create index if not exists referral_claims_code_idx on public.referral_claims (code);
alter table public.referral_claims enable row level security;

create or replace function public.referral_email_key(p_email text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_local text := split_part(v_email, '@', 1);
  v_domain text := split_part(v_email, '@', 2);
begin
  v_local := split_part(v_local, '+', 1);
  if v_domain in ('gmail.com', 'googlemail.com') then
    v_local := replace(v_local, '.', '');
    v_domain := 'gmail.com';
  end if;
  return encode(sha256(convert_to(v_local || '@' || v_domain, 'UTF8')), 'hex');
end;
$$;

create or replace function public.referral_register(p_code text, p_secret text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if p_code is null or p_code !~ '^[a-z2-9]{8}$'
     or p_secret is null or length(p_secret) < 20 or length(p_secret) > 80 then
    return false;
  end if;
  if (select count(*) from public.referral_codes c where c.created_at > now() - interval '1 day') >= 3000 then
    return false;
  end if;
  insert into public.referral_codes (code, secret_hash, user_id, bound_at)
  values (p_code, encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'), v_uid, case when v_uid is null then null else now() end)
  on conflict (code) do nothing;
  return found;
end;
$$;

create or replace function public.referral_my_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.code from public.referral_codes c
   where c.user_id = auth.uid() and auth.uid() is not null
   order by c.created_at, c.code
   limit 1;
$$;

create or replace function public.referral_welcome(p_claim bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select * into r from public.referral_claims c where c.id = p_claim for update;
  if r.id is null or r.friend_id is null or r.course is null or r.welcome_at is not null then
    return;
  end if;
  begin
    perform public.premium_add_pass(
      p_user => r.friend_id, p_course => r.course, p_pass => 'referral-welcome', p_days => 3,
      p_order_id => 'refw:' || r.id, p_funded_by => 'referral');
  exception when others then
    -- Not a course premium_add_pass knows: forget it, so the friend's first
    -- real answer names the course instead.
    if sqlerrm = 'bad pass' then
      update public.referral_claims set course = null where id = r.id;
    end if;
    return;
  end;
  update public.referral_claims set welcome_at = now() where id = r.id;
end;
$$;

create or replace function public.referral_reward(p_claim bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_sharer uuid;
begin
  select c.*, k.user_id as sharer into r
    from public.referral_claims c join public.referral_codes k on k.code = c.code
   where c.id = p_claim
     for update of c;
  if r.id is null or r.qualified_at is null or r.rewarded_at is not null or r.sharer is null or r.course is null then
    return;
  end if;
  v_sharer := r.sharer;
  perform pg_advisory_xact_lock(hashtextextended('referral_reward:' || v_sharer::text, 0));
  if (select count(*) from public.referral_claims c join public.referral_codes k on k.code = c.code
       where k.user_id = v_sharer and c.rewarded_at > now() - interval '365 days') >= 8 then
    update public.referral_claims set capped = true where id = r.id;
    return;
  end if;
  begin
    perform public.premium_add_pass(
      p_user => v_sharer, p_course => r.course, p_pass => 'referral', p_days => 7,
      p_order_id => 'refr:' || r.id, p_funded_by => 'referral');
  exception when others then
    return;
  end;
  update public.referral_claims set rewarded_at = now(), capped = false where id = r.id;
end;
$$;

create or replace function public.referral_adopt(p_code text, p_secret text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
begin
  if v_uid is null or p_code is null or p_secret is null then
    return false;
  end if;
  update public.referral_codes
     set user_id = v_uid, bound_at = now()
   where code = p_code and user_id is null
     and secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex');
  if not found and not exists (select 1 from public.referral_codes c where c.code = p_code and c.user_id = v_uid) then
    return false;
  end if;
  -- Friends who already studied enough while the code was unbound.
  for v_id in
    select c.id from public.referral_claims c
     where c.code = p_code and c.qualified_at is not null and c.rewarded_at is null
     order by c.qualified_at
  loop
    perform public.referral_reward(v_id);
  end loop;
  return true;
end;
$$;

create or replace function public.referral_claim(p_code text, p_course text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user record;
  v_code record;
  v_key text;
  v_id bigint;
begin
  if v_uid is null then
    return 'signed-out';
  end if;
  select u.created_at, u.email into v_user from auth.users u where u.id = v_uid;
  if v_user.email is null then
    return 'no-email';
  end if;
  if v_user.created_at < now() - interval '3 days' then
    return 'not-new';
  end if;
  select * into v_code from public.referral_codes c where c.code = lower(coalesce(p_code, ''));
  if v_code.code is null then
    return 'unknown';
  end if;
  if v_code.user_id = v_uid then
    return 'own-code';
  end if;
  v_key := public.referral_email_key(v_user.email);
  if v_code.user_id is not null
     and public.referral_email_key((select u.email from auth.users u where u.id = v_code.user_id)) = v_key then
    return 'own-code';
  end if;
  if exists (select 1 from public.referral_claims c where c.friend_id = v_uid or c.email_key = v_key) then
    return 'already';
  end if;
  insert into public.referral_claims (friend_id, code, email_key, course)
  values (v_uid, v_code.code, v_key, case when p_course ~ '^[a-z]{2,12}$' then p_course end)
  on conflict do nothing
  returning id into v_id;
  if v_id is null then
    return 'already';
  end if;
  perform public.referral_welcome(v_id);
  return 'claimed';
end;
$$;

create or replace function public.referral_note_answer(p_course text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r record;
begin
  if v_uid is null then
    return null;
  end if;
  select * into r from public.referral_claims c where c.friend_id = v_uid for update;
  if r.id is null then
    return jsonb_build_object('claim', false);
  end if;
  if r.qualified_at is not null then
    return jsonb_build_object('claim', true, 'answers', r.answers, 'need', 20, 'done', true);
  end if;
  -- Nobody answers a question in under two seconds; a script does.
  if r.last_answer_at is not null and r.last_answer_at > now() - interval '2 seconds' then
    return jsonb_build_object('claim', true, 'answers', r.answers, 'need', 20, 'done', false);
  end if;
  update public.referral_claims
     set answers = answers + 1, last_answer_at = now(),
         course = coalesce(course, case when p_course ~ '^[a-z]{2,12}$' then p_course end),
         qualified_at = case when answers + 1 >= 20 then now() end
   where id = r.id
  returning * into r;
  if r.welcome_at is null then
    perform public.referral_welcome(r.id);
  end if;
  if r.qualified_at is not null then
    perform public.referral_reward(r.id);
  end if;
  return jsonb_build_object('claim', true, 'answers', r.answers, 'need', 20, 'done', r.qualified_at is not null);
end;
$$;

create or replace function public.referral_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'code', (select k.code from public.referral_codes k where k.user_id = auth.uid() order by k.created_at, k.code limit 1),
    'joined', count(c.id),
    'studying', count(c.qualified_at),
    'rewarded', count(c.rewarded_at),
    'rewarded_year', count(c.id) filter (where c.rewarded_at > now() - interval '365 days'),
    'waiting', count(c.id) filter (where c.capped and c.rewarded_at is null),
    'cap', 8,
    'days_each', 7)
    from public.referral_codes k
    left join public.referral_claims c on c.code = k.code
   where k.user_id = auth.uid() and auth.uid() is not null;
$$;

revoke all on table public.referral_codes, public.referral_claims from anon, authenticated;
revoke execute on function public.referral_email_key(text) from public, anon, authenticated;
revoke execute on function public.referral_welcome(bigint) from public, anon, authenticated;
revoke execute on function public.referral_reward(bigint) from public, anon, authenticated;
revoke execute on function public.referral_register(text, text) from public;
revoke execute on function public.referral_my_code() from public;
revoke execute on function public.referral_adopt(text, text) from public;
revoke execute on function public.referral_claim(text, text) from public;
revoke execute on function public.referral_note_answer(text) from public;
revoke execute on function public.referral_summary() from public;
grant execute on function public.referral_register(text, text) to anon, authenticated;
grant execute on function public.referral_my_code() to authenticated;
grant execute on function public.referral_adopt(text, text) to authenticated;
grant execute on function public.referral_claim(text, text) to authenticated;
grant execute on function public.referral_note_answer(text) to authenticated;
grant execute on function public.referral_summary() to authenticated;
