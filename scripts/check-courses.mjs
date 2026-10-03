/* Everything that keeps its own copy of the course list, against the
   registry (assets/courses.js).

     node scripts/check-courses.mjs --check   fail on any disagreement (CI)

   scripts/build-courses.mjs writes the registry into the browser scripts.
   What it cannot write is checked here instead:

   1. Places that cannot read the registry at all. The Worker is deployed on
      its own (worker/src), and the database is SQL (scripts/sql/schema.sql
      for a fresh project, reports.sql for the owner's queries). Every course
      list in them must be exactly the registry's PAID courses, except
      COURSE_RULES (the assistant's per-course rules), which covers every
      course. Migrations (scripts/sql/migrations) are history and skipped: a
      course is added to the live database by a new migration plus the same
      edit in schema.sql, and this check is what says schema.sql still needs
      it.
   2. Per-course tables that stay in their consumer because they are content
      (rank names, the assistant's greeting and starter questions, search
      sources, the service worker's offline shell, the pricing copy). Each
      must have an entry for every course, so adding a course to the registry
      fails here, listing what still needs writing, instead of shipping a
      course with an "undefined" greeting. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES, KEYS, PAID, PAID_KEYS } from './lib/courses.mjs';
import { premiumData } from './lib/premium-data.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const problems = [];
const fail = (msg) => problems.push(msg);
const show = (a) => [...a].sort().join(', ') || '(none)';
const lineAt = (src, i) => src.slice(0, i).split('\n').length;

function sameSet(where, got, want, wantName) {
  const g = new Set(got), w = new Set(want);
  const missing = [...w].filter((k) => !g.has(k));
  const extra = [...g].filter((k) => !w.has(k));
  if (missing.length || extra.length) {
    fail(`${where}: has ${show(g)}; the registry's ${wantName} are ${show(w)}` +
      (missing.length ? ` (missing ${missing.join(', ')})` : '') + (extra.length ? ` (not in the registry: ${extra.join(', ')})` : ''));
  }
}

/* The top-level keys of an object literal `<name> = { ... }` in a source
   file, skipping strings and comments so nested values cannot add keys. */
export function topKeys(src, name, rel) {
  const m = new RegExp(`\\b${name}\\s*=\\s*\\{`).exec(src);
  if (!m) { fail(`${rel}: no "${name} = {" found`); return []; }
  // The literal's own level, nested values dropped and each string replaced
  // by a numbered placeholder, so "a, b: c" inside a value cannot pass for a
  // key.
  let flat = '', depth = 0, quote = null, str = '';
  const strings = [];
  for (let i = m.index + m[0].length - 1; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { str += src[++i]; continue; }
      if (ch === quote) {
        quote = null;
        if (depth === 1) { strings.push(str); flat += `\u0001${strings.length - 1}\u0001`; }
      } else str += ch;
      continue;
    }
    if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; str = ''; continue; }
    if ('{[('.includes(ch)) { depth++; continue; }
    if ('}])'.includes(ch)) {
      if (--depth === 0) {
        return flat.split(',')
          .map((seg) => seg.match(/^\s*(?:\u0001(\d+)\u0001|([A-Za-z_$][\w$]*))\s*:/))
          .filter(Boolean)
          .map((k) => (k[1] !== undefined ? strings[+k[1]] : k[2]));
      }
      continue;
    }
    if (depth === 1) flat += ch;
  }
  fail(`${rel}: ${name} never closes`);
  return [];
}

/* ---- 1. the Worker and the database ----------------------------------- */

const { PASSES, COURSE_NAMES } = await import(join(ROOT, 'worker/src/premium.js'));
sameSet('worker/src/premium.js PASSES (the courses passes are sold for)', Object.values(PASSES).map((p) => p.course), PAID_KEYS, 'paid courses');
sameSet('worker/src/premium.js COURSE_NAMES', Object.keys(COURSE_NAMES), PAID_KEYS, 'paid courses');
for (const c of PAID) {
  if (COURSE_NAMES[c.key] !== undefined && COURSE_NAMES[c.key] !== c.productName) {
    fail(`worker/src/premium.js COURSE_NAMES.${c.key} is "${COURSE_NAMES[c.key]}"; the registry's productName is "${c.productName}"`);
  }
}

