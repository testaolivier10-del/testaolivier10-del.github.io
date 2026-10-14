/* Validator for calculus/data/tools/motion-lab.json (Motion lab), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems.

   1. The frame, each context's kind, each listed motion (a known id and a
      topic of the map).
   2. The Explore motions: v = x′ and a = v′ by central differences on a
      grid; for velocity-given motions, x(t) against x(0) plus a fine
      midpoint sum of v, the distance against a midpoint sum of |v|; every
      direction change is a sign change of v.
   3. 300 seeded problems per context (_drills.mjs sweep), each key
      recomputed here: derivatives by central differences, integrals by
      fine midpoint sums (not the model's Simpson), zeros by scanning. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['deriv', 'speed', 'turn', 'dist', 'graph'];
const TOPIC = { deriv: 'straight-line-motion', speed: 'straight-line-motion', turn: 'straight-line-motion', dist: 'motion-with-integrals', graph: 'motion-with-integrals' };
const d1 = (f, t, h = 1e-5) => (f(t + h) - f(t - h)) / (2 * h);
function mid(f, a, b, n = 40000) { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }
function lin(pts) { return t => { for (let i = 0; i < pts.length - 1; i++) if (t <= pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[pts.length - 1][1]; }; }

export function motionProblems(model) {
  const errs = [];
  for (const id of model.ORDER) {
    const m = model.MOTIONS[id], T = m.T;
    for (let i = 1; i < 40; i++) {
      const t = T * i / 40;
      if (m.pts && m.pts.some(p => Math.abs(p[0] - t) < 1e-3)) continue;
      if (m.mode === 'x' && !close(m.v(t), d1(m.x, t), 1e-6, 1e-7)) { errs.push(`motion ${id}: v is not x′ at t = ${t}`); break; }
      if (!close(m.a(t), d1(m.v, t), 1e-5, 1e-6)) { errs.push(`motion ${id}: a is not v′ at t = ${t}`); break; }
    }
    if (m.mode === 'v') {
      for (const t of [T / 3, T * 0.7, T]) {
        const want = m.x0 + mid(m.v, 0, t), got = model.xAt(m, t);
        if (!close(got, want, 1e-6, 1e-6)) errs.push(`motion ${id}: x(${t}) = ${got}, x(0) + ∫v = ${want}`);
        const dw = mid(s => Math.abs(m.v(s)), 0, t), dg = model.distTo(m, t);
        if (!close(dg, dw, 1e-5, 1e-6)) errs.push(`motion ${id}: distance to ${t} = ${dg}, ∫|v| = ${dw}`);
      }
      if (m.exact && !close(model.xAt(m, T), m.exact(T), 1e-9)) errs.push(`motion ${id}: x(T) disagrees with its antiderivative`);
    }
    const tb = model.table(m, 200);
    if (!close(tb.d[200], model.distTo(m, T), 1e-6, 1e-6)) errs.push(`motion ${id}: the table's distance disagrees`);
    for (const z of model.analyze(m).turns) if (!(m.v(z - 1e-3) * m.v(z + 1e-3) < 0)) errs.push(`motion ${id}: t = ${z} is marked as a turn but v keeps its sign`);
    // every sign change of v is marked
    let n = 0, last = 0; for (let i = 0; i <= 2000; i++) { const s = Math.sign(Math.round(m.v(T * i / 2000) * 1e9)); if (s && last && s !== last) n++; if (s) last = s; }
    if (n !== model.analyze(m).turns.length) errs.push(`motion ${id}: v changes sign ${n} times, ${model.analyze(m).turns.length} turns marked`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'motion-lab', 'simulator', map, errs);
  const { M, Expr, model } = runtime('motion-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/motion-lab.js does not register ApCalcMath.motionLab with a generate()'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
    else if (c.topic !== TOPIC[c.kind]) errs.push(`context ${c.id}: a ${c.kind} problem belongs to topic ${TOPIC[c.kind]}`);
  }
  for (const m of data.motions || []) {
    if (!model.MOTIONS[m.id]) errs.push(`motions: unknown motion "${m.id}"`);
    else if (!topicOk(m.topic, map)) errs.push(`motions: ${m.id} has unknown topic "${m.topic}"`);
    else if (model.MOTIONS[m.id].mode === 'v' && m.topic !== 'motion-with-integrals') errs.push(`motions: ${m.id} gives velocity, so it belongs to motion-with-integrals`);
  }
  errs.push(...motionProblems(model));

  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, f = p.fig.f;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    if (p.type === 'deriv') {
      const vk = Expr.fn(S(p, 'v').cell.expr.answer, ['t']), ak = Expr.fn(S(p, 'a').cell.expr.answer, ['t']);
      for (const t of [0.4, 1.3, 2.7]) {
        if (!close(vk(t), d1(f, t), 1e-6, 1e-6)) { errs.push(`${w}: v(t) key is not x′(t) at ${t}`); break; }
        if (!close(ak(t), d1(vk, t), 1e-6, 1e-5)) { errs.push(`${w}: a(t) key is not v′(t) at ${t}`); break; }
      }
      if (!close(ans(p, 'vt'), d1(f, v.t0), 1e-6, 1e-6)) errs.push(`${w}: v(t0) is wrong`);
      if (!close(ans(p, 'at'), d1(t => d1(f, t, 1e-4), v.t0, 1e-4), 1e-4, 1e-4)) errs.push(`${w}: a(t0) is wrong`);
    }
    if (p.type === 'speed') {
      const vt = f(v.t0), at = d1(f, v.t0);
      if (!close(ans(p, 'vt'), vt, 1e-9, 1e-9) || !close(ans(p, 'at'), at, 1e-6, 1e-6)) errs.push(`${w}: v(t0) or a(t0) is wrong`);
      const first = S(p, 'state').options[0];
      if (/speeding up/.test(first) !== (vt * at > 0)) errs.push(`${w}: the keyed conclusion disagrees with the signs of v and a`);
    }
    if (p.type === 'turn') {
      const z = ans(p, 'z'), flips = [];
      if (!(Math.abs(f(z)) < 1e-9)) errs.push(`${w}: v(${z}) is not 0`);
      for (let i = 0; i < 2000; i++) { const t = (z - 0.01) * i / 2000; if (Math.abs(f(t)) < 1e-6) { errs.push(`${w}: v has an earlier zero near t = ${t}`); break; } }
      let last = 0; for (let i = 0; i <= 4000; i++) { const sg = Math.sign(Math.round(f(p.fig.T * i / 4000) * 1e9)); if (sg && last && sg !== last) flips.push(i); if (sg) last = sg; }
      const all = S(p, 'all').options[0];
      if (flips.length !== v.turns.length) errs.push(`${w}: ${flips.length} sign changes, ${v.turns.length} keyed`);
      for (const z of v.turns) if (!all.includes(String(z))) errs.push(`${w}: the keyed list misses t = ${z}`);
      if (/^Yes/.test(S(p, 'sign').options[0].replace(/<[^>]+>/g, '')) === v.dbl) errs.push(`${w}: the direction key at the first zero is wrong`);
    }
    if (p.type === 'dist') {
      const T = v.T, disp = mid(f, 0, T, 12000), dist = mid(t => Math.abs(f(t)), 0, T, 12000);
      if (!close(ans(p, 'disp'), disp, 1e-6, 1e-6)) errs.push(`${w}: displacement ${ans(p, 'disp')}, midpoint sum ${disp}`);
      if (!close(ans(p, 'dist'), dist, 1e-6, 1e-6)) errs.push(`${w}: distance ${ans(p, 'dist')}, midpoint sum ${dist}`);
      if (!close(ans(p, 'xT'), v.x0 + disp, 1e-6, 1e-6)) errs.push(`${w}: position is not x(0) + displacement`);
      if (!(dist > Math.abs(disp) + 1e-3)) errs.push(`${w}: v never changes sign, so distance and displacement agree`);
      if (!M.three(ans(p, 'dist'), dist)) errs.push(`${w}: the distance key fails the three-decimal rule`);
    }
    if (p.type === 'graph') {
      const g = lin(v.pts), T = v.T;
      const disp = mid(g, 0, T, 24000), dist = mid(t => Math.abs(g(t)), 0, T, 24000), xm = v.x0 + mid(g, 0, v.mid, 24000);
      if (!close(ans(p, 'disp'), disp, 1e-5, 1e-5)) errs.push(`${w}: displacement ${ans(p, 'disp')}, areas give ${disp}`);
      if (!close(ans(p, 'dist'), dist, 1e-5, 1e-5)) errs.push(`${w}: distance ${ans(p, 'dist')}, areas give ${dist}`);
      if (!close(ans(p, 'xm'), xm, 1e-5, 1e-5)) errs.push(`${w}: position ${ans(p, 'xm')}, want ${xm}`);
      if (v.pts[0][0] !== 0 || v.pts[v.pts.length - 1][0] !== T) errs.push(`${w}: the graph does not span 0 to T`);
    }
  });
  return errs;
}
