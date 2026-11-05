/* PGlite check of scripts/sql/migrations/2026-11d-classes-integrations.sql (after 2026-11b-classes.sql) and
   2026-11f-classes-google-ids.sql, on a
   real Postgres with stub auth.users / auth.identities / auth.uid() and the anon, authenticated and service_role roles.

   Not part of `node --test` (PGlite is not a dependency of the site). To run it:
     cd "$(mktemp -d)" && npm init -y >/dev/null && npm i @electric-sql/pglite@0.3.7
     cp <repo>/scripts/test/pglite/classes-integrations.mjs . && node classes-integrations.mjs <repo>
   Last run 2026-11-04: 82 passed, 0 failed. */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const REPO = process.argv[2];
const db = new PGlite();
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) pass++; else { failN++; console.log('FAIL', m); } };
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth; create schema extensions;
create function extensions.gen_random_bytes(n int) returns bytea language sql volatile as $$ select decode(string_agg(lpad(to_hex((random()*255)::int),2,'0'),''),'hex') from generate_series(1,n) $$;
create table auth.users (id uuid primary key, email text);
create table auth.identities (user_id uuid references auth.users (id) on delete cascade, provider text not null, provider_id text not null, identity_data jsonb not null default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('t.uid', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema extensions to anon, authenticated, service_role;
`);
await db.exec(readFileSync(REPO + '/scripts/sql/migrations/2026-11b-classes.sql', 'utf8'));
const mig = readFileSync(REPO + '/scripts/sql/migrations/2026-11d-classes-integrations.sql', 'utf8');
await db.exec(mig);
await db.exec(mig); // idempotent
const migF = readFileSync(REPO + '/scripts/sql/migrations/2026-11f-classes-google-ids.sql', 'utf8');
await db.exec(migF);
await db.exec(migF); // idempotent
const T = '11111111-1111-1111-1111-111111111111', S1 = '22222222-2222-2222-2222-222222222222', S2 = '33333333-3333-3333-3333-333333333333', X = '44444444-4444-4444-4444-444444444444';
await db.exec(`insert into auth.users values ('${T}','t@x.org'),('${S1}','s1@x.org'),('${S2}','s2@x.org'),('${X}','x@x.org');
grant select on auth.users to authenticated;`);
async function as(uid, role, sql, params) {
  await db.exec(`set t.uid = '${uid || ''}'; set role ${role};`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role;'); }
}
const one = async (uid, sql, params, role = 'authenticated') => { const r = await as(uid, role, sql, params); return Object.values(r.rows[0] || {})[0]; };
// setup class as teacher
await as(T, 'authenticated', `select public.teach_set_profile('Ms T', null)`);
const cls = await one(T, `select (public.teach_create_class('apbio','P1','[]'::jsonb))->>'id'`).catch(async () => (await one(T, `select public.teach_create_class('apbio','P1','[]'::jsonb)`)));
const clsId = typeof cls === 'object' ? cls.id : (String(cls).length === 36 ? cls : JSON.parse(cls).id);
const code = (await db.query(`select code from public.classes where id = $1`, [clsId])).rows[0].code;
await as(S1, 'authenticated', `select public.class_join($1, 'Sam One')`, [code]);
await as(S2, 'authenticated', `select public.class_join($1, 'Sue Two')`, [code]);
const aid = (await db.query(`insert into public.class_assignments (class_id, kind, title, spec) values ($1,'frq','FRQ 1','{"frq":"frq-agar-shape"}') returning id`, [clsId])).rows[0].id;
const pid = (await db.query(`insert into public.class_assignments (class_id, kind, title, spec, students) values ($1,'frq','FRQ only S2','{}', $2::jsonb) returning id`, [clsId, JSON.stringify([S2])])).rows[0].id;
const prac = (await db.query(`insert into public.class_assignments (class_id, kind, title) values ($1,'practice','P') returning id`, [clsId])).rows[0].id;

// grants: Worker-only tables invisible to browsers
for (const t of ['class_mail_log', 'class_oauth', 'lti_platforms', 'class_frq_work', 'class_report_links', 'class_ext_members']) {
  let denied = false; try { await as(S1, 'authenticated', `select * from public.${t}`); } catch { denied = true; }
  ok(denied, `${t} readable by authenticated`);
  let denied2 = false; try { await as(null, 'anon', `select * from public.${t}`); } catch { denied2 = true; }
  ok(denied2, `${t} readable by anon`);
  const r = await as(null, 'service_role', `select count(*) from public.${t}`); ok(r.rows.length === 1, `${t} service role`);
}
for (const f of [`public.class_mail_take('${T}','${clsId}','${S1}','remind', null)`, `public.class_member_emails('${clsId}')`, `public.class_report_get('x')`, `public.class_email_stop('${S1}')`, `public.class_email_stop_addr('x')`, `public.class_purge()`]) {
  let denied = false; try { await as(T, 'authenticated', `select ${f}`); } catch { denied = true; }
  ok(denied, `${f} callable by authenticated`);
}
// FRQ submit
ok(await one(S1, `select public.class_frq_submit($1, '{"a":"hi"}'::jsonb)`, [aid]) === true, 'member submits');
ok(await one(S1, `select public.class_frq_submit($1, '{"a":"hi"}'::jsonb)`, [pid]) === false, 'not targeted');
ok(await one(S1, `select public.class_frq_submit($1, '{"a":"hi"}'::jsonb)`, [prac]) === false, 'not frq');
ok(await one(X, `select public.class_frq_submit($1, '{"a":"hi"}'::jsonb)`, [aid]) === false, 'non member');
ok(await one(S1, `select public.class_frq_submit($1, '"x"'::jsonb)`, [aid]) === false, 'not object');
ok(await one(S1, `select public.class_frq_submit($1, $2::jsonb)`, [aid, JSON.stringify({ a: 'x'.repeat(21000) })]) === false, 'too big');
ok(await one(S2, `select public.class_frq_submit($1, '{"a":"yo"}'::jsonb)`, [pid]) === true, 'targeted member submits');
// teacher reads
let work = await one(T, `select public.teach_frq_work($1)`, [aid]);
ok(Array.isArray(work) && work.length === 1 && work[0].answers.a === 'hi', 'teacher sees work');
ok((await one(X, `select public.teach_frq_work($1)`, [aid])).length === 0, 'other teacher sees none');
ok((await one(S1, `select public.teach_frq_work($1)`, [aid])).length === 0, 'student sees none via teach');
// score
const sc = JSON.stringify({ points: { a: [true] }, got: 1, of: 4, comment: 'Good start' });
ok(await one(X, `select public.teach_frq_score($1,$2,$3::jsonb)`, [aid, S1, sc]) === false, 'other cannot score');
ok(await one(T, `select public.teach_frq_score($1,$2,$3::jsonb)`, [aid, S1, JSON.stringify({ points: {}, got: 5, of: 4 })]) === false, 'got > of');
ok(await one(T, `select public.teach_frq_score($1,$2,$3::jsonb)`, [aid, S1, JSON.stringify({ points: [], got: 1, of: 4 })]) === false, 'points not object');
ok(await one(T, `select public.teach_frq_score($1,$2,$3::jsonb)`, [aid, S1, sc]) === true, 'teacher scores');
let mine = await one(S1, `select public.class_frq_mine()`);
ok(mine.length === 1 && mine[0].score.comment === 'Good start' && mine[0].score.got === 1, 'student sees score');
ok((await one(S2, `select public.class_frq_mine()`)).length === 1, 'S2 sees only own');
// resubmit clears score
await as(S1, 'authenticated', `select public.class_frq_submit($1, '{"a":"better"}'::jsonb)`, [aid]);
mine = await one(S1, `select public.class_frq_mine()`);
ok(mine[0].score === null, 'resubmit clears score');
await as(T, 'authenticated', `select public.teach_frq_score($1,$2,$3::jsonb)`, [aid, S1, sc]);

// co-teachers score too; a stranger still cannot
await db.query(`insert into public.class_coteachers (class_id, user_id) values ($1,$2)`, [clsId, X]);
ok((await one(X, `select public.teach_frq_work($1)`, [aid])).length === 1, 'co-teacher sees work');
ok(await one(X, `select public.teach_frq_score($1,$2,$3::jsonb)`, [aid, S1, sc]) === true, 'co-teacher scores');
await db.query(`delete from public.class_coteachers`);
ok((await one(X, `select public.teach_frq_work($1)`, [aid])).length === 0, 'removed co-teacher sees none');

// mail take
const take = (s, k = 'remind', t = T, h = null) => one(null, `select public.class_mail_take($1,$2,$3,$4,$5)`, [t, clsId, s, k, h], 'service_role');
const H = (e) => createHash('sha256').update(e.trim().toLowerCase()).digest('hex');
ok(await take(S1) === true, 'first remind');
ok(await take(S1) === false, 'second within 20h');
ok(await take(S2) === true, 'other student');
ok(await take(S1, 'nope') === false, 'bad kind');
await db.query(`update public.class_mail_log set sent_at = now() - interval '21 hours' where student_id = $1`, [S1]);
ok(await take(S1) === true, 'after 21h');
ok(await one(null, `select public.class_email_stop($1)`, [S2], 'service_role') === true, 'stop');
ok(await one(null, `select public.class_email_stop($1)`, ['55555555-5555-5555-5555-555555555555'], 'service_role') === false, 'stop unknown');
await db.query(`update public.class_mail_log set sent_at = now() - interval '2 days'`);
ok(await take(S2) === false, 'opted out');
for (let i = 0; i < 200; i++) await db.query(`insert into public.class_mail_log (kind, teacher_id, class_id) values ('invite',$1,$2)`, [T, clsId]);
ok(await take(null, 'invite', T, H('new@x.org')) === false, 'teacher daily cap');
ok(await take(S1) === true, 'cap is per kind');
await db.query(`delete from public.class_mail_log where kind = 'invite'`);
ok(await take(null, 'invite') === false, 'an invite needs a recipient hash');
ok(await take(null, 'invite', T, H('new@x.org')) === true, 'first invite');
ok(await take(null, 'invite', X, H(' NEW@x.org ')) === false, 'once per 7 days per address, from any teacher');
await db.query(`update public.class_mail_log set sent_at = now() - interval '8 days' where kind = 'invite'`);
ok(await one(null, `select public.class_email_stop_addr($1)`, [H('new@x.org')], 'service_role') === true, 'stop by address');
ok(await take(null, 'invite', T, H('new@x.org')) === false, 'stopped address is not invited again');
ok(await one(null, `select public.class_email_stop_addr('nothex')`, [], 'service_role') === false, 'stop needs a hash');
await one(null, `select public.class_email_stop_addr($1)`, [H('s1@x.org')], 'service_role');
ok((await one(null, `select public.class_member_emails($1)`, [clsId], 'service_role')).find((m) => m.id === S1).optout === true, 'an address stop also covers reminders');
await db.query(`delete from public.class_email_optout_addr`);
await db.query(`insert into public.class_mail_log (kind, teacher_id, class_id, student_id, sent_at) values ('remind',$1,$2,$3, now() - interval '31 days')`, [T, clsId, S1]);
await one(null, `select public.class_purge()`, [], 'service_role');
ok(Number((await db.query(`select count(*) n from public.class_mail_log where sent_at < now() - interval '30 days'`)).rows[0].n) === 0, 'purge drops the 30-day log');
const em = await one(null, `select public.class_member_emails($1)`, [clsId], 'service_role');
ok(em.length === 2 && em.find((m) => m.id === S2).optout === true && em.find((m) => m.id === S1).email === 's1@x.org', 'member emails');

// report link
await db.query(`insert into public.class_report_links (token_hash, class_id, student_id, created_by, expires_at) values ('h1',$1,$2,$3, now() + interval '7 days'), ('h2',$1,$2,$3, now() - interval '1 minute')`, [clsId, S1, T]);
await as(S1, 'authenticated', `select public.class_push('apbio', '{"v":1,"at":1,"items":{"q1":["t","u",1,1,1,1,"p"]},"picks":{"q1":2},"flags":{},"exams":[],"frq":{},"done":{}}'::jsonb)`);
const rep = await one(null, `select public.class_report_get('h1')`, [], 'service_role');
ok(rep && rep.student === 'Sam One' && rep.teacher === 'Ms T' && rep.summary.items.q1 && rep.summary.picks === undefined, 'report data, no picks');
ok(rep.assignments.length === 2 && rep.assignments.find((a) => a.id === aid).teacher_score.got === 1, 'report: own assignments with teacher score');
ok(await one(null, `select public.class_report_get('h2')`, [], 'service_role') === null, 'expired link');
ok(await one(null, `select public.class_report_get('nope')`, [], 'service_role') === null, 'unknown link');

// Google Classroom matches (2026-11f): by Google sign-in id only, Worker only, never an address.
for (const f of [`public.class_google_matches('${clsId}', array['g1'])`, `public.class_announce_take('${clsId}')`]) {
  let denied = false; try { await as(T, 'authenticated', `select ${f}`); } catch { denied = true; }
  ok(denied, `${f} callable by authenticated`);
  let denied2 = false; try { await as(null, 'anon', `select ${f}`); } catch { denied2 = true; }
  ok(denied2, `${f} callable by anon`);
}
await db.query(`insert into auth.identities (user_id, provider, provider_id, identity_data) values
  ($1,'google','g1','{"sub":"g1","email":"s1@x.org"}'), ($2,'google','pid2','{"sub":"g2"}'), ($2,'email',$2::text,'{"email":"s2@x.org"}'), ($3,'google','g3','{"sub":"g3"}')`, [S1, S2, X]);
const gm = await one(null, `select public.class_google_matches($1, $2::text[])`, [clsId, ['g1', 'g2', 'g3', 'nope']], 'service_role');
ok(gm.length === 2 && gm.find((m) => m.id === S1).google === 'g1' && gm.find((m) => m.id === S2).google === 'g2', 'matches by provider_id and by sub, members only');
ok(!JSON.stringify(gm).includes('@'), 'no address in the matches');
ok(JSON.stringify(await one(null, `select public.class_google_matches($1, $2::text[])`, [clsId, []], 'service_role')) === '[]', 'no ids, no matches');
ok(JSON.stringify(await one(null, `select public.class_google_matches($1, $2::text[])`, [clsId, ['s1@x.org']], 'service_role')) === '[]', 'an email is not an id');
ok(await one(null, `select public.class_announce_take($1)`, [clsId], 'service_role') === false, 'no linked course, no announcement');
await db.query(`insert into public.class_ext_links (class_id, provider, external_id, title) values ($1,'google','501','AP Bio')`, [clsId]);
ok(await one(null, `select public.class_announce_take($1)`, [clsId], 'service_role') === true, 'first announcement');
ok(await one(null, `select public.class_announce_take($1)`, [clsId], 'service_role') === false, 'once per 10 minutes');
await db.query(`update public.class_ext_links set announced_at = now() - interval '11 minutes' where class_id = $1`, [clsId]);
ok(await one(null, `select public.class_announce_take($1)`, [clsId], 'service_role') === true, 'again after 10 minutes');

// ext links + leaving cascades
await db.query(`insert into public.class_ext_members (class_id, student_id, provider, external_user) values ($1,$2,'google','g1')`, [clsId, S1]);
await as(S1, 'authenticated', `select public.class_leave($1)`, [clsId]);
const left = (await db.query(`select (select count(*) from public.class_frq_work where student_id = $1) w, (select count(*) from public.class_report_links where student_id = $1) l, (select count(*) from public.class_ext_members where student_id = $1) e`, [S1])).rows[0];
ok(Number(left.w) === 0 && Number(left.l) === 0 && Number(left.e) === 0, 'leaving removes work, links and ext ids');
// delete class cascades
await db.query(`insert into public.class_oauth (teacher_id, provider, refresh_enc) values ($1,'google','enc')`, [T]);
await as(T, 'authenticated', `select public.teach_delete_class($1)`, [clsId]);
const gone = (await db.query(`select (select count(*) from public.class_frq_work) w, (select count(*) from public.class_mail_log) m`)).rows[0];
ok(Number(gone.w) === 0 && Number(gone.m) === 0, 'delete class cascades');
await db.query(`delete from auth.users where id = $1`, [T]);
ok(Number((await db.query(`select count(*) n from public.class_oauth`)).rows[0].n) === 0, 'deleting the account removes the Google token');
console.log(`${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
