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

    /* Every concept id credited here has to exist, because nothing else will
       ever say so. mastery-engine.js filters an unknown id out silently rather
       than warning, which is the right call at runtime — a typo should not
       break a lesson for a reader — but it means a misspelled concept is a
       step that quietly scores nothing, in a file whose entire purpose is to
       make steps score something. A browser pass noticed this; no check did.

       The ids are read out of concepts.js by pattern rather than by executing
       it, so this stays a text check like everything else in this file. */
    const conceptsPath = join(ROOT, 'ochem/assets/concepts.js');
    if (existsSync(conceptsPath)) {
      const conceptSrc = readFileSync(conceptsPath, 'utf8');
      const known = new Set(
        [...conceptSrc.matchAll(/\{\s*id:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]),
      );
      if (!known.size) {
        fail('ochem/assets/concepts.js: no concept ids parsed, so lesson-concepts.js cannot be checked');
      } else {
        /* A regex cannot find the end of a steps block reliably — the entries
           close as `] } },` on the last line, not on one of their own — so the
           braces are counted instead. */
        for (const start of src.matchAll(/'([a-z0-9-]+)':\s*\{\s*n:\s*\d+,\s*steps:\s*\{/g)) {
          const topic = start[1];
          let depth = 1;
          let i = start.index + start[0].length;
          for (; i < src.length && depth > 0; i++) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') depth--;
          }
          const block = src.slice(start.index + start[0].length, i - 1);
          for (const ref of block.matchAll(/'([a-z0-9-]+)'/g)) {
            if (!known.has(ref[1])) {
              fail(`lesson-concepts.js: "${topic}" credits the concept "${ref[1]}", which does not exist ` +
                   'in concepts.js. The mastery engine drops an unknown id without complaining, so that ' +
                   'step would score nothing and nobody would find out.');
            }
          }
        }
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
// until the content is rewritten. Tighten them as that work lands; never
// loosen one, because loosening is a decision to make the bank more guessable.
//
// "Tighten" is direction-dependent, and the sentence above used to say "lower",
// which is only right for half of these. A CEILING (hedgeCeiling) guards a tell
// that marks the RIGHT answer, so its measured value falls as the bank improves
// and the ceiling follows it down. A FLOOR (absoluteFloor, justifyFloor) guards
// a tell that marks the WRONG answer: the share of keyed items rises toward the
// 25% baseline as the work lands, so the floor follows it UP. Moving a floor
// down is the loosening, not the improvement.
// Below this many single-word-bearing items the rate is noise, not a tell.
const MIN_WORDING_SAMPLE = 30;

const WORDING_TELLS = [
  {
    label: 'an absolute word (always/never/only/must/immediately)',
    re: /\b(?:always|never|only|must|immediately)\b/i,
    threshold: 'absoluteFloor',
    // Given a far side once it reached chance, for the same reason the
    // justification row has one: the next domain rewritten would push it past
    // 25% and it would start marking keys instead.
    opposite: 'absoluteCeiling',
    direction: 'marks-wrong',
    advice: 'Rewrite the strawman distractors so that being absolute is not what makes them wrong.',
  },
  {
    label: 'a hedge ("per protocol"/"as appropriate"/"generally")',
    re: /(?:per protocol|as appropriate|generally)/i,
    threshold: 'hedgeCeiling',
    // Given a far side once it went past chance, for the same reason the other
    // two rows have one: a bound that only tightens is wrong for a number that
    // has arrived and kept going.
    opposite: 'hedgeFloor',
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
    // The only row with a far side so far, because it is the only one that has
    // reached chance and kept going. See the overshoot check below.
    opposite: 'justifyCeiling',
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
    // 54% when this was first guarded, 32% after the first editorial pass, and
    // 24.8% now — at chance, which is where it stops being information. The
    // last two points came from the other side of the same problem: 135 keys
    // ran 20 to 140 characters longer than every distractor beside them,
    // because they carried parenthetical explanation that belongs in the
    // explain field. Trimming them shortens the key AND improves the item, so
    // the tell closed without a single distractor being padded to close it.
    lengthCeiling: 0.25,
    trueFalseCeiling: null,
    // Measured 6.6% and 42.9% when the wording tells were first guarded.
    // Tightened as domains are rewritten: 0.06 at the start, then 0.065
    // (Cardiac, 6.2% -> 6.8%), 0.07 (Medical, -> 7.3%), 0.075 (Geriatrics,
    // -> 7.9%), 0.08 (Secondary Assessment, -> 8.5%), 0.09 (Musculoskeletal
    // & Burns, -> 9.3%), 0.10 (Obstetrics, -> 10.2%), 0.11 (Scene Safety,
    // -> 11.2%), 0.125 (Bleeding & Shock, -> 12.7%), 0.14 (Pediatrics,
    // -> 14.1%), 0.145 (Legal & Ethical, -> 14.9%), 0.17 (Trauma Systems,
    // -> 17.4%), 0.195 (Incident Management, -> 19.9%), 0.225 (Head, Chest
    // & Abdominal Trauma, -> 23.4%), which is the target reached.
    //
    // One false positive worth knowing about: the word boundary in \bonly\b
    // matches inside a hyphenated compound, so "an EMS-only response" reads as
    // an absolute-worded option when it is just a term of art. One item hit
    // this and was reworded rather than left to trip the check forever. If
    // more turn up, the pattern needs a lookbehind for a hyphen rather than
    // more rewording.
    // See 5(g) below before trusting this number. It is an AVERAGE, and at
    // 22.7% it looks all but closed while "entirely" inside it was 0 for 83
    // and "only" is still 13.3%. The group row stays because it is the
    // historical ratchet; the per-word rows are what actually see the bank.
    // It has crossed. Fourteen keys that were genuinely absolute — enter only
    // after the structure is cleared, always glove before contact, an EMT
    // MUST report suspected abuse — now say so, which is the decision recorded
    // in TRACKER as "balance this only with keys that are genuinely absolute".
    // That took the group from 22.7% to 27.1%, past the baseline, so the
    // ceiling is what guards it now and the floor sits just under chance.
    //
    // The first attempt overshot: six of those keys said "never", which took
    // that one word from 26% to 44% and built a new tell pointing the other
    // way. Three cord-prolapse keys carrying the identical phrase was a
    // pattern of its own besides. Half were reworded to "only" or "must not",
    // which is equally true and spreads the load — see 5(g).
    absoluteFloor: 0.235,
    absoluteCeiling: 0.30,
    // NOT tightened, and the reason is worth reading before the next domain.
    // This is the one tell here that marks the RIGHT answer, so it behaves
    // backwards from the other two: taking a hedge OUT OF A DISTRACTOR shrinks
    // the denominator while the keyed count stays put, which pushes the share
    // UP. The Medical pass removed seven distractor hedges as a side effect of
    // fixing absolute and justification tells in the same options, and the
    // share went 41.0% -> 42.2% — still inside the ceiling, but the wrong way.
    // For this tell the work is in the KEYS: a correct answer that needs "per
    // protocol" to be defensible is usually just a vaguer correct answer.
    //
    // Geriatrics followed that rule — two padded keys committed to definite
    // answers, no distractor hedges touched — and the share fell to 40.9%,
    // which is the first real movement this number has made. Tightened to
    // match, and again to 0.40 after Musculoskeletal & Burns (-> 39.5%),
    // where three keys kept their "per protocol" because repositioning a
    // limb to restore a pulse genuinely is protocol-gated, and 0.37 after
    // Obstetrics (-> 36.6%), 0.35 after Scene Safety (-> 34.2%), 0.315
    // after Bleeding & Shock (-> 30.7%), 0.295 after Pediatrics (-> 28.8%),
    // 0.28 after Legal & Ethical (-> 26.8%), which is within one standard
    // error of the 25% baseline. This tell is effectively closed too, and at
    // 25.7% after Trauma Systems it is sitting on the baseline. Not tightened
    // further: squeezing it below 25% would turn it into a tell pointing the
    // other way, which is the mistake the justification row just made.
    //
    // It has now crossed. Rewriting 38 keys that hedged at "appropriate" and
    // five that padded with "per protocol" took this to 15.6% on 64 items,
    // about 1.7 standard errors BELOW the baseline — so the ceiling comes down
    // to match and the row gains a far side, the same treatment the
    // justification row needed for the same reason in the opposite direction.
    // For this tell the remaining work, if any, is putting a hedge back into a
    // distractor, never taking one out.
    hedgeCeiling: 0.16,
    hedgeFloor: 0.15,
    // Measured 17.1% on the single-clause case against a 25% baseline.
    // 16.9% at the start, then 17.4% (Cardiac), 18.0% (Medical),
    // 18.5% (Geriatrics), 19.5% (Secondary Assessment),
    // 20.1% (Musculoskeletal & Burns), 21.2% (Obstetrics),
    // 22.1% (Scene Safety), 22.9% (Bleeding & Shock), 24.2% (Pediatrics),
    // 26.9% (Legal & Ethical), 29.9% (Trauma Systems).
    //
    // It kept climbing, exactly as the previous commit warned it might, so it
    // now has a bound on both sides. The mechanism is the same one that bit
    // the hedge row in reverse: taking a justification clause out of a
    // DISTRACTOR shrinks the denominator and leaves the keyed count alone, so
    // the share rises — useful while the tell marks distractors, and harmful
    // once it is past chance. 29.9% on 107 items is about 1.2 standard errors
    // above 25%, so it is not yet a tell; the ceiling is set where it would
    // start to be one.
    //
    // For the remaining domains: leave justification clauses in distractors
    // alone, and take them out of keys if this needs to come back down.
    // 28.4% now. The floor follows it up.
    justifyFloor: 0.28,
    justifyCeiling: 0.34,
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
    // Was 0.4, measured 37.7% at index 0. The six topics added with the
    // nomenclature chapter were authored with the key position cycled, which
    // pulled the whole bank to 26.4% — near the 25% chance for a four-option
    // item. Ratcheted down to match, with a little headroom.
    positionCeiling: 0.3,
    // 68% when the check was first pointed here, then down in steps as each
    // new chapter was authored with the reasoning kept in `why` rather than in
    // the keyed option: 60.2%, 56.5%, 54.6%, 54.1%, 51.2% with Biomolecules.
    // A pass over the whole bank then trimmed 638 keys that ran longer than
    // every distractor beside them, and took it to 22.3%. Not one distractor
    // was padded: every fix shortened a key, which improves the item as well
    // as closing the tell, and the trimming was allocated per topic so no
    // single topic sits far above the whole — the worst is 28%.
    lengthCeiling: 0.28,
    // The other side of the same tell, and the reason the pass stopped where
    // it did rather than trimming every key it could. 1,026 usable trims were
    // available; applying all of them would have put the bank near 10%, and a
    // bank where the longest option is almost never the answer is as
    // exploitable as one where it usually is — a student can eliminate a
    // distractor by picking the long one. Chance for a four-option item is
    // 25%, so the target is chance, from either direction. The floor is set
    // well below the current 22.3% because the newest chapters are written
    // with short keys by habit and sit at 0-3% on their own.
    lengthFloor: 0.12,
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
    const chance = Math.round(100 / (mc.reduce((a, q) => a + q.options.length, 0) / mc.length));
    if (tell > spec.lengthCeiling) {
      fail(`${spec.label}: the longest option is the answer in ${(tell * 100).toFixed(0)}% of items ` +
           `(${longestIsKey}/${mc.length}), over the ${(spec.lengthCeiling * 100).toFixed(0)}% ceiling. ` +
           `Trim over-long keys — chance is ~${chance}%.`);
    }
    // Both directions are information. A bank where the longest option is
    // almost never the key hands the student a way to eliminate one option,
    // and the usual cause is an over-enthusiastic trimming pass rather than
    // anything about the chemistry. Only checked where a floor is declared.
    if (spec.lengthFloor != null && tell < spec.lengthFloor) {
      fail(`${spec.label}: the longest option is the answer in only ${(tell * 100).toFixed(0)}% of items ` +
           `(${longestIsKey}/${mc.length}), under the ${(spec.lengthFloor * 100).toFixed(0)}% floor. ` +
           `That is a tell in the other direction — chance is ~${chance}%. ` +
           `Stop trimming keys; the target is chance, not zero.`);
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

      /* The far side. A tell that has been driven all the way to chance can
         keep going and become a tell again pointing the other way, and a
         single bound cannot see that coming. The justification clause did
         exactly this: 16.9% when it was marking distractors, then past the
         25% baseline to 29.9% as the clauses came out of distractor after
         distractor. Only rows that declare `opposite` are checked here,
         because a tell still far from chance does not need a far side. */
      const far = probe.opposite ? spec[probe.opposite] : undefined;
      if (far !== undefined && far !== null) {
        const overshot = probe.direction === 'marks-wrong' ? share > far : share < far;
        if (overshot) {
          fail(`${spec.label}: on ${n} items exactly one option contains ${probe.label}, ` +
               `and the key was that option ${(share * 100).toFixed(1)}% of the time ` +
               `(${keyed}/${n}) against a ${(chance * 100).toFixed(0)}% baseline — ` +
               `past chance and outside the ${(far * 100).toFixed(0)}% bound on the far side. ` +
               (probe.direction === 'marks-wrong'
                 ? `It has stopped marking distractors and started marking keys. ` +
                   `Stop taking these out of distractors; take them out of keys instead.`
                 : `It has stopped marking keys and started marking distractors. ` +
                   `Stop taking these out of keys; put one back into a distractor instead.`));
        }
      }
    }
  }
}

// ---- 5(g). The same tells again, one word at a time ----
// The grouped rows above read 22.7% absolute and 15.6% hedge, both close
// enough to a 25% baseline to look finished. They were an average hiding two
// perfect giveaways:
//
//   entirely     0 / 83   a student eliminating any option containing it was
//                         right every single time, on 83 questions
//   appropriate 38 / 43   picking the option containing it was right 88% of
//                         the time, on 43
//   completely   1 / 71      all       8 / 191      regardless   5 / 79
//   per protocol 11 / 12     only     14 / 105
//
// The average survived because `immediately` (30.3%) and `never` (22.2%) sat
// the other side of chance and cancelled the rest out. A grouped measurement
// cannot see that, so each word is now measured on its own.
//
// Thresholds follow the ratchet convention used everywhere else here: they sit
// at the bank's MEASURED state, so the number cannot get worse while the
// editorial work continues, and they move toward 25% as it lands. A floor
// guards a word that marks wrong answers and rises; a ceiling guards a word
// that marks right answers and falls. Never move one the other way.
//
// A word below MIN_WORDING_SAMPLE items is not asserted on — the rate is noise
// at that size — but its threshold is still recorded, so that reintroducing
// thirty of them fails the build rather than passing it quietly.
const PER_WORD_TELLS = [
  // Marks WRONG answers: the word appears in strawman distractors.
  { word: 'entirely',     re: /\bentirely\b/i,     direction: 'marks-wrong', floor: 0.20,
    note: 'was 0/83; the distractors it padded were rewritten, leaving 3 where it does real work' },
  { word: 'completely',   re: /\bcompletely\b/i,   direction: 'marks-wrong', floor: 0.12,
    note: 'was 1/71, now 6/48 — unlike "entirely" this word usually describes something real, so only the padding came out and five keys that are genuinely complete now say so' },
  { word: 'all',          re: /\ball\b/i,          direction: 'marks-wrong', floor: 0.06,
    note: 'was 8/191, now 8/131 — 96 options carried the bare intensifier "at all", which is padding wherever it appears' },
  { word: 'regardless',   re: /\bregardless\b/i,   direction: 'marks-wrong', floor: 0.10,
    note: 'was 5/79, now 7/70 — "regardless of X" is usually the substance of a wrong option, so only a template tail bolted onto nine distractors came out' },
  { word: 'only',         re: /\bonly\b/i,         direction: 'marks-wrong', floor: 0.16,
    note: '14/105 before the absolute-key pass, 17/106 after. Still the strongest single-word tell in the bank' },
  { word: 'always',       re: /\balways\b/i,       direction: 'marks-wrong', floor: 0.13,
    note: '2/27 before, 4/29 after. Under the sample floor, so recorded rather than asserted' },
  { word: 'must',         re: /\bmust\b/i,         direction: 'marks-wrong', floor: 0.23,
    note: '3/22 before, 6/25 after — mandatory-reporting and treat-as-arrest keys saying what they mean' },
  // The only row here that marks RIGHT answers, and it does so because of this
  // session's own edits: putting "never" into six keys at once took it from
  // 26% to 44%. Half were reworded away and it sits at 33% on 21 items, under
  // the sample floor. The ceiling is where it would start being a giveaway.
  { word: 'never',        re: /\bnever\b/i,        direction: 'marks-right', ceiling: 0.34,
    advice: 'Say the same thing with "only" or "must not" where that is equally true, or leave the key as it was. ' +
            'An absolute word marking KEYS is the same free rule as one marking distractors, pointing the other way.',
    note: 'watch this one: it is the word an absolute-key pass reaches for first' },
  // Marks RIGHT answers: the word appears in keys, where it hedges.
  { word: 'appropriate',  re: /\bappropriate\b/i,  direction: 'marks-right', ceiling: 0.30,
    note: 'was 38/43. "appropriate warning devices", "appropriate channels", "appropriate resources" — filler that made a key unfalsifiable. Every one now names the thing' },
  { word: 'per protocol', re: /per protocol/i,     direction: 'marks-right', ceiling: 0.30,
    note: 'was 11/12. Kept only where protocols genuinely differ, which is the four statements TRACKER records as protocol-dependent' },
];

if (bank) {
  const mc = bank.filter((q) => !q.type || q.type === 'mc');
  for (const probe of PER_WORD_TELLS) {
    let n = 0, keyed = 0, chanceSum = 0;
    for (const q of mc) {
      if (!Array.isArray(q.options)) continue;
      const hits = q.options.reduce((a, o, i) => (probe.re.test(String(o)) ? a.concat(i) : a), []);
      if (hits.length !== 1) continue;
      n++;
      chanceSum += 1 / q.options.length;
      if (hits[0] === q.correct) keyed++;
    }
    if (n < MIN_WORDING_SAMPLE) continue;
    const share = keyed / n;
    const chance = chanceSum / n;
    const bound = probe.direction === 'marks-wrong' ? probe.floor : probe.ceiling;
    const off = probe.direction === 'marks-wrong' ? share < bound : share > bound;
    if (off) {
      fail(`questions.json: on ${n} items exactly one option contains "${probe.word}", and the key was ` +
           `that option ${(share * 100).toFixed(1)}% of the time (${keyed}/${n}) against a ` +
           `${(chance * 100).toFixed(0)}% baseline — ` +
           (probe.direction === 'marks-wrong'
             ? `under the ${(bound * 100).toFixed(0)}% floor, so the word marks distractors. ` +
               `Rewrite the strawmen so that being absolute is not what makes them wrong, or let a key ` +
               `that is genuinely absolute say so.`
             : `over the ${(bound * 100).toFixed(0)}% ceiling, so the word marks keys. ` +
               (probe.advice || 'Name the thing instead of hedging at it.')));
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
  /* A "topic" in the marketing sense is one a student can actually work
     through — "62 topics and 10 mechanisms you perform yourself". That is not
     the same as the number of entries in the curriculum, because a topic whose
     lesson has not been built yet still has an href: it points at its written
     notes so it is never a dead link, and carries notesOnly: true to say so.
     Counting those as topics would advertise lessons that do not exist, so the
     count here is of topics with a LESSON, which is what hasLesson means in
     curriculum.js and what scripts/check-curriculum.mjs enforces the shape of. */
  const entries = [...src.matchAll(/href:\s*'([^']+)'((?:\s*,\s*[a-zA-Z]+:\s*[^,}]+)*)/g)]
    .map(m => ({ href: m[1], notesOnly: /notesOnly:\s*true/.test(m[2]) }));
  const hrefs = entries.filter(e => !e.notesOnly).map(e => e.href);
  const topics = hrefs.length;
  const lessons = hrefs.filter(h => h.startsWith('lessons/')).length;
  const mechanismsDir = join(ROOT, 'ochem', 'mechanisms');
  const mechanisms = existsSync(mechanismsDir) ? readdirSync(mechanismsDir).filter(f => f.endsWith('.html')).length : 0;
  // "sections" is the written half, counted separately from "topics" because
  // they are not the same number: every topic has a written section, including
  // the ones whose interactive lesson is still being built.
  const notesCount = existsSync(join(ROOT, 'ochem', 'notes'))
    ? readdirSync(join(ROOT, 'ochem', 'notes')).filter((f) => f.endsWith('.html')).length
    : 0;
  const expected = { topics, lessons, mechanisms, sections: notesCount };
  const OCHEM_COUNT_RE = /\b(\d{1,3})\s+(?:interactive\s+|chemistry\s+|note\s+|textbook\s+)?(topics|lessons|mechanisms|sections)\b/g;
  /* The assistant's greeting ("all 62 textbook sections are indexed") is the
     same kind of claim as the ones on the pages, and drifted the same way —
     it sat at 62 while the textbook had 64. It lives in a string in a script,
     so the HTML sweep never saw it. */
  const countFiles = [...htmlFiles, join(ROOT, 'assets', 'tutor.js')].filter(f => existsSync(f));
  for (const file of countFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel.startsWith('ochem/notes/')) continue;
    // The changelog is a dated record, not a claim about now. "audited across
    // all 62 sections" under a September date was true in September, and
    // rewriting it to today's number would make the entry a lie about what
    // that release actually covered.
    if (rel === 'changelog.html') continue;
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

  // Reachable from the start is only half of it: a node also has to be able to
  // reach an ending. A branch that loops back on itself forever, or a chain
  // that runs into a node someone forgot to give an ending, leaves the reader
  // stuck in a call that never resolves — which looks like a broken page
  // rather than a wrong answer. Walk the graph backwards from every ending and
  // anything not visited cannot finish.
  //
  // This parses the literal rather than eval'ing it, for the same reason the
  // checks above do: the file is a page, not a module.
  const endingIds = new Set([...src.matchAll(/^ {6}(s\d+_\w+):\s*\{\s*ending:/gm)].map((m) => m[1]));
  if (endingIds.size) {
    // edges: node -> [targets]. Slice between node headers rather than trying
    // to match a node's closing brace: an ending node is written on one line
    // and has no brace of its own at that indent, so a brace-matching pattern
    // runs past it and swallows the headers that follow.
    const edges = new Map();
    const headers = [...src.matchAll(/^ {6}(s\d+_\w+):\s*\{/gm)];
    headers.forEach((h, n) => {
      const body = src.slice(h.index, n + 1 < headers.length ? headers[n + 1].index : h.index + 4000);
      edges.set(h[1], [...body.matchAll(/next:\s*"(\w+)"/g)].map((m) => m[1]));
    });
    const reverse = new Map();
    for (const [id, outs] of edges) {
      for (const t of outs) {
        if (!reverse.has(t)) reverse.set(t, []);
        reverse.get(t).push(id);
      }
    }
    const canFinish = new Set(endingIds);
    const queue = [...endingIds];
    while (queue.length) {
      for (const from of reverse.get(queue.pop()) ?? []) {
        if (!canFinish.has(from)) { canFinish.add(from); queue.push(from); }
      }
    }
    for (const id of edges.keys()) {
      if (!canFinish.has(id)) {
        fail(`nremt/scenario-sim.html: node "${id}" cannot reach any ending — every path out of it loops or dead-ends, ` +
             `so a reader who gets there can never finish the scenario.`);
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

// ---- 15. Flow-diagram branches must not imply both arms continue ----
// Every branch on flowcharts.html used to be two bare columns followed by a
// shared down-arrow. Drawn that way, the diagram says both arms lead to the
// next box — so the mild-obstruction arm appeared to flow into abdominal
// thrusts, and the mild-allergy arm into epinephrine. Both are the opposite of
// the teaching.
//
// The convention now is that every arm ends in either a terminal box (it stops
// there) or a rejoin marker (it carries on to the next step), and no arrow
// follows a branch. This checks all three, plus the two structural things
// flow-drill.js needs to build its quiz from the same markup: each arm must
// carry a .branch-label and a .flow-box.
const flowPath = join(ROOT, 'nremt', 'flowcharts.html');
if (existsSync(flowPath)) {
  const html = readFileSync(flowPath, 'utf8');

  if (/<\/div>\s*<\/div>\s*<div class="flow-arrow">/.test(html)) {
    fail('nremt/flowcharts.html: a flow-arrow follows a branch, which draws both arms as leading to the next step. ' +
         'End each arm in a terminal box or a rejoin marker instead.');
  }

  const branches = [...html.matchAll(/<div class="flow-branch">([\s\S]*?)\n    <\/div>/g)];
  if (!branches.length) {
    fail('nremt/flowcharts.html: no flow branches found — the diagram markup or this check has drifted.');
  }
  branches.forEach((branch, n) => {
    const arms = branch[1].split(/\n      <div>\n/).slice(1);
    if (arms.length < 2) {
      fail(`nremt/flowcharts.html: branch ${n + 1} has fewer than two arms.`);
      return;
    }
    arms.forEach((arm, i) => {
      const where = `branch ${n + 1}, arm ${i + 1}`;
      if (!arm.includes('branch-label')) fail(`nremt/flowcharts.html: ${where} has no .branch-label — flow-drill.js will skip it.`);
      if (!arm.includes('flow-box')) fail(`nremt/flowcharts.html: ${where} has no .flow-box — flow-drill.js will skip it.`);
      if (!arm.includes('flow-box terminal') && !arm.includes('flow-rejoin')) {
        fail(`nremt/flowcharts.html: ${where} neither ends in a terminal box nor carries a rejoin marker, ` +
             `so a reader cannot tell whether that path stops or continues.`);
      }
    });
  });
}

// ---- 16. Every content table must sit inside a horizontal-scroll wrapper ----
// A <table> with four columns of clinical text is wider than a phone. Without
// a scrolling wrapper it does not shrink politely — it widens the whole page,
// and every other element on it scrolls sideways with the table.
//
// The site has four wrappers that do this job, one per area's stylesheet, and
// before this check every table on the site was inside one of them purely by
// habit. The four tables added to study-notes.html with the chapter expansion
// were not, which is how the habit got written down as a rule.
//
// Email templates are exempt: those tables ARE the layout, which is how HTML
// email has to be built, and they are never rendered in a browser viewport.
const SCROLL_WRAPPERS = ['table-wrap', 'table-scroll', 'notes-table-wrap', 'ttable-scroll'];
for (const file of htmlFiles) {
  const rel = relative(ROOT, file);
  if (rel.split(sep).includes('email')) continue;
  const html = readFileSync(file, 'utf8');
  let from = 0;
  for (;;) {
    const at = html.indexOf('<table', from);
    if (at === -1) break;
    from = at + 6;
    // The wrapper does not have to be the table's immediate parent — on the
    // ochem notes a full <figure> sits between the two — so find the last
    // wrapper opened before this table and confirm it is still open, by
    // counting div tags in between rather than by looking at what is adjacent.
    const before = html.slice(0, at);
    let wrapAt = -1;
    for (const w of SCROLL_WRAPPERS) {
      const re = new RegExp(`<div[^>]*class="[^"]*\\b${w}\\b[^"]*"[^>]*>`, 'g');
      for (let m; (m = re.exec(before)); ) wrapAt = Math.max(wrapAt, m.index);
    }
    const between = wrapAt === -1 ? '' : before.slice(wrapAt);
    const stillOpen = wrapAt !== -1 &&
      (between.match(/<div\b/g) || []).length > (between.match(/<\/div>/g) || []).length;
    if (!stillOpen) {
      const line = html.slice(0, at).split('\n').length;
      fail(`${rel}:${line}: a <table> is not inside a scrolling wrapper. Wrap it in a div with one of: ` +
           `${SCROLL_WRAPPERS.join(', ')} — otherwise a wide table scrolls the whole page sideways on a phone.`);
      break; // one report per file is enough to act on
    }
  }
}

// ---- 17. Figures that appear on more than one page must agree ----
// Writing the airway chapter turned up two numbers the site was stating two
// different ways: a single adult suction attempt was 15 seconds on the sound
// trainer and in four keyed questions but 10 seconds in the new chapter, and
// the non-rebreather was 12-15 L/min on the skill sheets and 10-15 L/min in
// the new chapter. A student who reads both pages cannot tell which to answer
// with, and neither can a reviewer.
//
// This is not a general fact-checker and cannot be one. It is a short list of
// figures that are repeated across pages, each with the value this site
// teaches; anything matching the pattern and disagreeing is a drift. Add a row
// when a number starts appearing in a second place, not for every number.
const CANONICAL_FIGURES = [
  {
    what: 'nasal cannula flow rate',
    expect: '1-6 L/min',
    re: /nasal cannula(?:[^.<]|<\/?[a-z]+>){0,70}?(\d+)\s*(?:&ndash;|[-–—]|to)\s*(\d+)\s*(?:L\/min|liters per minute)/gi,
  },
  {
    what: 'non-rebreather flow rate',
    expect: '10-15 L/min',
    re: /non-?rebreather(?:[^.<]|<\/?[a-z]+>){0,70}?(\d+)\s*(?:&ndash;|[-–—]|to)\s*(\d+)\s*(?:L\/min|liters per minute)/gi,
  },
  {
    what: 'longest single adult suction attempt',
    expect: '15 seconds',
    // Only the phrasings that state a ceiling for an adult, so the shorter
    // pediatric figure and the "suction then ventilate" prose do not match.
    re: /(?:no (?:more|longer) than|limit(?:ed)? to|maximum(?:[^.<]|<\/?[a-z]+>){0,20}?of)\s*(?:about\s*|approximately\s*)?(\d+)\s*seconds(?:[^.<]|<\/?[a-z]+>){0,60}?(?:in an adult|adult)|adult(?:[^.<]|<\/?[a-z]+>){0,60}?(?:no (?:more|longer) than|limit(?:ed)? to)\s*(?:about\s*)?(\d+)\s*seconds/gi,
  },
];
for (const fig of CANONICAL_FIGURES) {
  const seen = new Map(); // value -> [where]
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file);
    if (rel.split(sep).includes('email')) continue;
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(fig.re)) {
      const nums = m.slice(1).filter(Boolean);
      const value = nums.length === 2 ? `${nums[0]}-${nums[1]} L/min` : `${nums[0]} seconds`;
      if (!seen.has(value)) seen.set(value, []);
      if (!seen.get(value).includes(rel)) seen.get(value).push(rel);
    }
  }
  for (const [value, where] of seen) {
    if (value !== fig.expect) {
      fail(`${where.join(', ')}: states the ${fig.what} as ${value}, but this site teaches ${fig.expect}. ` +
           `Make them agree, or change the expected value in check-site.mjs if the site's teaching has changed.`);
    }
  }
}

// ---- 18. The advertised scenario count matches scenario-sim.html ----
// Same failure mode as the question counts in section 6, one page over: the
// NREMT hub said "eight branching scenarios" while the file held eighteen.
// It is written as a word rather than a numeral, so section 6's pattern — and
// any search for a digit — walks straight past it.
const NUMBER_WORDS = {
  four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, 'twenty-five': 25,
  'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24,
};
if (existsSync(scenarioPath)) {
  const scenarioCount = [...readFileSync(scenarioPath, 'utf8').matchAll(/^ {4}id:\s*"s\d+"/gm)].length;
  if (scenarioCount) {
    const re = new RegExp(`\\b(\\d{1,3}|${Object.keys(NUMBER_WORDS).join('|')})\\s+(?:branching\\s+)?(?:clinical\\s+)?scenarios\\b`, 'gi');
    for (const file of [...htmlFiles, join(ROOT, 'README.md')]) {
      if (!existsSync(file)) continue;
      const rel = relative(ROOT, file);
      if (rel === relative(ROOT, scenarioPath)) continue;
      for (const m of readFileSync(file, 'utf8').matchAll(re)) {
        const word = m[1].toLowerCase();
        const claimed = NUMBER_WORDS[word] ?? Number(word);
        if (Number.isFinite(claimed) && claimed !== scenarioCount) {
          fail(`${rel}: advertises ${m[1]} scenarios, but scenario-sim.html has ${scenarioCount}.`);
        }
      }
    }
  }
}

// ---- 19. Every lesson and mechanism links to its written section ----
// A lesson page is a step machine: with JavaScript off it renders a heading
// and nothing else. The prose for that topic does exist, as its own page
// under ochem/notes/, and before this check nothing static pointed at it —
// so a reader without JavaScript, and a crawler that does not run scripts,
// landed on a lesson and found a dead end with no way to the words.
//
// The link lives in the page's .lesson-links nav, which is static HTML, and
// it must be in the body: an earlier pass at this inserted six of them into
// <head>, where they are valid, invisible and useless.
for (const dir of ['lessons', 'mechanisms']) {
  const dirPath = join(ROOT, 'ochem', dir);
  if (!existsSync(dirPath)) continue;
  for (const name of readdirSync(dirPath)) {
    if (!name.endsWith('.html')) continue;
    const rel = `ochem/${dir}/${name}`;
    const html = readFileSync(join(dirPath, name), 'utf8');
    const m = html.match(/<a href="\.\.\/notes\/([a-z0-9-]+)\.html"/);
    if (!m) {
      fail(`${rel}: nothing static links to the written section for this topic, so with JavaScript off the page is a dead end.`);
      continue;
    }
    if (!existsSync(join(ROOT, 'ochem', 'notes', `${m[1]}.html`))) {
      fail(`${rel}: links to ochem/notes/${m[1]}.html, which does not exist.`);
    }
    const headEnd = html.indexOf('</head>');
    if (headEnd !== -1 && html.indexOf('<nav class="lesson-links') < headEnd) {
      fail(`${rel}: the .lesson-links nav is inside <head>, where it renders for nobody.`);
    }
  }
}

// ---- 21. A textbook section must not explain the same thing twice ----
// A section that says a thing in a paragraph, then again in a callout, then
// again in the figure caption beside them costs the reader three passes to
// learn one idea, and it is easy to do by accident because each block is
// written at a different time.
//
// Two things this check is deliberately NOT:
//
// It is not a ban on a caption restating the body. A figure caption has to
// make sense to somebody who only looks at the picture, so some echo is the
// design working. The measured ceiling below sits above every legitimate
// echo in the book and below the two near-verbatim repeats that were cut
// when it was written.
//
// It is not a ban on parallel construction. "For oxygen: 3 bonds means +1"
// beside "For nitrogen: 4 bonds means +1" scores 0.64 and is the whole point
// of the passage — the pattern IS the teaching.
//
// The trap worth recording: a <figure> can sit INSIDE a .notes-example, so
// pulling captions and callouts independently counts that caption's
// sentences twice and compares them with themselves. The first version of
// this reported 128 perfect duplicates, every one of them a sentence matched
// against itself. Strip figures before reading the callouts.
const PROSE_ECHO_CEILING = 0.72;   // measured max 0.688. Lower it, never raise it.
const notesDir = join(ROOT, 'ochem', 'notes');
if (existsSync(notesDir)) {
  const words = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const overlap = (a, b) => {
    const A = new Set(a), B = new Set(b);
    let i = 0;
    for (const w of A) if (B.has(w)) i++;
    return i / (A.size + B.size - i);
  };
  for (const name of readdirSync(notesDir)) {
    if (!name.endsWith('.html')) continue;
    const html = readFileSync(join(notesDir, name), 'utf8');
    const prose = html.slice(html.indexOf('<!-- notes:start -->'), html.indexOf('<!-- notes:end -->'));
    if (!prose) continue;
    const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    const units = [];
    const seen = new Set();
    const add = (kind, block) => {
      for (const sentence of text(block).split(/(?<=[.!?])\s+/)) {
        const w = words(sentence);
        if (w.length < 8) continue;
        const key = w.join(' ');
        if (seen.has(key)) continue;   // the nesting guard, belt and braces
        seen.add(key);
        units.push({ kind, sentence, w });
      }
    };
    for (const m of prose.matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/g)) add('caption', m[1]);
    const noFigures = prose.replace(/<figure[\s\S]*?<\/figure>/g, ' ');
    for (const m of noFigures.matchAll(/<div class="(?:notes-fact|notes-pitfall|explain-box|notes-example)"[^>]*>([\s\S]*?)<\/div>/g)) add('callout', m[1]);
    for (const m of noFigures.matchAll(/<p class="step-body"[^>]*>([\s\S]*?)<\/p>/g)) add('body', m[1]);

    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const score = overlap(units[i].w, units[j].w);
        if (score > PROSE_ECHO_CEILING) {
          fail(`ochem/notes/${name}: a ${units[i].kind} and a ${units[j].kind} say nearly the same thing ` +
               `(${score.toFixed(2)} word overlap). Cut one, or make one of them add something.\n` +
               `    ${units[i].sentence.slice(0, 110)}\n    ${units[j].sentence.slice(0, 110)}`);
        }
      }
    }
  }
}

// ---- 22. A page with a footer link row must reach the Terms of Use ----
// terms.html carries the medical disclaimer: this is study material, not
// medical advice, and your own protocols govern. A disclaimer nobody can find
// is decoration, so every page that has a footer link row has to link it.
//
// Pages with no footer at all are not in scope and cannot be: the thirteen
// root-level redirect stubs are a meta-refresh and nothing else, and the ochem
// lessons and mechanisms have never had a footer. That second gap is real but
// it is a layout gap rather than a missing link, and it is recorded in
// TRACKER.md instead of being papered over by a check that would pass.
for (const file of htmlFiles) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const html = readFileSync(file, 'utf8');
  if (!html.includes('class="privacy-link"')) continue;
  if (!/href="(?:\.\.\/)*terms\.html"/.test(html)) {
    fail(`${rel}: has a footer link row but does not link terms.html, so the medical disclaimer is unreachable from this page.`);
  }
}

// ---- 23. Superseded resuscitation guidance cannot come back ----
// The 2025 AHA Guidelines for CPR and ECC changed two things this site had
// taught, in prose, in flowcharts, in a scenario and in nineteen bank items:
//
//   * Adults and children with a severe foreign-body airway obstruction now get
//     cycles of 5 back blows and 5 abdominal thrusts. It was abdominal thrusts
//     alone. (A cohort of 709 patients: back blows relieved more obstructions,
//     with fewer injuries. Part 7, Adult BLS; Part 6, Pediatric BLS.)
//   * Infant chest thrusts and infant chest compressions are delivered with the
//     heel of one hand or two thumbs encircling. The two-finger technique was
//     eliminated for failing to reach adequate depth. (Part 6.)
//
// Guidance that has been superseded once comes back the way it left: somebody
// writes a new question from an old textbook, or copies a neighbouring item.
// So this reads every block of prose the site can show a learner and fails on a
// unit that PRESCRIBES the old thing.
//
// Prescribes, not mentions. The distinction is the whole design. A unit saying
// "abdominal thrusts can injure the liver, spleen or stomach" is aftercare, and
// an early draft of this check failed it. A unit saying "the heel of one hand,
// not two fingers" is teaching the change and must stay legal, or the check
// would forbid the very sentences that fixed the site. Hence: the trigger wants
// an imperative verb or a "... until/repeated", and any unit that negates or
// historicizes what it names is exempt.
//
// Distractors are deliberately out of scope. A wrong answer is allowed — is
// often required — to state the superseded technique; that is what makes it
// wrong. Only the stem, the keyed option(s) and the explanation are scanned.
const GUIDANCE_RULES = [
  {
    label: 'abdominal thrusts as the whole choking sequence',
    prescribes: (t) =>
      /\b(?:deliver|perform|give|begin|start|use|apply|escalate to|proceed to|repeat)\b[^.;]{0,60}(?:abdominal thrusts?|Heimlich)/i.test(t)
      || /(?:abdominal thrusts?|Heimlich)[^.;]{0,60}\b(?:until|repeated|repeatedly)\b/i.test(t)
      || /^\s*abdominal thrusts\b/i.test(t),
    topic: /chok|obstruct|foreign.?body|FBAO|Heimlich/i,
    ok: (t) => /back blow|back slap/i.test(t),
    exempt: /\bnot\b|\bnever\b|no longer|no place|used to|previously|thrusts alone|abdominal-thrusts-only|outdated|rather than|instead of|do(?:es)? nothing/i,
    why: 'The 2025 AHA sequence for an adult or child is 5 back blows THEN 5 abdominal thrusts, repeated. Add the back blows, or say explicitly that thrusts alone is the superseded guidance.',
  },
  {
    label: 'the two-finger technique for an infant',
    prescribes: (t) => /\btwo[- ]fingers?\b|\b2 fingers\b/i.test(t),
    topic: /\binfants?\b|\bsternum\b|chest thrust|chest compression/i,
    ok: () => false,
    exempt: /\bnot\b|\bnever\b|no longer|eliminat|replaced|dropped|used to|previously|older|instead of|rather than|did not/i,
    why: 'The 2025 AHA guidelines eliminated the two-finger technique for infants: it did not reach adequate depth. Use the heel of one hand, or two thumbs encircling the chest.',
  },
  {
    label: 'abdominal thrusts on an infant',
    prescribes: (t) =>
      /\b(?:deliver|perform|give|begin|start|use|apply)\b[^.;]{0,60}(?:abdominal thrusts?|Heimlich)/i.test(t)
      || /^\s*abdominal thrusts\b/i.test(t),
    topic: /\binfants?\b|under (?:one|1) year|under a year/i,
    ok: () => false,
    exempt: /\bnot\b|\bnever\b|no place|avoid|used to|previously|rather than|do(?:es)? nothing/i,
    why: 'Abdominal thrusts are not used under 1 year at all — the infant liver is large, low and poorly protected. Infants get 5 back blows and 5 chest thrusts.',
  },
];

// A unit is a block of prose plus the heading it sits under, and sometimes the
// table it sits in. None of that is decoration:
//
//   * A flowchart box reads "Abdominal thrusts, repeated". The word
//     "obstruction" is only in the <h2> above it.
//   * A cell of the choking grid in the notes reads "5 abdominal thrusts", the
//     back blows are in the row above, and the word "choking" is in a JS
//     `title:` key rather than in any HTML heading at all.
//
// Each of those slipped through a version of this check, and each was found the
// same way: by putting the old guidance back and watching nothing happen. So
// headings are tracked in document order across BOTH the markup and the inline
// JS data, and a table cell borrows its whole table.
function guidanceUnits(html) {
  const out = [];
  const flatten = (s) => s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();

  const tables = [];
  for (const m of html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)) {
    tables.push({ start: m.index, end: m.index + m[0].length, text: flatten(m[0]) });
  }
  const enclosingTable = (i) => tables.find((t) => i >= t.start && i < t.end);

  // One ordered pass over markup blocks and over the JS keys that title them,
  // so a heading declared in either form covers what follows it.
  // One pass PER TAG, not one combined pass. A combined alternation walks the
  // file left to right, so `<div class="table-wrap">` matched to its closing
  // tag and every <td> inside the table was consumed with it — the grid
  // arrived as a single unit, and a row reading "Abdominal thrusts are not
  // used at this age" excused every other cell beside it. Separate passes see
  // the cells. A <div> that still wraps other blocks is then dropped as a
  // duplicate of the leaves inside it.
  const seen = [];
  for (const tag of ['p', 'li', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div']) {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
    for (const m of html.matchAll(re)) {
      if (tag === 'div' && /<(?:p|li|td|th|table|div)\b/i.test(m[1])) continue;
      const text = flatten(m[1]);
      if (!text) continue;
      seen.push({
        at: m.index,
        text,
        heading: /^h[1-6]$/.test(tag),
        table: (tag === 'td' || tag === 'th') ? enclosingTable(m.index) : null,
      });
    }
  }
  for (const m of html.matchAll(/\b(title|heading|blurb|text|consequence):\s*"((?:[^"\\]|\\.)*)"/g)) {
    const text = m[2].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    seen.push({ at: m.index, text, heading: m[1] === 'title' || m[1] === 'heading', table: null });
  }
  seen.sort((a, b) => a.at - b.at);

  let heading = '';
  for (const u of seen) {
    if (u.heading) { heading = u.text; continue; }
    const body = u.table ? u.table.text : u.text;
    out.push({ text: u.text, scope: heading ? heading + '. ' + body : body });
  }
  return out;
}

function checkGuidance(where, text, scope = text) {
  for (const rule of GUIDANCE_RULES) {
    if (!rule.prescribes(text)) continue;
    if (!rule.topic.test(scope)) continue;
    // `ok` looks at the scope, because the correct guidance can be spread
    // across a table: back blows in one row, thrusts in the next. `exempt`
    // looks at the block alone, because a unit earns its exemption by its own
    // wording — reading it from the scope let one table's "not used at this
    // age" row excuse every other cell in the same grid.
    if (rule.ok(scope)) continue;
    if (rule.exempt.test(text)) continue;
    fail(`${where}: teaches ${rule.label}, which the 2025 AHA guidelines superseded.\n` +
         `    ${rule.why}\n` +
         `    ${text.slice(0, 160)}`);
  }
}

for (const file of htmlFiles) {
  const rel = relative(ROOT, file).split(sep).join('/');
  for (const u of guidanceUnits(readFileSync(file, 'utf8'))) checkGuidance(rel, u.text, u.scope);
}

{
  const bank = JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'questions.json'), 'utf8'));
  for (const q of bank) {
    const keyed = Array.isArray(q.correct) ? q.correct : [q.correct];
    checkGuidance(`questions.json id ${q.id} (stem)`, String(q.q || ''));
    checkGuidance(`questions.json id ${q.id} (explanation)`, String(q.explain || ''));
    // An 'order' item's options are all steps of the same correct sequence,
    // so every one of them is keyed content.
    const keyedOptions = q.type === 'order' ? q.options.map((_, i) => i) : keyed;
    for (const i of keyedOptions) {
      if (typeof q.options?.[i] === 'string') {
        checkGuidance(`questions.json id ${q.id} (keyed option)`, q.options[i]);
      }
    }
  }
}