const index = read('worker/src/index.js');
sameSet('worker/src/index.js COURSE_RULES', topKeys(index, 'COURSE_RULES', 'worker/src/index.js'), KEYS, 'courses');
// The assistant's course is validated against COURSE_RULES itself; a literal
// course comparison would be a second list this check cannot see.
for (const m of index.matchAll(/(?<!typeof [\w?.]*)\bcourse\s*===?\s*'(\w+)'/g)) {
  fail(`worker/src/index.js:${lineAt(index, m.index)}: compares a course to the literal '${m[1]}'; validate against COURSE_RULES instead`);
}

for (const rel of ['scripts/sql/schema.sql', 'scripts/sql/reports.sql']) {
  const sql = read(rel);
  let lists = 0;
  // check (course in ('a', 'b')) and p_course not in ('a', 'b')
  for (const m of sql.matchAll(/\b(?:p_)?course\s+(?:not\s+)?in\s*\(([^)]*)\)/gi)) {
    lists++;
    sameSet(`${rel}:${lineAt(sql, m.index)}`, [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]), PAID_KEYS, 'paid courses');
  }
  // from (values ('a'), ('b')) as c(course)
  for (const m of sql.matchAll(/values\s*((?:\(\s*'[^']+'\s*\)\s*,?\s*)+)\)?\s*as\s+\w+\s*\(\s*course\s*\)/gi)) {
    lists++;
    sameSet(`${rel}:${lineAt(sql, m.index)}`, [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]), PAID_KEYS, 'paid courses');
  }
  if (!lists) fail(`${rel}: no course list found; if the format changed, update scripts/check-courses.mjs`);
}

/* ---- 2. per-course tables in the site ---------------------------------- */

const { COURSES: PREMIUM } = premiumData();
sameSet('assets/premium.js COURSES (pricing and copy)', Object.keys(PREMIUM), PAID_KEYS, 'paid courses');
for (const c of PAID) {
  if (PREMIUM[c.key] && PREMIUM[c.key].name !== c.productName) {
    fail(`assets/premium.js COURSES.${c.key}.name is "${PREMIUM[c.key].name}"; the registry's productName is "${c.productName}"`);
  }
}

const TABLES = [
  ['assets/hub-progress.js', 'TITLES', 'rank names'],
  ['assets/tutor.js', 'STARTERS', "the assistant's starter questions"],
  ['assets/tutor.js', 'GREETING', "the assistant's greeting"],
  ['assets/site-search-all.js', 'SOURCES', 'what site search indexes'],
];
for (const [rel, name, what] of TABLES) {
  const keys = topKeys(read(rel), name, rel).filter((k) => k !== 'hub');
  sameSet(`${rel} ${name} (${what})`, keys, KEYS, 'courses');
}

const sw = read('sw.js');
const swDirs = [...sw.matchAll(/^COURSE_URLS(?:\.([\w-]+)|\[\s*'([^']+)'\s*\])\s*=/gm)].map((m) => m[1] || m[2]);
sameSet("sw.js COURSE_URLS (each course folder's offline shell)", swDirs, COURSES.map((c) => c.dir), 'course folders');

/* ---- report -------------------------------------------------------------- */

if (problems.length) {
  console.error(`${problems.length} place(s) disagree with assets/courses.js:`);
  for (const p of problems) console.error('  ' + p);
  console.error('See README, "Adding a course".');
  process.exit(1);
}
console.log(`The Worker, the SQL and ${TABLES.length + 2} per-course tables agree with the ${KEYS.length} courses in assets/courses.js.`);
