/* Free limits on the server (scripts/sql/migrations/2026-11h-free-usage.sql) in a real Postgres: PGlite with a
   fake auth.uid(). PGlite is not a repo dependency; the behaviour test runs when PGLITE points at it:
     npm i --prefix /some/dir @electric-sql/pglite
     PGLITE=/some/dir/node_modules/@electric-sql/pglite node --test scripts/test/free-usage-sql.test.mjs
   The static checks always run. Nothing here touches the live database. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const MIG = readFileSync('scripts/sql/migrations/2026-11h-free-usage.sql', 'utf8');

test('the table is closed to browsers; only the two RPCs are granted, to signed-in users only', () => {
  assert.match(MIG, /alter table public\.free_usage enable row level security;/);
  assert.match(MIG, /revoke all on public\.free_usage from anon, authenticated;/);
  assert.doesNotMatch(MIG, /create policy|grant (select|insert|update|delete|all) on/i);
  const grants = [...MIG.matchAll(/grant execute on function public\.(\w+)\([^)]*\) to ([a-z_, ]+);/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(grants, [['free_usage_get', 'authenticated'], ['free_usage_add', 'authenticated']]);
});

async function pglite() {
  const t = process.env.PGLITE;
  if (!t || !existsSync(t)) return null;
  const pkg = JSON.parse(readFileSync(join(t, 'package.json'), 'utf8'));
  const entry = (pkg.exports && pkg.exports['.'] && (pkg.exports['.'].import?.default || pkg.exports['.'].import)) || 'dist/index.js';
  return (await import(pathToFileURL(join(t, entry)).href)).PGlite;
}

test('behaviour in Postgres (PGlite)', async (t) => {
  const PGlite = await pglite();
  if (!PGlite) { t.skip('PGlite not found: set PGLITE to its package folder'); return; }
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;`);
  await db.exec(MIG);
  await db.exec(MIG); // idempotent
  const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
  await db.exec(`insert into auth.users values ('${A}'),('${B}')`);
  const as = async (u, q, p = []) => { await db.exec(`select set_config('test.uid', '${u}', false)`); return (await db.query(q, p)).rows[0].r; };
  const d = new Date(); const today = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;

  assert.equal(await as(A, `select public.free_usage_add('apbio', 'q', $1, 3) r`, [today]), 3);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'q', $1, 2) r`, [today]), 5, 'adds up');
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'exam', '', 1) r`), 1);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'exam', '', 1) r`), 1, 'an exam is a flag');
  assert.equal(await as(A, `select public.free_usage_add('nremt', 'cat', '', 1) r`), 1);
  assert.deepEqual(await as(A, `select public.free_usage_get($1) r`, [today]), { apbio: { q: 5, exam: 1 }, nremt: { cat: 1 } });
  assert.deepEqual(await as(B, `select public.free_usage_get($1) r`, [today]), {}, 'another user sees nothing of A');
  assert.deepEqual(await as('', `select public.free_usage_get($1) r`, [today]), {}, 'signed out: nothing');

  // Refused: signed out, unknown course or kind, adaptive exam outside NREMT, silly n, a far-off day.
  assert.equal(await as('', `select public.free_usage_add('apbio', 'q', $1, 1) r`, [today]), null);
  assert.equal(await as(A, `select public.free_usage_add('nope', 'q', $1, 1) r`, [today]), null);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'x', $1, 1) r`, [today]), null);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'cat', '', 1) r`), null);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'q', $1, 0) r`, [today]), null);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'q', $1, 31) r`, [today]), null);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'q', '2020-1-1', 1) r`), null);
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'q', 'garbage', 1) r`), null);
  // A different day is a fresh count.
  const y = new Date(Date.now() - 864e5); const yesterday = `${y.getUTCFullYear()}-${y.getUTCMonth() + 1}-${y.getUTCDate()}`;
  assert.equal(await as(A, `select public.free_usage_add('apbio', 'q', $1, 1) r`, [yesterday]), 1);
});
