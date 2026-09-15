/* A byte budget for the pages that matter.

   This site has argued carefully about weight before. Splitting the question
   bank in two took the first question on screen from 4467 ms to 2394 ms on a
   throttled connection; the two typefaces were pulled off Google's CDN to save
   a third-party round trip before first paint. Those were real decisions with
   measured results, and nothing defended them afterwards. The next commit that
   adds a 300 KB script to the shared header undoes the font work and nobody
   notices, because a page that got slower still looks exactly the same.

   So: what a page costs on arrival, against a number written down.

   WHAT IS COUNTED
   ---------------
   The HTML plus every same-origin stylesheet, script and font it references,
   gzipped, because that is what crosses the wire. Scripts count even though
   every one of them is deferred — deferred means "does not block the parser",
   not "free": it is still downloaded during load and still has to arrive
   before anything on the page responds.

   Not counted: images, which are decorative or lazy; and anything fetched
   later by JavaScript, which is a different budget and often a deliberate one.
   The 2.3 MB question bank is fetched after paint precisely so that it is not
   in this number, and folding it in here would erase the distinction that work
   was for.

   THREE BUCKETS, NOT ONE NUMBER
   -----------------------------
   Every page loads the same shell: theme.css, the two typefaces, account.js,
   site-chrome.js and the rest of /assets/. That is most of a first visit and
   nothing at all on every visit after, since it is one cache entry for the
   whole site. Counted into all twelve page budgets it would put every page
   within a few KB of every other — exactly the resolution at which a
   page-specific regression disappears. So:

     site      /assets/**             shared by every page, both courses
     course    <course>/assets/**     shared by every page of one course
     page      the HTML, plus whatever is neither of those

   Each shell is budgeted once. Each page is budgeted on its own bytes, which
   is the number that actually moves when somebody adds something to it.

   THE NUMBERS ARE A RATCHET
   -------------------------
   Same rule as the answer-tell check in check-site.mjs: lower a budget when a
   page gets lighter, never raise one to make a build pass. Raising one is a
   decision to make the site slower — fine occasionally, and worth a sentence
   in the commit message saying why.

     node scripts/check-weight.mjs            report everything, pass or fail
     node scripts/check-weight.mjs --check    exit non-zero if over (CI)
*/
import { readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

/* Measured, then rounded up by roughly a tenth. Not round numbers on purpose:
   a budget picked for looking tidy has slack built into it that nobody knows
   is there, and the first regression spends it silently.

   About 130 KB of the site shell is the two typefaces, which are woff2 and so
   already compressed — gzip does nothing to them and they are the floor this
   number cannot go below without dropping a weight or a character set. The
   rest, ~95 KB, is theme.css and the shared modules, and that is the part any
   commit can move. */
const SHELL_BUDGETS = [
  ['site', 240],
  ['nremt', 7],
  ['ochem', 92],
];

/* One entry per page whose weight is worth defending, which is not the same as
   every page. These are the doors people come in through and the pages they
   spend time on; a budget on all 180 would be 180 numbers nobody maintains. */
const BUDGETS = [
  // The front doors. A first-time visitor's whole impression of whether this
  // site is fast is formed on one of these three.
  ['index.html', 6],
  ['nremt/index.html', 9],
  ['ochem/index.html', 10],

  // The busiest page on the site, and the one the bank split was for.
  ['nremt/practice.html', 38],

  // Long reading pages. study-notes.html was forty chapters of prose in one
  // file — 172 KB gzipped, every reader downloading forty chapters to read
  // one — and the note here said the fix was to move CHAPTERS into a fetched
  // JSON file rather than raise the budget again. That is now done: the page
  // is an 18 KB shell and the chapters are 144 KB of JSON fetched alongside
  // it, budgeted under DATA_BUDGETS below. First paint no longer waits on
  // thirty-nine chapters nobody asked for.
  ['nremt/study-notes.html', 20],
  ['nremt/glossary.html', 10],

  // Added when the scenario set went from eight cases to twenty-five and the
  // page went from 73 KB to 168 KB raw. Measured at 46.5 KB gzipped and
  // budgeted at 50. Like study-notes.html, every case is inline and a reader
  // who opens one downloads all twenty-five; if this number needs to move
  // again, move the data out of the page instead.
  ['nremt/scenario-sim.html', 50],
  // learn.html is a shell whose only real weight is the static table of
  // contents generated into it for readers without JavaScript — one line per
  // section. It crossed 3.0 KB when the IUPAC Nomenclature chapter added four
  // sections, so the budget follows the book: this is the contents list doing
  // its job, not the page getting heavier per section. If it needs moving
  // again for any reason OTHER than new sections, find out why first.
  ['ochem/learn.html', 4],

  // One textbook section, standing in for the other 67. They became real
  // pages when the ochem prose was made readable without JavaScript
  // (scripts/build-notes-pages.mjs); hybridization.html is the largest of
  // them at 17.0 KB, so a budget here defends the worst case rather than a
  // typical one. The median section is 5.9 KB.
  ['ochem/notes/hybridization.html', 18],

  // Search. Both build a large index at runtime; this is the shell, not the
  // corpus, for the same reason as practice.html above.
  ['nremt/search.html', 6],
  ['ochem/search.html', 8],

  // One lesson and one mechanism, standing in for the 68 pages built on the
  // same engine. If these grow, they all did.
  ['ochem/lessons/pka.html', 6],
  ['ochem/mechanisms/e2.html', 10],

  // The privacy policy: the page that has to load well for somebody who has
  // not decided yet whether to trust the site.
  //
  // Raised from 10 when study reminders were added. This page carries the
  // switch for them and the prose explaining exactly what is stored, and both
  // of those belong here rather than anywhere else — the cost is a page that
  // tells the truth at greater length, which is the one thing this page is for.
  ['privacy.html', 12],
];

/* Files fetched at RUNTIME by JavaScript, which the reference walk above
   cannot see: nothing links to them with href or src, so they were invisible
   to this check and could grow without limit. That was already true of the
   question banks; splitting the study notes out of their page made it true of
   the largest single body of prose on the site as well.

   These are not first-paint costs — every one of them is fetched after the
   page is usable, which is the entire point of moving them out. The budget is
   here so that "it is fetched separately" does not quietly become "it is
   unbounded". Measured, then rounded up by roughly a tenth, same as above. */
const DATA_BUDGETS = [
  // The forty chapters, fetched by study-notes.html.
  ['nremt/assets/study-notes.json', 158],
  // What practice.html waits on before it can ask anything.
  ['nremt/assets/questions-core.json', 320],
  // And what it fetches straight afterwards, without blocking.
  ['nremt/assets/explanations.json', 444],
  // The assistant's teaching index for each course.
  ['nremt/assets/tutor-bank.json', 528],
  ['ochem/assets/tutor-bank.json', 182],
  // Ochem's question bank, keyed by topic.
  ['ochem/assets/practice-bank.json', 268],
];

const REF_RE = /(?:href|src)="([^"]+)"/g;
const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;

