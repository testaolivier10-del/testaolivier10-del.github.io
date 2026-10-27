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

const WORKER_ONLY = ['unsubscribe_email_reminder', 'premium_add_pass', 'premium_refund_order', 'premium_rechain', 'count_premium_paid',
  'frq_grade_take', 'frq_grade_give_back', 'count_frq_grade'];

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

test('2026-10c-apchem.sql adds apchem to every course check and course list, and runs after 2026-10b', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-10c-apchem.sql') > files.indexOf('2026-10b-apbio.sql'), 'runs after 2026-10b-apbio.sql');
  const mig = readFileSync('scripts/sql/migrations/2026-10c-apchem.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apchem`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apchem`);
  }
  // No course list anywhere in it or schema.sql still stops at apbio.
  for (const sql of [mig, SCHEMA]) assert.doesNotMatch(sql, /'apbio'\)/);
  // schema.sql has moved on to apphys (2026-10e).
  assert.doesNotMatch(SCHEMA, /'apchem'\)/);
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  assert.doesNotMatch(mig, /grant execute on function public\.premium_add_pass\([^)]*\) to [^;]*(anon|authenticated)/);
});

test('2026-10f-apphys.sql adds apphys to every course check and course list, runs after 2026-10e, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-10f-apphys.sql') > files.indexOf('2026-10e-funnel-seen.sql'), 'runs after 2026-10e-funnel-seen.sql');
  const mig = readFileSync('scripts/sql/migrations/2026-10f-apphys.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apphys`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apphys`);
  }
  assert.ok(fns.get('count_premium_step').includes("'signin-for-checkout'"), 'keeps the 2026-10d steps');
  assert.ok(fns.get('count_premium_step').includes("'limit-hit'"), 'keeps the 2026-10e-funnel-seen step');
  // schema.sql has moved on to apcalc (2026-10g), which only adds 'apcalc'.
  assert.equal(fns.get('count_premium_step').trim(), blocks(SCHEMA).get('count_premium_step').trim().replace(", 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych')", ", 'apphys')"), 'count_premium_step matches schema.sql');
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + SCHEMA, /'apchem'\)/, 'no course list stops at apchem');
});

test('2026-10g-apcalc.sql adds apcalc to every course check and course list, runs after 2026-10f, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-10g-apcalc.sql') > files.indexOf('2026-10f-apphys.sql'), 'runs after 2026-10f-apphys.sql');
  const mig = readFileSync('scripts/sql/migrations/2026-10g-apcalc.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apcalc`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apcalc`);
    // schema.sql has moved on to apstat and apenv (2026-10h, 10j), which only add course keys.
    assert.equal(fns.get(f).trim(), blocks(SCHEMA).get(f).trim().replace(", 'apcalc', 'apstat', 'apenv', 'appsych')", ", 'apcalc')"), `${f} matches schema.sql`);
  }
  assert.ok(fns.get('count_premium_step').includes("'limit-hit'"), 'keeps the 2026-10e-funnel-seen step');
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + SCHEMA, /'apphys'\)/, 'no course list stops at apphys');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-10h-apstat.sql adds apstat to every course check and course list, runs after 2026-10g, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  // Later migrations that list no courses (2026-10i grants, 2026-10j question tallies) may follow it.
  assert.ok(files.indexOf('2026-10h-apstat.sql') > files.indexOf('2026-10g-apcalc.sql'), 'runs after 2026-10g-apcalc.sql');
  const mig = readFileSync('scripts/sql/migrations/2026-10h-apstat.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apstat`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apstat`);
    // schema.sql has moved on to apenv (2026-10j), which only adds 'apenv'.
    assert.equal(fns.get(f).trim(), blocks(SCHEMA).get(f).trim().replace(", 'apstat', 'apenv', 'appsych')", ", 'apstat')"), `${f} matches schema.sql`);
  }
  assert.ok(fns.get('count_premium_step').includes("'limit-hit'"), 'keeps the 2026-10e-funnel-seen step');
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + SCHEMA, /'apcalc'\)/, 'no course list stops at apcalc');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-10k-apenv.sql adds apenv to every course check and course list, runs last, matches schema.sql, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  // Later migrations that list no paid-course set (2026-10l, the FRQ grader) may follow it.
  assert.ok(files.indexOf('2026-10k-apenv.sql') > files.indexOf('2026-10j-question-stats.sql'), 'runs after 2026-10j-question-stats.sql');
  const mig = readFileSync('scripts/sql/migrations/2026-10k-apenv.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apenv`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apenv`);
    // schema.sql has moved on to appsych (2026-10l), which only adds 'appsych'.
    assert.equal(fns.get(f).trim(), blocks(SCHEMA).get(f).trim().replace(", 'apenv', 'appsych')", ", 'apenv')"), `${f} matches schema.sql`);
  }
  assert.ok(fns.get('count_premium_step').includes("'limit-hit'"), 'keeps the 2026-10e-funnel-seen step');
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + SCHEMA, /'apstat'\)/, 'no course list stops at apstat');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-10l-appsych.sql adds appsych to every course check and course list, runs after apenv, matches schema.sql, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-10l-appsych.sql') > files.indexOf('2026-10k-apenv.sql'), 'runs after 2026-10k-apenv.sql');
  const mig = readFileSync('scripts/sql/migrations/2026-10l-appsych.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists appsych`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts appsych`);
    assert.equal(fns.get(f).trim(), blocks(SCHEMA).get(f).trim(), `${f} matches schema.sql`);
  }
  assert.ok(fns.get('count_premium_step').includes("'limit-hit'"), 'keeps the 2026-10e-funnel-seen step');
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + SCHEMA, /'apenv'\)/, 'no course list stops at apenv');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-10d-ref-tracking.sql: the browser may count video visits, only the Worker may count a sale', () => {
  const mig = readFileSync('scripts/sql/migrations/2026-10d-ref-tracking.sql', 'utf8');
  const fns = blocks(mig);
  for (const f of ['track_ref', 'track_ref_paid', 'count_premium_step']) assert.ok(fns.has(f), `${f} is defined`);
  assert.match(mig, /grant execute on function public\.track_ref\(text, text\) to anon, authenticated;/);
  assert.match(SCHEMA, /grant execute on function public\.track_ref\(text, text\) to anon, authenticated;/);
  assert.doesNotMatch(mig + SCHEMA, /grant execute on function public\.track_ref_paid\([^)]*\) to [^;]*(anon|authenticated)/);
  assert.doesNotMatch(fns.get('track_ref'), /'paid'/, 'a browser cannot claim a sale');
  // The same ref shape the browser accepts (assets/analytics.js VIDEO_REF).
  for (const f of ['track_ref', 'track_ref_paid']) assert.ok(fns.get(f).includes("'^(tt|yt|ig)-[a-z0-9-]{1,40}$'"), `${f} checks the ref`);
  assert.ok(mig.includes("check (step in ('gate-shown', 'interest', 'signin-for-checkout', 'checkout-start', 'checkout-paid'))"));
});

