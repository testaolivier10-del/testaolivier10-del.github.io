/* Class readiness (scripts/sql/migrations/2026-11l-class-ready.sql): hide scores and Class Premium.
   Static checks always run; the behaviour test runs on PGlite when it can be found (see classes-v2-sql.test.mjs). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const V1 = readFileSync('scripts/sql/migrations/2026-11b-classes.sql', 'utf8');
const V2 = readFileSync('scripts/sql/migrations/2026-11c-classes-v2.sql', 'utf8');
const MIG = readFileSync('scripts/sql/migrations/2026-11l-class-ready.sql', 'utf8');
const SCHEMA = readFileSync('scripts/sql/schema.sql', 'utf8');

test('schema.sql ends with the migration, word for word', () => {
  const body = MIG.slice(MIG.indexOf('alter table public.classes add column'));
  assert.ok(SCHEMA.trimEnd().endsWith(body.trimEnd()));
});

test('class_premium is closed to the browser; only the teacher read is granted to signed-in users', () => {
  assert.ok(MIG.includes('alter table public.class_premium enable row level security;'));
  assert.ok(MIG.includes('revoke all on public.class_premium from anon, authenticated;'));
  assert.doesNotMatch(MIG, /create policy/i);
  for (const f of ['class_premium_state', 'class_premium_until', 'class_premium_add', 'class_premium_refund']) {
    assert.match(MIG, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to service_role;`));
    assert.doesNotMatch(MIG, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`), `${f} stays Worker only`);
  }
  assert.match(MIG, /grant execute on function public\.teach_class_premium\(uuid\) to authenticated;/);
  for (const [, name, head] of MIG.matchAll(/create or replace function public\.(\w+)\([^)]*\)\s*\n?([\s\S]*?)as \$\$/g)) {
    assert.match(head, /security definer/, `${name} is security definer`);
    assert.match(head, /set search_path = public/, `${name} pins search_path`);
  }
});

async function pglite() {
  for (const t of [process.env.PGLITE, '@electric-sql/pglite'].filter(Boolean)) {
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
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema extensions;
    create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile as $$ select decode(string_agg(lpad(to_hex((random()*255)::int), 2, '0'), ''), 'hex') from generate_series(1, n) $$;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create table public.premium_passes (id bigint generated always as identity primary key, user_id uuid not null, course text not null,
      pass text not null, starts_at timestamptz not null default now(), expires_at timestamptz not null, order_id text unique, refunded_at timestamptz);`);
  await db.exec(V1); await db.exec(V2); await db.exec(MIG); await db.exec(MIG);   // twice: idempotent
  const U = (n) => `00000000-0000-0000-0000-00000000000${n}`;
  const as = (n) => db.exec(`select set_config('test.uid', '${n ? U(n) : ''}', false)`);
  const one = async (sql) => (await db.query(sql)).rows[0];
  for (let i = 1; i <= 6; i++) await db.exec(`insert into auth.users values ('${U(i)}')`);

  await as(1);
  await db.exec(`select public.teach_set_profile('Ms. Rivera', 'Lincoln High')`);
  const cls = (await one(`select public.teach_create_class('apbio', 'Period 1', '[]'::jsonb) as r`)).r;
  for (const [n, name] of [[2, 'Ana'], [3, 'Ben'], [4, 'Cy']]) {
    await as(n);
    assert.ok((await one(`select public.class_join('${cls.code}', '${name}') as r`)).r, `${name} joins`);
    await db.exec(`update public.class_members set joined_at = now() - interval '${10 - n} minutes' where student_id = '${U(n)}'`);
  }

  // Hide scores: off by default, a teacher sets it, students read it, a stranger cannot set it.
  await as(2);
  assert.equal((await one(`select public.class_mine() as r`)).r[0].hide_scores, false);
  assert.equal((await one(`select public.teach_update_class('${cls.id}', '{"hide_scores": true}') as r`)).r, null, 'a student cannot change it');
  await as(1);
  await db.exec(`select public.teach_update_class('${cls.id}', '{"hide_scores": true}')`);
  assert.equal((await one(`select public.teach_class_report('${cls.id}') as r`)).r.class.hide_scores, true);
  await db.exec(`select public.teach_update_class('${cls.id}', '{"name": "Period 1A"}')`);
  assert.equal((await one(`select public.teach_class_report('${cls.id}') as r`)).r.class.hide_scores, true, 'another patch leaves it alone');
  await as(2);
  assert.equal((await one(`select public.class_mine() as r`)).r[0].hide_scores, true);

  // No Class Premium yet: nobody has Premium.
  for (const n of [1, 2, 3, 4]) { await as(n); assert.equal((await db.query(`select * from public.my_premium()`)).rows.length, 0); }

  // Two seats: the first two students to join and the teacher are covered, the third is not.
  const until = '2027-07-01T09:59:59Z';
  const add = (await one(`select public.class_premium_add('${cls.id}', '${U(1)}', 2, '${until}', 'ord_1', 1000) as r`)).r;
  assert.equal(add.inserted, true);
  assert.equal((await one(`select public.class_premium_add('${cls.id}', '${U(1)}', 2, '${until}', 'ord_1', 1000) as r`)).r.inserted, false, 'the same order adds nothing');
  const prem = async (n) => { await as(n); return (await db.query(`select * from public.my_premium()`)).rows; };
  for (const n of [1, 2, 3]) {
    const rows = await prem(n);
    assert.equal(rows.length, 1, `user ${n} is covered`);
    assert.equal(rows[0].course, 'apbio');
    assert.equal(new Date(rows[0].expires_at).toISOString(), new Date(until).toISOString());
  }
  assert.equal((await prem(4)).length, 0, 'no seat for the third student');
  assert.equal((await prem(5)).length, 0, 'not in the class');
  await as(1);
  const st = (await one(`select public.teach_class_premium('${cls.id}') as r`)).r;
  assert.equal(Number(st.seats), 2); assert.equal(Number(st.members), 3);
  await as(5);
  assert.equal((await one(`select public.teach_class_premium('${cls.id}') as r`)).r, null, 'a stranger reads nothing');

  // One more seat covers the third student; their own longer pass wins over the class's.
  await db.exec(`select public.class_premium_add('${cls.id}', '${U(1)}', 1, '${until}', 'ord_2', 500)`);
  assert.equal((await prem(4)).length, 1);
  await db.exec(`insert into public.premium_passes (user_id, course, pass, starts_at, expires_at) values ('${U(2)}', 'apbio', 'bio-2027', now() - interval '1 day', '2028-01-01T00:00:00Z')`);
  assert.equal(new Date((await prem(2))[0].expires_at).toISOString(), '2028-01-01T00:00:00.000Z');

  // A refund of the first order leaves one seat: only the first student to join (and the teacher) stay covered.
  assert.equal((await one(`select public.class_premium_refund('ord_1') as r`)).r, 1);
  assert.equal((await one(`select public.class_premium_refund('ord_1') as r`)).r, 0);
  assert.equal((await prem(1)).length, 1);
  assert.equal((await prem(3)).length, 0);
  assert.equal((await prem(4)).length, 0);
  // Leaving the class ends the cover; an archived class covers no one.
  await as(3); await db.exec(`select public.class_leave('${cls.id}')`);
  await as(1); await db.exec(`select public.teach_update_class('${cls.id}', '{"archived": true}')`);
  assert.equal((await prem(1)).length, 0);
});
