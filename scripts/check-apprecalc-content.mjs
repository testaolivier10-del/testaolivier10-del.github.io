/* The AP® Precalculus content check: every authored file under precalculus/data/ against
   the formats in docs/apprecalc-architecture.md and the rules in docs/apprecalc-spec.md
   and docs/apprecalc-authoring-guide.md. Forked from check-apcalc-content.mjs, with
   the precalculus rules: math in the course's TeX subset (every $...$ must
   render), four-option multiple choice, skills 1.A-3.C (the CED's three
   practices); `expr` items (the key parses, evaluates on its domain, logs
   and inverse trig included, and no authored mistake is graded right; no
   antiderivative mode); numeric items with a calculator flag, an exact or
   three-decimal key and optional units; graph stimuli plotted from a spec;
   the four FRQ types (Q1-Q4), 6 points each, the calculator flag fixed by
   the type; no calculus wording ("increasing at a decreasing rate",
   derivative notation); "Make it specific" prompts; Unit 4 ("beyond the
   exam") never in an exam or an FRQ; pre-registered tools; and no OpenStax
   figures.

     node scripts/check-apprecalc-content.mjs                every topic with content
     node scripts/check-apprecalc-content.mjs --topic <id>   one topic (for authors); the tool
                                                         validators run only in a full run
     node scripts/check-apprecalc-content.mjs --tools        with --topic: run them too
     node scripts/check-apprecalc-content.mjs --check        exit 1 on a failure in a
                                                         PUBLISHED chapter; the rest print
     APPRECALC_DATA=<dir>                                    check another data folder (tests)

   Per topic: lesson, notes, question file (items and stimuli), glossary, the
   ordering rule (no term taught by a later topic, outside a declared preview
   box). Across the bank: the test-wise balance rules (A&P decision 79, via
   scripts/site-rules/anp-test-wise.mjs's limits), near-duplicates across topics
   (A&P decision 78), unique ids. Also every FRQ, every figure's license, and
   the trademark wording in everything authored.

   The map comes from the same loader as the generator (scripts/lib/apprecalc-build.mjs):
   docs/apprecalc-dependency-map.json, else the test fixture when APPRECALC_MAP_STUB=1.
   With no map, formats are still checked, but nothing counts as published. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadMap, ALLOWED_LICENSES, hasApToken, trademarkProblems } from './lib/apprecalc-build.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, JUSTIFY_SKILLS } from './lib/apprecalc-exams.mjs';
import { scanPage } from './lib/apprecalc-map.mjs';
import { Expr, Tex, Plot } from './lib/apprecalc-mathlib.mjs';
export { trademarkProblems };

const DATA = process.env.APPRECALC_DATA || join(ROOT, 'precalculus', 'data');
const args = process.argv.slice(2);
const only = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const exists = p => existsSync(p);
const strip = s => String(s ?? '').replace(/<[^>]+>/g, ' ');

export const TYPES = ['single', 'multi', 'numeric', 'expr', 'order', 'predict'];
export const LEVELS = ['recall', 'apply', 'analyze'];
export const STIM_KINDS = ['table', 'graph', 'diagram'];
// The four free-response questions (framework.md section 5): 6 points each;
// Q1 and Q2 with a calculator, Q3 and Q4 without (FRQ_CALC).
export const FRQ_TYPES = { concepts: 6, modeling: 6, periodic: 6, symbolic: 6 };
export const FRQ_CALC = { concepts: true, modeling: true, periodic: false, symbolic: false };
/* Calculus wording the readers do not expect (framework.md section 3, exclusions):
   checked in every authored string except where a page explains the trap
   (inside .pcalc-trap). Derivative notation is the map's job (concept
   notation); these are the phrases. */
