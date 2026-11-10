/* The AP® Human Geography content check: every authored file under
   human-geography/data/ against the formats in docs/aphug-architecture.md
   and the rules in docs/aphug-spec.md, docs/aphug-authoring-guide.md and
   docs/aphug-research/accuracy-risks.md. Forked from check-appsych-content.mjs,
   with the human-geography rules: math in the course's TeX subset, four-option
   multiple choice in the bank, the CED skills (1.A-5.D); numeric items (rates,
   densities, ratios; no calculator) whose key is recomputed by ApHugCalc from
   its recipe and every authored mistake graded wrong; "Make it specific" items;
   model items (ApHugModel.check, the key graded right); the set kinds (map,
   data, image, text); maps drawn and checked by ApHugMap (a dated source or
   invented data, legible labels, no value on a disputed place without a
   reason); plots drawn from their data; drawn scenes only, no photos; the
   three FRQ types (none, one, two stimuli), seven one-point parts A to G with
   a task verb each and samples that do what the verb demands; neutral,
   dated language; only CED-named models keyed (spec decision 8); no
   reproduced CED text; pre-registered tools.

     node scripts/check-aphug-content.mjs                every topic with content
     node scripts/check-aphug-content.mjs --topic <id>   one topic (for authors); the tool
                                                         validators run only in a full run
     node scripts/check-aphug-content.mjs --tools        with --topic: run them too
     node scripts/check-aphug-content.mjs --check        exit 1 on a failure in a
                                                         PUBLISHED chapter; the rest print
     APHUG_DATA=<dir>                                    check another data folder (tests)

   Per topic: lesson, notes, question file (items and stimuli), glossary, the
   ordering rule (no term taught by a later topic, outside a declared preview
   box). Across the bank: the test-wise balance rules (A&P decision 79, via
   scripts/site-rules/anp-test-wise.mjs's limits), near-duplicates across topics
   (A&P decision 78), unique ids. Also every FRQ, every figure's license, and
   the trademark wording in everything authored.

   The map comes from the same loader as the generator (scripts/lib/aphug-build.mjs):
   docs/aphug-dependency-map.json, else the test fixture when APHUG_MAP_STUB=1.
   With no map, formats are still checked, but nothing counts as published. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadMap, loadBases, ALLOWED_LICENSES, hasApToken, trademarkProblems, fromValue, specificSlots } from './lib/aphug-build.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, JUSTIFY_SKILLS, JUSTIFY_PER_CHAPTER } from './lib/aphug-exams.mjs';
import { scanPage, indexMap } from './lib/aphug-map.mjs';
import { Tex, Plot, Grade, Calc, HugMap, Model } from './lib/aphug-mathlib.mjs';
const BASES = loadBases();
export { trademarkProblems };

const DATA = process.env.APHUG_DATA || join(ROOT, 'human-geography', 'data');
const args = process.argv.slice(2);
const only = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const exists = p => existsSync(p);
const strip = s => String(s ?? '').replace(/<[^>]+>/g, ' ');

export const TYPES = ['single', 'multi', 'numeric', 'specific', 'order', 'model'];
export const LEVELS = ['recall', 'apply', 'analyze'];
// The kinds of multiple-choice set: a map, data (a table, chart or pyramid),
// an image (a drawn scene) and a text passage (framework.md section 5).
export const STIM_KINDS = ['map', 'data', 'image', 'text'];
// The three free-response questions of May 2027 (framework.md section 5): 7
// points each, seven one-point parts A to G, with 0, 1 and 2 stimuli.
export const FRQ_TYPES = { none: 7, one: 7, two: 7 };
export const FRQ_STIMULI = { none: 0, one: 1, two: 2 };
export const VERB_IDS = ['identify', 'define', 'describe', 'explain', 'compare', 'explain-degree'];
/* Out of scope in items: calculus notation and anything that needs a
   calculator (the exam has none). Notes may mention one in <aside class="going-further">. */
export const EXCLUDED = [
  [/\\int|\\lim\b|\\frac\{d\}\{d[a-z]\}|\\frac\{dy\}/, 'calculus notation'],
  [/\bcalculators?\b(?! (is|are) not| is never)/i, 'a calculator (the AP® Human Geography exam allows none)'],
];
/* Neutral language (docs/aphug-research/accuracy-risks.md sections 3-5, spec
   decision 7): no country or people called backward or primitive, no "Third
   World" outside a dated history sentence, groups by their own names, and
   "illegal" never used for people. */
export const LANGUAGE = [
  [/\b(backward|primitive|uncivili[sz]ed|savages?)\b/i, 'a place or people called backward, primitive or uncivilized (spec decision 7)'],
  [/\bthird[- ]world\b/i, '"Third World": write "less developed" or "periphery" (accuracy-risks.md section 3)'],
  [/\billegal (immigrants?|aliens?|migrants?)\b/i, '"illegal" for people: write "unauthorized" or "undocumented", attributed (accuracy-risks.md section 2)'],
  [/\b(eskimos?|gypsy|gypsies)\b/i, 'a name the group does not use: write Inuit or Roma (accuracy-risks.md section 5)'],
  [/\bCIA (World )?Factbook\b/i, 'the CIA World Factbook, closed in February 2026 (accuracy-risks.md section 1)'],
  [/\b(Turkey|Swaziland|Czech Republic|Kiev)\b(?![^<]{0,40}\b(formerly|until|renamed|now)\b)/, 'an old official name: write Türkiye, Eswatini, Czechia or Kyiv (accuracy-risks.md section 4)'],
  [/\b195 countries\b/i, '"195 countries": say "193 UN member states" and that counts differ by who recognizes whom'],
];
export function languageProblems(t) { const p = strip(t); return LANGUAGE.filter(([re]) => re.test(p)).map(([, what]) => `language: ${what}`); }
/* Dated (accuracy-risks.md section 0): a figure that moves with time is never
   "current" or "today" without a year. */
export const UNDATED = /\b(currently|today|nowadays|at present|right now)\b(?![^.]*\b(19|20)\d\d\b)/i;
export function datedProblems(t) { return UNDATED.test(strip(t)) ? ['dated: "currently" or "today" with no year in the sentence (accuracy-risks.md rule 3)'] : []; }
/* Only the models the CED names are keyed (spec decision 8). A model it does
   not name may appear only as a labeled aside: inside an element with the
   class "hug-aside" (notes, lessons) and never in a question, its options or
   its key. */
export const NOT_CED_MODELS = [
  [/\bLee'?s? (model|theory|laws?)\b|\bEverett Lee\b/i, 'Lee\'s migration model'],
  [/\bZelinsky\b/i, 'Zelinsky\'s mobility transition'],
  [/\bheartland theory\b|\bMackinder\b/i, 'Mackinder\'s heartland theory'],
  [/\brimland\b|\bSpykman\b/i, 'Spykman\'s rimland theory'],
  [/\borganic (state )?theory\b|\bRatzel\b/i, 'Ratzel\'s organic theory'],
  [/\bGriffin[- ](and|&)[- ]Ford\b/i, 'Griffin-Ford by name (teach the Latin American city model, unnamed)'],
  [/\bMcGee\b/i, 'McGee by name (teach the Southeast Asian city model, unnamed)'],
  [/\bde Blij\b/i, 'de Blij by name (teach the African city model, unnamed)'],
  [/\b(Mercator|Peters|Gall-Peters|Robinson|Winkel|Goode)\b[^.]{0,20}\bprojection\b/i, 'a named map projection (the CED names none; teach the trade-off)'],
];
const ASIDE_BOX = /<(\w+)[^>]*class="[^"]*\bhug-aside\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g;
export function modelProblems(t, { item = false } = {}) {
  const plain = strip(item ? String(t ?? '') : String(t ?? '').replace(ASIDE_BOX, ' '));
  return NOT_CED_MODELS.filter(([re]) => re.test(plain)).map(([, what]) => item ? `names ${what}, which the CED does not name: never in a question or its key (spec decision 8)` : `names ${what}, which the CED does not name: only inside a "hug-aside" box labeled "your class may name this" (spec decision 8)`);
}
/* The reader-report slips (spec section 2) the course is built to fix, read
   in rubrics and samples: a "describe" sample that only names, an "explain"
   sample without its link, a "compare" sample with one side, a degree sample
   with no degree, and the scale of analysis confused with the map's size. */
