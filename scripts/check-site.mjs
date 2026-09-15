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

// ---- 5. Question banks: no positional, length or polarity tell in the key ----
// All three are ways a bank can teach pattern-matching instead of the subject.
// The first is fatal and mechanical: at one point every one of the 1,000 newest
// multiple-choice items keyed to option A, so anything rendering the file
// without practice.html's runtime shuffle leaked every answer. The second is
// softer but the shuffle cannot help with it — reordering options doesn't
// change which one is longest. The third is true/false drifting to one answer,
// which shuffle-options.js cannot fix either, because it deliberately PINS a
// true/false pair in that order so the question still reads correctly.
//
// WHY THIS RUNS OVER BOTH BANKS
// -----------------------------
// It used to run over questions.json alone. That was right when there was one
// bank, and quietly wrong from the day ochem got its own: the defence existed,
// nothing pointed it at the second bank, and practice-bank.json drifted to more
// than twice the length-tell ceiling NREMT is held to. A check that guards one
// of two identical things is a check that has stopped meaning what it says.
//
// ABOUT THE OCHEM CEILINGS
// ------------------------
// Everywhere else in this repo a ceiling is a ratchet you only ever lower. The
// ochem numbers below are the exception, and they are not a blessing: they are
// the bank's measured state on the day it was first guarded, written down so it
// cannot get worse while the editorial work happens. A bank that is already 2x
// over cannot be held to the target on day one without failing every build
// until the content is rewritten. Lower them as that work lands. Do not raise
// them — raising one is a decision to make the bank more guessable.
// Below this many single-word-bearing items the rate is noise, not a tell.
const MIN_WORDING_SAMPLE = 30;

const WORDING_TELLS = [
  {
    label: 'an absolute word (always/never/only/must/immediately)',
    re: /\b(?:always|never|only|must|immediately)\b/i,
    threshold: 'absoluteFloor',
    direction: 'marks-wrong',
    advice: 'Rewrite the strawman distractors so that being absolute is not what makes them wrong.',
  },
  {
    label: 'a hedge ("per protocol"/"as appropriate"/"generally")',
    re: /(?:per protocol|as appropriate|generally)/i,
    threshold: 'hedgeCeiling',
    direction: 'marks-right',
    advice: 'Either hedge some distractors too, or commit the key to a definite answer.',
  },
  {
    // The third tell, and the one this repo created. Fixing the length tell
    // moved explanation out of the keys and into the distractors, where it
    // arrives as a clause justifying why the option is wrong — "..., since
    // that appears only late in shock". A student who notices that an option
    // arguing against itself is never the answer has a third free rule.
    label: 'a trailing justification clause (", since ...", ", because ...")',
    re: /,\s+(?:since|because|which|as it|a finding|a delay|rather than|not )/i,
    threshold: 'justifyFloor',
    direction: 'marks-wrong',
    advice: 'Move the reasoning into the explanation, where it teaches, instead of into the option, where it gives the answer away.',
  },
];

const BANKS = [
  {
    label: 'questions.json',
    path: ['nremt', 'assets', 'questions.json'],
    // A flat array. Untyped items are the 4-option multiple choice.
    items: (parsed) => (Array.isArray(parsed) ? parsed : null),
    isMulti: (q) => !q.type || q.type === 'mc',
    isTrueFalse: () => false,
    positionCeiling: 0.4,
    lengthCeiling: 0.32,
    trueFalseCeiling: null,
    // Measured 6.6% and 42.9% when the wording tells were first guarded.
    absoluteFloor: 0.06,
    hedgeCeiling: 0.43,
    // Measured 17.1% on the single-clause case against a 25% baseline.
    justifyFloor: 0.17,
  },
  {
    label: 'practice-bank.json',
    path: ['ochem', 'assets', 'practice-bank.json'],
    // Keyed by topic slug, one array of items each.
    items: (parsed) =>
      parsed && !Array.isArray(parsed) && typeof parsed === 'object'
        ? Object.values(parsed).flatMap((list) => (Array.isArray(list) ? list : []))
        : null,
    isMulti: (q) => q.type === 'mcq',
    isTrueFalse: (q) => q.type === 'tf',
    positionCeiling: 0.4,
    // Measured at 68% when the check was first pointed here. Target is ~32%,
    // the number NREMT reached after its own editorial pass.
    lengthCeiling: 0.68,
    // 74% of true/false items key to "True". Chance is 50% and the shuffle is
    // pinned, so this is the whole tell — it is not diluted by anything.
    trueFalseCeiling: 0.75,
    // Measured 3.0% absolute. The hedge tell here was 13 for 13 — a perfect
    // giveaway, but on a sample too small for MIN_WORDING_SAMPLE to assert on,
    // so it is recorded here rather than guarded. If ochem grows past thirty
    // single-hedge items, this ceiling starts biting; keep it honest.
    absoluteFloor: 0.03,
    hedgeCeiling: 0.5,
    justifyFloor: 0.1,
  },
];

