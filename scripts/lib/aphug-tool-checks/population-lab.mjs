/* Validator for human-geography/data/tools/population-lab.json (Population lab), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. The frame; the model (every pyramid sums to
   100%, its shape follows fertility, each stage's teaching rates are
   consistent with their own stage, the shape contexts give one shape over
   their whole range); then 300 problems per context and type regenerated
   with the model the page runs (ApHugMath.populationLab) and every key
   recomputed here from the givens with plain arithmetic: CBR, CDR, RNI and
   the rule of 70, growth with migration, the three dependency ratios, the
   stage from the rates (this file's own bands), the shape read off the
   figure's bars, birth years and the sex ratio. Every figure must draw
   (ApHugPlot.svg). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['rates', 'growth', 'dependency', 'stage', 'shape', 'cohort'];
const step = (p, k) => p.steps.find(s => s.key === k);
const plain = s => String(s).replace(/<[^>]+>/g, ' ');
const right = (p, k) => { const s = step(p, k); return s ? plain(s.options[s.correct]) : ''; };
// This file's own stage bands (the model's are in hug-calc.js transitionStage).
function stageHere(b, d) {
  if (b < d) return 5;
  if (b >= 30) return d >= 20 ? 1 : 2;
  return b - d >= 5 ? 3 : 4;
}
// Shape from the bars a student sees: mean of 0-14 against mean of 25-39.
function shapeOf(spec) {
  const t = i => spec.left[i] + spec.right[i];
  const k = (t(0) + t(1) + t(2)) / (t(5) + t(6) + t(7));
  return k > 1.25 ? 'expansive' : k < 0.92 ? 'constrictive' : 'stationary';
}

export function recheck(p, c, w, errs) {
  const { Plot } = runtime();
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const want = (k, v, d) => { const s = step(p, k); if (!s) return bad(`no ${k} step`); if (!close(s.cell.answer, v, 1e-9, 1e-9)) bad(`${k} key ${s.cell.answer}, recomputed ${v}`); if (d != null && s.d !== d) bad(`${k} shown to ${s.d} decimals`); };
  if (p.figure && p.figure.kind === 'pyramid') {
    try { Plot.svg(p.figure.spec); } catch (e) { bad(`the pyramid does not draw: ${e.message}`); }
    if (p.figure.spec.left.length !== 17) bad('a pyramid has 17 age groups');
  }
  const txt = plain(p.text + ' ' + p.solution.join(' '));
  if (/\b(is|are) in stage\b/i.test(txt)) bad('says a country "is in" a stage (spec decision 7: "consistent with")');
  if (!/invented/.test(p.text)) bad('the country is not labeled invented');
  switch (p.type) {
    case 'rates': {
      const pop = g.pop * 1e6, cbr = g.births / pop * 1000, cdr = g.deaths / pop * 1000, rni = (cbr - cdr) / 10;
      want('cbr', cbr, 0); want('cdr', cdr, 0); want('rni', rni, 1); want('dbl', 70 / rni, 0);
      if (!Number.isInteger(70 / rni + 1e-9) && Math.abs(70 / rni - Math.round(70 / rni)) > 1e-6) bad(`doubling time ${70 / rni} is not a whole number`);
      if (cbr > 50 || cdr < 4) bad(`rates ${cbr}/${cdr} out of a believable range`);
      break;
    }
    case 'growth': {
      const rni = (g.cbr - g.cdr) / 10, gr = (g.cbr - g.cdr + g.nmr) / 10;
      want('rni', rni, 1); want('dbl', 70 / rni, 0); want('nmr', gr, 1);
      if (!right(p, 'migrate').startsWith('The population grows ' + (g.nmr > 0 ? 'faster' : 'more slowly'))) bad('migration key');
      break;
    }
    case 'dependency': {
      const { young: y, old: o, work: wk } = g;
      want('total', 100 * (y + o) / wk, 0); want('youth', 100 * y / wk, 0); want('elderly', 100 * o / wk, 0);
      const k = right(p, 'needs');
      if (y > o * 2 ? !/schools/.test(k) : !/pensions|elder care/.test(k)) bad(`needs key "${k.slice(0, 30)}" for ${y}/${o}`);
      const s = p.figure.spec, sum = s.left.concat(s.right).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - (y + o + wk)) > 0.3) bad(`the pyramid holds ${sum} million, the text ${y + o + wk}`);
      break;
    }
    case 'stage': {
      const st = stageHere(g.cbr, g.cdr);
      if (st !== g.stage) bad(`rates ${g.cbr}/${g.cdr} give stage ${st} here, the problem says ${g.stage}`);
      // Well inside the band: one point either way keeps the stage.
      for (const [db, dd] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (stageHere(g.cbr + db, g.cdr + dd) !== st) bad(`rates ${g.cbr}/${g.cdr} sit on a stage boundary`);
      if (!right(p, 'stage').startsWith(`Stage ${st}:`)) bad(`stage key "${right(p, 'stage').slice(0, 12)}"`);
      if (step(p, 'stage').options.map(plain).map(x => x.slice(0, 7)).join() !== 'Stage 1,Stage 2,Stage 3,Stage 4,Stage 5') bad('stage options out of order');
      break;
    }
    case 'shape': {
      const sh = shapeOf(p.figure.spec);
      if (sh !== g.shape) bad(`the bars read ${sh}, the problem says ${g.shape}`);
      if (!right(p, 'shape').toLowerCase().startsWith(sh)) bad(`shape key "${right(p, 'shape').slice(0, 14)}"`);
      break;
    }
    case 'cohort': {
      const s = p.figure.spec, t = i => s.left[i] + s.right[i];
      if (g.kind === 'men') {
        want('ratio', 100 * g.mN / g.fN, 0);
        for (let i = 4; i <= 8; i++) if (!(s.left[i] > 1.5 * s.right[i])) bad(`group ${i}: males not clearly above females`);
        if (!/^Labor migration/.test(right(p, 'cause2'))) bad('cause key');
      } else {
        const boom = g.kind === 'boom';
        for (const i of [g.lo, g.hi]) for (const j of [g.lo - 1, g.hi + 1]) if (boom ? !(t(i) > t(j)) : !(t(i) < t(j))) bad(`group ${i} is not a ${g.kind} against group ${j}`);
        if (!right(p, 'born').startsWith(`About ${g.year - g.ageHi} to ${g.year - g.ageLo}`)) bad(`born key "${right(p, 'born')}"`);
        if (g.ageLo !== g.lo * 5 || g.ageHi !== g.hi * 5 + 4) bad('ages do not match the groups');
        if (!right(p, 'read').startsWith(boom ? 'A bulge' : 'A notch')) bad('read key');
      }
      break;
    }
    default: bad(`unknown type ${p.type}`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'population-lab', 'simulator', map, errs);
  const { model, Calc: K } = runtime('population-lab');
  if (!model) { errs.push('no model registered (ApHugMath.populationLab)'); return errs; }
  if (model.stub) return errs;
  const have = new Set((data.contexts || []).flatMap(c => c.types || []));
  for (const t of TYPES) if (!have.has(t)) errs.push(`no context drills "${t}"`);
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
  for (const tfr of [1.1, 1.6, 2.1, 3, 4.5, 6.5]) for (const e0 of [30, 50, 70, 85]) {
    const p = model.pyramid(tfr, e0), all = p.male.concat(p.female), tot = all.reduce((a, b) => a + b, 0);
    if (Math.abs(tot - 100) > 0.3) errs.push(`pyramid TFR ${tfr}, e0 ${e0} sums to ${tot}`);
    if (all.some(v => !(v >= 0))) errs.push(`pyramid TFR ${tfr}, e0 ${e0} has a negative bar`);
  }
  for (const [tfr, e0, sh] of [[5, 60, 'expansive'], [2.2, 76, 'stationary'], [1.4, 82, 'constrictive']]) {
    const s = model.shape(model.pyramid(tfr, e0));
    if (s !== sh) errs.push(`TFR ${tfr}, e0 ${e0} should be ${sh}, reads ${s}`);
  }
  for (const s of [1, 2, 3, 4, 5]) {
    const S = model.STAGES[s];
    if (stageHere(S.cbr, S.cdr) !== s || K.transitionStage({ cbr: S.cbr, cdr: S.cdr }).stage !== s) errs.push(`stage ${s}'s teaching rates do not read as stage ${s}`);
  }
  for (const c of data.contexts || []) if ((c.types || []).includes('shape')) {
    const seen = new Set();
    for (let t = c.tfr[0]; t <= c.tfr[1] + 1e-9; t += 0.1) for (let e = c.e0[0]; e <= c.e0[1]; e++) seen.add(model.shape(model.pyramid(Math.round(t * 10) / 10, e)));
    if (seen.size !== 1) errs.push(`context ${c.id}: its range gives more than one shape (${[...seen].join(', ')})`);
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  return errs;
}
