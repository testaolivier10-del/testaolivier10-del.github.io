/* Teacher classes v2 (scripts/sql/migrations/2026-11c-classes-v2.sql) run against a real Postgres: PGlite,
   with a fake auth.uid() read from a setting. PGlite is not a repo dependency (the site has no build step), so
   the behaviour tests run only when it can be found:
     npm i --prefix /some/dir @electric-sql/pglite
     PGLITE=/some/dir/node_modules/@electric-sql/pglite node --test scripts/test/classes-v2-sql.test.mjs
   The static checks (RLS, grants, schema.sql) always run. Nothing here touches the live database. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const V1 = readFileSync('scripts/sql/migrations/2026-11b-classes.sql', 'utf8');
const V2 = readFileSync('scripts/sql/migrations/2026-11c-classes-v2.sql', 'utf8');
const SCHEMA = readFileSync('scripts/sql/schema.sql', 'utf8');

test('every new table has RLS on and is closed to anon and authenticated', () => {
  const tables = [...V2.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);
  assert.ok(tables.length >= 6);
  for (const t of tables) {
    assert.ok(V2.includes(`alter table public.${t} enable row level security;`), `${t} has RLS`);
    assert.match(V2, new RegExp(`revoke all on table [^;]*public\\.${t}\\b[^;]*from anon, authenticated;`), `${t} revoked`);
    assert.ok(SCHEMA.includes(`create table if not exists public.${t} (`), `${t} is in schema.sql`);
  }
  assert.doesNotMatch(V2, /create policy|grant (select|insert|update|delete|all) on/i, 'no table grants or policies');
});

test('every function is security definer with a fixed search_path, and class_role stays internal', () => {
  const fns = [...V2.matchAll(/create or replace function public\.(\w+)\(([^)]*)\)\n([\s\S]*?)\nas \$\$/g)];
  assert.ok(fns.length >= 25);
  for (const [, name, , head] of fns) {
    assert.match(head, /security definer/, `${name} is security definer`);
    assert.match(head, /set search_path = public/, `${name} pins search_path`);
  }
  assert.doesNotMatch(V2 + SCHEMA, /grant execute on function public\.class_role\(/);
  assert.match(V2, /revoke execute on function public\.class_role\(uuid\) from public, anon, authenticated;/);
});

async function pglite() {
  const tries = [process.env.PGLITE, '@electric-sql/pglite'].filter(Boolean);
  for (const t of tries) {
    try {
      const spec = existsSync(t) ? pathToFileURL(join(t, JSON.parse(readFileSync(join(t, 'package.json'), 'utf8')).exports['.'].import.default || 'dist/index.js')).href : t;
      return (await import(spec)).PGlite;
    } catch (e) { /* try the next */ }
  }
  return null;
}