// ---- 24. The bank cannot outgrow the option letters the page can render ----
// practice.html labels options from a fixed LETTERS array. The choking-sequence
// ordering item became the bank's first six-option question, which is exactly
// as many letters as exist — a seventh would render `undefined)` beside a step
// and nothing would have caught it.
{
  const page = readFileSync(join(ROOT, 'nremt', 'practice.html'), 'utf8');
  const m = page.match(/const LETTERS\s*=\s*\[([^\]]*)\]/);
  if (!m) {
    fail('nremt/practice.html: cannot find the LETTERS array that labels options.');
  } else {
    const letters = m[1].split(',').filter((s) => s.trim()).length;
    const bank = JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'questions.json'), 'utf8'));
    let worst = 0, worstId = null;
    for (const q of bank) {
      const n = q.options?.length || 0;
      if (n > worst) { worst = n; worstId = q.id; }
    }
    if (worst > letters) {
      fail(`nremt/practice.html: LETTERS has ${letters} entries but questions.json id ${worstId} ` +
           `has ${worst} options, so the last option(s) would render with no letter.`);
    }
  }
}

// ---- 25. No impossible Glasgow Coma Scale score ----
// The reference card illustrated "report the parts, not just the total" with
// the pair "E3 V4 M6 and E1 V1 M11" — and M11 does not exist, the motor scale
// stopping at 6. It had been sitting under a correct table of the scale, on the
// page whose whole job is to be the number you look up. Nothing caught it
// because nothing was looking: a component score is three characters of prose.
//
// So every E/V/M triple the site writes down is checked against the scale it
// appears beneath, and any total stated beside one has to be the sum. The
// ranges are the scale itself and are not a threshold to tune.
const GCS_MAX = { E: 4, V: 5, M: 6 };
for (const file of htmlFiles) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\bE\s?(\d+)\s*V\s?(\d+)\s*M\s?(\d+)\b/g)) {
    const parts = { E: Number(m[1]), V: Number(m[2]), M: Number(m[3]) };
    for (const [k, v] of Object.entries(parts)) {
      if (v < 1 || v > GCS_MAX[k]) {
        fail(`${rel}: "${m[0]}" is not a possible Glasgow Coma Scale score — ` +
             `${k}${v} is outside ${k}1-${k}${GCS_MAX[k]}.`);
      }
    }
    // "E4 V4 M5 and E4 V3 M6 both come to 13" — the total, when it is written
    // down within the next hundred characters, has to be the one that adds up.
    const sum = parts.E + parts.V + parts.M;
    const after = html.slice(m.index + m[0].length, m.index + m[0].length + 100);
    const claim = after.match(/\b(?:total(?:s|ling)?(?: of)?|come to|comes to|add(?:s| up to)?)\s+(\d+)\b/i);
    if (claim && Number(claim[1]) !== sum && Number.isFinite(sum)) {
      fail(`${rel}: "${m[0]}" sums to ${sum}, but the text beside it says ${claim[1]}.`);
    }
  }
}

