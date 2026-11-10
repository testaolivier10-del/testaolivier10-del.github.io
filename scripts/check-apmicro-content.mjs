/* The AP® Microeconomics content check: every authored file under
   microeconomics/data/ against the formats in docs/apmicro-architecture.md
   and the rules in docs/apmicro-spec.md and docs/apmicro-authoring-guide.md.
   Forked from check-appsych-content.mjs, with the microeconomics rules:
   math in the course's TeX subset (every $...$ must render), four-option
   multiple choice (MCQ_OPTIONS, needs-author mcq-options), the CED skills
   (1.A-3.C on multiple choice; graphing 4.A-4.C only on graph items, as the
   exam assesses it only in Section II); numeric items whose key is
   recomputed by ApMicroCalc from its recipe (`from`) and every authored
   mistake graded wrong; graph items (ApMicroGraph.check: a known graph,
   known curves, a key whose stated outcome the key's shifts give, a cause
   for the slip feedback); "Make it specific" items (slots graded exactly, a
   model answer that passes its own flags); the set kinds (data, graph,
   text); plot stimuli drawn from their data; the FRQ types (long, 10
   points; short, 5 points), each graph part checked as a graph item and
   each rubric point marked `auto` matching a graph check; invented data
   labelled as invented; no reproduced CED text and no released questions;
   pre-registered tools; and no OpenStax figures.

     node scripts/check-apmicro-content.mjs                every topic with content
     node scripts/check-apmicro-content.mjs --topic <id>   one topic (for authors); the tool
                                                         validators run only in a full run
     node scripts/check-apmicro-content.mjs --tools        with --topic: run them too
     node scripts/check-apmicro-content.mjs --check        exit 1 on a failure in a
                                                         PUBLISHED chapter; the rest print
     APMICRO_DATA=<dir>                                    check another data folder (tests)

   Per topic: lesson, notes, question file (items and stimuli), glossary, the
   ordering rule (no term taught by a later topic, outside a declared preview
   box). Across the bank: the test-wise balance rules (A&P decision 79, via
   scripts/site-rules/anp-test-wise.mjs's limits), near-duplicates across topics
   (A&P decision 78), unique ids. Also every FRQ, every figure's license, and
   the trademark wording in everything authored.

   The map comes from the same loader as the generator (scripts/lib/apmicro-build.mjs):
   docs/apmicro-dependency-map.json, else the test fixture when APMICRO_MAP_STUB=1.
   With no map, formats are still checked, but nothing counts as published. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadMap, ALLOWED_LICENSES, hasApToken, trademarkProblems, fromValue, specificSlots } from './lib/apmicro-build.mjs';
import { loadExams, loadJustify, checkForms, checkJustify, checkNumbers, checkFifth, checkGraphs, checkMatrices, examVersion, JUSTIFY_SKILLS, JUSTIFY_PER_CHAPTER, JUSTIFY_PER_SKILLS_CHAPTER, MCQ_OPTIONS as EXAM_OPTIONS } from './lib/apmicro-exams.mjs';
import { scanPage, indexMap } from './lib/apmicro-map.mjs';
import { Tex, Plot, Grade, Stats, Graph, Matrix } from './lib/apmicro-mathlib.mjs';
export { trademarkProblems };

const DATA = process.env.APMICRO_DATA || join(ROOT, 'microeconomics', 'data');
const args = process.argv.slice(2);
const only = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const exists = p => existsSync(p);
const strip = s => String(s ?? '').replace(/<[^>]+>/g, ' ');

export const TYPES = ['single', 'multi', 'numeric', 'specific', 'order', 'graph', 'matrix'];
export const LEVELS = ['recall', 'apply', 'analyze'];
// The kinds of multiple-choice set: data (a table, chart or plot), a graph, a text scenario.
export const STIM_KINDS = ['data', 'graph', 'text'];
// The free-response questions of May 2027 (framework.md section 5): long 10, short 5.
export const FRQ_TYPES = { long: 10, short: 5 };
/* Out of scope for the course, in items: calculus notation, indifference
   curves (excluded by the CED, 1.6), a graphed quota (excluded by the CED,
   2.9: a quota's effect on quantities is in), macroeconomics topics (another
   course) and a calculator beyond four functions. Notes may mention one in
   <aside class="going-further">. */
export const EXCLUDED = [
  [/\\int|\\lim\b|\\frac\{d\}\{d[a-z]\}|\\frac\{dy\}/, 'calculus notation'],
  [/\b(indifference curves?|budget lines? tangent)\b/i, 'indifference curves (beyond the course, CED 1.6)'],
  [/\b(draw|graph|shade|show)\b[^.?]{0,40}\b(import )?quotas?\b[^.?]{0,20}\b(on|in) (the|a|your) graph\b/i, 'a graphed quota (beyond the course, CED 2.9; its effect on quantities is in)'],
  [/\b(aggregate demand|aggregate supply|real GDP|monetary policy|fiscal policy|money multiplier|Phillips curve|loanable funds)\b/i, 'a macroeconomics topic (AP® Macroeconomics, not this course)'],
  [/\b(graphing|scientific) calculator\b/i, 'a graphing or scientific calculator (the exam allows a four-function calculator only)'],
];
/* Reader-report slips the course never teaches as fact (spec section 2,
   framework.md section 7, the authoring guide): a page may name one only to
   correct it, inside an element with the class "mic-slip". */
