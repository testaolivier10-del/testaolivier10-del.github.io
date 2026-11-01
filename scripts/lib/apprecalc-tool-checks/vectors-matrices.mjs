/* Validator for precalculus/data/tools/vectors-matrices.json (Vectors and
   matrices), run by scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL
   ONLY (builder T4). check(data, map) -> problems.

   1. The frame, each context's kind, the path and matrix lists, and the
      "beyond the exam" note in the intro (Unit 4, spec decision 7).
   2. The Explore presets: each path's x(t), y(t) against its stated
      formula; each matrix's determinant against the area of the image of
      the unit square (shoelace), and A times its inverse is the identity.
   3. 300 seeded problems per context (_drills.mjs sweep), every key
      recomputed here: positions and the direction from the coefficients
      (y keeps one direction on the interval), average rates and the slope,
      k·u + v, its length and u·v, the image of a point row by row, the area
      of the image square by the shoelace formula, the determinant, and the
      top-left entry of A⁻¹ by solving A x = (1, 0) by elimination. No
      calculus wording anywhere. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['param', 'prates', 'vectors', 'transform', 'inverse'];
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<span class="sr-only">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/−/g, '-');
const CALC = [/\b(increasing|decreasing) at an? (increasing|decreasing) rate\b/i, /\bderivatives?\b/i, /\binstantaneous rate\b/i];
const shoelace = pts => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const times = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
/* Solve A x = b by elimination with a pivot swap. */
function solve(A, b) {
  let r0 = [A[0][0], A[0][1], b[0]], r1 = [A[1][0], A[1][1], b[1]];
  if (Math.abs(r1[0]) > Math.abs(r0[0])) [r0, r1] = [r1, r0];
  if (!r0[0]) return null;
  const f = r1[0] / r0[0]; r1 = r1.map((x, i) => x - f * r0[i]);
  if (Math.abs(r1[1]) < 1e-12) return null;
  const y = r1[2] / r1[1], x = (r0[2] - r0[1] * y) / r0[0];
  return [x, y];
}
const poly = (c, t) => c[0] + c[1] * t + c[2] * t * t;

