/* Validator for calculus/data/tools/related-rates.json (Related rates), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems.

   1. The frame (slug, kind, topic, intro, contexts) and each context's kind.
   2. The Explore scenes: for every scene, at many moments and rates, every
      readout rate equals the time derivative of its quantity along the
      motion the scene plays (central differences through scene.advance, not
      the model's chain-rule formulas).
   3. 300 seeded problems per context (_drills.mjs sweep), every key
      recomputed here from the problem's numbers by numerical
      differentiation along a straight-line path in time, and every typed
      derivative compared with that numerical derivative. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['ladder', 'cone', 'shadow', 'ripple', 'balloon'];
const D = (f, h = 1e-5) => (f(h) - f(-h)) / (2 * h);   // d/dt at t = 0

/* Each scene's rates are the derivatives of its quantities along its motion. */
export function sceneProblems(model) {
  const errs = [];
  for (const id of model.ORDER) {
    const S = model.SCENES[id], { min, max } = S.driver;
    for (let i = 1; i < 10; i++) {
      const u = min + (max - min) * i / 10;
      for (const rate of [S.rate.min, S.rate.value, S.rate.max]) {
        if (!rate) continue;
        const at = S.at(u, rate);
        for (const q of S.qs) {
          const num = D(t => S.at(S.advance(u, rate, t), rate).q[q.key], 1e-4);
          if (!close(at.d[q.key], num, 1e-4, 1e-7)) errs.push(`scene ${id}: at ${S.driver.key} = ${u.toFixed(3)}, rate ${rate}: d${q.key}/dt reads ${at.d[q.key]}, the motion gives ${num}`);
        }
        if (!close(S.at(u, rate).d[S.rate.key], rate, 1e-9)) errs.push(`scene ${id}: the given rate is not the rate shown`);
        if (S.chain(u, rate).some(c => /NaN|undefined|Infinity/.test(c.say + c.tex))) errs.push(`scene ${id}: a chain step prints NaN`);
      }
    }
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'related-rates', 'simulator', map, errs);
  const { M, Expr, model } = runtime('related-rates');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/related-rates.js does not register ApCalcMath.relatedRates with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
  for (const s of data.scenes || []) if (!model.SCENES[s]) errs.push(`scenes: unknown scene "${s}"`);
  errs.push(...sceneProblems(model));

  /* A typed derivative key against the numerical derivative of the relation
     along the path where every variable moves at its rate. */
  const exprOk = (step, vars, rel, w) => {
    const f = Expr.fn(step.cell.expr.answer, vars);
    for (const pt of [[1.3, 2.2, 0.7, -1.1, 1], [2.5, 1.4, -0.4, 0.9, 1.6], [3.1, 4.2, 1.7, 0.3, 0.8]]) {
      const sc = {}; vars.forEach((v, i) => { sc[v] = pt[i]; });
      const want = rel(sc);
      if (!close(f(sc), want, 1e-6, 1e-8)) { errs.push(`${w}: typed key ${step.cell.expr.answer} = ${f(sc)}, d/dt of the relation = ${want}`); return; }
    }
  };
  const S = (p, k) => p.steps.find(s => s.key === k);
  const ans = (p, k) => S(p, k).cell.answer;

  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    if (p.type !== c.kind) errs.push(`${w}: kind ${p.type}, context says ${c.kind}`);
    for (const k of ['rel', 'mean']) if (S(p, k) && S(p, k).correct !== 0) errs.push(`${w}: step ${k} key is not the first option`);
    if (p.type === 'ladder') {
      const { L, x, y, k, top } = v;
      if (x * x + y * y !== L * L) errs.push(`${w}: ${x}, ${y}, ${L} is not a right triangle`);
      // x(t), y(t) moving at the given rate, the other end kept on the ladder.
      const dx = top ? D(t => Math.sqrt(L * L - (y - k * t) ** 2)) : k;
      const dy = top ? -k : D(t => Math.sqrt(L * L - (x + k * t) ** 2));
      if (!close(ans(p, 'rate'), top ? dx : dy, 1e-6)) errs.push(`${w}: rate ${ans(p, 'rate')}, the motion gives ${top ? dx : dy}`);
      if (!close(ans(p, 'other'), top ? Math.sqrt(L * L - y * y) : Math.sqrt(L * L - x * x), 1e-9)) errs.push(`${w}: the other side is wrong`);
      exprOk(S(p, 'diff'), ['x', 'y', 'dx', 'dy', 'dt'], s => D(t => (s.x + s.dx / s.dt * t) ** 2 + (s.y + s.dy / s.dt * t) ** 2, 1e-4), w);
      if (!S(p, 'rel').options[0].includes(String(L * L))) errs.push(`${w}: the relation does not use ${L * L}`);
    }
    if (p.type === 'cone') {
      const { R, H, h, dV } = v, V = z => Math.PI / 3 * (R * z / H) ** 2 * z;
      const dh = dV / D(z => V(h + z));
      if (!close(ans(p, 'rate'), dh, 1e-6)) errs.push(`${w}: dh/dt ${ans(p, 'rate')}, from dV/dt over V'(h) ${dh}`);
      if (!close(ans(p, 'rdot'), R / H * dh, 1e-6)) errs.push(`${w}: dr/dt ${ans(p, 'rdot')}, want ${R / H * dh}`);
      exprOk(S(p, 'diff'), ['h', 'dh', 'dt'], s => D(t => V(s.h + s.dh / s.dt * t), 1e-4), w);
      if (Math.sign(dh) !== Math.sign(dV)) errs.push(`${w}: the level moves against the flow`);
    }
    if (p.type === 'shadow') {
      const { Hl, hp, w: speed, x } = v;
      // s from the similar triangles by bisection on Hl·s − hp·(x + s) = 0.
      const sOf = X => M.root(s => Hl * s - hp * (X + s), 0, 10 * X + 10);
      const ds = D(t => sOf(x + speed * t), 1e-4);
      if (!close(ans(p, 'ds'), ds, 1e-5)) errs.push(`${w}: ds/dt ${ans(p, 'ds')}, the triangles give ${ds}`);
      if (!close(ans(p, 'tip'), speed + ds, 1e-5)) errs.push(`${w}: the tip's speed is wrong`);
      const f = Expr.fn(S(p, 'solve').cell.expr.answer, ['x']);
      for (const X of [3, 7, 11]) if (!close(f(X), sOf(X), 1e-6)) errs.push(`${w}: s(x) key disagrees with the triangles at x = ${X}`);
    }
    if (p.type === 'ripple') {
      const { r0, k, byArea } = v, dA = D(t => Math.PI * (r0 + k * t) ** 2);
      if (!close(ans(p, 'dA'), dA, 1e-6)) errs.push(`${w}: dA/dt ${ans(p, 'dA')}, want ${dA}`);
      if (byArea && !close(ans(p, 'r'), Math.sqrt(v.A / Math.PI), 1e-9)) errs.push(`${w}: r from the area is wrong`);
      if (!byArea && S(p, 'r')) errs.push(`${w}: an r step without an area to find it from`);
      exprOk(S(p, 'diff'), ['r', 'dr', 'dt'], s => D(t => Math.PI * (s.r + s.dr / s.dt * t) ** 2, 1e-4), w);
    }
    if (p.type === 'balloon') {
      const { d, h, v: speed } = v, th = D(t => Math.atan((h + speed * t) / d));
      if (!close(ans(p, 'rate'), th, 1e-6)) errs.push(`${w}: dθ/dt ${ans(p, 'rate')}, the motion gives ${th}`);
      if (!close(ans(p, 'sec'), 1 / Math.cos(Math.atan(h / d)) ** 2, 1e-9)) errs.push(`${w}: sec² θ is wrong`);
      if (S(p, 'diff').correct !== 0) errs.push(`${w}: the derivative's key is not the first option`);
    }
  });
  return errs;
}