function isLocal(ref) {
  return ref && !/^(?:[a-z]+:)?\/\//i.test(ref) && !ref.startsWith('data:') &&
         !ref.startsWith('#') && !ref.startsWith('mailto:');
}

function resolveRef(fromFile, ref) {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  return clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(fromFile), clean);
}

function read(path) {
  try { return statSync(path).isFile() ? readFileSync(path) : null; } catch { return null; }
}

/* Which bucket an asset belongs to, from where it lives. */
function bucketOf(relPath) {
  const parts = relPath.split(sep);
  if (parts[0] === 'assets') return 'site';
  if (parts.length > 1 && parts[1] === 'assets') return parts[0];
  return 'page';
}

/* Gzipped as one blob per bucket rather than per file. That is not quite what
   the wire does — each response is compressed on its own — but summing
   separately compressed files overstates the total for a site whose files
   share this much vocabulary, and what this is for is a line that cannot drift
   without somebody noticing, not a waterfall. */
function gz(buffers) {
  if (!buffers.length) return 0;
  return gzipSync(Buffer.concat(buffers), { level: 9 }).length;
}

function weigh(pageRel) {
  const file = join(ROOT, pageRel);
  if (!existsSync(file)) return { error: 'missing' };

  const html = readFileSync(file, 'utf8');
  const seen = new Set();
  const buckets = { page: [Buffer.from(html)] };
  const parts = [];

  const take = (path) => {
    if (!path || seen.has(path)) return null;
    seen.add(path);
    const buf = read(path);
    if (!buf) return null;
    const rel = relative(ROOT, path);
    const bucket = bucketOf(rel);
    (buckets[bucket] = buckets[bucket] || []).push(buf);
    parts.push({ path: rel, raw: buf.length, bucket });
    return buf;
  };

  for (const m of html.matchAll(REF_RE)) {
    const ref = m[1];
    if (!isLocal(ref) || !/\.(css|js)$/i.test(ref)) continue;
    const path = resolveRef(file, ref);
    const buf = take(path);
    if (!buf || !/\.css$/i.test(ref)) continue;

    // One level into a stylesheet, which is how assets/fonts/fonts.css pulls
    // in the woff2 files that are most of the weight it is responsible for.
    for (const u of buf.toString('utf8').matchAll(CSS_URL_RE)) {
      if (!isLocal(u[1]) || !/\.(woff2?|ttf|otf)$/i.test(u[1])) continue;
      take(resolveRef(path, u[1]));
    }
  }

  const sizes = {};
  for (const [name, bufs] of Object.entries(buckets)) sizes[name] = gz(bufs) / 1024;
  return { sizes, parts: parts.sort((a, b) => b.raw - a.raw) };
}

// ---- measure ---------------------------------------------------------------

const rows = [];
const shellSizes = {};
const shellParts = {};
let failures = 0;

