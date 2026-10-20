/* Validator for environmental-science/data/tools/age-structure.json (Age structure), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems. The frame, the pyramid model (every pyramid
   sums to 100%, its shape follows TFR against replacement, the four stages'
   rates point to their own stage, its young and old shares stay within a few
   points of the rounded UN shares it was fitted to), then 300 problems per
   context and type regenerated with the model the page runs
   (ApEnvMath.ageStructure) and every key recomputed independently from the
   givens with ApEnvCalc: the growth rate and doubling year, the TFR and its
   comparison with replacement, the pyramid's shape read from its bars (base
   against the middle, computed here), the stage from the crude rates, and the
   dependency ratio. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['rate', 'tfr', 'shape', 'stage', 'dependency'];
const step = (p, k) => p.steps.find(s => s.key === k);
const ans = s => s.kind === 'unit' ? s.cell.numeric.answer : s.cell.answer;
const plain = s => String(s).replace(/<[^>]+>/g, ' ');
// The shape, read off the bars independently: mean of 0-14 against mean of 25-39.
function shapeOf(pyr) {
  const band = (a, b) => { let s = 0; for (let i = a; i <= b; i++) s += pyr.male[i] + pyr.female[i]; return s; };
  const k = band(0, 2) / band(5, 7);
  return k > 1.25 ? 'expansive' : k < 0.92 ? 'constrictive' : 'stable';
}

export function recheck(p, c, w, errs) {
  const { Calc: K, Expr } = runtime();
  const { model } = runtime('age-structure');
  const ev = (fn, args) => K.evaluate({ fn, args });
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const want = (k, v) => { const s = step(p, k); if (!s) return bad(`no ${k} step`); if (!close(ans(s), v, 1e-9, 1e-12)) bad(`${k} key ${ans(s)}, recomputed ${v}`); };
  const setupIs = v => { const S = step(p, 'setup').cell.setup, r = Expr.evaluate(S.answer, {}, S.units || []); if (!r.ok || !close(r.value, v, 1e-9)) bad(`setup key "${S.answer}" is not ${v}`); };
  const right = k => { const s = step(p, k); return plain(s.options[s.correct]); };
  switch (p.type) {
    case 'rate': {
      const gr = ev('naturalIncrease', [g.cbr, g.cdr]); setupIs(gr); want('answer', gr); want('year', ev('doublingYear', [g.y0, gr]));
      if (!(gr > 0)) bad('a growth-rate problem with no growth');
      break;
    }
    case 'tfr': {
      const t = ev('tfr', [g.asfr, 5]), a = ev('aboveReplacement', [t]); setupIs(t); want('answer', t);
      const k = right('predict');
      if (!(a > 0.15 ? /^It widens/ : a < -0.15 ? /^It narrows/ : /^It stays about/).test(k)) bad(`TFR ${t}: prediction "${k.slice(0, 20)}"`);
      break;
    }
    case 'shape': {
      const sh = shapeOf(model.pyramid(g.tfr, g.e0));
      if (!right('shape').toLowerCase().startsWith(sh)) bad(`shape key "${right('shape').slice(0, 14)}", bars say ${sh}`);
      if (step(p, 'shape').options.map(plain).map(x => x.split(':')[0]).join() !== 'Expansive,Stable,Constrictive') bad('shape options out of order');
      // Every context range must give the shape its lead describes, at both ends.
      break;
    }
    case 'stage': {
      if (!right('stage').startsWith(`Stage ${g.stage}:`)) bad(`stage key "${right('stage').slice(0, 10)}" for stage ${g.stage}`);
      if (model.stageOf(g.cbr, g.cdr) !== g.stage) bad(`rates ${g.cbr}/${g.cdr} do not point to stage ${g.stage}`);
      break;
    }
    case 'dependency': {
      const v = ev('mul', [ev('div', [ev('add', [g.young, g.old]), 100 - g.young - g.old]), 100]); setupIs(v); want('answer', v);
      const k = right('why');
      if (!(g.young > g.old * 2 ? /schools/ : /pensions/).test(k)) bad('dependency interpretation key');
      break;
    }
    default: bad(`unknown type ${p.type}`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'age-structure', 'simulator', map, errs);
  const { model, Calc: K } = runtime('age-structure');
  if (!model) { errs.push('no model registered (ApEnvMath.ageStructure)'); return errs; }
  if (model.stub) return errs;
  const have = new Set((data.contexts || []).flatMap(c => c.types || []));
  for (const t of TYPES) if (!have.has(t)) errs.push(`no context drills "${t}"`);
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
  // Pyramids: 100% in all, monotone in shape against TFR, close to the fitted shares.
  for (const tfr of [1.2, 1.6, 2.1, 3, 4.5, 6]) for (const e0 of [40, 60, 75, 84]) {
    const p = model.pyramid(tfr, e0), tot = p.male.concat(p.female).reduce((a, b) => a + b, 0);
    if (Math.abs(tot - 100) > 0.3) errs.push(`pyramid TFR ${tfr}, e0 ${e0} sums to ${tot}`);
    if (p.male.concat(p.female).some(v => !(v >= 0))) errs.push(`pyramid TFR ${tfr}, e0 ${e0} has a negative bar`);
  }
  for (const [tfr, e0, sh] of [[5, 60, 'expansive'], [2.2, 76, 'stable'], [1.4, 82, 'constrictive']]) {
    const s = shapeOf(model.pyramid(tfr, e0));
    if (s !== sh || model.shape(model.pyramid(tfr, e0)) !== sh) errs.push(`TFR ${tfr}, e0 ${e0} should be ${sh}, reads ${s}`);
  }
  // Rounded UN World Population Prospects shares (under 15, 65 and over) the model was fitted to.
  for (const [tfr, e0, y, o] of [[6.7, 62, 49, 3], [4.5, 64, 40, 4], [1.7, 79, 18, 17], [1.3, 84, 12, 29], [1.5, 81, 14, 22]]) {
    const b = model.broad(model.pyramid(tfr, e0));
    if (Math.abs(b.young - y) > 5 || Math.abs(b.old - o) > 5) errs.push(`TFR ${tfr}, e0 ${e0}: ${b.young.toFixed(1)}% young and ${b.old.toFixed(1)}% old, far from ${y}% and ${o}%`);
  }
  for (const s of [1, 2, 3, 4]) {
    const S = model.STAGES[s];
    if (model.stageOf(S.cbr, S.cdr) !== s) errs.push(`stage ${s}'s own rates read as stage ${model.stageOf(S.cbr, S.cdr)}`);
    if (!close(model.growth(S.cbr, S.cdr), K.evaluate({ fn: 'naturalIncrease', args: [S.cbr, S.cdr] }))) errs.push(`stage ${s} growth rate`);
  }
  // A shape context's whole range reads as one shape (its lead promises one).
  for (const c of data.contexts || []) if ((c.types || []).includes('shape')) {
    const seen = new Set();
    for (let t = c.tfr[0]; t <= c.tfr[1] + 1e-9; t += 0.1) for (let e = c.e0[0]; e <= c.e0[1]; e++) seen.add(shapeOf(model.pyramid(Math.round(t * 10) / 10, e)));
    if (seen.size !== 1) errs.push(`context ${c.id}: its range gives more than one shape (${[...seen].join(', ')})`);
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  return errs;
}
