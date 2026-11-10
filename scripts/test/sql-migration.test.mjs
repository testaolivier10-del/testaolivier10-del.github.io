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
// schema.sql as it was before AP® Calculus BC (2026-10o-apcalcbc.sql only adds 'apcalcbc'),
// for the tests of earlier course migrations.
// The schema before AP® Macroeconomics (2026-11a), then before AP® Calculus BC (2026-10o):
// each later course migration only adds its key at the end of every course list.
// The schema before AP® Microeconomics (2026-11i), which adds 'apmicro' after 'apmacro'
// in every course list and the class course checks.
const PRE_MIC = SCHEMA.replaceAll(", 'apmacro', 'apmicro')", ", 'apmacro')").replaceAll('apmacro|apmicro|nremt', 'apmacro|nremt');
const PRE_MAC = PRE_MIC.replaceAll(", 'apcalcbc', 'apmacro')", ", 'apcalcbc')");
const PRE_BC = PRE_MAC.replaceAll(", 'apprecalc', 'apcalcbc')", ", 'apprecalc')");

const WORKER_ONLY = ['unsubscribe_email_reminder', 'premium_add_pass', 'premium_refund_order', 'premium_rechain', 'count_premium_paid',
  'frq_grade_take', 'frq_grade_give_back', 'count_frq_grade', 'referral_email_key', 'referral_welcome', 'referral_reward',
  'class_mail_take', 'class_member_emails', 'class_report_get', 'class_email_stop', 'class_email_stop_addr', 'class_purge',
  'class_google_matches', 'class_announce_take'];

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
  // Grants from every migration: a later one (teacher classes, 2026-11b) adds its own browser RPCs.
  const ALL = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort().map((f) => readFileSync(join('scripts/sql/migrations', f), 'utf8')).join('\n');
  for (const m of ALL.matchAll(/grant execute on function public\.(\w+)\([^)]*\) to ([a-z_, ]+);/g)) {
    grants.set(m[1], m[2].split(',').map((s) => s.trim()));
  }
  for (const name of browserRpcs()) {
    assert.ok(grants.has(name), `the browser calls ${name}() but the migration grants it to nobody`);
  }
  for (const name of WORKER_ONLY) {
    assert.ok(!(grants.get(name) || []).some((r) => r === 'anon' || r === 'authenticated'), `${name}() must stay Worker-only (service role)`);
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
  for (const [name, body] of blocks(PRE_BC)) {
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
  assert.equal(fns.get('count_premium_step').trim(), blocks(PRE_BC).get('count_premium_step').trim().replace(", 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc')", ", 'apphys')"), 'count_premium_step matches schema.sql');
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
    assert.equal(fns.get(f).trim(), blocks(PRE_BC).get(f).trim().replace(", 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc')", ", 'apcalc')"), `${f} matches schema.sql`);
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
    assert.equal(fns.get(f).trim(), blocks(PRE_BC).get(f).trim().replace(", 'apstat', 'apenv', 'appsych', 'apprecalc')", ", 'apstat')"), `${f} matches schema.sql`);
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
    // schema.sql has moved on to appsych (2026-10l) and apprecalc (2026-10n), which only add their keys.
    assert.equal(fns.get(f).trim(), blocks(PRE_BC).get(f).trim().replace(", 'apenv', 'appsych', 'apprecalc')", ", 'apenv')"), `${f} matches schema.sql`);
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
    // schema.sql has moved on to apprecalc (2026-10n), which only adds 'apprecalc'.
    assert.equal(fns.get(f).trim(), blocks(PRE_BC).get(f).trim().replace(", 'appsych', 'apprecalc')", ", 'appsych')"), `${f} matches schema.sql`);
  }
  assert.ok(fns.get('count_premium_step').includes("'limit-hit'"), 'keeps the 2026-10e-funnel-seen step');
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + PRE_BC, /'apenv'\)/, 'no course list stops at apenv');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-10n-apprecalc.sql adds apprecalc to every course check and course list, runs after referrals, matches schema.sql, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-10n-apprecalc.sql') > files.indexOf('2026-10m-referrals.sql'), 'runs after every earlier migration');
  const mig = readFileSync('scripts/sql/migrations/2026-10n-apprecalc.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apprecalc`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apprecalc`);
    assert.equal(fns.get(f).trim(), blocks(PRE_BC).get(f).trim(), `${f} matches schema.sql`);
    // schema.sql has moved on to apcalcbc (2026-10o), which only adds 'apcalcbc'.
  }
  assert.ok(fns.get('count_premium_step').includes("'limit-hit'"), 'keeps the 2026-10e-funnel-seen step');
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + PRE_BC, /'appsych'\)/, 'no course list stops at appsych');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-10o-apcalcbc.sql adds apcalcbc to every course check and course list, runs after AP® Precalculus, matches schema.sql, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-10o-apcalcbc.sql') > files.indexOf('2026-10n-apprecalc.sql'), 'runs after AP® Precalculus');
  const mig = readFileSync('scripts/sql/migrations/2026-10o-apcalcbc.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apcalcbc`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apcalcbc`);
    assert.equal(fns.get(f).trim(), blocks(PRE_MAC).get(f).trim(), `${f} matches schema.sql`);
  }
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + PRE_MAC, /'appsych'\)|'apprecalc'\)/, 'no course list stops at appsych or apprecalc');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-11a-apmacro.sql adds apmacro to every course check and course list, runs last (after AP® Calculus BC), matches schema.sql, and is not granted to browsers where it must not be', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  // Anything after it but before the next course migration (teacher classes, 2026-11b) must not redefine a course list.
  for (const f of files.slice(files.indexOf('2026-11a-apmacro.sql') + 1).filter((x) => x < '2026-11i'))
    for (const fn of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid'])
      assert.ok(!blocks(readFileSync(join('scripts/sql/migrations', f), 'utf8')).has(fn), `${f} must not redefine ${fn} after the last course migration`);
  assert.ok(files.indexOf('2026-11a-apmacro.sql') > files.indexOf('2026-10o-apcalcbc.sql'), 'runs after AP® Calculus BC');
  const mig = readFileSync('scripts/sql/migrations/2026-11a-apmacro.sql', 'utf8');
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apmacro`);
  const fns = blocks(mig);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(LIST), `${f} accepts apmacro`);
    assert.equal(fns.get(f).trim(), blocks(PRE_MIC).get(f).trim(), `${f} matches schema.sql`);
  }
  assert.match(fns.get('premium_add_pass'), /p_until timestamptz default null/, 'the fixed-date pass parameter is kept');
  for (const f of ['premium_add_pass', 'count_premium_paid']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig + SCHEMA, /'appsych'\)|'apprecalc'\)|'apcalcbc'\)/, 'no course list stops at appsych, apprecalc or apcalcbc');
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
    assert.equal(fns.get(f).trim(), blocks(PRE_BC).get(f).trim().replace(", 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc')", ", 'apchem')"), `${f} matches schema.sql`);
  }
  assert.doesNotMatch(fns.get('track_ref'), /'paid'/, 'a browser cannot claim a sale');
  assert.match(mig, /grant execute on function public\.count_premium_step\(text, text\) to anon, authenticated;/);
});

test('2026-10l-frq-grader.sql: the grader cap and counts are Worker only, match schema.sql and run last', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  // After every course migration; later non-course migrations (2026-10m referrals) may follow it.
  assert.ok(files.indexOf('2026-10l-frq-grader.sql') > files.indexOf('2026-10l-appsych.sql'), 'runs after the last course migration');
  const mig = readFileSync('scripts/sql/migrations/2026-10l-frq-grader.sql', 'utf8');
  assert.match(mig, /NOT APPLIED/);
  const fns = blocks(mig);
  for (const f of ['frq_grade_take', 'frq_grade_give_back', 'count_frq_grade']) {
    assert.ok(fns.has(f), `${f} is defined`);
    assert.equal(fns.get(f), blocks(PRE_BC).get(f), `${f} matches schema.sql`);
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

test('2026-10m-referrals.sql: rewards go through premium_add_pass, internal helpers stay ungranted, no course list', () => {
  const mig = readFileSync('scripts/sql/migrations/2026-10m-referrals.sql', 'utf8');
  const fns = blocks(mig);
  for (const f of ['referral_register', 'referral_my_code', 'referral_adopt', 'referral_claim', 'referral_note_answer', 'referral_summary', 'referral_welcome', 'referral_reward', 'referral_email_key'])
    assert.ok(fns.has(f), `${f} is defined`);
  assert.match(fns.get('referral_reward'), /p_pass => 'referral', p_days => 7/);
  assert.match(fns.get('referral_reward'), />= 8 then/);
  assert.match(fns.get('referral_welcome'), /p_pass => 'referral-welcome', p_days => 3/);
  assert.match(fns.get('referral_claim'), /interval '3 days'/);
  assert.match(fns.get('referral_note_answer'), /answers \+ 1 >= 20/);
  for (const f of ['referral_welcome', 'referral_reward', 'referral_email_key'])
    assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  assert.doesNotMatch(mig, /course\s+(?:not\s+)?in\s*\(/, 'no course list: premium_add_pass refuses unknown courses');
});

/* Stream C of teacher classes v2 (docs/teacher-classes.md). Behaviour checked against PGlite with
   scripts/test/pglite/classes-integrations.mjs (70 checks: grants, FRQ ownership incl. co-teachers, mail and invite limits, report links,
   cascades on leaving, deleting a class and deleting an account). */
test('2026-11d-classes-integrations.sql: Worker-only tables and functions stay with the service role, RLS on, no course list', () => {
  const mig = readFileSync('scripts/sql/migrations/2026-11d-classes-integrations.sql', 'utf8');
  assert.match(mig, /NOT APPLIED/);
  const tables = [...mig.matchAll(/create table if not exists public\.(\w+) \(/g)].map((m) => m[1]);
  assert.ok(tables.length >= 11, 'all the integration tables are defined');
  for (const t of tables) {
    assert.ok(mig.includes(`alter table public.${t} enable row level security;`), `${t} has RLS`);
    assert.ok(SCHEMA.includes(`create table if not exists public.${t} (`), `${t} is in schema.sql`);
    assert.match(mig, new RegExp(`revoke all on table [^;]*public\\.${t}\\b[^;]* from anon, authenticated;`), `${t} is revoked from browsers`);
    assert.match(mig, new RegExp(`grant select, insert, update, delete on table [^;]*public\\.${t}\\b[^;]* to service_role;`), `${t} is granted to the service role`);
  }
  assert.doesNotMatch(mig, /grant [^;]* on table [^;]* to [^;]*(anon|authenticated)/, 'no table is granted to a browser role');
  const fns = blocks(mig);
  for (const f of ['class_mail_take', 'class_member_emails', 'class_report_get', 'class_email_stop', 'class_email_stop_addr', 'class_purge']) {
    assert.ok(fns.has(f), `${f} is defined`);
    assert.match(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to service_role;`));
    assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`), `${f} stays Worker only`);
  }
  for (const f of ['class_frq_submit', 'class_frq_mine', 'teach_frq_work', 'teach_frq_score']) {
    assert.match(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to authenticated;`), `${f} is a browser RPC`);
    assert.match(fns.get(f), /auth\.uid\(\)/, `${f} acts only for the caller`);
  }
  // Teachers only reach their own classes; the token column is ciphertext from the Worker.
  assert.match(fns.get('teach_frq_work'), /c\.teacher_id = auth\.uid\(\)/);
  assert.match(fns.get('teach_frq_score'), /c\.teacher_id = auth\.uid\(\)/);
  assert.match(mig, /refresh_enc\s+text not null/);
  assert.doesNotMatch(mig, /course\s+(?:not\s+)?in\s*\(/, 'no course list after the last course migration');
  // A family report never carries the answers picked or the flags.
  assert.doesNotMatch(fns.get('class_report_get'), /'picks'|'flags'/);
  // LMS platforms start pending (the owner activates them); invites are limited per address and honour stops.
  assert.match(mig, /status\s+text not null default 'pending' check \(status in \('pending', 'active'\)\)/);
  assert.match(fns.get('class_mail_take'), /interval '7 days'/);
  assert.match(fns.get('class_mail_take'), /class_email_optout_addr/);
  // Co-teachers may score free responses, through the same table A1 defines.
  assert.match(fns.get('teach_frq_score'), /class_coteachers/);
  // Deleting the account deletes its quote requests.
  assert.match(mig, /class_quote_requests \([\s\S]*?user_id\s+uuid references auth\.users \(id\) on delete cascade/);
});