// ---- 26. Hand-placed molecule diagrams are actually drawable ----
// Check 20 guards the GENERATED ochem figures — the ones drawn from
// scripts/lib/ochem-figure.mjs, where a coordinate mistake is caught by the
// code that draws it. The SN2 mechanism page predates that kit and places its
// atoms by hand, so nothing was looking at it, and it had shipped with three
// separate faults at once:
//
//   * the cyanide carbon and its nitrogen were placed exactly r1+r2 apart, so
//     the bond between them had zero visible length and the triple bond that
//     makes the nucleophile cyanide was drawn as three lines of no length;
//   * the attacking lone pair was placed at 200 degrees, which put both dots
//     inside the neighbouring nitrogen's circle — invisible, and read
//     literally, on the wrong atom;
//   * the ethyl terminus sat eight pixels below a 140-high viewBox and shipped
//     with a flat bottom.
//
// None of those is a broken build, a bad link or a parse error. They are a
// diagram quietly saying something other than what the prose beside it says,
// which is the same reason check 20 exists. This is that check, pointed at the
// coordinates a person typed.
const MOL_MIN_BOND = 6;      // below this a bond is a smudge, or nothing at all
const MOL_MIN_GAP = 3;       // circles closer than this read as one blob
for (const file of walk(join(ROOT, 'ochem', 'mechanisms'), ['.html'])) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const src = readFileSync(file, 'utf8');
  const open = src.indexOf('var MOLECULES = [');
  if (open === -1) continue;
  const close = src.indexOf('\n  ];', open);
  if (close === -1) { fail(`${rel}: found a MOLECULES array with no end.`); continue; }

  const vb = src.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!vb) { fail(`${rel}: has molecules but no "0 0 W H" viewBox to draw them in.`); continue; }
  const W = Number(vb[1]), H = Number(vb[2]);

  let molecules;
  try {
    molecules = new Function('return ' + src.slice(open + 'var MOLECULES = '.length, close + 4).replace(/;\s*$/, ''))();
  } catch (err) {
    fail(`${rel}: could not read its MOLECULES array — ${err.message}`);
    continue;
  }

  for (const mol of molecules) {
    const where = `${rel} (${mol.name})`;
    const atoms = mol.atoms || {};
    const keys = Object.keys(atoms);

    for (const k of keys) {
      const a = atoms[k];
      const over = [];
      if (a.x - a.r < 0) over.push(`${(a.r - a.x).toFixed(1)}px off the left`);
      if (a.x + a.r > W) over.push(`${(a.x + a.r - W).toFixed(1)}px off the right`);
      if (a.y - a.r < 0) over.push(`${(a.r - a.y).toFixed(1)}px off the top`);
      if (a.y + a.r > H) over.push(`${(a.y + a.r - H).toFixed(1)}px off the bottom`);
      if (over.length) fail(`${where}: atom "${k}" is ${over.join(' and ')} of the ${W}x${H} canvas, so it renders clipped.`);
    }

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = atoms[keys[i]], b = atoms[keys[j]];
        const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
        if (gap < MOL_MIN_GAP) {
          fail(`${where}: atoms "${keys[i]}" and "${keys[j]}" are ${gap.toFixed(1)}px apart, so their circles ` +
               `touch or overlap. Keep at least ${MOL_MIN_GAP}px between them.`);
        }
      }
    }

    for (const [from, to, style] of mol.bonds || []) {
      const a = atoms[from], b = atoms[to];
      if (!a || !b) { fail(`${where}: bond ${from}-${to} names an atom that does not exist.`); continue; }
      // Bonds are drawn from circle edge to circle edge, so the length that
      // actually appears is the centre distance minus both radii.
      const drawn = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
      if (drawn < MOL_MIN_BOND) {
        fail(`${where}: the ${style || 'single'} bond ${from}-${to} has ${drawn.toFixed(1)}px of visible length, ` +
             `so it renders as ${drawn <= 0 ? 'nothing at all' : 'a smudge'}. The atoms are too close together.`);
      }
    }

    for (const k of keys) {
      const a = atoms[k];
      for (const deg of a.lp || []) {
        // Same placement the page uses: a pair of dots on a circle of r+6.
        const R = a.r + 6, rad = (deg * Math.PI) / 180;
        const px = a.x + R * Math.cos(rad), py = a.y + R * Math.sin(rad);
        if (px < 0 || px > W || py < 0 || py > H) {
          fail(`${where}: the lone pair on "${k}" at ${deg}deg falls outside the canvas.`);
        }
        for (const k2 of keys) {
          if (k2 === k) continue;
          const b = atoms[k2];
          if (Math.hypot(px - b.x, py - b.y) < b.r + MOL_MIN_GAP) {
            fail(`${where}: the lone pair on "${k}" at ${deg}deg lands on atom "${k2}", where it cannot be seen ` +
                 `and reads as belonging to the wrong atom. Point it into open space.`);
          }
        }
      }
    }
  }
}

