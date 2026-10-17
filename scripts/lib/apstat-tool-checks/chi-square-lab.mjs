/* Validator for statistics/data/tools/chi-square-lab.json (chi-square lab), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It regenerates 300 problems per context and
   type with the model the page runs (ApStatMath.chiSquareLab) and then
   recomputes every key independently from the problem's table (never
   through the model or chi2table): each expected count from the margins,
   the cell's component, df = (r - 1)(c - 1), χ² as the sum of components,
   the upper-tail p-value with ApStatDist.chi2Sf, the decision against
   alpha, and for the chooser the test that fits the design, its null
   hypothesis and the expected counts condition. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['expected', 'chooser'];
const step = (p, k) => p.steps.find(s => s.key === k);
const key = s => s.cell.answer;

function margins(obs) {
  const R = obs.length, C = obs[0].length, rows = obs.map(r => r.reduce((a, b) => a + b, 0)), cols = [];
  for (let j = 0; j < C; j++) { let s = 0; for (let i = 0; i < R; i++) s += obs[i][j]; cols.push(s); }
  const N = rows.reduce((a, b) => a + b, 0), E = obs.map((r, i) => r.map((_, j) => rows[i] * cols[j] / N));
  let chi2 = 0, minE = Infinity;
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) { chi2 += (obs[i][j] - E[i][j]) ** 2 / E[i][j]; minE = Math.min(minE, E[i][j]); }
  return { R, C, rows, cols, N, E, chi2, minE, df: (R - 1) * (C - 1) };
}

export function recheck(p, c, w, errs) {
  const { Dist } = runtime();
  const d = p.data, bad = m => errs.push(`${w}: ${m}`);
  if (!d || !Array.isArray(d.obs)) return bad('no table on the problem');
  if (d.obs.length !== c.rows.length || d.obs[0].length !== c.cols.length) bad('table shape does not match the labels');
  if (d.obs.some(r => r.some(x => !Number.isInteger(x) || x < 0))) bad('a count is not a whole number');
  const m = margins(d.obs);
  if (d.design !== c.design) bad('design');
  if (p.type === 'expected') {
    const E = m.E[d.i][d.j], O = d.obs[d.i][d.j];
    if (!close(key(step(p, 'E')), E)) bad('expected count key');
    if (!close(key(step(p, 'comp')), (O - E) ** 2 / E)) bad('component key');
    if (key(step(p, 'df')) !== m.df) bad('df key');
    if (!close(key(step(p, 'chi2')), m.chi2)) bad('chi-square key');
    const pv = Dist.chi2Sf(m.chi2, m.df);
    if (!close(key(step(p, 'p')), pv, 1e-9, 1e-12)) bad('p-value key');
    if (m.minE < 5) bad('a test problem with an expected count below 5');
    if (Math.abs(pv - d.alpha) < 0.01) bad('p-value too close to alpha');
    const dk = step(p, 'decide'), ck = step(p, 'conclude'), reject = pv < d.alpha;
    if (!dk.options[dk.correct].includes(reject ? 'less' : 'greater') || !/(, reject|, fail to reject)/.test(dk.options[dk.correct]) || (reject ? /fail/.test(dk.options[dk.correct]) : !/fail/.test(dk.options[dk.correct]))) bad('decision key');
    if (!ck.options[ck.correct].startsWith(reject ? 'There is convincing' : 'There is not convincing')) bad('conclusion key');
    if (!ck.options[ck.correct].includes(c.design === 'independence' ? 'association' : 'distribution')) bad('conclusion wording does not match the design');
  } else if (p.type === 'chooser') {
    const t = step(p, 'test'), h = step(p, 'hyp'), co = step(p, 'cond');
    if (!t.options[t.correct].endsWith(c.design === 'independence' ? 'for independence' : 'for homogeneity')) bad('test key');
    if (!h.options[h.correct].includes(c.design === 'independence' ? 'no association' : 'is the same for')) bad('hypothesis key');
    if (!close(d.minE, m.minE)) bad('smallest expected count');
    if (!co.options[co.correct].startsWith(m.minE >= 5 ? 'Yes' : 'No')) bad('condition key');
  } else bad(`unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'chi-square-lab', 'simulator', map, errs);
  const { model } = runtime('chi-square-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/chi-square-lab.js does not register ApStatMath.chiSquareLab with a generate()'); return errs; }
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    if (!['homogeneity', 'independence'].includes(c.design)) errs.push(`context ${c.id}: design must be homogeneity or independence`);
    if (c.base && c.base.length !== c.cols.length) errs.push(`context ${c.id}: base has ${c.base.length} proportions for ${c.cols.length} columns`);
  }
  for (const s of (data.explore && data.explore.studies) || []) {
    if (s.obs.length !== s.rows.length || s.obs.some(r => r.length !== s.cols.length)) errs.push(`study ${s.id}: table shape does not match the labels`);
    else if (margins(s.obs).minE < 5) errs.push(`study ${s.id}: an expected count below 5`);
  }
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  return errs;
}