export function presetProblems(model) {
  const errs = [], PI = Math.PI;
  const want = { line: [t => -3 + 1.5 * t, t => 2 - t], toss: [t => -4 + 2.5 * t, t => -2 + 5 * t - 2 * t * t], circle: [t => 3 * Math.cos(t), t => 3 * Math.sin(t)], clock: [t => 3 * Math.sin(t), t => 3 * Math.cos(t)], ellipse: [t => 4 * Math.cos(t), t => 2 * Math.sin(t)] };
  for (const id of model.PORDER) {
    const P = model.PATHS[id], w = want[id];
    if (!w) { errs.push(`path ${id}: no reference formula in the validator`); continue; }
    for (let i = 0; i <= 12; i++) { const t = P.dom[0] + (P.dom[1] - P.dom[0]) * i / 12; if (!close(P.x(t), w[0](t), 1e-12, 1e-12) || !close(P.y(t), w[1](t), 1e-12, 1e-12)) { errs.push(`path ${id}: x(t), y(t) disagree at t = ${t}`); break; } }
  }
  for (const id of model.MORDER) {
    const A = model.MATRICES[id].A, D = model.det(A), img = [[0, 0], [1, 0], [1, 1], [0, 1]].map(p => times(A, p));
    if (!close(Math.abs(D), shoelace(img), 1e-12, 1e-12)) errs.push(`matrix ${id}: |det| ${Math.abs(D)}, image area ${shoelace(img)}`);
    const Ai = model.inverse(A);
    if (Math.abs(D) < 1e-12) { if (Ai) errs.push(`matrix ${id}: det 0 but an inverse is returned`); continue; }
    const I = model.mul(A, Ai);
    if (![[1, 0], [0, 1]].every((row, i) => row.every((x, j) => close(I[i][j], x, 1e-12, 1e-12)))) errs.push(`matrix ${id}: A times its inverse is not the identity`);
  }
  // blend: s = 0 is the identity, s = 1 is A
  const A = model.MATRICES.shear.A, b0 = model.blend(A, 0), b1 = model.blend(A, 1);
  if (b0[0][0] !== 1 || b0[0][1] !== 0 || b0[1][1] !== 1 || b1[0][1] !== A[0][1]) errs.push('blend(A, s) does not run from the identity to A');
  if (!close(model.angle([-1, -1]), 5 * PI / 4, 1e-12)) errs.push('angle of a vector is wrong');
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'vectors-matrices', 'simulator', map, errs);
  const { model } = runtime('vectors-matrices');
  if (!model) { errs.push('the model ApPrecalcMath.vectorsMatrices is not registered (precalculus/assets/tools/math/vectors-matrices.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t4.md)'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
    if (map && topicOk(c.topic, map) && map.topicById(c.topic).chapter !== 'unit-4') errs.push(`context ${c.id}: topic ${c.topic} is not in Unit 4`);
  }
  for (const id of data.paths || []) if (!model.PATHS[id]) errs.push(`paths: unknown path "${id}"`);
  for (const id of data.matrices || []) if (!model.MATRICES[id]) errs.push(`matrices: unknown matrix "${id}"`);
  if (!/Beyond the exam/.test(data.intro || '')) errs.push('intro: Unit 4 says it is beyond the exam (docs/apprecalc-spec.md decision 7)');
  for (const k of ['intro', 'howItWorks']) for (const re of CALC) if (re.test(strip(data[k] || ''))) errs.push(`${k}: calculus wording (${re})`);
  errs.push(...presetProblems(model));

  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer, opt0 = (p, k) => strip(S(p, k).options[0]);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`${w}: step ${s.key} key is not the first option`);
    const text = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])].map(strip).join(' ');
    for (const re of CALC) if (re.test(text)) errs.push(`${w}: calculus wording (${re})`);
    if (p.type === 'param') {
      if (!close(ans(p, 'x'), poly(v.cx, v.t0), 1e-12, 1e-12) || !close(ans(p, 'y'), poly(v.cy, v.t0), 1e-12, 1e-12)) errs.push(`${w}: position at t = ${v.t0} keyed (${ans(p, 'x')}, ${ans(p, 'y')})`);
      let up = true, down = true;
      for (let i = 0; i < 100; i++) { const a = poly(v.cy, v.t1 + (v.t2 - v.t1) * i / 100), b = poly(v.cy, v.t1 + (v.t2 - v.t1) * (i + 1) / 100); if (b < a) up = false; if (b > a) down = false; }
      if (!(up || down)) errs.push(`${w}: y turns inside [${v.t1}, ${v.t2}], so "which way" has no single answer`);
      const dx = poly(v.cx, v.t2) - poly(v.cx, v.t1), want = (dx > 0 ? 'Right' : 'Left') + ' and ' + (up ? 'up' : 'down');
      if (opt0(p, 'dir') !== want) errs.push(`${w}: direction key "${opt0(p, 'dir')}", the coefficients say "${want}"`);
    }
    if (p.type === 'prates') {
      const dt = v.t2 - v.t1, dx = poly(v.cx, v.t2) - poly(v.cx, v.t1), dy = poly(v.cy, v.t2) - poly(v.cy, v.t1);
      if (!close(ans(p, 'rx'), dx / dt, 1e-12, 1e-12) || !close(ans(p, 'ry'), dy / dt, 1e-12, 1e-12) || !close(ans(p, 'm'), dy / dx, 1e-12, 1e-12)) errs.push(`${w}: rates keyed ${ans(p, 'rx')}, ${ans(p, 'ry')}, ${ans(p, 'm')}; recomputed ${dx / dt}, ${dy / dt}, ${dy / dx}`);
    }
    if (p.type === 'vectors') {
      const wx = v.k * v.u[0] + v.v[0], wy = v.k * v.u[1] + v.v[1];
      if (ans(p, 'wx') !== wx || ans(p, 'wy') !== wy) errs.push(`${w}: w keyed (${ans(p, 'wx')}, ${ans(p, 'wy')}), recomputed (${wx}, ${wy})`);
      if (!close(ans(p, 'mag'), Math.sqrt(wx * wx + wy * wy), 1e-12, 1e-12)) errs.push(`${w}: magnitude keyed ${ans(p, 'mag')}`);
      if (ans(p, 'dot') !== v.u[0] * v.v[0] + v.u[1] * v.v[1]) errs.push(`${w}: dot product keyed ${ans(p, 'dot')}`);
    }
    if (p.type === 'transform') {
      const A = v.A, q = [A[0][0] * v.p[0] + A[0][1] * v.p[1], A[1][0] * v.p[0] + A[1][1] * v.p[1]];
      if (ans(p, 'qx') !== q[0] || ans(p, 'qy') !== q[1]) errs.push(`${w}: image keyed (${ans(p, 'qx')}, ${ans(p, 'qy')}), recomputed (${q})`);
      const area = shoelace([[0, 0], [1, 0], [1, 1], [0, 1]].map(pt => times(A, pt)));
      if (!close(ans(p, 'area'), area, 1e-12, 1e-12)) errs.push(`${w}: area keyed ${ans(p, 'area')}, shoelace ${area}`);
    }
    if (p.type === 'inverse') {
      const A = v.A, D = A[0][0] * A[1][1] - A[0][1] * A[1][0], area = shoelace([[0, 0], [1, 0], [1, 1], [0, 1]].map(pt => times(A, pt)));
      if (ans(p, 'det') !== D || !close(Math.abs(D), area, 1e-12, 1e-12)) errs.push(`${w}: det keyed ${ans(p, 'det')}, recomputed ${D}`);
      const x = solve(A, [1, 0]);
      if (!x !== (opt0(p, 'inv').startsWith('No'))) errs.push(`${w}: invertible key "${opt0(p, 'inv')}", elimination ${x ? 'solves' : 'fails'}`);
      if (x && !close(ans(p, 'i11'), x[0], 1e-12, 1e-12)) errs.push(`${w}: top-left of the inverse keyed ${ans(p, 'i11')}, elimination gives ${x[0]}`);
      if (!x && !/segment/.test(opt0(p, 'img'))) errs.push(`${w}: a singular matrix's image of the square is a segment`);
    }
  });
  return errs;
}