let bank = null; // questions.json, reused by section 6

for (const spec of BANKS) {
  const bankPath = join(ROOT, ...spec.path);
  if (!existsSync(bankPath)) continue;

  let parsed = null;
  try { parsed = JSON.parse(readFileSync(bankPath, 'utf8')); } catch { continue; /* section 2 reports it */ }
  if (spec.label === 'questions.json') bank = parsed;

  const all = spec.items(parsed);
  if (!all) continue;

  const mc = all.filter(spec.isMulti);

  // (a) keyed position spread
  if (mc.length) {
    const pos = {};
    for (const q of mc) pos[q.correct] = (pos[q.correct] || 0) + 1;
    for (const [idx, n] of Object.entries(pos)) {
      const share = n / mc.length;
      if (share > spec.positionCeiling) {
        fail(`${spec.label}: ${(share * 100).toFixed(0)}% of multiple-choice answers key to option index ${idx} ` +
             `(${n}/${mc.length}) — over the ${spec.positionCeiling * 100}% ceiling. Permute the stored options.`);
      }
    }
  }

  // (b) "the longest option is the answer". Chance is one over the number of
  // options — ~25% for a 4-option item. NREMT sat at 54% because keys in the
  // newest 1,000 items ran about 10% longer than their distractors on average;
  // an editorial pass over the 480 items where the key led by six characters or
  // fewer lengthened one distractor apiece and brought it to 30%. Ochem has not
  // had that pass yet. Tags are stripped first: a key wrapped in markup is not
  // longer to the student reading it, only to the file.
  if (mc.length) {
    const visible = (o) => String(o).replace(/<[^>]*>/g, '').trim().length;
    let longestIsKey = 0;
    for (const q of mc) {
      const lens = q.options.map(visible);
      if (lens.indexOf(Math.max(...lens)) === q.correct) longestIsKey++;
    }
    const tell = longestIsKey / mc.length;
    if (tell > spec.lengthCeiling) {
      const chance = Math.round(100 / (mc.reduce((a, q) => a + q.options.length, 0) / mc.length));
      fail(`${spec.label}: the longest option is the answer in ${(tell * 100).toFixed(0)}% of items ` +
           `(${longestIsKey}/${mc.length}), over the ${(spec.lengthCeiling * 100).toFixed(0)}% ceiling. ` +
           `Trim over-long keys or pad thin distractors — chance is ~${chance}%.`);
    }
  }

  // (c) true/false must not drift to one answer. shuffle-options.js pins the
  // pair in order, by design, so nothing downstream dilutes this.
  if (spec.trueFalseCeiling !== null) {
    const tf = all.filter(spec.isTrueFalse);
    if (tf.length > 10) {
      const counts = {};
      for (const q of tf) counts[q.correct] = (counts[q.correct] || 0) + 1;
      for (const [idx, n] of Object.entries(counts)) {
        const share = n / tf.length;
        if (share > spec.trueFalseCeiling) {
          const which = idx === '0' ? 'the first option' : 'the second option';
          fail(`${spec.label}: ${(share * 100).toFixed(0)}% of true/false items key to ${which} ` +
               `(${n}/${tf.length}), over the ${(spec.trueFalseCeiling * 100).toFixed(0)}% ceiling. ` +
               `Chance is 50%, and the option shuffle pins true/false pairs, so this tell reaches the student intact.`);
        }
      }
    }
  }

  // (d) select-N keys must not all be the same set
  const multi = all.filter((q) => q.type === 'multi');
  if (multi.length > 10) {
    const sets = {};
    for (const q of multi) { const k = JSON.stringify(q.correct); sets[k] = (sets[k] || 0) + 1; }
    const [topSet, topN] = Object.entries(sets).sort((a, b) => b[1] - a[1])[0];
    if (topN / multi.length > spec.positionCeiling) {
      fail(`${spec.label}: ${topN}/${multi.length} select-N items key to the same set ${topSet}. Permute the stored options.`);
    }
  }

  // (e) and (f): wording tells. Position and length are about the shape of an
  // option; these two are about its vocabulary, and the option shuffle is no
  // help against either — reordering does not change how an option is worded.
  //
  // The direction matters and it is opposite for the two lists. An absolute
  // word marks a WRONG answer, because distractors get written as strawmen
  // ("ALWAYS apply a tourniquet first") while keys get written carefully. A
  // hedge marks a RIGHT one, for the mirror-image reason: the key is the option
  // allowed to be cautious. So one gets a floor and the other a ceiling, and
  // both are measured on items where exactly ONE option carries such a word —
  // that is the case a student can actually act on.
  //
  // A tell this mechanical is worth more than its size suggests: 441 of the
  // NREMT bank's items have a single absolute-worded option, and the key was
  // that option 6.6% of the time against a 25% baseline. A student who learns
  // one rule eliminates an option on a fifth of the bank.
  if (mc.length) {
    for (const probe of WORDING_TELLS) {
      const ceiling = spec[probe.threshold];
      if (ceiling === undefined || ceiling === null) continue;
      let n = 0, keyed = 0, chanceSum = 0;
      for (const q of mc) {
        if (!Array.isArray(q.options)) continue;
        const hits = q.options.reduce((acc, o, i) => (probe.re.test(String(o)) ? acc.concat(i) : acc), []);
        if (hits.length !== 1) continue;
        n++;
        chanceSum += 1 / q.options.length;
        if (hits[0] === q.correct) keyed++;
      }
      if (n < MIN_WORDING_SAMPLE) continue;
      const share = keyed / n;
      const chance = chanceSum / n;
      const off = probe.direction === 'marks-wrong' ? share < ceiling : share > ceiling;
      if (off) {
        fail(`${spec.label}: on ${n} items exactly one option contains ${probe.label}, ` +
             `and the key was that option ${(share * 100).toFixed(1)}% of the time ` +
             `(${keyed}/${n}) against a ${(chance * 100).toFixed(0)}% baseline — ` +
             (probe.direction === 'marks-wrong'
               ? `under the ${(ceiling * 100).toFixed(0)}% floor — it is marking distractors. ${probe.advice}`
               : `over the ${(ceiling * 100).toFixed(0)}% ceiling — it is marking keys. ${probe.advice}`));
      }
    }
  }
}

