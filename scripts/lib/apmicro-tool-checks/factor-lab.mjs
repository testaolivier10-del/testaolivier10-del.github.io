/* Validator for microeconomics/data/tools/factor-lab.json (Factor Market Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, each context's fields and types,
   the Explore tables (competitive and monopsony, with and without a minimum
   wage) against this file's own arithmetic, then 300 problems per context
   and type regenerated with the model the page runs (ApMicroMath.factorLab),
   every key recomputed here: MP, MRP = MP x P, workers hired (last MRP at
   least the MRC), MFC as the change in total labor cost, the wage read from
   labor supply, MP per dollar, and every graph key (ApMicroGraph.named for the
   hiring point, the shift direction from the cause). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['hire', 'derived', 'monopsony', 'leastcost'];
const step = (p, k) => p.steps.find(s => s.key === k);
// Own hiring rule: the number of the last worker whose MRP is at least the cost.
export function hires(mrp, cost) { let n = 0; mrp.forEach((v, i) => { if (v >= (Array.isArray(cost) ? cost[i] : cost) - 1e-9) n = i + 1; }); return n; }
export function monoTable(m, mw = 0) {
  const out = []; let prev = 0;
  for (let L = 1; L <= m.n; L++) { const w = m.a + m.b * L, tlc = Math.max(w, mw) * L; out.push({ L, w, tlc, mfc: tlc - prev, mrp: m.c - m.d * L }); prev = tlc; }
  return out;
}

export function recheck(p, c, w, errs) {
  const { Graph, Grade } = runtime('factor-lab');
  const need = (ok, m) => { if (!ok) errs.push(`${w}: ${m}`); };
  const g = p.given;
  if (p.type === 'hire') {
    const mp = g.tp.slice(1).map((v, i) => v - g.tp[i]), mrp = mp.map(x => x * g.P);
    need(mp.every((x, i) => x > 0 && (i === 0 || x <= mp[i - 1])), 'marginal product is not positive and diminishing');
    need(close(step(p, 'mp').cell.answer, mp[g.k - 1]), 'MP key');
    need(close(step(p, 'mrp').cell.answer, mrp[g.k - 1]), 'MRP key');
    const h = hires(mrp, g.W);
    need(step(p, 'hire').cell.answer === h && h >= 1 && h < mp.length, `hire key ${step(p, 'hire').cell.answer}, own ${h}`);
    need(p.table.includes(String(g.tp[g.k])), 'the table does not show the total product');
  } else if (p.type === 'derived') {
    const sh = step(p, 'shift'), key = sh.spec.key.shifts[0];
    if (g.price) {
      need(key.curve === 'MRP' && key.dir === (g.up ? 'right' : 'left'), 'a product price change shifts MRP the same way');
      need((g.P1 > g.P) === g.up, 'the new price does not move with demand');
      need(close(step(p, 'newmrp').cell.answer, g.mp * g.P1), 'new MRP key');
      const r = step(p, 'chain').options[0];
      need(/MRP/.test(r) && /price/.test(r) && /labor demand/.test(r), 'the keyed chain misses a link');
      need(step(p, 'chain').options.slice(1).every(o => !/MRP/.test(o)), 'a distractor also names MRP');
    } else {
      need(key.curve === 'SL' && key.dir === (g.up ? 'left' : 'right'), 'a change in workers shifts labor supply');
      const o = Graph.outcome(sh.spec, Graph.keyOffsets(sh.spec));
      need(o && o.wage === (g.up ? 'up' : 'down'), 'the wage outcome is wrong');
      need(step(p, 'firm').options[0].includes(g.up ? 'fewer' : 'more'), 'the firm key is wrong');
    }
    // An untouched graph and the wrong curve are graded wrong.
    const wrong = { shifts: { [key.curve === 'MRP' ? 'SL' : 'DL']: 1 }, eq: null, point: null, labels: {}, line: null, shade: [] };
    need(!Grade.graph(sh.spec, wrong).correct, 'the wrong curve is graded right');
  } else if (p.type === 'monopsony') {
    const t = monoTable(g.m), mrp = t.map(r => r.mrp), h = hires(mrp, t.map(r => r.mfc)), comp = hires(mrp, t.map(r => r.w));
    need(close(step(p, 'mfc').cell.answer, t[g.k - 1].mfc), 'MFC key');
    need(t[g.k - 1].mfc > t[g.k - 1].w, 'MFC is not above the wage');
    need(step(p, 'hire').cell.answer === h, `hire key, own ${h}`);
    need(close(step(p, 'wage').cell.answer, t[h - 1].w), 'wage key (from supply)');
    need(comp > h, 'the competitive market does not hire more');
    const gs = step(p, 'graph').spec;
    if (gs.do[0] === 'point') {
      const pt = Graph.named(gs, {}, 'hire'), mf = Graph.named(gs, {}, 'mrp=mfc');
      need(pt && mf && close(pt[0], mf[0]) && pt[1] < mf[1], 'the hiring point is not below MRP = MFC');
      need(!Grade.graph(gs, { shifts: {}, eq: null, point: mf, labels: {}, line: null, shade: [] }).correct, 'the wage read from MFC is graded right');
    } else need(gs.key.shade === 'wage-bill', 'the shade key is not the wage bill');
  } else if (p.type === 'leastcost') {
    const a = g.mpl / g.w, b = g.mpk / g.r, ch = step(p, 'next');
    need(close(step(p, 'labor').cell.answer, a) && close(step(p, 'capital').cell.answer, b), 'MP per dollar keys');
    const want = Math.abs(a - b) < 1e-9 ? 2 : a > b ? 0 : 1;
    need(ch.correct === want, 'the next-dollar key');
    need(new Set(ch.options).size === 4, 'two options read the same');
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'factor-lab', 'skill', map, errs);
  for (const c of data.contexts || []) {
    for (const k of ['firm', 'good', 'unit', 'town']) if (!c[k]) errs.push(`context ${c.id}: "${k}" is required`);
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types from ${TYPES.join(', ')}`);
  }
  const { model } = runtime('factor-lab');
  if (!model || model.stub) { errs.push('ApMicroMath.factorLab is not built'); return errs; }
  // Explore: the competitive table and the monopsony (with and without a minimum wage).
  for (const P of [2, 3, 4, 5, 6, 7]) for (const W of [12, 16, 20, 24, 28, 32]) {
    const r = model.competitive(P, W), mp = model.TP.slice(1).map((v, i) => v - model.TP[i]), mrp = mp.map(x => x * P);
    if (r.hire !== hires(mrp, W)) errs.push(`explore competitive P ${P} W ${W}: hires ${r.hire}, own ${hires(mrp, W)}`);
  }
  for (const mw of [0, 12, 14, 16, 18, 20, 22, 24]) {
    const r = model.monopsony(mw), t = monoTable(model.MONO, mw), h = hires(t.map(x => x.mrp), t.map(x => x.mfc));
    if (r.hire !== h) errs.push(`explore monopsony mw ${mw}: hires ${r.hire}, own ${h}`);
    if (r.wage !== Math.max(mw, model.MONO.a + model.MONO.b * h)) errs.push(`explore monopsony mw ${mw}: wage ${r.wage}`);
  }
  const m0 = model.monopsony(0);
  if (m0.hire !== 6 || m0.wage !== 16 || m0.comp !== 9) errs.push('explore monopsony no longer matches the graph (hire 6 at $16; competitive 9)');
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}
