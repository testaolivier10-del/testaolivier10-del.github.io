#!/usr/bin/env node
// Lightweight CI checks for a static, no-build-step site: no bundler to catch
// a typo'd path or a broken JSON file before it ships, so this does it instead.
//   1. Every local href/src (and every <script src>) points at a file that exists.
//   2. Every JSON file (questions.json, manifest.json, etc.) actually parses.
//   3. Every URL listed in sitemap.xml maps to a file that exists on disk.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
let failures = 0;

function fail(msg) {
  failures++;
  console.error('FAIL: ' + msg);
}

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules' || name === 'scripts') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.includes(extname(name))) out.push(full);
  }
  return out;
}

// ---- 1 & (implicitly) well-formedness: scan every HTML file's local references ----
const htmlFiles = walk(ROOT, ['.html']);
const REF_RE = /(?:href|src)="([^"]+)"/g;

for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf8');
  let m;
  while ((m = REF_RE.exec(content))) {
    let ref = m[1];
    // Not a literal path: built at runtime inside an inline <script>, either
    // in a template literal (`${...}`) or by concatenation ("' + x + '").
    // Several lesson pages build href="' + location.pathname + '" that way.
    if (ref.includes('${')) continue;
    if (/['"`]\s*\+|\+\s*['"`]/.test(ref)) continue;
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith('mailto:') || ref.startsWith('tel:') || ref.startsWith('data:') || ref.startsWith('#')) continue;
    ref = ref.split('#')[0].split('?')[0];
    if (!ref) continue;
    const base = ref.startsWith('/') ? ROOT : dirname(file);
    const target = join(base, ref);
    if (!existsSync(target)) {
      fail(`${relative(ROOT, file)}: broken reference "${ref}"`);
    }
  }
}

// ---- 2. JSON files parse ----
const jsonFiles = walk(ROOT, ['.json']);
for (const file of jsonFiles) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`${relative(ROOT, file)}: invalid JSON (${e.message})`);
  }
}

// ---- 3. sitemap.xml URLs resolve to real files ----
const sitemapPath = join(ROOT, 'sitemap.xml');
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const locRe = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = locRe.exec(sitemap))) {
    const url = new URL(m[1]);
    let p = url.pathname;
    if (p.endsWith('/')) p += 'index.html';
    const target = join(ROOT, p);
    if (!existsSync(target)) {
      fail(`sitemap.xml: "${m[1]}" has no matching file (${relative(ROOT, target)})`);
    }
  }
}

// ---- 4. the lesson-concept map still lines up with the lessons ----
// assets/lesson-concepts.js credits concepts by step INDEX. If a lesson gains
// or loses a step, every index below it shifts and the map would quietly
// credit the wrong concept. The engine already falls back to inference when
// the step count disagrees, so this never ships bad data — but a silent
// fallback also means nobody notices the map has rotted, hence the check.
/* Count the top-level entries of a lesson's `steps: [ ... ]` array.

   This used to be `body.match(/\{\s*(?:type|render)\s*:/g).length`, which
   silently assumed every step object opens with `type:` or `render:` as
   its very first property. That is not a rule the engine enforces, and it
   stopped holding the moment steps grew a `diagramHtml` ahead of `type:`
   or a comment ahead of `render:` — at which point the checker reported
   every one of those lessons as having one step fewer than it has, which
   reads like the concept map drifting when nothing of the sort happened.

   So scan for real: find the steps array, then walk it tracking nesting,
   strings and comments, and count the braces that open at depth 1. */
function countSteps(body) {
  const start = body.indexOf('steps: [');
  if (start < 0) return null;
  let i = body.indexOf('[', start);
  let depth = 0, count = 0;
  let quote = null, esc = false, line = false, block = false;

  for (; i < body.length; i++) {
    const c = body[i], next = body[i + 1];

    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '*' && next === '/') { block = false; i++; } continue; }
    if (quote) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && next === '/') { line = true; i++; continue; }
    if (c === '/' && next === '*') { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }

    if (c === '[') { depth++; continue; }
    if (c === ']') { depth--; if (depth === 0) return count; continue; }
    if (c === '{') { if (depth === 1) count++; depth++; continue; }
    if (c === '}') { depth--; continue; }
  }
  return null; // unbalanced; caller reports it
}