// ---- 6. Every advertised question count matches the bank ----
// The homepage advertised "920 practice questions" long after the bank passed
// two thousand. The figure appears in nine places — page copy, meta
// descriptions, Open Graph tags — so it drifts quietly. This makes it loud.
//
// There are TWO banks now, and which one a page is talking about is decided by
// where the page lives: anything under ochem/ means the ochem bank, anything
// else means NREMT's. Before ochem had a bank of its own this was a single
// comparison, and the first ochem page to quote its own figure would have
// failed the build for being accurate.
const ochemBankPath = join(ROOT, 'ochem', 'assets', 'practice-bank.json');
let ochemBankCount = null;
if (existsSync(ochemBankPath)) {
  try {
    const parsed = JSON.parse(readFileSync(ochemBankPath, 'utf8'));
    ochemBankCount = Object.values(parsed).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0);
  } catch { /* section 2 reports it */ }
}

if (Array.isArray(bank)) {
  const nremtExpected = bank.length.toLocaleString('en-US');
  const ochemExpected = ochemBankCount === null ? null : ochemBankCount.toLocaleString('en-US');
  const COUNT_RE = /\b(\d{1,3}(?:,\d{3})+|\d{3,5})(?=[- ](?:practice )?questions?\b|-question\b)/g;
  for (const file of [...htmlFiles, join(ROOT, 'README.md')]) {
    if (!existsSync(file)) continue;
    const rel = relative(ROOT, file);
    const body = readFileSync(file, 'utf8');
    // The README describes both courses in the same file, so a figure in it is
    // correct if it matches either bank. Everything else belongs to one course.
    const isReadme = rel === 'README.md';
    const isOchem = rel.split(/[\\/]/)[0] === 'ochem';
    for (const m of body.matchAll(COUNT_RE)) {
      const n = m[1];
      // Session lengths (a 100-question exam, a 20-question drill) and badge
      // thresholds ("500 questions" answered) are not claims about the pool.
      // 900 sits above every one of those and below any real pool figure — the
      // stale "920 practice questions" on the homepage is still caught.
      if (Number(n.replace(/,/g, '')) < 900) continue;

      const allowed = isReadme
        ? [nremtExpected, ochemExpected].filter(Boolean)
        : [isOchem ? ochemExpected : nremtExpected].filter(Boolean);
      if (!allowed.length || allowed.includes(n)) continue;
      fail(`${rel}: advertises "${n} questions" but the ${isOchem ? 'ochem' : 'NREMT'} bank holds ${allowed.join(' or ')}.`);
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

// ---- 8. Every advertised Ochem count matches the curriculum ----
// The course was "58 lessons" on the hub, "62 topics" on its own home page
// and "Fifty-eight interactive lessons" on the 404 page at the same time.
// All three were true of something, which is how they drifted unnoticed.
// curriculum.js is the single source of truth: a topic with an href exists,
// a lesson is one whose href is under lessons/, and a mechanism is a page
// under ochem/mechanisms/. Any digit count of "topics", "lessons" or
// "mechanisms" on a page has to match, the way the question count does.
const curriculumPath = join(ROOT, 'ochem', 'assets', 'curriculum.js');
if (existsSync(curriculumPath)) {
  const src = readFileSync(curriculumPath, 'utf8');
  const hrefs = [...src.matchAll(/href:\s*'([^']+)'/g)].map(m => m[1]);
  const topics = hrefs.length;
  const lessons = hrefs.filter(h => h.startsWith('lessons/')).length;
  const mechanismsDir = join(ROOT, 'ochem', 'mechanisms');
  const mechanisms = existsSync(mechanismsDir) ? readdirSync(mechanismsDir).filter(f => f.endsWith('.html')).length : 0;
  const expected = { topics, lessons, mechanisms };
  const OCHEM_COUNT_RE = /\b(\d{1,3})\s+(?:interactive\s+|chemistry\s+)?(topics|lessons|mechanisms)\b/g;
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel.startsWith('ochem/notes/')) continue;
    const body = readFileSync(file, 'utf8');
    for (const m of body.matchAll(OCHEM_COUNT_RE)) {
      const n = Number(m[1]);
      // Small figures are structure, not catalogue claims: "the two topics
      // below", "three mechanisms in this module".
      if (n < 20) continue;
      if (n !== expected[m[2]]) {
        fail(`${rel}: advertises "${m[1]} ${m[2]}" but curriculum.js has ${expected[m[2]]}.`);
      }
    }
  }
}

// ---- 9. The static tool tiles on ochem/tools.html match the registry ----
// tools.html carries the seven tiles as markup so a crawler or a reader
// with scripts off still gets the list; tools-page.js re-renders the same
// markup from tools-registry.js on load. If a tool is added to the registry
// and not the page, the two versions of the page disagree.
const registryPath = join(ROOT, 'ochem', 'assets', 'tools-registry.js');
const toolsPagePath = join(ROOT, 'ochem', 'tools.html');
if (existsSync(registryPath) && existsSync(toolsPagePath)) {
  const w = {};
  new Function('window', readFileSync(registryPath, 'utf8'))(w);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wanted = w.OchemTools.ALL.map(t =>
    `<a class="tool-tile" href="tools/${esc(t.slug)}.html"><span class="tool-tile__mark"><svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg></span><span class="tool-tile__name">${esc(t.name)}</span><span class="tool-tile__tag">${esc(t.tagline)}</span><span class="tool-tile__blurb">${esc(t.blurb)}</span><span class="tool-tile__foot"><span>${esc(t.teaches)}</span><span class="tool-tile__go">Open &rarr;</span></span></a>`
  );
  const page = readFileSync(toolsPagePath, 'utf8');
  const have = [...page.matchAll(/<a class="tool-tile"[\s\S]*?<\/a>/g)].map(m => m[0]);
  if (have.length !== wanted.length || have.some((h, i) => h !== wanted[i])) {
    fail(`ochem/tools.html: the static tool tiles differ from tools-registry.js (${have.length} on the page, ${wanted.length} in the registry). Regenerate them from the registry.`);
  }
}

// ---- 10. Every question has a unique, permanent id ----
// An id is what every record in a learner's browser refers to: their missed
// queue, their flagged list, their mastery record, the option order each
// question is displayed in, and any half-finished attempt. A question with no
// id cannot be referred to at all; two questions sharing one means both sets
// of records land on whichever the code resolves first. Neither throws in a
// browser — the student just silently gets the wrong questions back.
//
// This does not check that ids were not RENUMBERED, which is the other way to
// break every record at once and which no static check can see. Don't. Adding
// a question means running build-question-bank.mjs, which only ever hands out
// ids above the high-water mark; removing one means deleting its line and
// leaving the hole.
if (Array.isArray(bank)) {
  const byId = new Map();
  let missing = 0;
  bank.forEach((q, at) => {
    if (!Number.isInteger(q.id) || q.id < 0) { missing++; return; }
    if (byId.has(q.id)) {
      fail(`questions.json: id ${q.id} is on both question ${byId.get(q.id)} and question ${at}.`);
    } else {
      byId.set(q.id, at);
    }
  });
  if (missing) {
    fail(`questions.json: ${missing} question(s) have no id — run scripts/build-question-bank.mjs to assign them.`);
  }
}

// ---- 11. Every page that can report an error does ----
// assets/errors.js is the only thing that says a page broke. A page that
// carries the rest of the site's chrome but not this one is a page whose
// failures are invisible — and a new page is copied from an existing one, so
// the omission would be inherited silently forever.
//
// It must also come FIRST. Deferred scripts run in document order, so a
// reporter below account.js is a reporter that missed anything thrown while
// account.js was running, and the errors worth hearing about are exactly the
// ones early enough to stop a page working.
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const account = html.indexOf('assets/account.js');
  if (account === -1) continue;
  const errors = html.indexOf('assets/errors.js');
  const rel = relative(ROOT, file);
  if (errors === -1) {
    fail(`${rel}: loads assets/account.js but not assets/errors.js, so nothing reports when this page breaks.`);
  } else if (errors > account) {
    fail(`${rel}: loads assets/errors.js after assets/account.js — it has to come first to catch anything thrown before it.`);
  }
}