for (const [pageRel, budgetKb] of BUDGETS) {
  const res = weigh(pageRel);
  if (res.error) {
    console.error(`FAIL: ${pageRel} is in the budget list but does not exist. Remove it or fix the path.`);
    failures++;
    continue;
  }
  const kb = res.sizes.page || 0;
  rows.push({ pageRel, kb, budgetKb, over: kb > budgetKb, parts: res.parts.filter((p) => p.bucket === 'page') });

  // A shell is the same bytes wherever it is reached from, so the largest
  // measurement of it is the whole of it — a page that loads only half the
  // ochem shell should not make the ochem shell look smaller than it is.
  for (const [name, size] of Object.entries(res.sizes)) {
    if (name === 'page') continue;
    if (!(name in shellSizes) || size > shellSizes[name]) {
      shellSizes[name] = size;
      shellParts[name] = res.parts.filter((p) => p.bucket === name);
    }
  }
}

const dataRows = [];
for (const [rel, budgetKb] of DATA_BUDGETS) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`FAIL: ${rel} is in the data budget list but does not exist. Remove it or fix the path.`);
    failures++;
    continue;
  }
  const kb = gzipSync(readFileSync(abs), { level: 9 }).length / 1024;
  dataRows.push({ rel, kb, budgetKb, over: kb > budgetKb });
}

// ---- report ----------------------------------------------------------------

const pad = (s, n) => String(s).padEnd(n);
const line = (name, kb, budget) => {
  const head = budget - kb;
  return pad(name, 34) + pad(kb.toFixed(1) + ' KB', 10) + pad(budget + ' KB', 9) +
    (kb > budget ? `OVER by ${(-head).toFixed(1)} KB` : `${head.toFixed(1)} KB`);
};

console.log('Shared shells — downloaded once for the whole site, then cached.\n');
console.log(pad('shell', 34) + pad('gzipped', 10) + pad('budget', 9) + 'headroom');
console.log('-'.repeat(66));
const shellRows = [];
for (const [name, budget] of SHELL_BUDGETS) {
  const kb = shellSizes[name] || 0;
  if (!kb) continue;
  const over = kb > budget;
  if (over) failures++;
  shellRows.push({ name, kb, budget, over });
  console.log(line(name === 'site' ? '/assets (every page)' : `${name}/assets`, kb, budget));
}

console.log('\nPer page — the HTML and anything only this page loads.\n');
console.log(pad('page', 34) + pad('gzipped', 10) + pad('budget', 9) + 'headroom');
console.log('-'.repeat(66));
for (const r of rows) {
  if (r.over) failures++;
  console.log(line(r.pageRel, r.kb, r.budgetKb));
}

console.log('\nFetched after the page is usable — data files no reference graph can see.\n');
console.log(pad('data file', 34) + pad('gzipped', 10) + pad('budget', 9) + 'headroom');
console.log('-'.repeat(66));
for (const r of dataRows) {
  if (r.over) failures++;
  console.log(line(r.rel, r.kb, r.budgetKb));
}

for (const r of dataRows.filter((x) => x.over)) {
  console.error(`\nFAIL: ${r.rel} is ${r.kb.toFixed(1)} KB gzipped, over its ${r.budgetKb} KB budget.`);
  console.error('      Nothing links to this file, so nothing else was measuring it.');
}

for (const r of shellRows.filter((x) => x.over)) {
  console.error(`\nFAIL: the ${r.name} shell is ${r.kb.toFixed(1)} KB gzipped, over its ${r.budget} KB budget.`);
  console.error('      This one is on the critical path of EVERY page it belongs to,');
  console.error('      so it is the most expensive place on the site to add weight.');
  for (const p of (shellParts[r.name] || []).slice(0, 6)) {
    console.error(`        ${(p.raw / 1024).toFixed(0).padStart(6)} KB raw  ${p.path}`);
  }
}

for (const r of rows.filter((x) => x.over)) {
  console.error(`\nFAIL: ${r.pageRel} is ${r.kb.toFixed(1)} KB gzipped of its own, over its ${r.budgetKb} KB budget.`);
  for (const p of r.parts.slice(0, 5)) {
    console.error(`        ${(p.raw / 1024).toFixed(0).padStart(6)} KB raw  ${p.path}`);
  }
}

if (failures) {
  console.error('\nMake it lighter, or raise the budget in scripts/check-weight.mjs and say');
  console.error('in the commit message why the site is allowed to be slower.');
}

// A budget with a lot of room left is a stale budget. Reported, never failed: a
// ratchet that tightened itself would fail the build for making things better.
const slack = [...shellRows, ...rows, ...dataRows]
  .filter((r) => !r.over)
  .map((r) => ({ name: r.name || r.pageRel || r.rel, kb: r.kb, budget: r.budget ?? r.budgetKb }))
  .filter((r) => r.budget - r.kb > r.budget * 0.3);
if (slack.length) {
  console.log('\nRoom to tighten — these budgets have drifted generous:');
  for (const r of slack) console.log(`  ${r.name}: ${r.kb.toFixed(1)} KB against a ${r.budget} KB budget`);
}

if (failures) {
  console.error(`\n${failures} budget(s) exceeded.`);
  if (check) process.exit(1);
} else {
  console.log(`\nAll ${shellRows.length + rows.length + dataRows.length} budgets are within range.`);
}