export const CALCULUS_WORDS = [
  [/\b(increasing|decreasing) at an? (increasing|decreasing) rate\b/i, 'say "the rate of change is increasing (or decreasing)", not the calculus phrase'],
  [/\bderivatives?\b/i, 'no derivatives in precalculus: say "rate of change"'],
  [/\binstantaneous rate\b/i, 'precalculus estimates rates with average rates of change over small intervals'],
];
const TRAP_BOX = /<(\w+)[^>]*class="[^"]*\bpcalc-trap\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g;
export function calculusWordProblems(t) {
  const s = String(t ?? '').replace(TRAP_BOX, ' ');
  return CALCULUS_WORDS.filter(([re]) => re.test(s)).map(([, why]) => why);
}
// Multiple choice on the exam has four options (A-D).
export const MCQ_OPTIONS = 4;
export const SKILL_RE = /^[1-3]\.[A-C]$/;
// Skills the exam does not assess: none are marked so in the CED (framework.md section 4).
export const NOT_ASSESSED = [];

/* Every $...$ in a piece of text renders in the course's TeX subset. */
export function mathProblems(t) { return Tex.check(String(t ?? '')); }
const RAW = new Set(['answer', 'expr', 'fn', 'fn2', 'dydx', 'id', 'topic', 'unit', 'type', 'kind', 'stimulus', 'figure', 'practice', 'level', 'answerTex', 'lhs']);
const allStrings = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(allStrings)
  : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => k === 'plot' || k === 'chart' || (RAW.has(k) && typeof x !== 'object') ? [] : allStrings(x)) : [];
export const MIN_ITEMS = 15, MIN_HIGHER = 0.6, MIN_IN_SETS = 0.4, SET_MIN = 4, SET_MAX = 5, LONGEST_MAX = 0.4;
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