const LINK = /\b(because|so|therefore|which (means|leads|causes|makes)|leads? to|results? in|causes?|as a result|this (means|leads|causes|makes))\b/i;
const BOTH = /\b(both|whereas|while|but|than|unlike|similarly|in contrast|however)\b/i;
const DEGREE = /\b(high|moderate|low|great|large|small|limited|significant)\s+(degree|extent)\b/i;
export function verbProblems(p) {
  const out = [], s = strip(p.sample || '');
  if (p.verb === 'explain' && !LINK.test(s)) out.push(`part ${p.label}: the explain sample has no link (because, so, therefore): it would only describe`);
  if (p.verb === 'compare' && !BOTH.test(s)) out.push(`part ${p.label}: the compare sample speaks of one side only (no whereas, both, than)`);
  if (p.verb === 'explain-degree' && !DEGREE.test(s)) out.push(`part ${p.label}: the explain-the-degree sample does not state its degree first ("to a high degree")`);
  if (p.verb === 'describe' && s.split(/\s+/).length < 8) out.push(`part ${p.label}: a describe sample of a few words only names; give the characteristics`);
  return out;
}
export const SCALE_SLIP = /\b(national|global) scale\b[^.]{0,80}\bbecause (it|the map) shows (a|one|the whole) (country|world)\b/i;
export function scaleProblems(t) { return SCALE_SLIP.test(strip(t)) ? ['scale: the scale of analysis is the scale of the data shown, not the size of the area on the map (spec section 2)'] : []; }
export function excludedProblems(t) {
  const out = [];
  for (const [re, what] of EXCLUDED) if (re.test(String(t ?? ''))) out.push(`mentions ${what}`);
  return out;
}
// A real figure carries a source with a year (accuracy-risks.md rule 1).
export const DATED_SOURCE = /\b(19|20)\d\d\b/;
// Multiple choice in the bank has four options; the exam forms add a fifth
// (aphug-exams.mjs MCQ_OPTIONS; needs-author mcq-options).
export const MCQ_OPTIONS = 4;
export const SKILL_RE = /^[1-5]\.[A-F]$/;
export const NOT_ASSESSED = [];
/* No CED text reproduced (decision 4): a phrase of 12+ words from the CED
   map's objectives or knowledge lines would be our own summary copied, not
   CED text, but the CED's own wording is never in the repo, so the check
   holds authored text to a list of CED signature phrases instead. */
export const CED_PHRASES = [
  /students? (will|should) be able to/i,
  /\bessential knowledge\b/i,
  /\blearning objective\b/i,
  /\benduring understanding\b/i,
];
/* Every $...$ in a piece of text renders in the course's TeX subset. */
export function mathProblems(t) { return Tex.check(String(t ?? '')); }
const RAW = new Set(['answer', 'id', 'topic', 'unit', 'units', 'type', 'kind', 'stimulus', 'figure', 'practice', 'level', 'set', 'mode', 'from', 'source']);
const allStrings = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(allStrings)
  : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => k === 'plot' || k === 'chart' || (RAW.has(k) && typeof x !== 'object') ? [] : allStrings(x)) : [];
export const MIN_ITEMS = 15, MIN_HIGHER = 0.6, MIN_IN_SETS = 0.4, SET_MIN = 3, SET_MAX = 5, LONGEST_MAX = 0.4;
// An explanation never names an option by letter or position: options are shuffled.
export const POS_RE = /\b[Oo]ptions?\s+(one|two|three|four|five|[1-6]|[A-F])\b|\b(first|second|third|fourth|fifth|last|above|below)\s+(option|choice|answer)\b|\b(choice|answer)\s+[A-F]\b|\(\s*[A-E]\s*\)|\b[A-E]\s+(and|or)\s+[A-E]\b|\bthe (other )?(options|choices) above\b/;

/* The test-wise limits A&P holds its bank to (site rule anp-test-wise),
   scaled for a bank that is still small: the count-based minimums apply once
   there are enough items for them to mean anything. */
export const TEST_WISE = { multiShare: 0.5, multiMaxFraction: 2 / 3, singleKeyShare: 0.2, singleKeyFrom: 5, noneShare: 0.2, noneFrom: 10, distractorAbsolutes: 0.024 };
const ABS = /\b(always|never|only|all|none|every|completely|entirely|must|cannot)\b/i;
const hasAbs = s => ABS.test(strip(s).replace(/all-or-none/gi, ''));
export function testWise(items) {
  const errs = [];
  const multis = items.filter(q => q.type === 'multi' && Array.isArray(q.correct));
  let opts = 0, keys = 0, single = 0;
  for (const q of multis) {
    opts += q.options.length; keys += q.correct.length;
    if (q.correct.length === 1) single++;
    if (q.correct.length / q.options.length > TEST_WISE.multiMaxFraction + 1e-9) errs.push(`${q.id}: ${q.correct.length} of ${q.options.length} select-all options are correct (at most two thirds)`);
  }
  if (opts && keys / opts > TEST_WISE.multiShare + 1e-9) errs.push(`select-all items: ${(100 * keys / opts).toFixed(1)}% of options are correct (limit 50%)`);
  if (multis.length >= TEST_WISE.singleKeyFrom && single / multis.length < TEST_WISE.singleKeyShare) errs.push(`select-all items with one correct option: ${single} of ${multis.length} (at least 20%)`);
  let vars = 0, none = 0;
  for (const q of items.filter(x => x.type === 'predict')) for (const v of q.variables || []) { vars++; if (v.answer === 'none') none++; }
  if (vars >= TEST_WISE.noneFrom && none / vars < TEST_WISE.noneShare) errs.push(`predict items: "no change" keys ${(100 * none / vars).toFixed(1)}% of variables (at least 20%)`);
  let d = 0, dAbs = 0, k = 0, kAbs = 0;
  for (const q of items.filter(x => x.options && (x.type === 'single' || x.type === 'multi'))) {
    const key = [].concat(q.correct);
    q.options.forEach((o, i) => { if (key.includes(i)) { k++; if (hasAbs(o)) kAbs++; } else { d++; if (hasAbs(o)) dAbs++; } });
  }
  if (d && dAbs / d > TEST_WISE.distractorAbsolutes) errs.push(`distractors with absolute words (always, never, only...): ${(100 * dAbs / d).toFixed(1)}% (limit 2.4%)`);
  if (d && k && dAbs / d > kAbs / k) errs.push(`absolute words are more common in distractors (${(100 * dAbs / d).toFixed(1)}%) than in keys (${(100 * kAbs / k).toFixed(1)}%)`);
  return errs;
}

/* Near-duplicates across topics: 75% shared content words (A&P decision 78). Each $...$ span counts as
   one word, so "$y = x^2$" and "$x = y^2$" differ, and a set item counts its stimulus title too (`ctx`,
   added by the main loop): "find the volume when $R$ is revolved about the $x$-axis" is a different
   question for each region $R$. */
const STOP = new Set('the a an of to in and or is are which what that this does with for from by on as at it its be most best your you their than into when why how'.split(' '));
function words(t) {
  const math = [];
  const prose = strip(t).replace(/\$([^$]+)\$/g, (_, m) => { math.push('m:' + m.replace(/\s+/g, '')); return ' '; });
  return [...math, ...prose.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x && !STOP.has(x))];
}
export function duplicates(items) {
  const all = items.map(q => {
    const t = [q.ctx || '', q.q, ...(q.options || []), ...(q.variables || []).map(v => v.name)].join(' ');
    return { topic: q.topic, id: q.id, w: [...new Set(words(t))] };
  });
  const errs = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j];
    if (a.topic === b.topic) continue;
    const bw = new Set(b.w); const inter = a.w.filter(x => bw.has(x)).length;
    if (inter / (a.w.length + b.w.length - inter) >= 0.75) errs.push(`${a.id} and ${b.id} are near-duplicates across topics; vary or drop one`);
  }
  return errs;
}

