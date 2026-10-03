/* scripts/sql/migrations/2026-10-audit.sql against scripts/sql/schema.sql and
   the browser code.

   The migration is what the live database gets; schema.sql is what a fresh
   project gets. They must define every function the same way, or the two
   databases drift apart silently. And the grants are the security boundary
   (site audit, Fix-first 9): every RPC the browser calls must be granted,
   and nothing the Worker alone may call can be. Behaviour was checked
   against a real Postgres (PGlite) while writing this; see
   docs/site-audit-notes/w3.md. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MIG = readFileSync('scripts/sql/migrations/2026-10-audit.sql', 'utf8');
const SCHEMA = readFileSync('scripts/sql/schema.sql', 'utf8');
const FN = /(?:create or replace function|create function) public\.(\w+)\(.*?\n\$\$;\n/gs;
const blocks = (sql) => new Map([...sql.matchAll(FN)].map((m) => [m[1], m[0]]));

const WORKER_ONLY = ['unsubscribe_email_reminder', 'premium_add_pass', 'premium_refund_order', 'premium_rechain', 'count_premium_paid'];

function browserRpcs() {
  const names = new Set();
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (f === 'node_modules' || f.startsWith('.') || p.startsWith('worker') || p.startsWith('scripts') || p.startsWith('docs')) continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(js|html)$/.test(f)) {
        for (const m of readFileSync(p, 'utf8').matchAll(/\brpc(?:Data)?\(\s*['"]([a-z_]+)['"]/g)) names.add(m[1]);
      }
    }
  };
  walk('.');
  return [...names].sort();
}

/* Later migrations (named so they sort by date, like 2026-10-audit.sql)
   may redefine a function, e.g. to accept a new course; the live database
   runs them in order, so the newest definition is the one schema.sql must
   match. */
function latestBlocks() {
  const dir = 'scripts/sql/migrations';
  const out = new Map();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    for (const [name, body] of blocks(readFileSync(join(dir, f), 'utf8'))) out.set(name, body);
  }
  return out;
}

test('every function in the migrations is word for word the one in schema.sql', () => {
  assert.ok(blocks(MIG).size >= 10, 'the audit migration defines too few functions to be the real one');
  const sch = blocks(SCHEMA);
  for (const [name, body] of latestBlocks()) {
    assert.ok(sch.has(name), `${name} is in a migration but not in schema.sql`);
    assert.equal(sch.get(name), body, `${name} differs between its latest migration and schema.sql`);
  }
});

test('EXECUTE is revoked from anon and authenticated everywhere, and by default', () => {
  assert.match(MIG, /revoke execute on all functions in schema public from public, anon, authenticated;/);
  assert.match(MIG, /alter default privileges in schema public revoke execute on functions from public, anon, authenticated;/);
  assert.match(SCHEMA, /revoke execute on all functions in schema public from public, anon, authenticated;/);
});

test('every RPC the browser calls is granted; Worker-only functions are not', () => {
  const grants = new Map();
  for (const m of MIG.matchAll(/grant execute on function public\.(\w+)\([^)]*\) to ([a-z_, ]+);/g)) {
    grants.set(m[1], m[2].split(',').map((s) => s.trim()));
  }
  for (const name of browserRpcs()) {
    assert.ok(grants.has(name), `the browser calls ${name}() but the migration grants it to nobody`);
  }
  for (const name of WORKER_ONLY) {
    assert.ok(!grants.has(name), `${name}() must stay Worker-only (service role)`);
  }
});

test('my_premium counts a pass only from its start', () => {
  const body = blocks(MIG).get('my_premium');
  assert.match(body, /p\.starts_at <= now\(\)/);
});

test('pageviews.sql reads the views column, not count', () => {
  const sql = readFileSync('scripts/sql/pageviews.sql', 'utf8');
  assert.doesNotMatch(sql, /sum\(count\)|,\s*count\s*$/m);
  assert.match(sql, /sum\(views\)/);
});

/* A course added to the registry reaches the live database only through a
   migration (README, "Adding a course"). Every function and table check in
   schema.sql that lists courses must therefore be redefined, with the same
   list, by some migration; otherwise schema.sql alone would carry the course
   and a live insert would fail its check. */
test('every course list in schema.sql reaches the live database through a migration', () => {
  const latest = latestBlocks();
  const list = (s) => (s.match(/course\s+(?:not\s+)?in\s*\(([^)]*)\)/) || [])[1];
  for (const [name, body] of blocks(SCHEMA)) {
    if (!list(body)) continue;
    assert.ok(latest.has(name), `${name}() lists courses in schema.sql but no migration defines it`);
  }
  const migs = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort()
    .map((f) => readFileSync(join('scripts/sql/migrations', f), 'utf8')).join('\n');
  for (const m of SCHEMA.matchAll(/create table if not exists public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    const check = m[2].match(/course\s+text not null check \(course in \(([^)]*)\)\)/);
    if (!check) continue;
    assert.ok(migs.includes(`add constraint ${m[1]}_course_check check (course in (${check[1]}))`),
      `public.${m[1]}: no migration adds its course check with schema.sql's list (${check[1]})`);
  }
});

test('premium_add_pass takes p_until (fixed-date passes) and never ends one before it', () => {
  const body = latestBlocks().get('premium_add_pass');
  assert.match(body, /p_until timestamptz default null/);
  assert.match(body, /if p_until is not null and p_until > v_end then\s+v_end := p_until;/);
  const mig = readFileSync('scripts/sql/migrations/2026-10b-apbio.sql', 'utf8');
  assert.match(mig, /drop function if exists public\.premium_add_pass\(uuid, text, text, integer, text, integer, timestamptz, text, text\);/);
  assert.doesNotMatch(mig, /grant execute on function public\.premium_add_pass\([^)]*\) to [^;]*(anon|authenticated)/);
});