function checkStimulus(sid, s, figures, err) {
  const w = `stimulus ${sid}`;
  if (!STIM_KINDS.includes(s.kind)) err(`${w}: kind must be ${STIM_KINDS.join(', ')}`);
  if (!s.title) err(`${w}: title missing`);
  if (!s.html && !s.table && !s.figure && !s.chart && !s.plot) err(`${w}: needs html, table, figure, plot or chart`);
  // A graph is drawn from the function it claims to show: a plot spec,
  // drawn by precalculus/assets/tools/pcalc-plot.js at build time.
  if (s.plot) { try { Plot.svg(s.plot); } catch (e) { err(`${w}: plot: ${e.message}`); } }
  for (const p of allStrings({ title: s.title, text: s.text, html: s.html, table: s.table })) for (const m of mathProblems(p)) err(`${w}: math: ${m}`);
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
  if (s.kind === 'graph' && !s.plot && !s.chart && !s.figure && !/<svg/.test(s.html || '')) err(`${w}: a graph stimulus needs a plot spec (preferred), a chart, a figure or an inline SVG`);
  // A diagram (a ladder against a wall, a cone filling, a solid's cross
  // section) is a picture with a text alternative: our own SVG (inline,
  // role="img" and an aria-label of 20+ characters) or a registered figure.
  if (s.kind === 'diagram') {
    if (!s.figure && !/<svg/.test(s.html || '')) err(`${w}: a diagram stimulus needs an inline SVG or a figure`);
    if (/<svg/.test(s.html || '') && !(/role="img"/.test(s.html) && /aria-label="[^"]{20,}"/.test(s.html))) err(`${w}: the diagram's SVG needs role="img" and an aria-label (20+ characters) that says what the scene shows`);
  }
}

/* A numeric item's key (docs/apprecalc-architecture.md, "Numeric items"): the
   value (a number, or for a no-calculator item an exact expression such as
   "pi/4"), its unit, and the authored slips. calc: the item's calculator
   flag. Returns problems as strings. */
export function numericProblems(N, calc = false) {
  const out = [], bad = m => out.push(m);
  const A = typeof N.answer === 'string' ? Expr.number(N.answer) : N.answer;
  if (!Number.isFinite(A)) { bad('numeric.answer must be a number or an exact expression such as "pi/4" or "sqrt(2)/2"'); return out; }
  for (const k of ['tol', 'rel', 'sigfigs', 'places', 'decimals', 'gAlt']) if (N[k] !== undefined) bad(`numeric.${k} is not used in precalculus: calculator answers follow the three-decimal rule, the rest are exact`);
  if (N.unit !== undefined && typeof N.unit !== 'string') bad('numeric.unit must be a string');
  if (N.units !== undefined && (!Array.isArray(N.units) || N.units.some(u => typeof u !== 'string' || !u))) bad('numeric.units (other accepted spellings) must be a list of strings');
  if (N.askUnit && !N.unit) bad('numeric.askUnit needs numeric.unit');
  // A no-calculator key is exact: an irrational one is written as an expression.
  if (!calc && typeof N.answer === 'number' && !Number.isInteger(N.answer * 1e6)) bad(`numeric.answer ${N.answer} looks rounded; a no-calculator key is exact: write it as an expression ("pi/4", "ln(3)", "sqrt(2)/2")`);
  if (N.answerTex !== undefined) { try { Tex.render(N.answerTex, { strict: true }); } catch (e) { bad(`numeric.answerTex: ${e.message}`); } }
  for (const [i, mk] of (N.mistakes || []).entries()) {
    const mv = typeof mk.value === 'string' ? Expr.number(mk.value) : mk.value;
    if (!Number.isFinite(mv)) bad(`numeric.mistakes[${i}].value must be a number or an exact expression`);
    else {
      const r3 = x => Math.sign(x) * Math.round(Math.abs(x) * 1000 + 1e-7) / 1000, t3 = x => Math.sign(x) * Math.floor(Math.abs(x) * 1000 + 1e-7) / 1000;
      if (Math.abs(mv - A) <= 1e-9 * Math.max(1, Math.abs(A)) || [r3(mv), t3(mv)].some(x => [r3(A), t3(A)].some(y => Math.abs(x - y) < 1e-9))) bad(`numeric.mistakes[${i}] (${mk.value}) is graded right (same value to three decimal places), so it can never be shown`);
    }
    if (!mk.why || strip(mk.why).trim().length < 20) bad(`numeric.mistakes[${i}] needs a "why" that names the slip and how to fix it`);
  }
  if (N.mistakes !== undefined && !Array.isArray(N.mistakes)) bad('numeric.mistakes must be a list');
  return out;
}

/* An expr item's key (docs/apprecalc-architecture.md, "expr items"): the
   answer parses in the student syntax with its variables, is a finite
   number at most sample points of its domain (so grading compares enough
   points), and every authored mistake parses and is graded wrong. */
// No antiderivatives in precalculus: only exact comparison (the parser's 'constant' mode stays for the shared code).
export const EXPR_MODES = ['exact'];
export function exprProblems(E) {
  const out = [], bad = m => out.push(m);
  if (!E || typeof E !== 'object') { bad('expr item needs an "expr" object'); return out; }
  const vars = E.vars || ['x'];
  if (!Array.isArray(vars) || !vars.length || vars.some(v => !/^([a-zA-Z]|theta)$/.test(v) || v === 'e' || v === 'C')) bad('expr.vars must be single letters other than e and C (or theta)');
  if (E.mode !== undefined && !EXPR_MODES.includes(E.mode)) bad(`expr.mode must be ${EXPR_MODES.join(' or ')}`);
  if (E.needC !== undefined && typeof E.needC !== 'boolean') bad('expr.needC must be true or false');
  const dom = E.domain;
  const okDom = d => Array.isArray(d) && d.length === 2 && d.every(Number.isFinite) && d[0] < d[1];
  if (dom !== undefined && !(okDom(dom) || (dom && typeof dom === 'object' && vars.every(v => okDom(dom[v]))))) bad('expr.domain must be [a, b] or { var: [a, b] } with a < b');
  if (typeof E.answer !== 'string' || !E.answer.trim()) { bad('expr.answer must be the key as a string in the student syntax ("2x*cos(x^2)")'); return out; }
  const r = Expr.read(E.answer, { vars });
  if (!r.ok) { bad(`expr.answer "${E.answer}" does not parse: ${r.error}`); return out; }
  const self = Expr.compare(E.answer, E.answer, { vars, domain: dom, mode: 'exact', seed: E.seed });
  if (self.tooFew || self.used < 30) bad(`expr.answer is a real number at only ${self.used} of 40 sample points of its domain; choose a domain where it is defined`);
  if (E.lhs !== undefined) { try { Tex.render(E.lhs, { strict: true }); } catch (e) { bad(`expr.lhs: ${e.message}`); } }
  if (E.answerTex !== undefined) { try { Tex.render(E.answerTex, { strict: true }); } catch (e) { bad(`expr.answerTex: ${e.message}`); } }
  for (const [i, m] of (E.mistakes || []).entries()) {
    const mr = Expr.read(String(m.expr || ''), { vars, allowC: E.mode === 'constant' });
    if (!mr.ok) { bad(`expr.mistakes[${i}].expr does not parse: ${mr.error}`); continue; }
    const c = Expr.compare(String(m.expr), E.answer, { vars, domain: dom, mode: E.mode || 'exact', seed: E.seed });
    if (c.equal) bad(`expr.mistakes[${i}] (${m.expr}) is equivalent to the key, so it is graded right and its feedback never shows`);
    if (!m.why || strip(m.why).trim().length < 20) bad(`expr.mistakes[${i}] needs a "why" that names the slip and how to fix it`);
  }
  // The key graded through the runtime: right as written, and with + C when it is an antiderivative.
  const g = Expr.grade({ expr: E }, E.answer + (E.mode === 'constant' ? ' + C' : ''));
  if (!g.correct) bad('expr.answer is not graded right by ApPrecalcExpr.grade');
  return out;
}

export function checkItem(q, { topic, map, stimuli, err, idRe }) {
  const w = `item ${q.id || '(no id)'}`;
  if (!q.id || !(idRe || new RegExp(`^pcalc-${topic.id}-\\d+$`)).test(q.id)) err(`${w}: id must be ${idRe ? 'pcalc-exam-<form>-<nn>' : `pcalc-${topic.id}-<n>`}`);
  if (!TYPES.includes(q.type)) err(`${w}: type must be one of ${TYPES.join(', ')}`);
  // Unit, topic and practice are required and never inferred (spec section 1).
  if (!q.unit) err(`${w}: "unit" is required`); else if (q.unit !== topic.chapter) err(`${w}: unit "${q.unit}" is not this topic's chapter "${topic.chapter}"`);
  if (!q.topic) err(`${w}: "topic" is required`); else if (q.topic !== topic.id) err(`${w}: topic "${q.topic}" does not match the file`);
  if (!q.practice) err(`${w}: "practice" is required (a skill id like "2.B")`);
  else if (!SKILL_RE.test(q.practice) || !map.practices.some(p => String(p.id) === q.practice.split('.')[0] && (!p.skills || p.skills.includes(q.practice)))) err(`${w}: practice "${q.practice}" is not a skill id of the framework (e.g. "2.B")`);
  else if (NOT_ASSESSED.includes(q.practice)) err(`${w}: skill ${q.practice} is not assessed on the exam; tag the skill the item exercises`);
  if (q.calc !== undefined && typeof q.calc !== 'boolean') err(`${w}: "calc" must be true (graphing calculator, exam Part B) or left out`);
  for (const t of allStrings({ q: q.q, options: q.options, why: q.why, variables: q.variables, numeric: q.numeric && { mistakes: q.numeric.mistakes }, expr: q.expr && { mistakes: q.expr.mistakes } })) {
    for (const m of mathProblems(t)) err(`${w}: math: ${m}`);
    for (const m of calculusWordProblems(t)) err(`${w}: calculus wording: ${m}`);
  }
  // Unit 4 is beyond the exam: its items are practice, never exam items (spec decision 7).
  if (map.chapterById(topic.chapter) && map.chapterById(topic.chapter).beyondExam && idRe) err(`${w}: Unit 4 is beyond the exam; no exam-only item comes from it`);
  if (!LEVELS.includes(q.level)) err(`${w}: level must be recall, apply or analyze`);
  if (![1, 2, 3].includes(q.diff)) err(`${w}: diff must be 1, 2 or 3`);
  if (!q.q || strip(q.q).trim().length < 12) err(`${w}: no question text`);
  if (q.stimulus && !stimuli[q.stimulus]) err(`${w}: unknown stimulus "${q.stimulus}"`);
  if (!q.why || !q.why.correct) err(`${w}: why.correct missing`);
  if (q.type === 'numeric') {
    const N = q.numeric || {};
    for (const p of numericProblems(N, !!q.calc)) err(`${w}: ${p}`);
    if (q.options || q.correct !== undefined) err(`${w}: numeric items have no options or correct`);
  } else if (q.type === 'expr') {
    for (const p of exprProblems(q.expr)) err(`${w}: ${p}`);
    if (q.options || q.correct !== undefined) err(`${w}: expr items have no options or correct`);
    if (q.calc) err(`${w}: an expr item is a no-calculator item (an expression is the answer)`);
  } else if (q.type === 'predict') {
    if (!Array.isArray(q.variables) || q.variables.length < 2) err(`${w}: predict needs 2+ variables`);
    for (const v of q.variables || []) {
      if (!['up', 'down', 'none'].includes(v.answer)) err(`${w}: variable "${v.name}" answer must be up, down or none`);
      if (!v.why || v.why.length < 20) err(`${w}: variable "${v.name}" needs a causal explanation`);
    }
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

const textOfItem = q => [q.q, ...(q.options || []), q.why?.correct, ...((q.why && q.why.options) || []), ...(q.variables || []).flatMap(v => [v.name, v.why]),
  ...((q.expr && q.expr.mistakes) || []).map(m => m.why), ...((q.numeric && q.numeric.mistakes) || []).map(m => m.why)].map(x => String(x ?? '')).join('\n');

/* Concepts taught after this topic whose words, or whose notation in $...$
   math, appear in text (outside a declared preview box) break the ordering
   rule: the map's own page scan (scripts/lib/apprecalc-map.mjs). */
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
    // Stimulus sets: 4-5 items, consecutive in the file, and 40% of a concept topic's items.
    const bySet = new Map();
    items.forEach((q, i) => { if (q.stimulus) { if (!bySet.has(q.stimulus)) bySet.set(q.stimulus, []); bySet.get(q.stimulus).push(i); } });
    let inSets = 0;
    for (const [sid, idx] of bySet) {
      if (idx.length < SET_MIN || idx.length > SET_MAX) err(`stimulus set ${sid}: ${idx.length} items (a set has ${SET_MIN}-${SET_MAX})`);
      if (idx[idx.length - 1] - idx[0] !== idx.length - 1) err(`stimulus set ${sid}: its items must be consecutive in the file (authored order)`);
      if (idx.some(i => !!items[i].calc !== !!items[idx[0]].calc)) err(`stimulus set ${sid}: its items are all calculator items or all not (one exam part)`);
      inSets += idx.length;
    }
    for (const sid of Object.keys(stimuli)) if (!bySet.has(sid)) warn(`stimulus ${sid} is used by no item`);
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

  // --- trademark wording, math, ordering
  for (const t of texts) for (const p of trademarkProblems(t)) err(`trademark: ${p}`);
  for (const t of texts) for (const p of mathProblems(t)) if (!errors.some(e => e.endsWith(p))) err(`math: ${p}`);
  for (const t of texts) for (const p of calculusWordProblems(t)) err(`calculus wording: ${p}`);
  // Unit 4's one line (spec decision 7) comes from the generator; a lesson or notes page never pastes it.
  if (texts.some(t => /does not test this unit/.test(t))) err('the "beyond the exam" line is added by the generator; do not paste it');
  for (const p of orderingProblems(map, id, texts)) err(p);
  return { errors, warns, items };
}

/* Figure licenses: our own SVG or public domain, always with a credit; no
   OpenStax material (docs/apprecalc-spec.md decision 4). */
export function checkFigure(fid, f, err) {
  if (hasApToken(fid)) err(`figure ${fid}: the id contains the token "ap" (it becomes a file name under precalculus/)`);
  if (!ALLOWED_LICENSES.includes(f.license)) err(`figure ${fid}: license "${f.license}" is not allowed (${ALLOWED_LICENSES.join(', ')})`);
  if (!f.credit) err(`figure ${fid}: credit missing`);
  if (!f.alt || f.alt.length < 20) err(`figure ${fid}: alt text missing`);
  if (f.source === 'levlprep') {
    if (f.license !== 'LevlPrep original') err(`figure ${fid}: our own diagrams carry the license "LevlPrep original"`);
    if (f.ext !== 'svg' || !exists(join(ROOT, 'precalculus', 'figures', `${fid}.svg`))) err(`figure ${fid}: our own diagram must be precalculus/figures/${fid}.svg with "ext": "svg"`);
  } else if (f.license === 'LevlPrep original') err(`figure ${fid}: "LevlPrep original" is only for source "levlprep"`);
  else if (f.source === 'public-domain') {
    if (f.license !== 'Public domain') err(`figure ${fid}: a public-domain source carries the license "Public domain"`);
    if (!f.url) err(`figure ${fid}: a public-domain figure records where it came from (url)`);
  } else err(`figure ${fid}: source must be levlprep or public-domain (no OpenStax material in this course)`);
  if (/openstax/i.test(JSON.stringify(f))) err(`figure ${fid}: no OpenStax material in this course`);
  if (f.source !== 'levlprep' && !exists(join(ROOT, 'precalculus', 'figures', `${fid}.${f.ext || 'jpg'}`))) err(`figure ${fid}: file precalculus/figures/${fid}.${f.ext || 'jpg'} is missing`);
}

/* FRQs (spec section 1): rubric points add up, every part has a sample. */
export function checkFrq(fid, f, map, figures = {}) {
  const errs = [], err = m => errs.push(m);
  if (f.id !== fid) err(`id "${f.id}" must match the file name`);
  if (hasApToken(fid)) err('the id contains the token "ap"');
  if (!(f.type in FRQ_TYPES)) err(`type must be one of ${Object.keys(FRQ_TYPES).join(', ')}`);
  else if (f.points !== FRQ_TYPES[f.type]) err(`every FRQ is worth ${FRQ_TYPES[f.type]} points, not ${f.points}`);
  if (/\$/.test(f.title || '')) err('title is plain text (it becomes the page title and links): no $...$ math in it');
  if (typeof f.calc !== 'boolean') err('"calc" is required: true for Q1 and Q2 (Part A, graphing calculator), false for Q3 and Q4 (Part B)');
  else if (f.type in FRQ_CALC && f.calc !== FRQ_CALC[f.type]) err(`a ${f.type} question is ${FRQ_CALC[f.type] ? 'Part A: calc true' : 'Part B: calc false'}`);
  for (const t of allStrings(f)) for (const m of calculusWordProblems(t)) err(`calculus wording: ${m}`);
  if (f.graphSpec && (!f.graphSpec.x || !f.graphSpec.y)) err('graphSpec needs x and y axes (the blank grid the student sketches on)');
  if (f.drawSpec) err('drawSpec is not used in precalculus; sketches go on a graphSpec grid');
  for (const p of f.parts || []) {
    if (p.space !== undefined && !['lines', 'graph'].includes(p.space)) err(`part ${p.label}: space must be lines or graph`);
    if (p.space === 'graph' && !f.graphSpec) err(`part ${p.label}: space "graph" needs a graphSpec`);
  }
  for (const t of allStrings(f)) for (const m of mathProblems(t)) err(`math: ${m}`);
  if (map) {
    for (const u of f.units || []) if (map.chapterById(u) && map.chapterById(u).beyondExam) err(`unit "${u}" is beyond the exam; FRQs come from Units 1-3`);
    for (const u of f.units || []) if (!map.chapterById(u)) err(`unknown unit "${u}"`);
    for (const t of f.topics || []) if (!map.topicById(t)) err(`unknown topic "${t}"`);
  }
  if (!(f.units || []).length || !(f.topics || []).length || !(f.practices || []).length) err('units, topics and practices are required');
  for (const p of f.practices || []) if (!SKILL_RE.test(p)) err(`practice "${p}" is not a skill id`);
  if (!f.stimulus) err('stimulus missing');
  else if (typeof f.stimulus === 'object') checkStimulus('(frq)', f.stimulus, figures, err);
  if (!Array.isArray(f.parts) || !f.parts.length) err('parts missing');
  let sum = 0;
  for (const p of f.parts || []) {
    const w = `part ${p.label || '?'}`;
    if (!p.label || !p.prompt) err(`${w}: label and prompt required`);
    if (!Number.isInteger(p.points) || p.points < 1) err(`${w}: points must be a whole number`);
    sum += p.points || 0;
    if (!Array.isArray(p.rubric) || p.rubric.length !== p.points) err(`${w}: one rubric line per point (${p.points})`);
    for (const r of p.rubric || []) if (!r.point || !Array.isArray(r.accept)) err(`${w}: each rubric line has "point" and an "accept" list`);
    if (!p.sample || strip(p.sample).trim().length < 20) err(`${w}: a full-credit sample answer is required`);
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
  const pubItems = [], allItems = [];
  if (!map) console.log('AP Precalculus content: no course map yet; checking formats that need no map.');
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
    // (docs/apprecalc-architecture.md, "Tools").
    if (exists(join(DATA, 'tools', `${t.slug}.json`))) {
      if (!exists(join(ROOT, 'precalculus', 'assets', 'tools', `${t.slug}.js`))) bad(`no script precalculus/assets/tools/${t.slug}.js`);
      if (!exists(join(ROOT, 'precalculus', 'assets', 'tools', 'math', `${t.slug}.js`))) bad(`no model file precalculus/assets/tools/math/${t.slug}.js`);
    }
    if (t.studio !== true) bad('every tool is on the Tool Studio ("studio": true)');
    if (typeof t.topic !== 'string' || (map && !map.topicById(t.topic))) bad(`"topic" must be the tool's context topic in the map (got ${JSON.stringify(t.topic)})`);
  }
  // Tools: each content file against its validator (scripts/lib/apprecalc-tool-checks/<slug>.mjs).
  // They take minutes, so --topic skips them unless --tools asks.
  let toolFails = 0;
  const toolDir = join(DATA, 'tools');
  const runTools = !only || args.includes('--tools');
  for (const f of runTools && exists(toolDir) ? readdirSync(toolDir).filter(f => f.endsWith('.json')).sort() : []) {
    const slug = f.slice(0, -5), v = join(ROOT, 'scripts', 'lib', 'apprecalc-tool-checks', `${slug}.mjs`);
    if (!exists(v)) { console.log(`tool ${slug}: FAIL: no validator at scripts/lib/apprecalc-tool-checks/${slug}.mjs`); toolFails++; continue; }
    const { check } = await import(v);
    const errs = check(readJson(join(toolDir, f)), map) || [];
    if (errs.length) { toolFails++; console.log(`tool ${slug}: FAIL`); for (const e of errs) console.log(`  FAIL: ${e}`); }
  }
  // Practice exams and the justification trainer (docs/apprecalc-architecture.md,
  // "Practice exams", "Justification trainer"): exam-only items in the bank
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
      checkItem(q, { topic, map, stimuli: ex.stimuli, err: bad2, idRe: /^pcalc-exam-\d+-\d{2}$/ });
      // The ordering rule: a full practice exam is taken after the whole course,
      // so nothing outside the course's terms (scanned from its last topic).
      const last = map.topics.filter(t => t.chapter.startsWith('unit-')).pop();
      for (const p of scanPage(map, `<p>${textOfItem(q)}</p>`, last.id)) bad2(`${q.id}: ORDER: ${p}`);
      for (const p of trademarkProblems(textOfItem(q))) bad2(`${q.id}: trademark: ${p}`);
    }
    if (ex.items.length) { const lt = lengthTell(ex.items); if (lt) bad2(`exam-only items: ${lt}`); }
    for (const e of [...testWise(ex.items), ...duplicates([...allItems, ...ex.items.map(q => ({ ...q, topic: `exam:${q.topic}` }))]).filter(e => /pcalc-exam-/.test(e))]) bad2(e);
    const frqs = {};
    for (const f of exists(frqDir) ? readdirSync(frqDir).filter(f => f.endsWith('.json')) : []) { const d = readJson(join(frqDir, f)); frqs[d.id] = d; }
    const bank = new Map(allItems.map(q => [q.id, q]));
    for (const e of checkForms(ex.forms, { map, bank, examItems, frqs, orderOf: id => orderOf[id] })) bad2(e);
    for (const e of checkJustify(prompts, { map, trademarkProblems, scanPage })) bad2(e);
    // "Make it specific" (spec decision 11): Phase 3 writes 30+ prompts, 8-12 per exam unit; Unit 4 has none.
    if (prompts.length && prompts.length < 30) bad2(`the "Make it specific" trainer has ${prompts.length} prompts; it needs at least 30`);
    for (const u of map.chapters.filter(c => c.part === 'course')) { const n = prompts.filter(p => p.unit === u.id).length; if (u.beyondExam ? n : prompts.length && (n < 8 || n > 12)) bad2(`${u.id} has ${n} "Make it specific" prompts (${u.beyondExam ? 'none: beyond the exam' : '8 to 12'})`); }
    for (const k of Object.keys(JUSTIFY_SKILLS)) if (prompts.length && !prompts.some(p => p.skill === k)) bad2(`no "Make it specific" prompt practises "${k}"`);
    for (const p of prompts.filter(p => p.specific)) for (const [k, sl] of Object.entries(p.specific.slots || {})) {
      if (!sl.label || !Array.isArray(sl.options) || sl.options.length < 2 || sl.options.length > 4 || !Number.isInteger(sl.correct) || !sl.options[sl.correct]) bad2(`${p.id}: builder slot ${k} needs a label, 2-4 options and a correct index`);
      for (let i = 0; i < (sl.options || []).length; i++) if (i !== sl.correct && !(sl.why && sl.why[i])) bad2(`${p.id}: builder slot ${k} option ${i} needs a why (the note shown when it is picked)`);
    }
    // Each form: mostly bank items that are not lesson-check items (those are on
    // the free lessons), plus 12-14 exam-only items of its own.
    const lessonChecks = new Set();
    for (const t of map.topics) { const p = join(DATA, 'lessons', `${t.id}.json`); if (exists(p)) for (const id of readJson(p).check || []) lessonChecks.add(id); }
    for (const f of ex.forms) {
      const ids = (f.mcq || []).flat(), own = ids.filter(id => examItems.has(id)).length;
      if (own > 20) bad2(`${f.id}: ${own} exam-only items (at most 20; the rest from the bank)`);
      for (const id of ids.filter(id => lessonChecks.has(id))) bad2(`${f.id}: ${id} is a lesson check item; use one a student has not met on a free lesson`);
    }
    for (const q of ex.items) if (!ex.forms.some(f => (f.mcq || []).flat().includes(q.id))) bad2(`${q.id}: an exam-only item in no form`);
    for (const e of checkNumbers(examItems, prompts)) bad2(e);
    console.log(`AP Precalculus exams: ${ex.forms.length} practice exams, ${ex.items.length} exam-only items, ${prompts.length} "Make it specific" prompts, ${examFails} failing.`);
  }
  const bad = failed + bankErr.length + frqFails + metaFails + toolFails + examFails;
  console.log(`AP Precalculus content: ${ids.length} topics, ${total} items, ${failed} failing${draft ? ` (+${draft} in unpublished chapters)` : ''}; bank ${bankErr.length}, FRQ ${frqFails}, meta ${metaFails}, tools ${toolFails}, exams ${examFails} failing.`);
  if (args.includes('--check') && bad) process.exit(1);
}