/* Per topic: the correct option is strictly the longest at most 40% of the time. */
export function lengthTell(items) {
  const singles = items.filter(q => q.type === 'single' && (q.options || []).length >= 3 && Number.isInteger(q.correct));
  if (singles.length < 5) return null;
  const longest = singles.filter(q => { const L = q.options.map(o => strip(o).trim().length); return L[q.correct] > Math.max(...L.filter((_, i) => i !== q.correct)); }).length;
  return longest / singles.length > LONGEST_MAX + 1e-9 ? `the correct option is the longest in ${longest} of ${singles.length} single-answer items (at most 40%): even out the option lengths` : null;
}

export function checkStimulus(sid, s, figures, err) {
  const w = `stimulus ${sid}`;
  if (!STIM_KINDS.includes(s.kind)) err(`${w}: kind must be ${STIM_KINDS.join(', ')} (the set kinds: a map, data, an image, a text)`);
  if (!s.title) err(`${w}: title missing`);
  if (!s.html && !s.table && !s.figure && !s.chart && !s.plot && !s.map && !s.image && !s.text) err(`${w}: needs a map, table, plot, chart, image, text or html`);
  // A graph is drawn from the numbers it claims to show: a plot spec, drawn
  // by human-geography/assets/tools/hug-plot.js at build time.
  if (s.plot) { try { Plot.svg(s.plot); } catch (e) { err(`${w}: plot: ${e.message}`); } }
  // A map is drawn from its data on a base map (hug-map.js), legible at 360 px.
  if (s.map) for (const p of HugMap.check(s.map, BASES[s.map.base])) err(`${w}: map: ${p}`);
  if (s.set !== undefined) err(`${w}: "set" is not used; the stimulus kind (map, data, image, text) is the set kind`);
  if (s.study !== undefined) err(`${w}: "study" is not used in human geography`);
  const texts = allStrings({ title: s.title, text: s.text, html: s.html, table: s.table, image: s.image, map: s.map && { label: s.map.label, legendTitle: s.map.legendTitle, classes: s.map.classes } });
  for (const t of texts) for (const m of [...excludedProblems(t), ...languageProblems(t), ...datedProblems(t), ...modelProblems(t, { item: true })]) err(`${w}: ${m}`);
  for (const p of texts) for (const m of mathProblems(p)) err(`${w}: math: ${m}`);
  if (s.table) {
    const t = s.table;
    if (!Array.isArray(t.cols) || !Array.isArray(t.rows) || !t.rows.length) err(`${w}: table needs cols and rows`);
    else for (const [i, r] of t.rows.entries()) if (!Array.isArray(r) || r.length !== t.cols.length) err(`${w}: table row ${i + 1} has ${r.length} cells for ${t.cols.length} columns`);
    if (!t.caption) err(`${w}: table needs a caption`);
  }
  if (s.chart) {
    const c = s.chart;
    if (!['line', 'bar'].includes(c.type)) err(`${w}: chart type must be line or bar`);
    if (!c.x || !c.x.label || !c.y || !c.y.label) err(`${w}: chart axes need labels`);
    for (const se of c.series || []) for (const p of se.points || []) if (!Array.isArray(p) || typeof p[1] !== 'number' || (c.type === 'line' && typeof p[0] !== 'number')) err(`${w}: chart point ${JSON.stringify(p)} is not [x, y, err?]`);
    if (!(c.series || []).length) err(`${w}: chart has no series`);
  }
  if (s.figure && !figures[s.figure]) err(`${w}: unknown figure "${s.figure}"`);
  if (s.kind === 'map' && !s.map) err(`${w}: a map set has a map spec (hug-map.js)`);
  if (s.kind === 'data' && !s.table && !s.plot && !s.chart) err(`${w}: a data set shows its data: a table, a plot spec (line, bar, scatter, pyramid) or a chart`);
  // Drawn scenes only, no photos (spec section 4): a LevlPrep original SVG
  // figure, or a placeholder carrying the alt text until it is drawn.
  if (s.kind === 'image') {
    if (!s.image) err(`${w}: an image set has "image": { figure?, alt, caption? }`);
    else {
      if (!s.image.alt || strip(s.image.alt).length < 20) err(`${w}: image.alt (20+ characters) says what the scene shows`);
      if (s.image.figure && !figures[s.image.figure]) err(`${w}: unknown figure "${s.image.figure}"`);
      if (s.image.figure && figures[s.image.figure] && figures[s.image.figure].ext && figures[s.image.figure].ext !== 'svg') err(`${w}: a scene is a drawn SVG, never a photo`);
    }
  }
  if (s.kind === 'text' && !s.text) err(`${w}: a text set has "text" (the passage)`);
  if (/<svg/.test(s.html || '') && !(/role="img"/.test(s.html) && /aria-label="[^"]{20,}"/.test(s.html))) err(`${w}: the SVG needs role="img" and an aria-label (20+ characters) that says what it shows`);
  // Every real figure carries a source and a year; invented data says so (accuracy-risks.md rule 1).
  const hasData = !!(s.table || s.plot || s.chart);
  if (hasData && !s.invented && !s.source) err(`${w}: data need "invented": true (shown as "Invented data for practice") or a "source" with its year ("UN WPP 2024, 2024 estimates")`);
  if (hasData && s.invented && s.source) err(`${w}: data are either invented or sourced, not both`);
  if (s.source && !DATED_SOURCE.test(s.source)) err(`${w}: source "${s.source}" has no year (accuracy-risks.md rule 1)`);
}

/* A numeric item's key (docs/aphug-architecture.md, "numeric"): the key
   recomputed from its recipe when it has one (`from`, through ApHugCalc: a
   typed key that disagrees fails; every calculated key must have one), its
   unit readable, and the authored slips (a value or a recipe), each graded
   wrong by ApHugGrade. Returns problems. */
export function numericProblems(N, { needRecipe = true } = {}) {
  const out = [], bad = m => out.push(m);
  let A = N.answer;
  if (N.from !== undefined) {
    try { const v = fromValue(N.from); if (typeof A === 'number' && Math.abs(A - v) > Grade.tolerance({ ...N, answer: v }) / 10 + 1e-12) bad(`numeric.answer ${A} disagrees with its recipe: ${N.from.fn} gives ${v}`); A = v; }
    catch (e) { bad(`numeric.from: ${e.message}`); return out; }
  } else if (needRecipe) { bad('numeric.from is required: every calculated key is a recipe ApHugCalc recomputes (spec section 7)'); if (typeof A !== 'number') return out; }
  else if (typeof A !== 'number' || !Number.isFinite(A)) { bad('numeric.answer must be a number'); return out; }
  if (N.tol !== undefined && !(N.tol >= 0)) bad('numeric.tol must be a number at least 0');
  if (N.rel !== undefined && !(N.rel >= 0 && N.rel < 0.2)) bad('numeric.rel must be between 0 and 0.2');
  if (N.unit !== undefined && typeof N.unit !== 'string') bad('numeric.unit must be a string');
  if (N.unit && !Grade.normUnit(N.unit)) bad(`numeric.unit "${N.unit}" cannot be read`);
  for (const k of ['kind', 'sigfigs', 'alts', 'accept', 'alpha']) if (N[k] !== undefined) bad(`numeric.${k} is not used in human-geography (no significant figures; units instead)`);
  const key = { ...N, answer: A };
  if (!Grade.numeric(key, { value: String(A), unit: N.unit || '' }).correct) bad('the key itself is not graded right by ApHugGrade.numeric');
  for (const u of N.units || []) if (!Grade.numeric(key, { value: String(A), unit: u }).correct) bad(`the accepted unit "${u}" is not graded right`);
  for (const [i, mk] of (N.mistakes || []).entries()) {
    let v = mk.value;
    if (mk.from) { try { v = fromValue(mk.from); } catch (e) { bad(`numeric.mistakes[${i}].from: ${e.message}`); continue; } }
    if (typeof v !== 'number' || !Number.isFinite(v)) { bad(`numeric.mistakes[${i}] needs a value or a from recipe (the slip, computed)`); continue; }
    const g = Grade.numeric({ ...key, mistakes: (N.mistakes || []).map(m => m.from ? { ...m, value: fromValue(m.from) } : m) }, { value: String(v), unit: N.unit || '' });
    if (g.correct || g.parts.value) bad(`numeric.mistakes[${i}] (${v}) is within the tolerance of the key, so it is graded right and its feedback never shows`);
    else if (!g.mistake || Math.abs(g.mistake.value - v) > 1e-9 * Math.max(1, Math.abs(v))) bad(`numeric.mistakes[${i}] (${v}) is matched by an earlier mistake`);
    if (!mk.why || strip(mk.why).trim().length < 20) bad(`numeric.mistakes[${i}] needs a "why" that names the slip and how to fix it`);
  }
  if (N.mistakes !== undefined && !Array.isArray(N.mistakes)) bad('numeric.mistakes must be a list');
  return out;
}

/* A model item (hug-model.js): the model checks (slots, pieces, a key for
   every slot, at most three distractors, short pieces), its own key grades
   right, and every authored slip names a wrong placement. */
export function modelItemProblems(M) {
  if (!M || typeof M !== 'object') return ['a model item needs a "model" object'];
  const out = Model.check(M).map(p => `model: ${p}`);
  if (!out.length && !Model.grade(M, M.key).correct) out.push('model: its own key is not graded right');
  return out;
}

/* A "Make it specific" item: slots with 2-4 options, a label, one right
   answer each and a why for every wrong one; a model answer that passes its
   own write flags. */
export function specificProblems(S) {
  const out = [], bad = m => out.push(m);
  if (!S || typeof S !== 'object') { bad('specific item needs a "specific" object'); return out; }
  const slots = specificSlots(S);
  if (Object.keys(slots).length < 2) bad('specific needs 2 or more slots');
  for (const [n, sl] of Object.entries(slots)) {
    if (!sl.label) bad(`slot ${n}: a label (what the slot is: "Independent variable", "How it works")`);
    if (!Array.isArray(sl.options) || sl.options.length < 2 || sl.options.length > 4) bad(`slot ${n}: 2 to 4 options`);
    else if (!(Number.isInteger(sl.correct) && sl.correct >= 0 && sl.correct < sl.options.length)) bad(`slot ${n}: correct must be an option index`);
    else {
      if (new Set(sl.options.map(o => strip(o).trim().toLowerCase())).size !== sl.options.length) bad(`slot ${n}: duplicate options`);
      for (let i = 0; i < sl.options.length; i++) if (i !== sl.correct && !(sl.why && strip(sl.why[i]).length >= 15)) bad(`slot ${n}: option ${i + 1} needs a why that names the slip`);
    }
  }
  if (!S.model || strip(S.model).trim().length < 30) bad('specific.model (an answer that earns the point) is required');
  else if (S.write) for (const f of Grade.flags(S, strip(S.model))) if (!f.ok) bad(`specific.model fails its own rule "${f.rule}": ${f.hint}`);
  return out;
}

export function checkItem(q, { topic, map, stimuli, err, idRe }) {
  const w = `item ${q.id || '(no id)'}`;
  if (!q.id || !(idRe || new RegExp(`^hug-${topic.id}-\\d+$`)).test(q.id)) err(`${w}: id must be ${idRe ? 'hug-exam-<form>-<nn>' : `hug-${topic.id}-<n>`}`);
  if (!TYPES.includes(q.type)) err(`${w}: type must be one of ${TYPES.join(', ')}`);
  // Unit, topic and practice are required and never inferred (spec section 1).
  if (!q.unit) err(`${w}: "unit" is required`); else if (q.unit !== topic.chapter) err(`${w}: unit "${q.unit}" is not this topic's chapter "${topic.chapter}"`);
  if (!q.topic) err(`${w}: "topic" is required`); else if (q.topic !== topic.id) err(`${w}: topic "${q.topic}" does not match the file`);
  if (!q.practice) err(`${w}: "practice" is required (a skill id like "2.B")`);
  else if (!SKILL_RE.test(q.practice) || !map.practices.some(p => String(p.id) === q.practice.split('.')[0] && (!p.skills || p.skills.includes(q.practice)))) err(`${w}: practice "${q.practice}" is not a skill id of the framework (e.g. "2.B")`);

  if (q.calc !== undefined) err(`${w}: no "calc" flag: the exam allows no calculator, so no item needs one`);
  for (const t of allStrings({ q: q.q, options: q.options, why: q.why, numeric: q.numeric && { mistakes: q.numeric.mistakes }, specific: q.specific && { model: q.specific.model, slots: q.specific.slots } })) {
    for (const m of mathProblems(t)) err(`${w}: math: ${m}`);
    for (const m of [...excludedProblems(t), ...languageProblems(t), ...datedProblems(t), ...modelProblems(t, { item: true })]) err(`${w}: ${m}`);
  }
  if (!LEVELS.includes(q.level)) err(`${w}: level must be recall, apply or analyze`);
  if (![1, 2, 3].includes(q.diff)) err(`${w}: diff must be 1, 2 or 3`);
  if (!q.q || strip(q.q).trim().length < 12) err(`${w}: no question text`);
  if (q.stimulus && !stimuli[q.stimulus]) err(`${w}: unknown stimulus "${q.stimulus}"`);
  if (!q.why || !q.why.correct) err(`${w}: why.correct missing`);
  const typed = { numeric: [numericProblems, q.numeric || {}], specific: [specificProblems, q.specific], model: [modelItemProblems, q.model] }[q.type];
  if (typed) {
    for (const p of typed[0](typed[1])) err(`${w}: ${p}`);
    if (q.options || q.correct !== undefined) err(`${w}: ${q.type} items have no options or correct`);
  } else {
    const n = (q.options || []).length;
    const min = q.type === 'order' ? 3 : 2;
    if (q.type === 'single' && n !== MCQ_OPTIONS) err(`${w}: a single-answer item has exactly ${MCQ_OPTIONS} options, as on the exam`);
    if (n < min) err(`${w}: needs at least ${min} options`);
    if (n > 6) err(`${w}: at most 6 options`);
    if (new Set((q.options || []).map(o => strip(o).trim().toLowerCase())).size !== n) err(`${w}: duplicate options`);
    if (q.type === 'multi') {
      if (!Array.isArray(q.correct) || !q.correct.length || q.correct.some(i => !(Number.isInteger(i) && i >= 0 && i < n))) err(`${w}: multi needs correct as an array of option indices`);
    } else if (q.type === 'order') {
      if (q.correct !== undefined) err(`${w}: order items list options in the correct order and have no "correct"`);
    } else if (!(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < n)) err(`${w}: correct must be an option index`);
    if (q.type !== 'order' && (!q.why || !Array.isArray(q.why.options) || q.why.options.length !== n || q.why.options.some(x => !x || strip(x).trim().length < 8))) err(`${w}: why.options must explain every option (${n})`);
  }
  const all = [q.why?.correct, ...((q.why && q.why.options) || []), ...(q.variables || []).map(v => v.why)].map(strip).join(' ');
  const m = all.match(POS_RE);
  if (m) err(`${w}: explanation says "${m[0]}"; options are shuffled, so name the option by its content`);
}

/* A numeric item whose question asks for a rate ("... per day",
   "per person") but whose key unit has no "/" (a reviewer found "°C per
   decade" keyed as "°C", so the bare "0.15 °C" passed and "0.15 °C per
   decade" failed). A warning, not an error: "the dose per rat in mg" or "the
   energy per hectare" may rightly key a plain unit when the stem fixes the
   denominator. Only the asking sentences are read; parts per million and
   "per kWh" inside a given price are skipped by that. */
export function rateUnitWarning(q) {
  const unit = q.type === 'numeric' ? q.numeric && q.numeric.unit : undefined;
  if (unit === undefined) return null;
  if (unit && (/\//.test(unit) || /\bper\b/.test(unit) || Grade.normUnit(unit).includes('-'))) return null;
  if (['%', 'times', 'ppm', 'ppb'].includes(unit)) return null;
  const sents = strip(q.q).split(/(?<=[.?])\s+/);
  const ask = sents.filter(x => /\?/.test(x) || /^(Calculate|Give|Find|Write|Estimate|Determine|What)\b/.test(x)).join(' ').replace(/parts per (million|billion)/gi, '').replace(/\bat (?:[^,.?]|\.\d)*\bper\b[^,.?]*,/gi, '');
  const m = ask.match(/\bper\s+(?!cent\b)([a-z]+)/i);
  return m ? `item ${q.id}: the question asks for a rate ("per ${m[1]}") but the key unit "${unit || '(none)'}" has no "/"; key it as a rate (X/${m[1]}) unless the stem fixes the "per" and a plain unit is meant` : null;
}

const textOfItem = q => [q.q, ...(q.options || []), q.why?.correct, ...((q.why && q.why.options) || []),
  ...((q.numeric && q.numeric.mistakes) || []).map(m => m.why),
  q.specific && q.specific.model, ...Object.values((q.specific && q.specific.slots) || {}).flatMap(sl => sl.options || [])].map(x => String(x ?? '')).join('\n');

/* Concepts taught after this topic whose words, or whose notation in $...$
   math, appear in text (outside a declared preview box) break the ordering
   rule: the map's own page scan (scripts/lib/aphug-map.mjs). */
function orderingProblems(map, topicId, texts) {
  return scanPage(map.raw, `<div>${texts.join('\n')}</div>`, topicId).map(p => `ORDER: ${p}`);
}

export function checkTopic(map, id, { glossary, figures }) {
  const errors = [], warns = [];
  const err = m => errors.push(m), warn = m => warns.push(m);
  const topic = map.topicById(id);
  const here = map.topics.indexOf(topic);
  const lp = join(DATA, 'lessons', `${id}.json`), np = join(DATA, 'notes', `${id}.html`), qp = join(DATA, 'questions', `${id}.json`);
  const texts = [];
  let items = [], stimuli = {};

  // --- questions
  if (!exists(qp)) err('no question file');
  else {
    let f;
    try { f = readJson(qp); } catch (e) { err(`questions: invalid JSON (${e.message})`); }
    if (f && (Array.isArray(f) || !Array.isArray(f.items))) err('questions: the file is { "stimuli": {...}, "items": [...] }');
    else if (f) { items = f.items; stimuli = f.stimuli || {}; }
    for (const [sid, s] of Object.entries(stimuli)) {
      if (!new RegExp(`^${id}-s\\d+$`).test(sid)) err(`stimulus ${sid}: id must be ${id}-s<n>`);
      checkStimulus(sid, s, figures, err);
      texts.push([s.title, s.text, s.html, ...(s.table ? [s.table.caption, ...s.table.cols, ...s.table.rows.flat()] : [])].map(x => String(x ?? '')).join('\n'));
    }
    const ids = new Set();
    let higher = 0;
    for (const q of items) {
      if (ids.has(q.id)) err(`item ${q.id}: duplicate id`); ids.add(q.id);
      checkItem(q, { topic, map, stimuli, err });
      if (q.level && q.level !== 'recall') higher++;
      texts.push(textOfItem(q));
    }
    // Stimulus sets: 3-5 items (the exam's sets are 3 or 4; practice may run
    // to 5), consecutive in the file, and 40% of a concept topic's items.
    const bySet = new Map();
    items.forEach((q, i) => { if (q.stimulus) { if (!bySet.has(q.stimulus)) bySet.set(q.stimulus, []); bySet.get(q.stimulus).push(i); } });
    let inSets = 0;
    for (const [sid, idx] of bySet) {
      if (idx.length < SET_MIN || idx.length > SET_MAX) err(`stimulus set ${sid}: ${idx.length} items (a set has ${SET_MIN}-${SET_MAX})`);
      if (idx[idx.length - 1] - idx[0] !== idx.length - 1) err(`stimulus set ${sid}: its items must be consecutive in the file (authored order)`);
      inSets += idx.length;
    }
    for (const sid of Object.keys(stimuli)) if (!bySet.has(sid)) warn(`stimulus ${sid} is used by no item`);
    for (const q of items) { const r = rateUnitWarning(q); if (r) warn(r); }
    if (topic.kind === 'concept' && items.length < MIN_ITEMS) err(`questions: ${items.length}, need at least ${MIN_ITEMS}`);
    if (items.length && higher / items.length < MIN_HIGHER) err(`questions: ${(100 * higher / items.length).toFixed(0)}% apply/analyze; at least 60%`);
    if (topic.kind === 'concept' && items.length && inSets / items.length < MIN_IN_SETS) err(`questions: ${(100 * inSets / items.length).toFixed(0)}% of items are in stimulus sets; at least 40%`);
    const lt = lengthTell(items);
    if (lt) err(`questions: ${lt}`);
  }

  // --- lesson
  if (!exists(lp)) err('no lesson file');
  else {
    let L;
    try { L = readJson(lp); } catch (e) { err(`lesson: invalid JSON (${e.message})`); }
    if (L) {
      if (L.topic !== id) err('lesson: "topic" must be the topic id');
      if (!L.hook || strip(L.hook).length < 80) err('lesson: hook missing (a short real-world opening)');
      if (here > 0 && (!Array.isArray(L.prereq) || L.prereq.length < 2 || L.prereq.length > 3)) err('lesson: prereq needs 2 or 3 questions');
      for (const [i, p] of (L.prereq || []).entries()) {
        if (!Array.isArray(p.options) || !(Number.isInteger(p.correct) && p.correct >= 0 && p.correct < p.options.length)) err(`lesson: prereq ${i + 1} malformed`);
        if (!p.why) err(`lesson: prereq ${i + 1} has no explanation`);
        const rv = map.topicById(p.review);
        if (!rv || map.topics.indexOf(rv) >= here) err(`lesson: prereq ${i + 1} must point "review" at an earlier topic`);
        texts.push([p.q, ...(p.options || []), p.why].map(x => String(x ?? '')).join('\n'));
      }
      if (L.figure !== null && L.figure !== undefined) {
        if (!L.figure.figure) err('lesson: figure.figure missing (use null for no figure)');
        else if (!figures[L.figure.figure]) err(`lesson: unknown figure "${L.figure.figure}"`);
        texts.push(String(L.figure.caption ?? ''));
      } else warn('lesson: no figure (the course is meant to be visual)');
      if (!Array.isArray(L.chain) || L.chain.length < 3) err('lesson: chain needs at least 3 cause-and-effect steps');
      for (const s of L.chain || []) { if (!s.cause || !s.effect) err('lesson: every chain step needs cause and effect'); texts.push(`${s.cause}\n${s.effect}`); }
      if (L.ideas !== undefined) {
        if (!Array.isArray(L.ideas) || L.ideas.some(x => typeof x !== 'string' || !x.trim())) err('lesson: ideas must be a list of short HTML strings');
        else for (const [i, x] of L.ideas.entries()) {
          const words = strip(x).split(/\s+/).filter(Boolean).length;
          if (words > 70) err(`lesson: key idea ${i + 1} is ${words} words (70 at most)`);
          texts.push(x);
        }
      }
      if (!L.misconception || !L.misconception.wrong || !L.misconception.right) err('lesson: misconception needs wrong and right');
      else texts.push(`${L.misconception.wrong}\n${L.misconception.right}`);
      if (!Array.isArray(L.check) || L.check.length < 5 || L.check.length > 8) err('lesson: check needs 5 to 8 item ids');
      const qids = new Set(items.map(q => q.id));
      for (const c of L.check || []) if (!qids.has(c)) err(`lesson: check lists unknown item "${c}"`);
      // A set's panel shows once above its items, so its items sit together.
      const checkSets = (L.check || []).map(c => (items.find(q => q.id === c) || {}).stimulus).filter(Boolean);
      for (const sid of new Set(checkSets)) { const pos = (L.check || []).map((c, i) => (items.find(q => q.id === c) || {}).stimulus === sid ? i : -1).filter(i => i > -1); if (pos[pos.length - 1] - pos[0] !== pos.length - 1) err(`lesson: check items from stimulus ${sid} must be listed together`); }
      if (!L.summary || strip(L.summary).length < 80) err('lesson: summary missing');
      if (L.help !== undefined) err('lesson: "help" is not used in human geography');
      texts.push(String(L.hook ?? ''), String(L.summary ?? ''));
    }
  }

  // --- notes
  let notes = '';
  if (!exists(np)) err('no notes file');
  else {
    notes = readFileSync(np, 'utf8');
    const words = strip(notes).split(/\s+/).filter(Boolean).length;
    if (topic.kind === 'concept' && words < 500) err(`notes: ${words} words; a notes page is a full explanation (500+)`);
    if (!/<h2[\s>]/.test(notes)) err('notes: needs <h2> sections');
    for (const m of [...languageProblems(notes), ...modelProblems(notes)]) err(`notes: ${m}`);
    if (/<h1[\s>]/.test(notes)) err('notes: no <h1> (the generator adds the title)');
    const ids = new Set([...notes.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
    for (const m of notes.matchAll(/<a class="figref" href="#([^"]+)"/g)) if (!ids.has(m[1])) err(`notes: figure reference #${m[1]} points at no figure on the page`);
    for (const m of notes.matchAll(/<figure[^>]*data-fig="([^"]+)"/g)) if (!figures[m[1]]) err(`notes: unknown figure "${m[1]}"`);
    texts.push(notes);
  }

  // --- figures this topic registers
  const fp = join(DATA, 'figures', `${id}.json`);
  if (exists(fp)) {
    let F = {};
    try { F = readJson(fp); } catch (e) { err(`figures: invalid JSON (${e.message})`); }
    for (const [fid, f] of Object.entries(F)) checkFigure(fid, f, err);
  }

  // --- glossary: every concept this topic teaches is defined
  for (const c of map.concepts.filter(c => c.taughtIn === id)) {
    const g = glossary[c.id];
    if (!g || !g.def) err(`glossary: no definition for ${c.id} ("${c.term}")`);
    else texts.push(g.def);
  }

  // --- trademark wording, no CED text, math, ordering
  for (const t of texts) for (const p of trademarkProblems(t)) err(`trademark: ${p}`);
  for (const t of texts) for (const re of CED_PHRASES) if (re.test(strip(t))) err(`CED wording "${strip(t).match(re)[0]}": write in our own words (decision 4)`);
  for (const t of texts) for (const p of mathProblems(t)) if (!errors.some(e => e.endsWith(p))) err(`math: ${p}`);
  for (const p of orderingProblems(map, id, texts)) err(p);
  return { errors, warns, items };
}

/* Figure licenses: our own SVG or public domain, always with a credit; no
   OpenStax material (docs/aphug-spec.md decision 4). */
export function checkFigure(fid, f, err) {
  if (hasApToken(fid)) err(`figure ${fid}: the id contains the token "ap" (it becomes a file name under human-geography/)`);
  if (!ALLOWED_LICENSES.includes(f.license)) err(`figure ${fid}: license "${f.license}" is not allowed (${ALLOWED_LICENSES.join(', ')})`);
  if (!f.credit) err(`figure ${fid}: credit missing`);
  if (!f.alt || f.alt.length < 20) err(`figure ${fid}: alt text missing`);
  if (f.source === 'levlprep') {
    if (f.license !== 'LevlPrep original') err(`figure ${fid}: our own diagrams carry the license "LevlPrep original"`);
    if (f.ext !== 'svg' || !exists(join(ROOT, 'human-geography', 'figures', `${fid}.svg`))) err(`figure ${fid}: our own diagram must be human-geography/figures/${fid}.svg with "ext": "svg"`);
  } else if (f.license === 'LevlPrep original') err(`figure ${fid}: "LevlPrep original" is only for source "levlprep"`);
  else if (f.source === 'public-domain') {
    if (f.license !== 'Public domain') err(`figure ${fid}: a public-domain source carries the license "Public domain"`);
    if (!f.url) err(`figure ${fid}: a public-domain figure records where it came from (url)`);
  } else err(`figure ${fid}: source must be levlprep or public-domain (no OpenStax material in this course)`);
  if (/openstax/i.test(JSON.stringify(f))) err(`figure ${fid}: no OpenStax material in this course`);
  if (f.source !== 'levlprep' && !exists(join(ROOT, 'human-geography', 'figures', `${fid}.${f.ext || 'jpg'}`))) err(`figure ${fid}: file human-geography/figures/${fid}.${f.ext || 'jpg'} is missing`);
}

/* FRQs (spec section 7, docs/aphug-architecture.md "FRQ"): three types,
   named by their stimuli (none, one, two), 7 points each, seven one-point
   parts A to G in order, each with its task verb (VERB_IDS); one rubric
   line a point, a full-credit sample that does what its verb demands. */
export const FRQ_PARTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
/* The topic an FRQ unlocks with: the latest of its topics in course order. */
export function unlockTopic(map, f) {
  const { topicIndex } = indexMap(map.raw);
  return (f.topics || []).slice().sort((a, b) => topicIndex.get(b) - topicIndex.get(a))[0];
}
const FRQ_META = new Set(['id', 'type', 'units', 'topics', 'practices', 'points', 'label', 'verb', 'invented', 'source', 'base', 'render', 'kind']);
const frqTexts = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(frqTexts)
  : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => FRQ_META.has(k) || k === 'plot' || k === 'values' || k === 'points' ? [] : frqTexts(x)) : [];
export function checkFrq(fid, f, map, figures = {}) {
  const errs = [], err = m => errs.push(m);
  if (f.id !== fid) err(`id "${f.id}" must match the file name`);
  if (hasApToken(fid)) err('the id contains the token "ap"');
  if (!(f.type in FRQ_TYPES)) err(`type must be one of ${Object.keys(FRQ_TYPES).join(', ')}`);
  else if (f.points !== FRQ_TYPES[f.type]) err(`every FRQ is worth ${FRQ_TYPES[f.type]} points, not ${f.points}`);
  if (/\$/.test(f.title || '')) err('title is plain text (it becomes the page title and links): no $...$ math in it');
  if (f.calc !== undefined) err('no "calc" flag: the exam allows no calculator');
  for (const k of ['graphSpec', 'drawSpec', 'stimulus', 'study', 'sources', 'restricted']) if (f[k] !== undefined) err(`"${k}" is not used: an FRQ carries its "stimuli" (0, 1 or 2)`);
  for (const p of f.parts || []) if (p.check) err(`part ${p.label}: no "check my number" on human-geography FRQs`);
  for (const t of frqTexts(f)) for (const m of [...excludedProblems(t), ...languageProblems(t), ...datedProblems(t), ...modelProblems(t, { item: true }), ...scaleProblems(t)]) err(m);
  for (const t of frqTexts(f)) for (const m of mathProblems(t)) err(`math: ${m}`);
  // The stimuli: none, one or two, each a stimulus as the bank's (a map, data, an image, a text).
  const want = FRQ_STIMULI[f.type];
  if (!Array.isArray(f.stimuli)) err('stimuli: a list (empty for type none)');
  else {
    if (want !== undefined && f.stimuli.length !== want) err(`a ${f.type} FRQ has ${want} stimul${want === 1 ? 'us' : 'i'}, not ${f.stimuli.length}`);
    f.stimuli.forEach((s, i) => checkStimulus(`stimuli[${i}]`, s, figures, err));
    // Two stimuli are two different sources, not one table split in two.
    if (f.stimuli.length === 2 && f.stimuli[0].kind === f.stimuli[1].kind && JSON.stringify(f.stimuli[0]) === JSON.stringify(f.stimuli[1])) err('the two stimuli are the same');
  }
  if (map) {
    for (const u of f.units || []) if (!map.chapterById(u)) err(`unknown unit "${u}"`);
    for (const t of f.topics || []) if (!map.topicById(t)) err(`unknown topic "${t}"`);
  }
  if (!(f.units || []).length || !(f.topics || []).length || !(f.practices || []).length) err('units, topics and practices are required');
  // Teaching order: an FRQ unlocks with the latest of its topics in course
  // order, so nothing in it may use a term taught after that topic. The
  // practice exams are exempt: they come after the whole course.
  if (map && (f.topics || []).every(t => map.topicById(t))) {
    const at = unlockTopic(map, f);
    for (const t of f.topics) { const c = map.topicById(t).chapter; if (!(f.units || []).includes(c)) err(`topic ${t} is in ${c}; list that unit in "units" too`); }
    const texts = frqTexts(f);
    for (const p of scanPage(map.raw, `<p>${texts.join('</p>\n<p>')}</p>`, at)) err(`ORDER (unlocks with ${at}): ${p}`);
  }
  for (const p of f.practices || []) if (!SKILL_RE.test(p)) err(`practice "${p}" is not a skill id`);
  if (!Array.isArray(f.parts) || !f.parts.length) err('parts missing');
  else {
    const got = f.parts.map(p => `${p.label}:${p.points}`).join(' '), exp = FRQ_PARTS.map(l => `${l}:1`).join(' ');
    if (got !== exp) err(`parts must be the exam's, in order: ${exp} (got ${got})`);
  }
  let sum = 0;
  for (const p of f.parts || []) {
    const w = `part ${p.label || '?'}`;
    if (!p.label || !p.prompt) err(`${w}: label and prompt required`);
    if (!VERB_IDS.includes(p.verb)) err(`${w}: verb must be one of ${VERB_IDS.join(', ')} (the task verb the prompt uses)`);
    else {
      const word = p.verb === 'explain-degree' ? /\bexplain the (degree|extent)\b/i : new RegExp(`\\b${p.verb}\\b`, 'i');
      if (!word.test(strip(p.prompt))) err(`${w}: the prompt does not use its task verb "${p.verb === 'explain-degree' ? 'explain the degree' : p.verb}"`);
    }
    if (p.points !== 1) err(`${w}: every part is worth 1 point`);
    sum += p.points || 0;
    if (!Array.isArray(p.rubric) || p.rubric.length !== 1) err(`${w}: one rubric line (one point)`);
    for (const r of p.rubric || []) if (!r.point || !Array.isArray(r.accept)) err(`${w}: each rubric line has "point" and an "accept" list`);
    if (!p.sample || strip(p.sample).trim().length < 20) err(`${w}: a full-credit sample answer is required`);
    for (const m of verbProblems(p)) err(m);
  }
  if (sum !== f.points) err(`parts add up to ${sum} points, not ${f.points}`);
  for (const t of [JSON.stringify(f)]) for (const p of trademarkProblems(t)) err(`trademark: ${p}`);
  return errs;
}

function glossaryAll() {
  const dir = join(DATA, 'glossary'), all = {};
  if (exists(dir)) for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) Object.assign(all, readJson(join(dir, f)));
  return all;
}
function figuresAll() {
  const dir = join(DATA, 'figures'), all = {};
  if (exists(dir)) for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) Object.assign(all, readJson(join(dir, f)));
  return all;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const map = loadMap();
  const published = new Set(exists(join(DATA, 'published.json')) ? readJson(join(DATA, 'published.json')).chapters || [] : []);
  const glossary = glossaryAll(), figures = figuresAll();
  const dataTopics = new Set(['lessons', 'notes', 'questions'].flatMap(d => exists(join(DATA, d)) ? readdirSync(join(DATA, d)).filter(f => !f.startsWith('.')).map(f => f.replace(/\.(json|html)$/, '')) : []));
  let failed = 0, draft = 0, total = 0;
  const pubItems = [], allItems = [], allStimuli = {};
  if (!map) console.log('AP Human Geography content: no course map yet; checking formats that need no map.');
  const ids = only ? [only] : [...dataTopics].sort();
  for (const id of ids) {
    const topic = map && map.topicById(id);
    if (!topic) {
      const msg = `${id}: ${map ? 'FAIL: not a topic in the map' : 'skipped (no map)'}`;
      console.log(msg);
      continue;
    }
    const r = checkTopic(map, id, { glossary, figures });
    const qf = join(DATA, 'questions', `${id}.json`);
    const stims = exists(qf) ? (readJson(qf).stimuli || {}) : {};
    Object.assign(allStimuli, stims);
    r.items = r.items.map(q => q.stimulus && stims[q.stimulus] ? { ...q, ctx: stims[q.stimulus].title || '' } : q);
    total += r.items.length;
    allItems.push(...r.items);
    const isPub = published.has(topic.chapter);
    if (isPub) pubItems.push(...r.items);
    if (r.errors.length || r.warns.length || only) {
      console.log(`${id}: ${r.errors.length ? 'FAIL' : 'ok'} (${r.items.length} items${isPub ? '' : ', unpublished'})`);
      for (const e of r.errors) console.log(`  FAIL: ${e}`);
      for (const w of r.warns) console.log(`  warning: ${w}`);
    }
    if (r.errors.length) { if (isPub) failed++; else draft++; }
  }
  // Bank-wide rules: they fail on the published bank and print for the whole one.
  const ids2 = new Map();
  for (const q of allItems) { if (ids2.has(q.id)) console.log(`  FAIL: item id ${q.id} is used twice`); ids2.set(q.id, 1); }
  const bankErr = [...testWise(pubItems), ...duplicates(pubItems)];
  for (const e of bankErr) console.log(`bank: FAIL: ${e}`);
  for (const e of [...testWise(allItems), ...duplicates(allItems)]) if (!bankErr.includes(e)) console.log(`bank (with unpublished): ${e}`);
  // FRQs: fail when any of their units is published.
  let frqFails = 0;
  const frqDir = join(DATA, 'frq');
  for (const f of exists(frqDir) ? readdirSync(frqDir).filter(f => f.endsWith('.json')).sort() : []) {
    const fid = f.slice(0, -5), d = readJson(join(frqDir, f));
    const errs = checkFrq(fid, d, map, figures);
    if (errs.length) {
      const pub = (d.units || []).some(u => published.has(u));
      console.log(`frq ${fid}: FAIL${pub ? '' : ' (unpublished)'}`); for (const e of errs) console.log(`  FAIL: ${e}`);
      if (pub) frqFails++;
    }
  }
  // Authored meta text: descriptions and page descriptions carry no "AP" at all (decision 3).
  let metaFails = 0;
  const desc = exists(join(DATA, 'descriptions.json')) ? readJson(join(DATA, 'descriptions.json')) : {};
  for (const [kind, o] of Object.entries(desc)) if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (/\bAP\b/.test(v)) { console.log(`descriptions.json ${kind}.${k}: FAIL: no "AP" in a meta description`); metaFails++; }
  const pages = exists(join(DATA, 'pages.json')) ? readJson(join(DATA, 'pages.json')) : { apps: [] };
  for (const a of pages.apps || []) {
    if (/\bAP\b/.test(a.desc || '')) { console.log(`pages.json ${a.slug}: FAIL: no "AP" in desc (it is the meta description)`); metaFails++; }
    for (const k of ['h1', 'title', 'lede', 'card']) for (const p of trademarkProblems(a[k])) { console.log(`pages.json ${a.slug}.${k}: FAIL: ${p}`); metaFails++; }
    for (const k of ['slug', 'script', 'css']) if (a[k] && [].concat(a[k]).some(hasApToken)) { console.log(`pages.json ${a.slug}: FAIL: ${k} "${a[k]}" contains the token "ap"`); metaFails++; }
  }
  for (const t of pages.tools || []) {
    const bad = m => { console.log(`pages.json tool ${t.slug}: FAIL: ${m}`); metaFails++; };
    if (/\bAP\b/.test(t.desc || '')) bad('no "AP" in desc (it is the meta description)');
    for (const k of ['name', 'title', 'blurb', 'lede']) { if (!t[k] && k !== 'lede') bad(`"${k}" is required`); for (const p of trademarkProblems(t[k])) bad(`${k}: ${p}`); }
    if (!t.slug || hasApToken(t.slug)) bad(`slug "${t.slug}" is missing or contains the token "ap"`);
    if (!['simulator', 'skill', 'drill'].includes(t.kind)) bad('kind must be simulator, skill or drill');
    // A tool is pre-registered (Phase 0) before it has content. Once its data
    // file exists it needs its script, its model file and its validator
    // (docs/aphug-architecture.md, "Tools").
    if (exists(join(DATA, 'tools', `${t.slug}.json`))) {
      if (!exists(join(ROOT, 'human-geography', 'assets', 'tools', `${t.slug}.js`))) bad(`no script human-geography/assets/tools/${t.slug}.js`);
      if (!exists(join(ROOT, 'human-geography', 'assets', 'tools', 'math', `${t.slug}.js`))) bad(`no model file human-geography/assets/tools/math/${t.slug}.js`);
    }
    if (t.studio !== true) bad('every tool is on the Tool Studio ("studio": true)');
    if (typeof t.topic !== 'string' || (map && !map.topicById(t.topic))) bad(`"topic" must be the tool's context topic in the map (got ${JSON.stringify(t.topic)})`);
  }
  // Tools: each content file against its validator (scripts/lib/aphug-tool-checks/<slug>.mjs).
  // They take minutes, so --topic skips them unless --tools asks.
  let toolFails = 0;
  const toolDir = join(DATA, 'tools');
  const runTools = !only || args.includes('--tools');
  for (const f of runTools && exists(toolDir) ? readdirSync(toolDir).filter(f => f.endsWith('.json')).sort() : []) {
    const slug = f.slice(0, -5), v = join(ROOT, 'scripts', 'lib', 'aphug-tool-checks', `${slug}.mjs`);
    if (!exists(v)) { console.log(`tool ${slug}: FAIL: no validator at scripts/lib/aphug-tool-checks/${slug}.mjs`); toolFails++; continue; }
    const { check } = await import(v);
    const errs = check(readJson(join(toolDir, f)), map) || [];
    if (errs.length) { toolFails++; console.log(`tool ${slug}: FAIL`); for (const e of errs) console.log(`  FAIL: ${e}`); }
  }
  // Practice exams and the "Make it specific" trainer (docs/aphug-architecture.md,
  // "Practice exams", "Make it specific"): exam-only items in the bank
  // item format, the two fixed forms, the prompts, and every number recomputed.
  let examFails = 0;
  // Only where the data has them (the test fixture has neither).
  if (map && (exists(join(DATA, 'exams')) || exists(join(DATA, 'justify')))) {
    const ex = loadExams(DATA), prompts = loadJustify(DATA, map);
    const bad2 = m => { console.log(`exams: FAIL: ${m}`); examFails++; };
    const examItems = new Map(ex.items.map(q => [q.id, q]));
    const orderOf = {};
    for (const t of map.topics) { const p = join(DATA, 'questions', `${t.id}.json`); if (exists(p)) readJson(p).items.forEach((q, i) => { orderOf[q.id] = i; }); }
    ex.items.forEach((q, i) => { orderOf[q.id] = i; });
    for (const [sid, s] of Object.entries(ex.stimuli)) { if (!/^exam-\d+-s\d+$/.test(sid)) bad2(`stimulus ${sid}: id must be exam-<form>-s<n>`); checkStimulus(sid, s, figuresAll(), bad2); }
    for (const q of ex.items) {
      const topic = map.topicById(q.topic);
      if (!topic) { bad2(`${q.id}: unknown topic "${q.topic}"`); continue; }
      if (q.type !== 'single') bad2(`${q.id}: exam-only items are four-option single-answer questions`);
      checkItem(q, { topic, map, stimuli: ex.stimuli, err: bad2, idRe: /^hug-exam-\d+-\d{2}$/ });
      // The ordering rule: a full practice exam is taken after the whole course,
      // so nothing outside the course's terms (scanned from its last topic).
      const last = map.topics.filter(t => t.chapter.startsWith('unit-')).pop();
      for (const p of scanPage(map, `<p>${textOfItem(q)}</p>`, last.id)) bad2(`${q.id}: ORDER: ${p}`);
      for (const p of trademarkProblems(textOfItem(q))) bad2(`${q.id}: trademark: ${p}`);
    }
    if (ex.items.length) { const lt = lengthTell(ex.items); if (lt) bad2(`exam-only items: ${lt}`); }
    for (const e of [...testWise(ex.items), ...duplicates([...allItems, ...ex.items.map(q => ({ ...q, topic: `exam:${q.topic}` }))]).filter(e => /hug-exam-/.test(e))]) bad2(e);
    const frqs = {};
    for (const f of exists(frqDir) ? readdirSync(frqDir).filter(f => f.endsWith('.json')) : []) { const d = readJson(join(frqDir, f)); frqs[d.id] = d; }
    const bank = new Map(allItems.map(q => [q.id, q]));
    const stimOf = sid => ex.stimuli[sid] || allStimuli[sid];
    // Lesson check items (on the free lessons) never go in a form: checkForms skips them as set fillers too.
    const lessonChecks = new Set();
    for (const t of map.topics) { const p = join(DATA, 'lessons', `${t.id}.json`); if (exists(p)) for (const id of readJson(p).check || []) lessonChecks.add(id); }
    for (const e of checkForms(ex.forms, { map, bank, examItems, frqs, orderOf: id => orderOf[id], stimuli: stimOf, lessonChecks })) bad2(e);
    for (const e of checkJustify(prompts, { map, trademarkProblems, scanPage })) bad2(e);
    // Spec section 7: 40+ prompts, 6 to 9 per unit and in the research skills
    // chapter (JUSTIFY_PER_CHAPTER).
    if (prompts.length < 40) bad2(`the "Make it specific" trainer has ${prompts.length} prompts; it needs at least 40`);
    for (const u of map.chapters) { const n = prompts.filter(p => p.unit === u.id).length, [lo, hi] = JUSTIFY_PER_CHAPTER; if (n < lo || n > hi) bad2(`${u.id} has ${n} "Make it specific" prompts (${lo} to ${hi})`); }
    for (const k of Object.keys(JUSTIFY_SKILLS)) if (prompts.length && !prompts.some(p => p.skill === k)) bad2(`no "Make it specific" prompt practises "${k}"`);
    // Each form: mostly bank items that are not lesson-check items (those are on
    // the free lessons), plus 12-14 exam-only items of its own.
    for (const f of ex.forms) {
      const ids = (f.mcq || []).flat(), own = ids.filter(id => examItems.has(id)).length;
      if (own < 20 || own > 30) bad2(`${f.id}: ${own} exam-only items (20 to 30)`);
      for (const id of ids.filter(id => lessonChecks.has(id))) bad2(`${f.id}: ${id} is a lesson check item; use one a student has not met on a free lesson`);
    }
    for (const q of ex.items) if (!ex.forms.some(f => (f.mcq || []).flat().includes(q.id))) bad2(`${q.id}: an exam-only item in no form`);
    for (const e of checkNumbers(examItems, prompts)) bad2(e);
    console.log(`AP Human Geography exams: ${ex.forms.length} practice exams, ${ex.items.length} exam-only items, ${prompts.length} "Make it specific" prompts, ${examFails} failing.`);
  }
  const bad = failed + bankErr.length + frqFails + metaFails + toolFails + examFails;
  console.log(`AP Human Geography content: ${ids.length} topics, ${total} items, ${failed} failing${draft ? ` (+${draft} in unpublished chapters)` : ''}; bank ${bankErr.length}, FRQ ${frqFails}, meta ${metaFails}, tools ${toolFails}, exams ${examFails} failing.`);
  if (args.includes('--check') && bad) process.exit(1);
}