export const MYTHS = [
  [/\b(monopol\w*|firm)\b[^.]{0,60}\b(price|charges?)\b[^.]{0,30}\b(read|found|set|determined) (from|on|off|at) (the )?(MR|marginal revenue)( curve)?\b/i, 'the monopoly price read from MR (it is read from demand above the quantity where MR = MC)'],
  [/\b(perfectly )?competitive firm'?s? (demand|d)( curve)? (is |slopes |sloping )?(downward|down)/i, "a competitive firm's demand sloping downward (it is horizontal: d = MR = AR = P)"],
  [/\bmarginal cost\b[^.]{0,20}\bis (just |simply )?the change in total cost\b(?![^.]{0,40}\b(divided|per|over)\b)/i, 'marginal cost as the change in total cost without dividing by the change in output'],
  [/\b(positive|greater than zero) cross[- ]price elasticity\b[^.]{0,60}\bcomplements?\b|\b(negative|less than zero) cross[- ]price elasticity\b[^.]{0,60}\bsubstitutes?\b/i, 'the sign of cross-price elasticity reversed (positive: substitutes; negative: complements)'],
  [/\b(inelastic|elastic) because (the|its) (elasticity|coefficient) is negative\b/i, 'elasticity read from its sign (read the absolute value)'],
  [/\blump[- ]sum tax\b[^.]{0,40}\b(raises|shifts|increases) (the )?(MC|marginal cost|supply)\b/i, 'a lump-sum tax changing MC (it changes ATC only; price and quantity stay)'],
  [/\bMRP\s*=\s*MR\s*(×|x|\*|times)\s*P\b|\bmarginal revenue product (equals|is) (MR|marginal revenue) (times|×) (the )?price\b/i, 'MRP as MR times P (MRP = MP × MR)'],
  [/\bmonopsonist?\b[^.]{0,60}\b(wage|pays)\b[^.]{0,30}\b(read )?(from|on) (the )?(MRP|marginal revenue product|MFC|marginal factor cost)( curve)?\b/i, 'the monopsony wage read from MRP or MFC (it is read from labor supply)'],
  [/\bshuts? down\b[^.]{0,50}\bbelow (the )?(minimum (of )?)?(ATC|average total cost)\b/i, 'shutting down below minimum ATC (the short-run shutdown point is minimum AVC)'],
  [/\bdominant strategy\b[^.]{0,40}\b(highest|largest|biggest) (single )?payoff\b/i, 'a dominant strategy as the strategy with the highest payoff (it wins every comparison)'],
  [/\b(supply|demand) is (greater|more|larger|less|smaller) than (supply|demand)\b/i, 'supply greater than demand (compare quantity supplied with quantity demanded)'],
  [/\b(firms )?enter (the market )?because (of )?(demand|higher demand) (rises|increases)\b/i, 'entry because demand rises (firms enter because of economic profit)'],
];
const MYTH_BOX = /<(\w+)[^>]*class="[^"]*\bmic-slip\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g;
export function mythProblems(t) {
  const plain = strip(String(t ?? '').replace(MYTH_BOX, ' '));
  return MYTHS.filter(([re]) => re.test(plain)).map(([, what]) => `teaches a slip: ${what}; name it only inside a "mic-slip" box that corrects it`);
}
/* Plain, neutral language about economic policy (the authoring guide): no
   party politics, no named politicians. */
export const LANGUAGE = [
  [/\b(Democrats?|Republicans?|liberals?|conservatives?|left-wing|right-wing)\b/, 'party politics (keep policy examples neutral)'],
];
export function languageProblems(t) { const p = strip(t); return LANGUAGE.filter(([re]) => re.test(p)).map(([, what]) => `language: ${what}`); }
// A real data source is cited by publisher and year: "Bureau of Labor Statistics (2025)".
export const CITATION = /[A-Z][A-Za-z'’.-]+(?: [A-Za-z'’.-]+){0,6},? \(?(19\d\d|20\d\d)\)?/;
export function excludedProblems(t) {
  const out = [];
  for (const [re, what] of EXCLUDED) if (re.test(String(t ?? ''))) out.push(`mentions ${what}`);
  return out;
}
// Single-answer questions in the practice bank have four options. The exam
// has five, (A) to (E) (needs-author mcq-options): a practice exam adds a
// fifth to each bank question it uses (data/exams/fifth.json), and its
// exam-only questions have five (EXAM_OPTIONS, scripts/lib/apmicro-exams.mjs).
export const MCQ_OPTIONS = 4;
export const SKILL_RE = /^[1-4]\.[A-D]$/;
// Graphing (practice 4) is assessed only in Section II (framework.md
// section 4): only a graph item may focus on it.
export const NOT_ASSESSED = ['4.A', '4.B', '4.C'];
/* No CED text reproduced (decision 4): a phrase of 12+ words from the CED
   map's objectives or knowledge lines would be our own summary copied, not
   CED text, but the CED's own wording is never in the repo, so the check
   holds authored text to a list of CED signature phrases instead. */
export const CED_PHRASES = [
  /\bMICRO-\d|\bMKT-\d|\bCBA-\d|\bPRD-\d|\bPOL-\d/,
  /students? (will|should) be able to/i,
  /\bessential knowledge\b/i,
  /\blearning objective\b/i,
  /\benduring understanding\b/i,
];
/* Every $...$ in a piece of text renders in the course's TeX subset. */
export function mathProblems(t) { return Tex.check(String(t ?? '')); }
const RAW = new Set(['answer', 'id', 'topic', 'unit', 'units', 'type', 'kind', 'stimulus', 'figure', 'practice', 'level', 'set', 'mode', 'from', 'source']);
const allStrings = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(allStrings)
  : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => k === 'plot' || k === 'chart' || k === 'graph' || (RAW.has(k) && typeof x !== 'object') ? [] : allStrings(x)) : [];