// ---- 12. Molecule drawings must not contradict the valence they teach ----
// The aldol figure drew acetone's two methyl carbons with two hydrogens each,
// so a course whose first module is "count the bonds on every atom" was
// shipping a ketone whose methyls were CH2. Six more structures had the same
// defect, always for the same reason: the third hydrogen was dropped to keep
// the picture uncluttered.
//
// The rule is narrower than "every carbon needs four bonds", because a carbon
// with NO hydrogens drawn is ordinary shorthand — skeletal structures are drawn
// that way on purpose and are not wrong. What a student cannot read is a carbon
// that draws SOME of its hydrogens and not the rest: that asserts a complete
// picture and then gets it wrong. So this only flags an atom that draws at
// least one hydrogen and still falls short.
//
// A drawing that means to show only the hydrogens under discussion — a chair
// whose axial/equatorial fate is the whole point, an E2 substrate where two
// competing beta hydrogens are the subject — declares `partialH` with its
// reason, and is exempt. That keeps the intent in the file rather than in
// whoever last edited it.
const VALENCE = { C: 4, N: 3, O: 2, S: 2 };
const moleculesPath = join(ROOT, 'ochem', 'assets', 'molecules.js');
if (existsSync(moleculesPath)) {
  const src = readFileSync(moleculesPath, 'utf8');
  for (const block of src.matchAll(/M\['([^']+)'\]\s*=\s*\{([\s\S]*?)\n  \};/g)) {
    const [, name, body] = block;
    if (/\bpartialH\s*:/.test(body)) continue;
    const atomsBlock = body.match(/atoms:\s*\{([\s\S]*?)\n    \},/);
    const bondsBlock = body.match(/bonds:\s*\[([\s\S]*?)\]/);
    if (!atomsBlock || !bondsBlock) continue;

    const atoms = new Map();
    for (const a of atomsBlock[1].matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
      const label = a[2].match(/label:\s*'([^']*)'/);
      if (label) atoms.set(a[1], { el: label[1], charged: /charge\s*:/.test(a[2]) });
    }
    const degree = new Map([...atoms.keys()].map((k) => [k, 0]));
    const drawnH = new Map([...atoms.keys()].map((k) => [k, 0]));
    for (const b of bondsBlock[1].matchAll(/\{a:'(\w+)',b:'(\w+)'(?:,\s*order:\s*(\d))?/g)) {
      const [, a1, a2, ord] = b;
      const order = Number(ord || 1);
      if (degree.has(a1)) degree.set(a1, degree.get(a1) + order);
      if (degree.has(a2)) degree.set(a2, degree.get(a2) + order);
      if (atoms.has(a1) && atoms.has(a2)) {
        if (atoms.get(a2).el === 'H') drawnH.set(a1, drawnH.get(a1) + 1);
        if (atoms.get(a1).el === 'H') drawnH.set(a2, drawnH.get(a2) + 1);
      }
    }
    for (const [key, atom] of atoms) {
      const want = VALENCE[atom.el];
      if (!want || atom.charged) continue;
      if (drawnH.get(key) > 0 && degree.get(key) < want) {
        fail(`ochem/assets/molecules.js: ${name}, atom "${key}" (${atom.el}) draws ` +
             `${drawnH.get(key)} hydrogen(s) but has only ${degree.get(key)} of ${want} bonds — ` +
             `it reads as ${atom.el}H${drawnH.get(key)} where the structure needs ${want - degree.get(key)} more. ` +
             `Draw the missing hydrogen(s), or declare partialH with the reason if the omission is deliberate.`);
      }
    }
  }
}