// ---- 27. No British spelling in anything a reader sees ----
// The site teaches an American exam and an American chemistry course. Two
// earlier passes converted what a text-node sweep could reach, which left
// everything held in a JavaScript string — the study-notes chapters, the
// scenario nodes, both question banks, the tool copy — and that is most of the
// words on the site. 235 occurrences in 67 files.
//
// The list and the visible-span logic live in scripts/lib/spelling.mjs, and
// the distinction they draw is the whole point: `stereocentre` in a sentence
// is a misspelling, `stereocentre` as an object key is a name, and renaming a
// key silently breaks a lookup. Only text nodes, the attributes a reader sees
// (alt, title, aria-label, placeholder, meta content) and string literals of
// three words or more are in scope.
//
// Out of scope by design: scripts/ and docs/, which are developer notes rather
// than anything a student reads.
{
  const spelling = await import('./lib/spelling.mjs');
  // Vendored third-party code is nobody's prose, and Web Audio's AnalyserNode
  // is an API name rather than a spelling choice.
  const SKIP = /^(?:scripts|docs)\/|\/vendor\//;
  const textFiles = walk(ROOT, ['.html', '.json', '.js', '.mjs'])
    .filter((f) => !SKIP.test(relative(ROOT, f).split(sep).join('/')));

  for (const file of textFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const src = readFileSync(file, 'utf8');
    const spans = spelling.visibleSpans(rel, src);
    if (!spans.length) continue;
    for (const hit of spelling.findAll(src)) {
      if (!spans.some(([a, b]) => hit.at >= a && hit.at < b)) continue;
      // `analyse()` inside a sentence names the real function analyse(a, b) in
      // ochem/assets/tools/acid-base.js. Rewriting the sentence would make it
      // point at nothing, so a word followed by a bracket is a reference.
      if (src[hit.at + hit.word.length] === '(') continue;
      const line = src.slice(0, hit.at).split('\n').length;
      fail(`${rel}:${line}: "${hit.word}" is a British spelling in visible text — ` +
           `use "${spelling.americanize(hit.word, hit.brit, hit.amer)}".`);
    }
  }
}