test('2026-10e-funnel-seen.sql: limit-hit is a funnel step everywhere the browser may count one', () => {
  const mig = readFileSync('scripts/sql/migrations/2026-10e-funnel-seen.sql', 'utf8');
  const fns = blocks(mig);
  const STEP = "check (step in ('gate-shown', 'limit-hit', 'interest', 'signin-for-checkout', 'checkout-start', 'checkout-paid'))";
  assert.ok(mig.includes(STEP));
  assert.ok(SCHEMA.includes(STEP));
  for (const f of ['count_premium_step', 'track_ref']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.match(fns.get(f), /'limit-hit'/, `${f} accepts limit-hit`);
    // schema.sql carries the later versions (2026-10f to 10h), which only add course keys.
    assert.equal(fns.get(f).trim(), blocks(SCHEMA).get(f).trim().replace(", 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych')", ", 'apchem')"), `${f} matches schema.sql`);
  }
  assert.doesNotMatch(fns.get('track_ref'), /'paid'/, 'a browser cannot claim a sale');
  assert.match(mig, /grant execute on function public\.count_premium_step\(text, text\) to anon, authenticated;/);
});

test('2026-10l-frq-grader.sql: the grader cap and counts are Worker only, match schema.sql and run last', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.equal(files[files.length - 1], '2026-10l-frq-grader.sql');
  const mig = readFileSync('scripts/sql/migrations/2026-10l-frq-grader.sql', 'utf8');
  assert.match(mig, /NOT APPLIED/);
  const fns = blocks(mig);
  for (const f of ['frq_grade_take', 'frq_grade_give_back', 'count_frq_grade']) {
    assert.ok(fns.has(f), `${f} is defined`);
    assert.equal(fns.get(f), blocks(SCHEMA).get(f), `${f} matches schema.sql`);
    assert.doesNotMatch(mig + SCHEMA, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`), `${f} stays Worker only`);
  }
  // The cap is atomic: one upsert that refuses past the limit.
  assert.match(fns.get('frq_grade_take'), /on conflict \(user_id, day\) do update set n = frq_grade_daily\.n \+ 1\s+where frq_grade_daily\.n < p_limit/);
  for (const t of ['frq_grade_daily', 'frq_grade_counts']) {
    assert.ok(mig.includes(`alter table public.${t} enable row level security;`), `${t} has RLS`);
    assert.ok(SCHEMA.includes(`create table if not exists public.${t} (`), `${t} is in schema.sql`);
  }
  // Anonymous: the counts carry no user.
  const counts = mig.slice(mig.indexOf('create table if not exists public.frq_grade_counts'), mig.indexOf(');', mig.indexOf('create table if not exists public.frq_grade_counts')));
  assert.doesNotMatch(counts, /user_id|browser|ip/);
});