// ---- 13. Every scenario branch leads somewhere ----
// scenario-sim.html is one big literal graph of nodes and `next` pointers,
// hand-edited. A typo'd target is not a parse error and not a broken link, so
// nothing above would catch it: the scenario simply dead-ends mid-call, which
// is the one thing a branching-call trainer must never do. An unreachable node
// is the same mistake seen from the other end — a branch someone wrote and
// then orphaned by renaming what pointed at it.
const scenarioPath = join(ROOT, 'nremt', 'scenario-sim.html');
if (existsSync(scenarioPath)) {
  const src = readFileSync(scenarioPath, 'utf8');
  const ids = new Set([...src.matchAll(/^ {6}(s\d+_\w+):\s*\{/gm)].map((m) => m[1]));
  const targets = new Set([...src.matchAll(/next:\s*"(\w+)"/g)].map((m) => m[1]));
  const starts = new Set([...src.matchAll(/startNode:\s*"(\w+)"/g)].map((m) => m[1]));
  if (ids.size) {
    for (const t of [...targets, ...starts]) {
      if (!ids.has(t)) fail(`nremt/scenario-sim.html: a choice points at "${t}", which is not a node — that branch dead-ends.`);
    }
    for (const id of ids) {
      if (!targets.has(id) && !starts.has(id)) {
        fail(`nremt/scenario-sim.html: node "${id}" is unreachable — nothing points at it and it is no scenario's startNode.`);
      }
    }
  }
}

// ---- 14. No question may carry the previous question's answer options ----
// Five items had option sets that were lightly reworded copies of the item
// before them: a question about a diving injury whose four options were all
// about blood pressure, a question about the pediatric assessment triangle
// answered by "instability or grinding felt on gentle pressure". The stems and
// the explanations were correct and unrelated to the options, which is what
// made it invisible — the file parses, the ids are unique, the counts match,
// and nothing else here reads a question and its options together.
//
// The signal is deliberately narrow. Adjacent items legitimately share
// vocabulary (two musculoskeletal definitions drawing on sprain/strain/
// fracture/dislocation score high on any naive similarity measure and are
// both perfectly correct), so similarity alone produces false positives. What
// does not happen legitimately is an option set that is near-identical to the
// previous item's AND shares almost nothing with its own question stem.
const STOP = new Set(['the','a','an','of','to','in','is','and','or','for','with','which','that','best','following','what','how','when','should','patient','describes','appropriate','most','be','are','this','his','her','you','your','at','on','it','as','from','by','not','any','all','more','than','during','after','before']);
const words = (t) => new Set(String(t).toLowerCase().match(/[a-z]{3,}/g)?.filter((w) => !STOP.has(w)) ?? []);
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const w of a) if (b.has(w)) hit++;
  return hit / (a.size + b.size - hit);
};
if (Array.isArray(bank)) {
  for (let n = 1; n < bank.length; n++) {
    const prev = bank[n - 1], cur = bank[n];
    if (!Array.isArray(prev.options) || !Array.isArray(cur.options)) continue;
    if (prev.options.length !== cur.options.length) continue;
    const prevOpts = words(prev.options.join(' '));
    const curOpts = words(cur.options.join(' '));
    const curStem = words(`${cur.q} ${cur.explain ?? ''}`);
    // Options that look like the neighbour's, and unlike their own question.
    if (jaccard(prevOpts, curOpts) > 0.6 && jaccard(curOpts, curStem) < 0.12) {
      fail(`questions.json: question ${cur.id}'s options look like a copy of question ${prev.id}'s ` +
           `and share almost nothing with its own stem — the options were probably clobbered when this item was written.`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log(`OK — scanned ${htmlFiles.length} HTML files and ${jsonFiles.length} JSON files, no broken local references.`);
}