// ---- 28. The study notes and their data file stay in step ----
// The forty chapters used to be an inline array in study-notes.html: 456 KB of
// prose in the HTML, which every reader downloaded to read one chapter of. They
// are now nremt/assets/study-notes.json, fetched by a script in the head.
//
// That split introduced four ways to break the page silently, none of which any
// existing check could see, because a page that renders "Loading the notes…"
// forever is still valid HTML with no broken links in it:
//
//   * the data file goes missing or stops parsing;
//   * the page stops fetching it, or fetches the wrong path;
//   * sw.js stops precaching it, so the page works online and is an empty
//     shell offline — which is the one state nobody tests;
//   * somebody pastes the chapters back inline, undoing the split without
//     anything failing.
//
// Section ids are checked too: the page routes by them, so a duplicate id
// sends two different sections to the same URL.
{
  const NOTES_PAGE = join(ROOT, 'nremt', 'study-notes.html');
  const NOTES_DATA = join(ROOT, 'nremt', 'assets', 'study-notes.json');
  const DATA_REL = 'nremt/assets/study-notes.json';

  if (!existsSync(NOTES_DATA)) {
    fail(`${DATA_REL} is missing — study-notes.html has nothing to render.`);
  } else {
    let data = null;
    try { data = JSON.parse(readFileSync(NOTES_DATA, 'utf8')); }
    catch (err) { fail(`${DATA_REL}: does not parse — ${err.message}`); }

    const page = readFileSync(NOTES_PAGE, 'utf8');

    if (data) {
      const chapters = Array.isArray(data.chapters) ? data.chapters : null;
      if (!chapters || !chapters.length) {
        fail(`${DATA_REL}: has no "chapters" array.`);
      } else {
        const seenIds = new Map();
        for (const ch of chapters) {
          const where = `${DATA_REL} chapter ${ch.num}`;
          if (typeof ch.num !== 'number' || !ch.title) fail(`${where}: needs a numeric num and a title.`);
          if (!Array.isArray(ch.sections) || !ch.sections.length) {
            fail(`${where} ("${ch.title}"): has no sections, so the chapter renders empty.`);
            continue;
          }
          for (const sec of ch.sections) {
            if (!sec.id) { fail(`${where}: a section has no id, and the page routes by id.`); continue; }
            if (seenIds.has(sec.id)) {
              fail(`${DATA_REL}: two sections share the id "${sec.id}" (chapters ${seenIds.get(sec.id)} and ${ch.num}), ` +
                   `so one of them is unreachable at #${sec.id}.`);
            }
            seenIds.set(sec.id, ch.num);
            if (!Array.isArray(sec.topics) || !sec.topics.length) {
              fail(`${DATA_REL}: section "${sec.id}" has no topics.`);
            }
          }
        }

        // "forty chapters" is claimed on two hub pages. The bank counts in
        // check 6 are guarded the same way; this is the same idea for prose.
        const WORDS = { thirty: 30, forty: 40, fifty: 50, sixty: 60 };
        // Scoped to pages actually talking about these notes. The first
        // version was not, and it failed ochem/learn.html for saying
        // "14 chapters" about the ochem textbook — a different book, with a
        // different number of chapters, on a page that has never linked here.
        for (const file of htmlFiles) {
          const rel = relative(ROOT, file).split(sep).join('/');
          if (rel === 'changelog.html') continue;   // a dated entry is a record
          const html = readFileSync(file, 'utf8');
          const aboutTheseNotes = rel.startsWith('nremt/') ||
            /href="[^"]*nremt\/study-notes\.html/.test(html);
          if (!aboutTheseNotes) continue;
          for (const m of html.matchAll(/\b(\d{2}|thirty|forty|fifty|sixty)[\s -]+chapters\b/gi)) {
            const claimed = WORDS[m[1].toLowerCase()] ?? Number(m[1]);
            if (Number.isFinite(claimed) && claimed !== chapters.length) {
              fail(`${rel}: claims "${m[0]}" but ${DATA_REL} has ${chapters.length}.`);
            }
          }
        }
      }
    }

    // The split has to hold. An inline array with real content in it means the
    // chapters came back into the page.
    const inline = page.match(/const CHAPTERS\s*=\s*\[([\s\S]{200,}?)\n\];/);
    if (inline) {
      fail('nremt/study-notes.html: the chapters are inline again. They belong in ' +
           `${DATA_REL}, which is why the page is 18 KB instead of 172 KB.`);
    }
    if (!page.includes('assets/study-notes.json')) {
      fail(`nremt/study-notes.html: does not fetch ${DATA_REL}, so it has no chapters to render.`);
    }

    const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
    if (!sw.includes(DATA_REL)) {
      fail(`sw.js: does not precache ${DATA_REL}. The page would work online and be an ` +
           'empty shell offline, which is the state nobody tests.');
    }
  }
}

