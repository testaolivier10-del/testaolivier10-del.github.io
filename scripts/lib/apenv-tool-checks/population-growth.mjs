/* Validator for environmental-science/data/tools/population-growth.json (Population growth), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems. The frame, the model's curves (logistic levels
   off at K, exponential matches ApEnvCalc.exponential, overshoot passes K and
   dies back below it without going extinct, survivorship shapes in their
   order), then 300 problems per context and type regenerated with the model
   the page runs (ApEnvMath.populationGrowth) and every key recomputed
   independently from the givens with ApEnvCalc and a logistic written here:
   doubling time and year, doublings and the projection, K read off the curve,
   the peak of an overshoot, the survivorship curve named in the context, and
   the r or K strategy. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['doubling', 'project', 'logistic', 'phase', 'survivorship', 'rk'];
const step = (p, k) => p.steps.find(s => s.key === k);
const ans = s => s.kind === 'unit' ? s.cell.numeric.answer : s.cell.answer;
const plain = s => String(s).replace(/<[^>]+>/g, ' ');

export function recheck(p, c, w, errs) {
  const { Calc: K, Expr } = runtime();
  const ev = (fn, args) => K.evaluate({ fn, args });
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const want = (k, v, rel = 1e-9) => { const s = step(p, k); if (!s) return bad(`no ${k} step`); if (!close(ans(s), v, rel, 1e-12)) bad(`${k} key ${ans(s)}, recomputed ${v}`); };
  const setupIs = v => { const S = step(p, 'setup').cell.setup, r = Expr.evaluate(S.answer, {}, S.units || []); if (!r.ok || !close(r.value, v, 1e-9)) bad(`setup key "${S.answer}" is not ${v}`); };
  const right = k => { const s = step(p, k); return plain(s.options[s.correct]); };
  switch (p.type) {
    case 'doubling': { const td = ev('ruleOf70', [g.rate]); setupIs(td); want('answer', td); want('year', ev('doublingYear', [g.y0, g.rate])); break; }
    case 'project': {
      const td = ev('ruleOf70', [g.rate]); want('k', g.k);
      const v = ev('afterDoublings', [g.n0, g.k * td, td]); setupIs(v); want('answer', v); break;
    }
    case 'logistic': {
      // An independent logistic: the curve must level off at the K keyed.
      let N = g.n0; for (let y = 0; y < 30; y++) N = N + g.r * N * (1 - N / g.K);
      if (Math.abs(N / g.K - 1) > 0.02) bad(`the logistic curve ends at ${N}, not near K ${g.K}`);
      want('k', g.K);
      if (!/K\/2|half the carrying/.test(right('phase'))) bad('fastest growth key is not K/2');
      if (!/^Limiting resources/.test(right('why'))) bad('levelling key');
      break;
    }
    case 'phase': {
      const sim = p.figure && runtime('population-growth').model.simulate(p.figure);
      if (!sim) return bad('no figure to read');
      if (!(sim.peak > g.K * 1.05)) bad(`no overshoot: peak ${sim.peak} vs K ${g.K}`);
      const after = sim.n.slice(sim.peakT);
      if (!(Math.min(...after) < g.K)) bad('no dieback below K');
      if (!(Math.min(...after) > 0.01 * g.K)) bad('the herd goes extinct (the model should die back, not vanish)');
      want('read', sim.peak);
      if (!/^Overshoot/.test(right('phase'))) bad('phase key');
      if (!/^Overgrazing damaged/.test(right('why'))) bad('dieback key');
      break;
    }
    case 'survivorship': {
      const k = right('curve');
      if (!k.startsWith('Type ' + c.curve + ':')) bad(`curve key "${k.slice(0, 12)}" for a Type ${c.curve} context`);
      if (step(p, 'curve').options.map(plain).map(x => x.split(':')[0]).join() !== 'Type I,Type II,Type III') bad('curve options are not in order I, II, III');
      if (!/related, not the same/.test(right('link'))) bad('survivorship vs r and K key');
      break;
    }
    case 'rk': {
      if (right('rk') !== (c.strategy === 'r' ? 'r-selected' : 'K-selected')) bad('strategy key');
      if (!(c.strategy === 'r' ? /rebounds/ : /recovers slowly/).test(right('trait'))) bad('prediction key');
      break;
    }
    default: bad(`unknown type ${p.type}`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'population-growth', 'simulator', map, errs);
  const { model, Calc: K } = runtime('population-growth');
  if (!model) { errs.push('no model registered (ApEnvMath.populationGrowth)'); return errs; }
  if (model.stub) return errs;
  const have = new Set((data.contexts || []).flatMap(c => c.types || []));
  for (const t of TYPES) if (!have.has(t)) errs.push(`no context drills "${t}"`);
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
    if ((c.types || []).includes('survivorship') && !['I', 'II', 'III'].includes(c.curve)) errs.push(`context ${c.id}: curve must be I, II or III`);
    if ((c.types || []).includes('rk') && !['r', 'K'].includes(c.strategy)) errs.push(`context ${c.id}: strategy must be r or K`);
  }
  // The model the explore view draws.
  const e = model.simulate({ model: 'exp', r: 0.05, K: 1000, n0: 100, years: 20 });
  if (!close(e.n[20], K.evaluate({ fn: 'exponential', args: [100, 5, 20] }), 1e-9)) errs.push('exponential curve does not match ApEnvCalc.exponential');
  for (const r of [0.2, 0.4, 0.6]) {
    const l = model.simulate({ model: 'log', r, K: 1000, n0: 50, years: 60 });
    if (Math.abs(l.n[60] - 1000) > 5 || l.n.some((v, i) => i && v < l.n[i - 1] - 1e-9)) errs.push(`logistic r=${r} does not rise steadily to K`);
  }
  for (let r = 0.2; r <= 0.6001; r += 0.05) {
    const o = model.simulate({ model: 'over', r, K: 1000, n0: 60, years: 50, lag: 2, crash: 0.55 });
    const after = o.n.slice(o.peakT);
    if (!(o.peak > 1000) || !(Math.min(...after) < 1000) || !(Math.min(...after) > 10)) errs.push(`overshoot r=${r.toFixed(2)}: peak ${o.peak}, low ${Math.min(...after)}`);
  }
  const C = model.CURVES;
  for (const t of ['I', 'II', 'III']) if (C[t].length !== 11 || C[t][0] !== 1000 || C[t].some((v, i) => i && v > C[t][i - 1])) errs.push(`survivorship ${t} is not a falling curve from 1,000`);
  if (!(C.I[5] > C.II[5] && C.II[5] > C.III[5])) errs.push('survivorship curves are not in order at mid-life');
  // Type II is a constant rate: a straight line on a log scale.
  const lr = C.II.slice(1).map((v, i) => Math.log(v / C.II[i]));
  if (lr.some(x => Math.abs(x - lr[0]) > 0.05)) errs.push('Type II is not a constant death rate');
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  return errs;
}