test('behaviour in Postgres (PGlite)', async (t) => {
  const PGlite = await pglite();
  if (!PGlite) { t.skip('PGlite not found: set PGLITE to its package folder'); return; }
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema extensions;
    create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile as $$ select decode(string_agg(lpad(to_hex((random()*255)::int), 2, '0'), ''), 'hex') from generate_series(1, n) $$;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;`);
  await db.exec(V1);
  await db.exec(V2);
  await db.exec(V2); // idempotent
  const T = '11111111-1111-1111-1111-111111111111', S = '22222222-2222-2222-2222-222222222222', X = '33333333-3333-3333-3333-333333333333',
        C = '44444444-4444-4444-4444-444444444444', S2 = '55555555-5555-5555-5555-555555555555';
  await db.exec(`insert into auth.users values ('${T}'),('${S}'),('${X}'),('${C}'),('${S2}')`);
  const as = async (u, q, p = []) => { await db.exec(`select set_config('test.uid', '${u}', false)`); return (await db.query(q, p)).rows[0].r; };

  await as(T, `select public.teach_set_profile('Ms. Rivera', null) r`);
  await as(C, `select public.teach_set_profile('Mr. Chen', null) r`);
  const cls = await as(T, `select public.teach_create_class('apbio', 'Period 3', '["unit-1","unit-2"]') r`);
  await as(S, `select public.class_join($1, 'Priya K.') r`, [cls.code]);
  await as(S2, `select public.class_join($1, 'Dev L.') r`, [cls.code]);

  // Co-teachers
  assert.equal(await as(C, `select public.teach_class_report($1) r`, [cls.id]), null, 'no access before joining');
  assert.equal(await as(C, `select public.teach_coteach_code($1) r`, [cls.id]), null, 'only the owner makes the co-teacher code');
  const cc = await as(T, `select public.teach_coteach_code($1) r`, [cls.id]);
  assert.match(cc, /^[A-Z2-9]{8}$/);
  assert.equal(await as(S, `select public.teach_coteach_join($1) r`, [cc]), null, 'a student with no teacher profile cannot co-teach');
  assert.equal((await as(C, `select public.teach_coteach_join($1) r`, [cc.toLowerCase()])).id, cls.id, 'co-teacher joins');
  const repC = await as(C, `select public.teach_class_report($1) r`, [cls.id]);
  assert.equal(repC.class.role, 'co'); assert.equal(repC.class.coteach_code, null, 'co-teachers do not see the co-teacher code');
  assert.equal(repC.members.length, 2);
  assert.equal((await as(T, `select public.teach_class_report($1) r`, [cls.id])).coteachers[0].name, 'Mr. Chen');
  assert.equal((await as(C, `select public.teach_my_classes() r`))[0].role, 'co');
  const aid = await as(C, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'mastery', title: 'Master unit 1', spec: { topics: ['water'], target: 0.8, min: 10, controls: { timeLimit: 20, shuffle: true, release: 'after_due', questions: [] } } })]);
  assert.ok(aid, 'co-teacher assigns, mastery kind accepted');
  assert.equal(await as(C, `select public.teach_delete_assignment($1) r`, [aid]), false, 'co-teacher cannot delete an assignment');
  assert.equal(await as(C, `select public.teach_set_member($1, $2, '{"remove":true}') r`, [cls.id, S]), false, 'co-teacher cannot remove a student');
  assert.equal(await as(C, `select public.teach_set_member($1, $2, '{"extra_time":1.5}') r`, [cls.id, S]), true, 'co-teacher sets extra time');
  await as(C, `select public.teach_update_class($1, '{"archived":true,"name":"P3 renamed"}') r`, [cls.id]);
  const after = await as(T, `select public.teach_class_report($1) r`, [cls.id]);
  assert.equal(after.class.archived, false, 'co-teacher cannot archive'); assert.equal(after.class.name, 'P3 renamed', 'co-teacher renames');
  assert.equal(await as(C, `select public.teach_delete_class($1) r`, [cls.id]), false, 'co-teacher cannot delete the class');
  assert.equal(await as(X, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'x' })]), null, 'a stranger cannot assign');

  // Announcements
  const an = await as(C, `select public.teach_post_announcement($1, '  Quiz Friday on unit 1. ') r`, [cls.id]);
  assert.ok(an);
  assert.equal(await as(X, `select public.teach_post_announcement($1, 'spam') r`, [cls.id]), null, 'a stranger cannot post');
  const mine = await as(S, `select public.class_mine() r`);
  assert.equal(mine[0].announcements[0].body, 'Quiz Friday on unit 1.', 'students see announcements');
  assert.equal(mine[0].extra_time, 1.5);
  assert.equal(await as(X, `select public.teach_delete_announcement($1) r`, [an]), false);
  assert.equal(await as(T, `select public.teach_delete_announcement($1) r`, [an]), true, 'the owner deletes any announcement');

  // Teacher questions
  const qd = { course: 'apbio', topic: 'water', unit: 'unit-1', q: 'Why does ice float?', options: ['Less dense', 'More dense', 'Same density'], correct: 0, why: 'Hydrogen bonds hold it open.' };
  const qid = await as(T, `select public.teach_save_question(null, $1) r`, [JSON.stringify(qd)]);
  assert.ok(qid);
  for (const bad of [{ ...qd, correct: 3 }, { ...qd, correct: 1.5 }, { ...qd, options: ['only one'] }, { ...qd, course: 'nremt' }, { ...qd, q: '' }, { ...qd, options: ['a', 2] }])
    assert.equal(await as(T, `select public.teach_save_question(null, $1) r`, [JSON.stringify(bad)]), null, 'refused: ' + JSON.stringify(bad).slice(0, 60));
  assert.equal(await as(S, `select public.teach_save_question(null, $1) r`, [JSON.stringify(qd)]), null, 'students cannot write questions');
  assert.equal((await as(T, `select public.teach_questions('apbio') r`)).length, 1);
  assert.equal((await as(C, `select public.teach_questions('apbio') r`)).length, 0, 'banks are per teacher');
  assert.equal(await as(C, `select public.teach_save_question($1, $2) r`, [qid, JSON.stringify(qd)]), null, 'nobody else edits it');
  const qa = await as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'With mine', spec: { topics: ['water'], count: 5, controls: { questions: [qid] } } })]);
  const qs = await as(S, `select public.class_questions_for($1) r`, [qa]);
  assert.equal(qs.length, 1); assert.equal(qs[0].q, 'Why does ice float?');
  assert.equal((await as(X, `select public.class_questions_for($1) r`, [qa])).length, 0, 'not for someone outside the class');
  const qa2 = await as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'Only Dev', students: [S2], spec: { topics: ['water'], count: 5, controls: { questions: [qid] } } })]);
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [qa2])).length, 0, 'not for a student the assignment is not for');
  const qa3 = await as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'Later', opens_at: '2099-01-01T00:00:00Z', spec: { controls: { questions: [qid] } } })]);
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [qa3])).length, 0, 'not before it opens');
  const other = await as(X, `select public.teach_set_profile('Ms. X', null) r`);
  assert.equal(other, true);
  const xq = await as(X, `select public.teach_save_question(null, $1) r`, [JSON.stringify(qd)]);
  const qa4 = await as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'Foreign', spec: { controls: { questions: [xq] } } })]);
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [qa4])).length, 0, 'never another teacher’s question');
  assert.equal(qs[0].correct, 0, 'release now (the default): answers come with the questions');

  // Held answers and class_submit
  const held = (release, due) => as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'Held ' + release, due_at: due, spec: { controls: { release, questions: [qid] } } })]);
  const future = '2099-01-01T00:00:00Z', past = '2020-01-01T00:00:00Z';
  const hd = await held('after_due', future);
  let hq = await as(S, `select public.class_questions_for($1) r`, [hd]);
  assert.equal(hq.length, 1); assert.equal(hq[0].correct, undefined, 'after_due: no answer before the due date'); assert.equal(hq[0].why, undefined);
  assert.equal(await as(S, `select public.class_submit($1, $2) r`, [hd, JSON.stringify({ 'not-listed': 1 })]), null, 'only the assignment’s questions');
  assert.equal(await as(S, `select public.class_submit($1, $2) r`, [hd, JSON.stringify({ [qid]: 'x' })]), null, 'picks are numbers');
  let sub = await as(S, `select public.class_submit($1, $2) r`, [hd, JSON.stringify({ [qid]: 1 })]);
  assert.equal(sub.recorded, true); assert.equal(sub.answers, undefined, 'after_due before the due date: recorded only');
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [hd]))[0].correct, undefined, 'still held after submitting');
  assert.equal(await as(X, `select public.class_submit($1, $2) r`, [hd, JSON.stringify({ [qid]: 0 })]), null, 'not for someone outside the class');
  assert.equal(await as(S, `select public.class_submit($1, $2) r`, [qa2, JSON.stringify({ [qid]: 0 })]), null, 'not for an assignment meant for someone else');
  const hs = await held('after_submit', future);
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [hs]))[0].correct, undefined, 'after_submit: held before submitting');
  sub = await as(S, `select public.class_submit($1, $2) r`, [hs, JSON.stringify({ [qid]: 2 })]);
  assert.equal(sub.answers[0].correct, 0); assert.equal(sub.answers[0].why, qd.why);
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [hs]))[0].correct, 0, 'after_submit: open once submitted');
  await as(S, `select public.class_submit($1, $2) r`, [hs, JSON.stringify({ [qid]: 0 })]);
  assert.equal((await db.query(`select picks from public.class_submissions where assignment_id = $1`, [hs])).rows[0].picks[qid], 2, 'recorded once: a second call changes nothing');
  const hp = await held('after_due', past);
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [hp]))[0].correct, 0, 'after_due: open once the due date passed');
  await as(T, `select public.teach_set_member($1, $2, '{"extra_days":3}') r`, [cls.id, S]);
  const hx = await held('after_due', new Date(Date.now() - 86400000).toISOString());
  assert.equal((await as(S, `select public.class_questions_for($1) r`, [hx]))[0].correct, undefined, 'extra days move the release too');
  assert.equal((await as(S2, `select public.class_questions_for($1) r`, [hx]))[0].correct, 0, 'a student without extra days sees it');
  await as(T, `select public.teach_set_member($1, $2, '{"extra_days":0}') r`, [cls.id, S]);

  // Student lists are capped and must be ids
  const many = Array.from({ length: 201 }, () => S);
  assert.equal(await as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'big', students: many })]), null, 'at most 200 students');
  assert.equal(await as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'practice', title: 'bad', students: ['Priya K.'] })]), null, 'ids only');

  // The co-teacher reads the owner's questions this class uses; copying gives the copier their own copy
  assert.equal((await as(C, `select public.teach_class_questions($1) r`, [cls.id])).length, 1, 'class questions for a co-teacher');
  assert.deepEqual(await as(X, `select public.teach_class_questions($1) r`, [cls.id]), [], 'a stranger gets none');
  const cc2 = await as(C, `select public.teach_copy_class($1, 'Chen P2', 0) r`, [cls.id]);
  const mineC = await as(C, `select public.teach_questions('apbio') r`);
  assert.equal(mineC.length, 1, 'the owner’s question copied to the co-teacher'); assert.notEqual(mineC[0].id, qid);
  const repCopy = await as(C, `select public.teach_class_report($1) r`, [cc2.id]);
  const withQ = repCopy.assignments.find((a) => a.title === 'With mine');
  assert.deepEqual(withQ.spec.controls.questions, [mineC[0].id], 'the copy points at the copied question');
  assert.equal(repCopy.assignments.find((a) => a.title === 'Foreign').spec.controls.questions[0], xq, 'a stranger’s question is not copied');

  // Copy a class
  const due = '2026-09-10T12:00:00Z';
  await as(T, `select public.teach_save_assignment($1, null, $2) r`, [cls.id, JSON.stringify({ kind: 'review', title: 'Dated', due_at: due, late_until: '2026-09-12T12:00:00Z', opens_at: '2026-09-01T12:00:00Z', students: [S] })]);
  const cp = await as(T, `select public.teach_copy_class($1, 'Period 5', 365) r`, [cls.id]);
  const rep2 = await as(T, `select public.teach_class_report($1) r`, [cp.id]);
  assert.equal(rep2.members.length, 0, 'no students copied');
  assert.equal(rep2.assignments.length, (await as(T, `select public.teach_class_report($1) r`, [cls.id])).assignments.length, 'every assignment copied');
  const dated = rep2.assignments.find((a) => a.title === 'Dated');
  assert.ok(dated.due_at.startsWith('2027-09-10'), 'dates shifted by a year: ' + dated.due_at);
  assert.equal(dated.students, null, 'student lists dropped');
  assert.notEqual(cp.code, cls.code);
  assert.equal(await as(X, `select public.teach_copy_class($1, 'Mine now', 0) r`, [cls.id]), null, 'a stranger cannot copy');

  // Live mode
  const item = { id: 'bio-x-1', q: 'Pick A', options: ['A', 'B', 'C'], correct: 0, why: 'Because.' };
  assert.equal(await as(X, `select public.teach_live_show($1, $2) r`, [cls.id, JSON.stringify(item)]), null);
  assert.equal(await as(T, `select public.teach_live_show($1, $2) r`, [cls.id, JSON.stringify(item)]), 1);
  let ls = await as(S, `select public.class_live_state() r`);
  assert.equal(ls.length, 1); assert.equal(ls[0].item.correct, undefined, 'no answer before the reveal'); assert.equal(ls[0].item.why, undefined);
  assert.equal((await as(S, `select public.class_mine() r`))[0].live, true);
  assert.equal(await as(S, `select public.class_live_answer($1, 1, 2) r`, [cls.id]), true);
  assert.equal(await as(S, `select public.class_live_answer($1, 1, 1) r`, [cls.id]), true, 'change before the reveal');
  assert.equal(await as(S, `select public.class_live_answer($1, 1, 3) r`, [cls.id]), false, 'no option 3');
  assert.equal(await as(S, `select public.class_live_answer($1, 9, 0) r`, [cls.id]), false, 'not an old or future question');
  assert.equal(await as(X, `select public.class_live_answer($1, 1, 0) r`, [cls.id]), false, 'not a member');
  await as(S2, `select public.class_live_answer($1, 1, 0) r`, [cls.id]);
  let tl = await as(C, `select public.teach_live_state($1) r`, [cls.id]);
  assert.equal(tl.answers.length, 2); assert.equal(tl.answers.find((a) => a.name === 'Priya K.').pick, 1);
  assert.equal(await as(X, `select public.teach_live_state($1) r`, [cls.id]), null, 'a stranger sees nothing');
  await as(T, `select public.teach_live_reveal($1, true) r`, [cls.id]);
  assert.equal(await as(S, `select public.class_live_answer($1, 1, 0) r`, [cls.id]), false, 'locked after the reveal');
  ls = await as(S, `select public.class_live_state() r`);
  assert.equal(ls[0].item.correct, 0); assert.equal(ls[0].mine, 1); assert.deepEqual(ls[0].counts, { 0: 1, 1: 1 });
  assert.equal(await as(T, `select public.teach_live_show($1, $2) r`, [cls.id, JSON.stringify(item)]), 2, 'next question');
  assert.equal((await as(T, `select public.teach_live_state($1) r`, [cls.id])).answers.length, 0, 'fresh answers for the next question');
  await as(T, `select public.teach_live_stop($1) r`, [cls.id]);
  assert.equal((await as(S, `select public.class_live_state() r`)).length, 0);
  assert.equal((await as(T, `select public.teach_live_state($1) r`, [cls.id])).open, false);

  // Departments
  const code = await as(T, `select public.teach_dept_create('Science') r`);
  assert.match(code, /^[A-Z2-9]{8}$/);
  assert.equal(await as(S, `select public.teach_dept_create('Nope') r`), null, 'students cannot make one');
  assert.equal(await as(C, `select public.teach_dept_join($1) r`, [code]), true);
  await as(T, `select public.teach_update_class($1, '{"dept_shared":true,"dept_stats":{"n":2,"units":{"unit-1":0.5,"Priya K.":1},"names":["Priya K."],"current":"Priya","order":["unit-1","Dev L."]}}') r`, [cls.id]);
  await as(C, `select public.teach_update_class($1, '{"dept_shared":false}') r`, [cls.id]);
  let dv = await as(C, `select public.teach_dept_view() r`);
  assert.equal(dv.name, 'Science'); assert.equal(dv.teachers.length, 2);
  assert.equal(dv.classes.length, 1, 'shared class listed (a co-teacher cannot unshare it)'); assert.equal(dv.classes[0].stats.n, 2);
  assert.equal(JSON.stringify(dv).includes('Priya'), false, 'no student names in the department view');
  assert.deepEqual(dv.classes[0].stats, { n: 2, units: { 'unit-1': 0.5 }, order: ['unit-1'] }, 'only whitelisted numbers and unit keys are kept');
  const code2 = await as(X, `select public.teach_dept_create('Math') r`);
  await as(T, `select public.teach_dept_join($1) r`, [code]);
  assert.equal((await as(C, `select public.teach_dept_view() r`)).classes.length, 1, 'rejoining the same department keeps sharing');
  await as(T, `select public.teach_dept_join($1) r`, [code2]);
  assert.equal((await as(T, `select public.teach_dept_view() r`)).classes.length, 0, 'switching departments stops sharing');
  assert.equal((await as(C, `select public.teach_dept_view() r`)).classes.length, 0);
  await as(T, `select public.teach_dept_join($1) r`, [code]);
  assert.equal((await as(X, `select public.teach_dept_view() r`)).classes.length, 0, 'another department sees none of these classes');
  await as(T, `select public.teach_dept_leave() r`);
  dv = await as(C, `select public.teach_dept_view() r`);
  assert.equal(dv.classes.length, 0, 'leaving stops sharing');

  // Leaving co-teaching
  assert.equal(await as(C, `select public.teach_coteach_remove($1, $2) r`, [cls.id, T]), false, 'a co-teacher cannot remove the owner');
  assert.equal(await as(C, `select public.teach_coteach_remove($1, $2) r`, [cls.id, C]), true, 'a co-teacher leaves');
  assert.equal(await as(C, `select public.teach_class_report($1) r`, [cls.id]), null);

  // Grants
  const g = (await db.query(`select has_function_privilege('anon','public.class_live_state()','execute') a,
      has_function_privilege('authenticated','public.class_live_state()','execute') b,
      has_function_privilege('authenticated','public.class_role(uuid)','execute') r,
      has_table_privilege('authenticated','public.class_questions','select') t1,
      has_table_privilege('authenticated','public.class_live_answers','insert') t2`)).rows[0];
  assert.deepEqual(g, { a: false, b: true, r: false, t1: false, t2: false });
  await db.close();
});