export const MIN_ITEMS = 15, MIN_HIGHER = 0.6, MIN_IN_SETS = 0.4, SET_MIN = 3, SET_MAX = 5, LONGEST_MAX = 0.4, KEY_POS_MAX = 0.4;
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

/* Per topic (and for the exam-only items and each served form): the key's
   position in the authored order is balanced, like its length. The page
   shuffles options, but the static question HTML, print and a fixed item show
   them as written, so no position holds the key in more than 40% of the
   single-answer items, and once there are at least two items per position
   every position holds it at least once. Fixed items (a scale, an order) are
   left out: their order is the content. */
export function keyPositionTell(items) {
  const singles = items.filter(q => q.type === 'single' && !q.fixed && (q.options || []).length >= 3 && Number.isInteger(q.correct));
  if (singles.length < 5) return null;
  const n = Math.min(...singles.map(q => q.options.length)), count = Array(Math.max(...singles.map(q => q.options.length))).fill(0);
  for (const q of singles) count[q.correct]++;
  const top = Math.max(...count), at = count.indexOf(top);
  if (top / singles.length > KEY_POS_MAX + 1e-9) return `the key is option ${at + 1} in ${top} of ${singles.length} single-answer items (at most 40%): rotate options with their explanations (counts ${count.join(', ')})`;
  if (singles.length >= 2 * n) { const never = count.slice(0, n).findIndex(c => c === 0); if (never > -1) return `the key is never option ${never + 1} in ${singles.length} single-answer items: rotate options with their explanations (counts ${count.join(', ')})`; }
  return null;
}