test('2026-11e-classes-courses.sql lets classes and teacher questions be for nremt, ochem and anp too, matches schema.sql', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-11e-classes-courses.sql') > files.indexOf('2026-11c-classes-v2.sql'), 'runs after 2026-11c');
  const mig = readFileSync('scripts/sql/migrations/2026-11e-classes-courses.sql', 'utf8'), fns = blocks(mig), schema = blocks(SCHEMA);
  const RE = "'^(apbio|apchem|apphys|apcalc|apcalcbc|apstat|apenv|appsych|apprecalc|apmacro|nremt|ochem|anp)$'";
  const pre = blocks(PRE_MIC);
  for (const f of ['teach_create_class', 'teach_save_question']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.ok(fns.get(f).includes(RE), `${f} accepts the three courses`);
    assert.equal(fns.get(f).trim(), pre.get(f).trim(), `${f} matches schema.sql (before 2026-11i added apmicro)`);
    assert.match(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to authenticated;`));
  }
  // schema.sql keeps 11b's and 11c's definitions in their sections and appends 11e's (section 12);
  // the newest definition of each function is the one that counts, as in the live database.
  for (const [name, body] of [...fns, ...schema]) assert.doesNotMatch(body, /apmacro\)\$'/, `${name}: no class course check stops at apmacro`);
  assert.match(fns.get('teach_save_question'), /p_data->>'topic' !~ '\^\[a-z0-9\]/, 'keeps 11c\'s id-only topic and unit check');
  assert.match(mig, /NOT APPLIED/);
});

test('2026-11f-classes-google-ids.sql: Classroom matches by Google sign-in id, Worker only, no emails, matches schema.sql', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.ok(files.indexOf('2026-11f-classes-google-ids.sql') > files.indexOf('2026-11d-classes-integrations.sql'), 'runs after 2026-11d');
  const mig = readFileSync('scripts/sql/migrations/2026-11f-classes-google-ids.sql', 'utf8'), fns = blocks(mig), schema = blocks(SCHEMA);
  assert.match(mig, /NOT APPLIED/);
  for (const f of ['class_google_matches', 'class_announce_take']) {
    assert.ok(fns.has(f), `${f} is defined`);
    assert.equal(fns.get(f).trim(), schema.get(f).trim(), `${f} matches schema.sql`);
    assert.match(fns.get(f), /security definer/);
    assert.match(mig, new RegExp(`revoke execute on function public\\.${f}\\([^)]*\\) from public, anon, authenticated;`));
    assert.match(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to service_role;`));
    assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`), `${f} stays Worker only`);
  }
  const m = fns.get('class_google_matches');
  assert.match(m, /auth\.identities/);
  assert.match(m, /i\.provider = 'google'/);
  assert.match(m, /i\.provider_id = any \(p_users\)/);
  assert.match(m, /identity_data->>'sub'/);
  assert.doesNotMatch(m, /email/, 'never returns an address');
  assert.match(fns.get('class_announce_take'), /interval '10 minutes'/);
  assert.ok(mig.includes('alter table public.class_ext_links add column if not exists announced_at timestamptz;'));
  assert.ok(SCHEMA.includes('alter table public.class_ext_links add column if not exists announced_at timestamptz;'));
  assert.doesNotMatch(mig, /course\s+(?:not\s+)?in\s*\(/, 'no course list after the last course migration');
});

test('2026-11i-apmicro.sql adds apmicro to every course check, course list, class check and free-usage list, runs last, matches schema.sql', () => {
  const files = readdirSync('scripts/sql/migrations').filter((x) => x.endsWith('.sql')).sort();
  assert.equal(files.indexOf('2026-11i-apmicro.sql'), files.findLastIndex((f) => /'apmacro'|apmacro\|/.test(readFileSync(join('scripts/sql/migrations', f), 'utf8'))), 'the newest migration with a course list');
  const mig = readFileSync('scripts/sql/migrations/2026-11i-apmicro.sql', 'utf8'), fns = blocks(mig), schema = blocks(SCHEMA);
  const LIST = "('nremt', 'ochem', 'anp', 'apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych', 'apprecalc', 'apcalcbc', 'apmacro', 'apmicro')";
  for (const t of ['premium_passes', 'premium_funnel', 'exam_completions'])
    assert.ok(mig.includes(`add constraint ${t}_course_check check (course in ${LIST})`), `${t} check lists apmicro`);
  for (const f of ['report_question', 'join_waitlist', 'count_premium_step', 'premium_add_pass', 'record_exam_completion', 'count_premium_paid', 'teach_create_class', 'teach_save_question', 'free_usage_course_ok']) {
    assert.ok(fns.has(f), `${f} is redefined`);
    assert.match(fns.get(f), /'apmicro'|apmicro\|/, `${f} accepts apmicro`);
    assert.equal(fns.get(f).trim(), schema.get(f).trim(), `${f} matches schema.sql`);
  }
  for (const f of ['premium_add_pass', 'count_premium_paid', 'free_usage_course_ok']) assert.doesNotMatch(mig, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to [^;]*(anon|authenticated)`));
  for (const [name, body] of schema) assert.doesNotMatch(body, /'apmacro'\)|apmacro\|nremt/, `${name}: no course list stops at apmacro`);
  assert.match(mig, /NOT APPLIED/);
});