{
  const lcPath = join(ROOT, 'ochem/assets/lesson-concepts.js');
  const lessonDir = join(ROOT, 'ochem/lessons');
  if (existsSync(lcPath) && existsSync(lessonDir)) {
    const src = readFileSync(lcPath, 'utf8');
    // Each entry looks like:  'topic-id': { n:8, steps:{ ... } }
    const entries = [...src.matchAll(/'([a-z0-9-]+)':\s*\{\s*n:\s*(\d+)/g)]
      .map(m => ({ topic: m[1], n: Number(m[2]) }));
    if (!entries.length) fail('ochem/assets/lesson-concepts.js: no lesson entries parsed');
    for (const { topic, n } of entries) {
      const lesson = join(lessonDir, topic + '.html');
      if (!existsSync(lesson)) { fail(`lesson-concepts.js: no lesson file for "${topic}"`); continue; }
      // Count the step objects the lesson hands the engine.
      const body = readFileSync(lesson, 'utf8');
      const steps = countSteps(body);
      if (steps === null) {
        fail(`lesson-concepts.js: could not find the steps array in ${topic}.html`);
        continue;
      }
      if (steps !== n) {
        fail(`lesson-concepts.js: "${topic}" authored against ${n} steps but the lesson now has ${steps} — re-check the step indices, then update n.`);
      }
    }
  }
}

// ---- 5. Question bank: no positional or length tell in the keyed answer ----
// Both are ways a bank can teach pattern-matching instead of medicine. The
// first is fatal and mechanical: at one point every one of the 1,000 newest
// multiple-choice items keyed to option A, so anything rendering the file
// without practice.html's runtime shuffle leaked every answer. The second is
// softer but the shuffle cannot help with it — reordering options doesn't
// change which one is longest.
const bankPath = join(ROOT, 'nremt', 'assets', 'questions.json');
let bank = null;
if (existsSync(bankPath)) {
  try { bank = JSON.parse(readFileSync(bankPath, 'utf8')); } catch { /* section 2 reports it */ }
  if (Array.isArray(bank)) {
    const mc = bank.filter(q => !q.type || q.type === 'mc');

    // (a) keyed position spread
    const pos = {};
    for (const q of mc) pos[q.correct] = (pos[q.correct] || 0) + 1;
    const POSITION_CEILING = 0.4;
    for (const [idx, n] of Object.entries(pos)) {
      const share = n / mc.length;
      if (share > POSITION_CEILING) {
        fail(`questions.json: ${(share * 100).toFixed(0)}% of multiple-choice answers key to option index ${idx} ` +
             `(${n}/${mc.length}) — over the ${POSITION_CEILING * 100}% ceiling. Permute the stored options.`);
      }
    }

    // (b) "the longest option is the answer". Chance is ~25%; the bank sits well
    // above that because keys in the newest 1,000 items run about 10% longer
    // than their distractors on average. The worst outliers have been trimmed;
    // the rest is an editorial pass over several hundred items. This ceiling is
    // a ratchet: lower it as that work lands, never raise it to let a
    // regression through.
    const LENGTH_TELL_CEILING = 0.55;
    let longestIsKey = 0;
    for (const q of mc) {
      const lens = q.options.map(o => String(o).length);
      if (lens.indexOf(Math.max(...lens)) === q.correct) longestIsKey++;
    }
    const tell = longestIsKey / mc.length;
    if (tell > LENGTH_TELL_CEILING) {
      fail(`questions.json: the longest option is the answer in ${(tell * 100).toFixed(0)}% of items ` +
           `(${longestIsKey}/${mc.length}), over the ${LENGTH_TELL_CEILING * 100}% ceiling. ` +
           `Trim over-long keys or pad thin distractors — chance is ~25%.`);
    }

    // (c) select-N keys must not all be the same set
    const multi = bank.filter(q => q.type === 'multi');
    if (multi.length > 10) {
      const sets = {};
      for (const q of multi) { const k = JSON.stringify(q.correct); sets[k] = (sets[k] || 0) + 1; }
      const [topSet, topN] = Object.entries(sets).sort((a, b) => b[1] - a[1])[0];
      if (topN / multi.length > POSITION_CEILING) {
        fail(`questions.json: ${topN}/${multi.length} select-N items key to the same set ${topSet}. Permute the stored options.`);
      }
    }
  }
}

// ---- 6. Every advertised question count matches the bank ----
// The homepage advertised "920 practice questions" long after the bank passed
// two thousand. The figure appears in nine places — page copy, meta
// descriptions, Open Graph tags — so it drifts quietly. This makes it loud.
if (Array.isArray(bank)) {
  const expected = bank.length.toLocaleString('en-US');
  const COUNT_RE = /\b(\d{1,3}(?:,\d{3})+|\d{3,5})(?=[- ](?:practice )?questions?\b|-question\b)/g;
  for (const file of [...htmlFiles, join(ROOT, 'README.md')]) {
    if (!existsSync(file)) continue;
    const body = readFileSync(file, 'utf8');
    for (const m of body.matchAll(COUNT_RE)) {
      const n = m[1];
      // Session lengths (a 100-question exam, a 20-question drill) and badge
      // thresholds ("500 questions" answered) are not claims about the pool.
      // 900 sits above every one of those and below any real pool figure — the
      // stale "920 practice questions" on the homepage is still caught.
      if (Number(n.replace(/,/g, '')) < 900) continue;
      if (n !== expected) {
        fail(`${relative(ROOT, file)}: advertises "${n} questions" but the bank holds ${expected}.`);
      }
    }
  }
}

// ---- 7. Every page is in the sitemap ----
// Fifty lesson pages once shipped with no path in from a search engine because
// sitemap.xml was maintained by hand. This walk already knows every HTML file.
const sitemapForCoverage = join(ROOT, 'sitemap.xml');
if (existsSync(sitemapForCoverage)) {
  const listed = new Set(
    [...readFileSync(sitemapForCoverage, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(m => new URL(m[1]).pathname)
  );
  for (const file of htmlFiles) {
    const body = readFileSync(file, 'utf8');
    // Redirect stubs, and Google's site-verification file, are not pages.
    if (/http-equiv="refresh"/.test(body)) continue;
    if (/^google[0-9a-f]+\.html$/.test(relative(ROOT, file))) continue;
    // Nor 404.html and offline.html: each is served in place of some other
    // URL — the first by GitHub Pages for anything it cannot resolve, the
    // second by sw.js for anything it cannot fetch — so neither has an
    // address of its own to submit.
    if (/^(404|offline)\.html$/.test(relative(ROOT, file).split(sep).join('/'))) continue;
    // Nor are the textbook's section fragments — see build-sitemap.mjs.
    if (relative(ROOT, file).split(sep).join('/').startsWith('ochem/notes/')) continue;
    const path = '/' + relative(ROOT, file).split(sep).join('/');
    if (!listed.has(path) && !listed.has(path.replace(/index\.html$/, ''))) {
      fail(`sitemap.xml: no entry for ${path} — run scripts/build-sitemap.mjs`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log(`OK — scanned ${htmlFiles.length} HTML files and ${jsonFiles.length} JSON files, no broken local references.`);
}