// ---- 29. A sort step's answers must not lie on the diagonal ----

/* The lesson sort steps render their own buttons from a fixed OPTS array, so
   none of the answer-tell checks above ever saw them — and they had the worst
   version of the tell. An author writes the rows in the order the options were
   listed, because that is the order the ideas arrive in while writing, and the
   correct answers end up on the diagonal: click the Nth button in the Nth row
   and the whole step clears. When this check was written, twelve lessons were
   on the diagonal and six of them were perfectly so, clearable with no
   chemistry at all.

   shuffle-options.js now reorders these buttons at render time, so a reader
   cannot exploit it. This check exists anyway, for the reason that file gives
   about the banks: the runtime fix makes the tell invisible, and an invisible
   tell in the source is still a step whose rows were never thought about. It
   also fails loudly if the shuffle is ever removed.

   Two separate things are measured. DIAGONAL is how many rows are answered by
   the button at their own index. DOMINANT is the best score available from
   pressing one button in every row, which is the check the polymer-properties
   step failed by hand earlier in this work. */
{
  const lessonFiles = htmlFiles.filter((f) => f.includes(`ochem${sep}lessons${sep}`));
  for (const file of lessonFiles) {
    const html = readFileSync(file, 'utf8');
    if (!html.includes('radical-sort')) continue;

    const rights = [...html.matchAll(/right:\s*'([A-Za-z0-9_-]+)'/g)].map((m) => m[1]);
    const optsBlock = html.match(/var OPTS\s*=\s*\[([\s\S]*?)\];/);
    if (!rights.length || !optsBlock) continue;
    const keys = [...optsBlock[1].matchAll(/k:\s*'([A-Za-z0-9_-]+)'/g)].map((m) => m[1]);
    if (keys.length < 2) continue;

    const where = file.slice(file.indexOf(`ochem${sep}lessons${sep}`));
    const diagonal = rights.filter((r, i) => keys[i] === r).length;
    const dominant = Math.max(...keys.map((k) => rights.filter((r) => r === k).length));
    const chance = rights.length / keys.length;

    if (diagonal / rights.length >= 0.6) {
      fail(`${where}: the sort step's answers run down the diagonal — ` +
           `${diagonal} of ${rights.length} rows are answered by the option at their own ` +
           'index, so pressing the buttons straight down the page clears the step without ' +
           'reading it. Reorder the CASES array so the answers do not track the OPTS order.');
    }
    if (dominant > Math.max(chance * 1.5, chance + 1)) {
      fail(`${where}: one answer covers ${dominant} of the sort step's ${rights.length} rows, ` +
           `against ${chance.toFixed(1)} expected by chance across ${keys.length} options. ` +
           'Pressing that one button scores well without knowing anything. Add rows that ' +
           'need the other answers, or drop an option that is barely used.');
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log(`OK — scanned ${htmlFiles.length} HTML files and ${jsonFiles.length} JSON files, no broken local references.`);
}