function checkStimulus(sid, s, figures, err) {
  const w = `stimulus ${sid}`;
  if (!STIM_KINDS.includes(s.kind)) err(`${w}: kind must be ${STIM_KINDS.join(', ')} (the set kinds: data, a graph, a text scenario)`);
  if (!s.title) err(`${w}: title missing`);
  if (!s.html && !s.table && !s.figure && !s.chart && !s.plot && !s.graph && !s.matrix && !s.text) err(`${w}: needs a table, plot, chart, graph, matrix, figure, text or html`);
  // A graph is drawn from the numbers it claims to show: a plot spec, drawn
  // by microeconomics/assets/tools/mic-plot.js at build time, or an economics graph (mic-graph.js).
  if (s.plot) { try { Plot.svg(s.plot); } catch (e) { err(`${w}: plot: ${e.message}`); } }
  if (s.graph) {
    if (!Graph.KINDS[s.graph.kind]) err(`${w}: graph.kind must be one of ${Object.keys(Graph.KINDS).join(', ')}`);
    else {
      // The graph as given passes the engine's own checker (a "label" task stands in for none), and draws.
      const g = { ...s.graph, do: ['label'] }; delete g.showEq; delete g.letters;
      for (const m of Graph.check(g)) err(`${w}: ${m}`);
      try { Graph.svg({ ...s.graph, do: [] }, { shifts: s.graph.show || {}, letters: !!s.graph.letters }); } catch (e) { err(`${w}: graph: ${e.message}`); }
      if (s.graph.letters !== undefined && (s.graph.letters !== true || !Graph.areas({ ...s.graph, do: [] }).cells.length)) err(`${w}: graph.letters (true) letters the area cells of a graph that has them (a policy, a firm, a monopoly, an externality, a Lorenz curve)`);
      if (s.graph.showEq !== undefined && (s.graph.showEq !== true || !Object.values(s.graph.show || {}).some(Boolean) || !Graph.eq({ ...s.graph, do: [] }, s.graph.show))) err(`${w}: graph.showEq (true) marks the new equilibrium of a graph whose show shifts a curve; this one has no shift or no new crossing`); }
  }
  if (s.set !== undefined) err(`${w}: "set" is not used; the stimulus kind (data, graph, text) is the set kind`);
  if (s.study !== undefined) err(`${w}: "study" is not used in microeconomics`);
  for (const t of allStrings({ title: s.title, text: s.text, html: s.html, table: s.table })) for (const m of [...excludedProblems(t), ...mythProblems(t), ...languageProblems(t)]) err(`${w}: ${m}`);
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
  if (s.kind === 'data' && !s.table && !s.plot && !s.chart && !s.figure) err(`${w}: a data set shows its data: a table, a plot spec (preferred), a chart or a figure`);
  if (s.matrix) { for (const m of Matrix.check({ ...s.matrix, do: ['nash'] })) err(`${w}: ${m}`); }
  if (s.kind === 'graph' && !s.graph && !s.matrix && !s.figure && !/<svg/.test(s.html || '')) err(`${w}: a graph set needs a graph spec (preferred), a payoff matrix, a figure or an inline SVG`);
  if (s.kind === 'text' && !s.text && !s.html) err(`${w}: a scenario set needs its text`);
  if (/<svg/.test(s.html || '') && !(/role="img"/.test(s.html) && /aria-label="[^"]{20,}"/.test(s.html))) err(`${w}: the SVG needs role="img" and an aria-label (20+ characters) that says what it shows`);
  // Data are invented (and say so) or cite a real, published source.
  const hasData = !!(s.table || s.plot || s.chart);
  if (hasData && !s.invented && !s.source) err(`${w}: data needs "invented": true or a "source" citing where the numbers come from`);
  if (hasData && s.invented && s.source) err(`${w}: data is either invented or cited, not both`);
  if (s.source && !CITATION.test(s.source)) err(`${w}: source "${s.source}" must cite a real publisher and a year: "Bureau of Labor Statistics (2025)"`);
}

/* A graph item's spec (ApMicroGraph.check), plus the course rules: the
   feedback has a cause; a shift item names its outcome when the kind has an
   equilibrium (what readers score after the shift). */
export function graphProblems(G) {
  const out = Graph.check(G);
  if (out.length) return out;
  const k = Graph.KINDS[G.kind];
  if ((G.do || []).includes('equilibrium') && k.out && !G.key.outcome) out.push('graph.key.outcome: say what happens to both axes at the new equilibrium (up, down or same), as readers score it');
  // The key graded as right by the grader itself, and the common slip graded wrong.
  // ApMicroGraph.keyResponse: the key drawn as a student would (shifts, E2, labels, the point).
  const keyResp = Graph.keyResponse(G);
  const g = Grade.graph(G, keyResp);
  if (!g.correct) out.push(`graph: the key itself is not graded right (${g.slip || 'check the key'})`);
  // Every other accepted shift set (key.alt), drawn, is graded right too.
  for (const [j, set] of ((G.key && G.key.alt) || []).entries()) {
    const r = Graph.keyResponse({ ...G, key: { ...G.key, shifts: set, alt: undefined } });
    const ga = Grade.graph(G, r);
    if (!ga.correct) out.push(`graph.key.alt[${j}]: drawn, it is not graded right (${ga.slip || 'check it'})`);
  }
  // A shading item: a near miss (another named region) is graded wrong, and so is part of the region.
  if ((G.do || []).includes('shade')) {
    const R = Graph.areas(G).regions, want = Graph.regionCells(G, G.key.shade);
    for (const [name, cells] of Object.entries(R)) if (cells.slice().sort().join() !== want.join() && Grade.graph(G, { ...keyResp, shade: cells }).correct) out.push(`graph: shading ${name} is graded right too; the key's region is not told apart`);
    if (want.length > 1 && Grade.graph(G, { ...keyResp, shade: want.slice(1) }).correct) out.push('graph: part of the region is graded right');
  }
  return out;
}

/* A payoff matrix item (ApMicroMatrix.check): its key, computed from the
   payoffs, graded right by the grader; authored key fields must agree. */
export function matrixProblems(M) {
  const out = Matrix.check(M);
  if (out.length) return out;
  const k = Matrix.keyResponse(M), g = Matrix.grade(M, k);
  if (!g.correct) out.push(`matrix: the computed key is not graded right (${g.slip})`);
  if (M.key) for (const [t, v] of Object.entries(M.key)) if (JSON.stringify(v) !== JSON.stringify(k[t])) out.push(`matrix.key.${t} is ${JSON.stringify(v)}, but the payoffs give ${JSON.stringify(k[t])}`);
  if ((M.do || []).includes('nash') && Matrix.grade(M, { ...k, nash: [], nashNone: false }).correct) out.push('matrix: an empty answer is graded right');
  return out;
}

/* A numeric item's key (docs/apmicro-architecture.md, "numeric"): the key
   recomputed from its recipe when it has one (`from`, through ApMicroCalc: a
   typed key that disagrees fails; every calculated key must have one), its
   unit readable, and the authored slips (a value or a recipe), each graded
   wrong by ApMicroGrade. Returns problems. */
export function numericProblems(N, { needRecipe = true } = {}) {
  const out = [], bad = m => out.push(m);
  let A = N.answer;
  if (N.from !== undefined) {
    try { const v = fromValue(N.from); if (typeof A === 'number' && Math.abs(A - v) > Grade.tolerance({ ...N, answer: v }) / 10 + 1e-12) bad(`numeric.answer ${A} disagrees with its recipe: ${N.from.fn} gives ${v}`); A = v; }
    catch (e) { bad(`numeric.from: ${e.message}`); return out; }
  } else if (needRecipe) { bad('numeric.from is required: every calculated key is a recipe ApMicroCalc recomputes (spec section 7)'); if (typeof A !== 'number') return out; }
  else if (typeof A !== 'number' || !Number.isFinite(A)) { bad('numeric.answer must be a number'); return out; }
  if (N.tol !== undefined && !(N.tol >= 0)) bad('numeric.tol must be a number at least 0');
  if (N.rel !== undefined && !(N.rel >= 0 && N.rel < 0.2)) bad('numeric.rel must be between 0 and 0.2');
  if (N.unit !== undefined && typeof N.unit !== 'string') bad('numeric.unit must be a string');
  if (N.unit && !Grade.normUnit(N.unit)) bad(`numeric.unit "${N.unit}" cannot be read`);
  for (const k of ['kind', 'sigfigs', 'alts', 'accept', 'alpha']) if (N[k] !== undefined) bad(`numeric.${k} is not used in microeconomics (no significant figures; units instead)`);
  const key = { ...N, answer: A };
  if (!Grade.numeric(key, { value: String(A), unit: N.unit || '' }).correct) bad('the key itself is not graded right by ApMicroGrade.numeric');
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

export function checkItem(q, { topic, map, stimuli, err, idRe, nOptions }) {
  const w = `item ${q.id || '(no id)'}`;
  if (!q.id || !(idRe || new RegExp(`^mic-${topic.id}-\\d+$`)).test(q.id)) err(`${w}: id must be ${idRe ? 'mic-exam-<form>-<nn>' : `mic-${topic.id}-<n>`}`);
  if (!TYPES.includes(q.type)) err(`${w}: type must be one of ${TYPES.join(', ')}`);
  // Unit, topic and practice are required and never inferred (spec section 1).
  if (!q.unit) err(`${w}: "unit" is required`); else if (q.unit !== topic.chapter) err(`${w}: unit "${q.unit}" is not this topic's chapter "${topic.chapter}"`);
  if (!q.topic) err(`${w}: "topic" is required`); else if (q.topic !== topic.id) err(`${w}: topic "${q.topic}" does not match the file`);
  if (!q.practice) err(`${w}: "practice" is required (a skill id like "2.B")`);
  else if (!SKILL_RE.test(q.practice) || !map.practices.some(p => String(p.id) === q.practice.split('.')[0] && (!p.skills || p.skills.includes(q.practice)))) err(`${w}: practice "${q.practice}" is not a skill id of the framework (e.g. "2.B")`);
  else if (NOT_ASSESSED.includes(q.practice) && q.type !== 'graph' && q.type !== 'matrix') err(`${w}: skill ${q.practice} (graphing) is assessed only in the free-response section; only a graph or matrix item carries it`);
  if (q.calc !== undefined) err(`${w}: no "calc" flag: a four-function calculator is allowed throughout`);
  for (const t of allStrings({ q: q.q, options: q.options, why: q.why, numeric: q.numeric && { mistakes: q.numeric.mistakes }, specific: q.specific && { model: q.specific.model, slots: q.specific.slots } })) {
    for (const m of mathProblems(t)) err(`${w}: math: ${m}`);
    for (const m of [...excludedProblems(t), ...mythProblems(t), ...languageProblems(t)]) err(`${w}: ${m}`);
  }
  if (!LEVELS.includes(q.level)) err(`${w}: level must be recall, apply or analyze`);
  if (![1, 2, 3].includes(q.diff)) err(`${w}: diff must be 1, 2 or 3`);
  if (!q.q || strip(q.q).trim().length < 12) err(`${w}: no question text`);
  if (q.stimulus && !stimuli[q.stimulus]) err(`${w}: unknown stimulus "${q.stimulus}"`);
  if (!q.why || !q.why.correct) err(`${w}: why.correct missing`);
  const typed = { numeric: [numericProblems, q.numeric || {}], specific: [specificProblems, q.specific], graph: [graphProblems, q.graph || {}], matrix: [matrixProblems, q.matrix || {}] }[q.type];
  if (q.type === 'graph' || q.type === 'matrix') for (const t of allStrings({ slips: (q.graph || q.matrix || {}).slips, because: q.graph && q.graph.key && q.graph.key.because, names: q.matrix && q.matrix.players })) for (const m of [...mythProblems(t), ...languageProblems(t)]) err(`${w}: ${m}`);
  if (typed) {
    for (const p of typed[0](typed[1])) err(`${w}: ${p}`);
    if (q.options || q.correct !== undefined) err(`${w}: ${q.type} items have no options or correct`);
  } else {
    const n = (q.options || []).length;
    const min = q.type === 'order' ? 3 : 2;
    const nOpt = nOptions || MCQ_OPTIONS;
    if (q.type === 'single' && n !== nOpt) err(`${w}: a single-answer item has exactly ${nOpt} options${nOptions ? ' (an exam-only question, as on the exam)' : ' (the practice bank; a practice exam adds a fifth)'}`);
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
   rule: the map's own page scan (scripts/lib/apmicro-map.mjs). */
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
    const kp = keyPositionTell(items);
    if (kp) err(`questions: ${kp}`);
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
      if (L.help !== undefined) err('lesson: "help" is not used in microeconomics');
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

  // --- trademark wording, no CED text, math, ordering
  for (const t of texts) for (const p of trademarkProblems(t)) err(`trademark: ${p}`);
  for (const t of texts) for (const re of CED_PHRASES) if (re.test(strip(t))) err(`CED wording "${strip(t).match(re)[0]}": write in our own words (decision 4)`);
  for (const t of texts) for (const p of mathProblems(t)) if (!errors.some(e => e.endsWith(p))) err(`math: ${p}`);
  for (const p of orderingProblems(map, id, texts)) err(p);
  return { errors, warns, items };
}

/* Figure licenses: our own SVG or public domain, always with a credit; no
   OpenStax material (docs/apmicro-spec.md decision 4). */
export function checkFigure(fid, f, err) {
  if (hasApToken(fid)) err(`figure ${fid}: the id contains the token "ap" (it becomes a file name under microeconomics/)`);
  if (!ALLOWED_LICENSES.includes(f.license)) err(`figure ${fid}: license "${f.license}" is not allowed (${ALLOWED_LICENSES.join(', ')})`);
  if (!f.credit) err(`figure ${fid}: credit missing`);
  if (!f.alt || f.alt.length < 20) err(`figure ${fid}: alt text missing`);
  if (f.source === 'levlprep') {
    if (f.license !== 'LevlPrep original') err(`figure ${fid}: our own diagrams carry the license "LevlPrep original"`);
    if (f.ext !== 'svg' || !exists(join(ROOT, 'microeconomics', 'figures', `${fid}.svg`))) err(`figure ${fid}: our own diagram must be microeconomics/figures/${fid}.svg with "ext": "svg"`);
  } else if (f.license === 'LevlPrep original') err(`figure ${fid}: "LevlPrep original" is only for source "levlprep"`);
  else if (f.source === 'public-domain') {
    if (f.license !== 'Public domain') err(`figure ${fid}: a public-domain source carries the license "Public domain"`);
    if (!f.url) err(`figure ${fid}: a public-domain figure records where it came from (url)`);
  } else err(`figure ${fid}: source must be levlprep or public-domain (no OpenStax material in this course)`);
  if (/openstax/i.test(JSON.stringify(f))) err(`figure ${fid}: no OpenStax material in this course`);
  if (f.source !== 'levlprep' && !exists(join(ROOT, 'microeconomics', 'figures', `${fid}.${f.ext || 'jpg'}`))) err(`figure ${fid}: file microeconomics/figures/${fid}.${f.ext || 'jpg'} is missing`);
}

/* FRQs (spec section 7, docs/apmicro-architecture.md "FRQ"): long (10
   points) and short (5 points) (framework.md section 5). Parts labeled A,
   B, ... (sub-parts "(i)" allowed: "A(i)"); one rubric line per point,
   points add up, every part has a full-credit sample. A part of type
   "graph" carries a graph spec (as a graph item's, checked the same way);
   its rubric lines may name `auto` (labels, shift, equilibrium, outcome,
   point), the graph check that pre-ticks them; a long question has at
   least one graph part (spec 5a). */
export const FRQ_LABEL = /^[A-H](\((i|ii|iii|iv)\))?$/;
export const AUTO = ['labels', 'shift', 'equilibrium', 'outcome', 'point', 'line', 'shade'];
// A matrix part's rubric points name these checks (ApMicroMatrix tasks).
export const MATRIX_AUTO = ['dominant', 'nash', 'best', 'joint'];
/* The topic an FRQ unlocks with: the latest of its topics in course order. */
export function unlockTopic(map, f) {
  const { topicIndex } = indexMap(map.raw);
  return (f.topics || []).slice().sort((a, b) => topicIndex.get(b) - topicIndex.get(a))[0];
}
const FRQ_META = new Set(['id', 'type', 'units', 'topics', 'practices', 'points', 'label', 'invented', 'source', 'auto']);
const frqTexts = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(frqTexts)
  : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => FRQ_META.has(k) || k === 'plot' || k === 'graph' ? [] : frqTexts(x)) : [];
export function checkFrq(fid, f, map, figures = {}) {
  const errs = [], err = m => errs.push(m);
  if (f.id !== fid) err(`id "${f.id}" must match the file name`);
  if (hasApToken(fid)) err('the id contains the token "ap"');
  if (!(f.type in FRQ_TYPES)) err(`type must be one of ${Object.keys(FRQ_TYPES).join(', ')}`);
  else if (f.points !== FRQ_TYPES[f.type]) err(`every FRQ is worth ${FRQ_TYPES[f.type]} points, not ${f.points}`);
  if (/\$/.test(f.title || '')) err('title is plain text (it becomes the page title and links): no $...$ math in it');
  if (f.calc !== undefined) err('no "calc" flag: a four-function calculator is allowed throughout');
  for (const k of ['study', 'sources', 'restricted', 'graphSpec', 'drawSpec']) if (f[k] !== undefined) err(`"${k}" is not used in microeconomics FRQs`);
  for (const t of allStrings({ ...f, parts: (f.parts || []).map(p => ({ ...p, graph: undefined, matrix: undefined })) })) for (const m of [...excludedProblems(t), ...mythProblems(t), ...languageProblems(t)]) err(m);
  for (const t of allStrings(f)) for (const m of mathProblems(t)) err(`math: ${m}`);
  // scenario: the text that sets the question up, shown before the parts (and
  // before the data). Plain text with inline emphasis only.
  if (f.scenario !== undefined) {
    if (typeof f.scenario !== 'string' || strip(f.scenario).trim().length < 20) err('scenario is the text before the parts (a sentence or more)');
    else { const tags = [...f.scenario.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)].map(m => m[1].toLowerCase()).filter(t => !['b', 'i', 'em', 'strong', 'sub', 'sup'].includes(t)); if (tags.length) err(`scenario is plain text with inline emphasis only, not <${tags[0]}>`); }
    if (/<b>(Draw|Identify|Calculate|Explain|Show|Plot|Label|Define|State)<\/b>/.test(f.scenario || '')) err('scenario sets the question up; the tasks (Draw, Identify, ...) go in the parts');
  }
  if (f.stimulus) checkStimulus(`${fid}.stimulus`, { kind: 'data', ...f.stimulus }, figures, err);
  if (f.type === 'long' && !(f.parts || []).some(p => p.type === 'graph')) err('a long question has at least one graph part (type "graph")');
  if (map) {
    for (const u of f.units || []) if (!map.chapterById(u)) err(`unknown unit "${u}"`);
    for (const t of f.topics || []) if (!map.topicById(t)) err(`unknown topic "${t}"`);
  }
  if (!(f.units || []).length || !(f.topics || []).length || !(f.practices || []).length) err('units, topics and practices are required');
  // Teaching order (spec section 10, lead note a): an FRQ unlocks with the
  // latest of its topics in course order, so nothing in it (study, sources,
  // prompts, rubric, samples, hint lists) may use a term taught after that
  // topic. Every unit of those topics is listed. Restricted-term lists are
  // words a student must not offer, so they are not read. The practice exams
  // are exempt: they come after the whole course.
  if (map && (f.topics || []).every(t => map.topicById(t))) {
    const at = unlockTopic(map, f);
    for (const t of f.topics) { const c = map.topicById(t).chapter; if (!(f.units || []).includes(c)) err(`topic ${t} is in ${c}; list that unit in "units" too`); }
    const texts = frqTexts(f);
    for (const p of scanPage(map.raw, `<p>${texts.join('</p>\n<p>')}</p>`, at)) err(`ORDER (unlocks with ${at}): ${p}`);
  }
  for (const p of f.practices || []) if (!SKILL_RE.test(p)) err(`practice "${p}" is not a skill id`);
  if (!Array.isArray(f.parts) || !f.parts.length) err('parts missing');
  const labels = (f.parts || []).map(p => p.label);
  if (new Set(labels).size !== labels.length) err('part labels repeat');
  let sum = 0;
  for (const p of f.parts || []) {
    const w = `part ${p.label || '?'}`;
    if (!p.label || !p.prompt) err(`${w}: label and prompt required`);
    else if (!FRQ_LABEL.test(p.label)) err(`${w}: label is A, B, ... or A(i), A(ii) (as the exam labels parts)`);
    if (p.type !== undefined && p.type !== 'graph' && p.type !== 'matrix') err(`${w}: type is "graph", "matrix" or absent (written)`);
    if (p.type === 'matrix') {
      for (const m of matrixProblems(p.matrix || {})) err(`${w}: ${m}`);
      for (const r of p.rubric || []) if (r.auto !== undefined && (!MATRIX_AUTO.includes(r.auto) || !(p.matrix && (p.matrix.do || []).includes(r.auto)))) err(`${w}: rubric auto "${r.auto}" is not a check this matrix makes (${(p.matrix && p.matrix.do || []).join(', ')})`);
      if (!(p.rubric || []).some(r => r.auto)) err(`${w}: a matrix part marks the rubric points the matrix check can tick (auto)`);
    } else if (p.matrix !== undefined) err(`${w}: a "matrix" needs type "matrix"`);
    if (p.type === 'graph') {
      for (const m of graphProblems(p.graph || {})) err(`${w}: ${m}`);
      for (const r of p.rubric || []) if (r.auto !== undefined && (!AUTO.includes(r.auto) || !(p.graph && ((p.graph.do || []).includes(r.auto === 'labels' ? 'label' : r.auto) || (r.auto === 'outcome' && p.graph.key && p.graph.key.outcome))))) err(`${w}: rubric auto "${r.auto}" is not a check this graph makes (${(p.graph && p.graph.do || []).join(', ')})`);
      if (!(p.rubric || []).some(r => r.auto)) err(`${w}: a graph part marks the rubric points the graph check can tick (auto)`);
    } else if (p.graph !== undefined) err(`${w}: a "graph" needs type "graph"`);
    for (const r of p.rubric || []) if (r.auto !== undefined && p.type !== 'graph' && p.type !== 'matrix') err(`${w}: only a graph or matrix part's rubric lines take "auto"`);
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

/* Every definition, as the build reads it: the first file (in name order) that has the concept, unless the file of
   the topic that teaches it has one (a term taught early is defined at the early level). */
export function glossaryAll(map = null) {
  const dir = join(DATA, 'glossary'), all = {};
  if (!exists(dir)) return all;
  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort(), byFile = {};
  for (const f of files) { byFile[f.slice(0, -5)] = readJson(join(dir, f)); for (const [k, v] of Object.entries(byFile[f.slice(0, -5)])) if (!(k in all)) all[k] = v; }
  for (const c of (map && (map.raw || map).concepts) || []) if (byFile[c.taughtIn] && byFile[c.taughtIn][c.id]) all[c.id] = byFile[c.taughtIn][c.id];
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
  const glossary = glossaryAll(map), figures = figuresAll();
  const dataTopics = new Set(['lessons', 'notes', 'questions'].flatMap(d => exists(join(DATA, d)) ? readdirSync(join(DATA, d)).filter(f => !f.startsWith('.')).map(f => f.replace(/\.(json|html)$/, '')) : []));
  let failed = 0, draft = 0, total = 0;
  const pubItems = [], allItems = [], allStimuli = {};
  if (!map) console.log('AP Microeconomics content: no course map yet; checking formats that need no map.');
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
    // (docs/apmicro-architecture.md, "Tools").
    if (exists(join(DATA, 'tools', `${t.slug}.json`))) {
      if (!exists(join(ROOT, 'microeconomics', 'assets', 'tools', `${t.slug}.js`))) bad(`no script microeconomics/assets/tools/${t.slug}.js`);
      if (!exists(join(ROOT, 'microeconomics', 'assets', 'tools', 'math', `${t.slug}.js`))) bad(`no model file microeconomics/assets/tools/math/${t.slug}.js`);
      // The hub group (pages.json) and the page eyebrow (the data file) say the same kind (integration T2).
      const tk = readJson(join(DATA, 'tools', `${t.slug}.json`)).kind;
      if (tk && tk !== t.kind) bad(`kind "${t.kind}" here but "${tk}" in data/tools/${t.slug}.json; make them the same`);
    }
    if (t.studio !== true) bad('every tool is on the Tool Studio ("studio": true)');
    if (typeof t.topic !== 'string' || (map && !map.topicById(t.topic))) bad(`"topic" must be the tool's context topic in the map (got ${JSON.stringify(t.topic)})`);
  }
  // Tools: each content file against its validator (scripts/lib/apmicro-tool-checks/<slug>.mjs).
  // They take minutes, so --topic skips them unless --tools asks.
  let toolFails = 0;
  const toolDir = join(DATA, 'tools');
  const runTools = !only || args.includes('--tools');
  for (const f of runTools && exists(toolDir) ? readdirSync(toolDir).filter(f => f.endsWith('.json')).sort() : []) {
    const slug = f.slice(0, -5), v = join(ROOT, 'scripts', 'lib', 'apmicro-tool-checks', `${slug}.mjs`);
    if (!exists(v)) { console.log(`tool ${slug}: FAIL: no validator at scripts/lib/apmicro-tool-checks/${slug}.mjs`); toolFails++; continue; }
    const { check } = await import(v);
    const errs = check(readJson(join(toolDir, f)), map) || [];
    if (errs.length) { toolFails++; console.log(`tool ${slug}: FAIL`); for (const e of errs) console.log(`  FAIL: ${e}`); }
  }
  // Practice exams and the "Make it specific" trainer (docs/apmicro-architecture.md,
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
      if (q.type !== 'single') bad2(`${q.id}: exam-only items are ${EXAM_OPTIONS}-option single-answer questions`);
      checkItem(q, { topic, map, stimuli: ex.stimuli, err: bad2, idRe: /^mic-exam-\d+-\d{2}$/, nOptions: EXAM_OPTIONS });
      // The ordering rule: a full practice exam is taken after the whole course,
      // so nothing outside the course's terms (scanned from its last topic).
      const last = map.topics.filter(t => t.chapter.startsWith('unit-')).pop();
      for (const p of scanPage(map, `<p>${textOfItem(q)}</p>`, last.id)) bad2(`${q.id}: ORDER: ${p}`);
      for (const p of trademarkProblems(textOfItem(q))) bad2(`${q.id}: trademark: ${p}`);
    }
    if (ex.items.length) { const lt = lengthTell(ex.items); if (lt) bad2(`exam-only items: ${lt}`); const kp = keyPositionTell(ex.items); if (kp) bad2(`exam-only items: ${kp}`); }
    for (const e of [...testWise(ex.items), ...duplicates([...allItems, ...ex.items.map(q => ({ ...q, topic: `exam:${q.topic}` }))]).filter(e => /mic-exam-/.test(e))]) bad2(e);
    const frqs = {};
    for (const f of exists(frqDir) ? readdirSync(frqDir).filter(f => f.endsWith('.json')) : []) { const d = readJson(join(frqDir, f)); frqs[d.id] = d; }
    const bank = new Map(allItems.map(q => [q.id, q]));
    const stimOf = sid => ex.stimuli[sid] || allStimuli[sid];
    // Lesson check items (on the free lessons) never go in a form: checkForms skips them as set fillers too.
    const lessonChecks = new Set();
    for (const t of map.topics) { const p = join(DATA, 'lessons', `${t.id}.json`); if (exists(p)) for (const id of readJson(p).check || []) lessonChecks.add(id); }
    for (const e of checkForms(ex.forms, { map, bank, examItems, frqs, orderOf: id => orderOf[id], stimuli: stimOf, lessonChecks, fifth: ex.fifth })) bad2(e);
    // The fifth options (bank questions as a form serves them), checked as authored text and,
    // with the exam-only items, for the length tell and the test-wise limits form by form.
    for (const e of checkFifth(ex.fifth, { bank, forms: ex.forms })) bad2(e);
    for (const [id, f] of Object.entries(ex.fifth || {})) for (const t of [f.option, f.why]) {
      for (const m of [...mathProblems(t), ...excludedProblems(t), ...mythProblems(t), ...languageProblems(t), ...trademarkProblems(t)]) bad2(`fifth option for ${id}: ${m}`);
      const m = strip(t).match(POS_RE); if (m) bad2(`fifth option for ${id}: says "${m[0]}"; options are shuffled`);
    }
    for (const f of ex.forms) {
      const served = (f.mcq || []).flat().map(id => examItems.get(id) || (bank.get(id) && examVersion(bank.get(id), ex.fifth))).filter(Boolean);
      const lt = lengthTell(served); if (lt) bad2(`${f.id}: ${lt}`);
      const kp = keyPositionTell(served); if (kp) bad2(`${f.id}: ${kp}`);
      for (const e of testWise(served)) bad2(`${f.id}: ${e}`);
    }
    for (const e of checkGraphs(examItems, ex.stimuli)) bad2(e);
    for (const e of checkMatrices(examItems, ex.stimuli)) bad2(e);
    for (const e of checkJustify(prompts, { map, trademarkProblems, scanPage })) bad2(e);
    // About ten prompts per unit (as AP® Precalculus), a few in the graph skills chapter.
    if (prompts.length < 50) bad2(`the "Make it specific" trainer has ${prompts.length} prompts; it needs at least 50`);
    for (const u of map.chapters) { const n = prompts.filter(p => p.unit === u.id).length, [lo, hi] = u.part === 'course' ? JUSTIFY_PER_CHAPTER : JUSTIFY_PER_SKILLS_CHAPTER; if (n < lo || n > hi) bad2(`${u.id} has ${n} "Make it specific" prompts (${lo} to ${hi})`); }
    for (const k of Object.keys(JUSTIFY_SKILLS)) if (prompts.length && !prompts.some(p => p.skill === k)) bad2(`no "Make it specific" prompt practises "${k}"`);
    for (const q of ex.items) if (!ex.forms.some(f => (f.mcq || []).flat().includes(q.id))) bad2(`${q.id}: an exam-only item in no form`);
    for (const e of checkNumbers(examItems, prompts)) bad2(e);
    console.log(`AP Microeconomics exams: ${ex.forms.length} practice exams, ${ex.items.length} exam-only items, ${prompts.length} "Make it specific" prompts, ${examFails} failing.`);
  }
  const bad = failed + bankErr.length + frqFails + metaFails + toolFails + examFails;
  console.log(`AP Microeconomics content: ${ids.length} topics, ${total} items, ${failed} failing${draft ? ` (+${draft} in unpublished chapters)` : ''}; bank ${bankErr.length}, FRQ ${frqFails}, meta ${metaFails}, tools ${toolFails}, exams ${examFails} failing.`);
  if (args.includes('--check') && bad) process.exit(1);
}
