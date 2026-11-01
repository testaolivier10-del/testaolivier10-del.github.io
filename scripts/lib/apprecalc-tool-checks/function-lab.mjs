/* Validator for precalculus/data/tools/function-lab.json (Function lab), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems.

   1. The frame, each context's kind, the families list (each with a topic).
   2. The Explore model against this file's own parents (PARENT, not the
      model's): g on a grid for many parameter sets; every key point's image
      on g; the zeros against a sign-change scan; the end behavior against
      g far out; vertical asymptotes against g just beside x = h; the domain
      against where g is defined.
   3. 300 seeded problems per context (_drills.mjs sweep), each key
      recomputed here from the problem's numbers. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['identify', 'pointMap', 'describe', 'rational', 'exponential'];
const PARENT = {
  linear: u => u, quadratic: u => u ** 2, cubic: u => u ** 3, absolute: u => Math.abs(u),
  sqrt: u => (u >= 0 ? Math.sqrt(u) : NaN), reciprocal: u => (u === 0 ? NaN : 1 / u),
  exponential: u => 2 ** u, logarithmic: u => (u > 0 ? Math.log(u) / Math.LN2 : NaN), sine: u => Math.sin(u),
  piecewise: u => (u < 0 ? u + 2 : 1 - u / 2)
};
const G = (fam, p) => x => { const v = PARENT[fam](p.b * (x - p.h)); return Number.isNaN(v) ? NaN : p.a * v + p.k; };
const ann = html => [...String(html).matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g)].map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
const rhs = tex => { const m = /= ([^=]+)$/.exec(tex); return m ? m[1].trim() : ''; };
/* A number written in TeX: 3, -2, \\frac{1}{2}, -\\frac{3}{4}. */
const texNum = t => { const m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(t); return m ? (m[1] ? -1 : 1) * m[2] / m[3] : Number(t); };

/* Zeros of f on [a, b] by scanning: sign changes, and touches (|f| tiny at a local min of |f|). */
function scanZeros(f, a, b, n = 8000) {
  const out = [];
  let x0 = a, f0 = f(a);
  for (let i = 1; i <= n; i++) {
    const x1 = a + (b - a) * i / n, f1 = f(x1);
    if (Number.isFinite(f0) && Number.isFinite(f1)) {
      if (f0 === 0) out.push(x0);
      else if (f0 * f1 < 0) {
        let lo = x0, hi = x1, flo = f0;
        for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2, fm = f(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
        const z = (lo + hi) / 2;
        if (Math.abs(f(z)) < 1e-6) out.push(z);
      }
    }
    x0 = x1; f0 = f1;
  }
  return out;
}

export function exploreProblems(model) {
  const errs = [], fams = model.ORDER;
  const sets = [];
  for (const a of [1, -2, 0.5, 3]) for (const b of [1, 2, -1, 0.5]) for (const h of [0, 2, -3]) for (const k of [0, -1.5, 2]) sets.push({ a, b, h, k });
  for (const id of fams) {
    if (!PARENT[id]) { errs.push(`family ${id}: the validator has no parent for it`); continue; }
    const F = model.FAMILIES[id];
    for (const p of sets) {
      const g = G(id, p), w = `family ${id} a=${p.a} b=${p.b} h=${p.h} k=${p.k}`;
      for (let i = 0; i <= 40; i++) {
        const x = -7 + 14 * i / 40, m = model.g(id, p, x), o = g(x);
        if (Number.isFinite(o) !== Number.isFinite(m) || (Number.isFinite(o) && !close(m, o, 1e-12, 1e-12))) { errs.push(`${w}: g(${x}) is ${m}, should be ${o}`); break; }
      }
      F.keys.forEach((kp, i) => {
        const q = model.image(p, kp);
        if (F.open && F.open.includes(i)) return;
        if (!close(g(q[0]), q[1], 1e-9, 1e-9)) errs.push(`${w}: key point ${kp} maps to ${q}, which is not on g`);
      });
      // zeros in [-12, 12]: the scan finds sign changes; the model's list must hold each, and every listed zero is a zero
      const Z = model.zeros(id, p, [-12, 12]);
      for (const z of Z) if (!(Math.abs(g(z)) < 1e-7)) errs.push(`${w}: listed zero ${z} gives g = ${g(z)}`);
      for (const z of scanZeros(g, -12, 12)) if (!Z.some(y => Math.abs(y - z) < 1e-5)) { errs.push(`${w}: g changes sign near ${z}, not a listed zero (${Z})`); break; }
      // end behavior, from g far out (the sine oscillates; outside the domain is null)
      const E = model.ends(id, p);
      for (const [side, X] of [['pos', 1], ['neg', -1]]) {
        const v1 = g(X * 1e3), v2 = g(X * 1e6), want = E[side];
        let got;
        if (id === 'sine') got = 'osc';
        else if (Number.isNaN(v1) && Number.isNaN(v2)) got = null;
        else if (!Number.isFinite(v2)) got = v2 > 0 ? 'inf' : '-inf';
        else if (Math.abs(v2) > 1e4 || Math.abs(v2 - v1) > 0.5) got = v2 > v1 ? 'inf' : '-inf';
        else got = Math.round(v2 * 1e4) / 1e4;
        const ok = typeof want === 'number' ? typeof got === 'number' && close(want, got, 1e-3, 1e-3) : want === got;
        if (!ok) errs.push(`${w}: end behavior at ${side}∞ is ${want}, g far out says ${got}`);
      }
      for (const V of model.vas(id, p)) {
        for (const [side, d] of [['right', 1], ['left', -1]]) {
          // slow (log) or fast (1/x): the outputs keep moving one way as x closes in
          const v1 = g(V.x + d * 1e-6), v2 = g(V.x + d * 1e-12), want = V[side];
          const got = Number.isNaN(v2) ? null : Math.abs(v2) > 1e4 || Math.abs(v2 - v1) > 5 ? (v2 > v1 ? 'inf' : '-inf') : 'finite';
          if (want !== got) errs.push(`${w}: one-sided limit from the ${side} of x = ${V.x} is ${want}, g there says ${got}`);
        }
      }
      if (F.va && !model.vas(id, p).length) errs.push(`${w}: no vertical asymptote listed`);
      const dom = model.domain(id, p);
      if (!/\\infty/.test(dom)) errs.push(`${w}: domain "${dom}" is not in interval notation`);
    }
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'function-lab', 'simulator', map, errs);
  const { M, Expr, model } = runtime('function-lab');
  if (!model) { errs.push('the model ApPrecalcMath.functionLab is not registered (precalculus/assets/tools/math/function-lab.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t1.md)'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
  if (!Array.isArray(data.families) || !data.families.length) errs.push('families: list the Explore families, each { id, topic }');
  for (const f of data.families || []) {
    if (!model.FAMILIES[f.id]) errs.push(`families: unknown family "${f.id}"`);
    if (!topicOk(f.topic, map)) errs.push(`families: ${f.id} has unknown topic "${f.topic}"`);
  }
  errs.push(...exploreProblems(model));

  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`${w}: step ${s.key} key is not the first option`);
    if (p.type === 'identify') {
      const g = G(v.fam, v.p);
      if (ans(p, 'h') !== v.p.h || ans(p, 'k') !== v.p.k || ans(p, 'a') !== v.p.a) errs.push(`${w}: h, k, a keys do not match the graph`);
      if (!close(g(v.p.h), v.p.k, 1e-12, 1e-12)) errs.push(`${w}: the stated corner is not on g`);
      if (!close(g(v.q[0]), v.q[1], 1e-12, 1e-12)) errs.push(`${w}: the second point is not on g`);
      // a from the two points, this file's way
      const a2 = (v.q[1] - v.p.k) / PARENT[v.fam](v.q[0] - v.p.h);
      if (!close(a2, ans(p, 'a'), 1e-12)) errs.push(`${w}: a from the points is ${a2}, key ${ans(p, 'a')}`);
      const E = S(p, 'g').cell.expr, key = Expr.fn(E.answer, ['x']);
      for (let i = 0; i <= 10; i++) { const x = E.domain[0] + (E.domain[1] - E.domain[0]) * i / 10; if (!close(key(x), g(x), 1e-9, 1e-9)) { errs.push(`${w}: the g(x) key differs from g at x = ${x}`); break; } }
    }
    if (p.type === 'pointMap') {
      const { a, b, h, k } = v.p, [px, py] = v.from, x2 = ans(p, 'x'), y2 = ans(p, 'y');
      if (!close(b * (x2 - h), px, 1e-12, 1e-12)) errs.push(`${w}: the inside of g at x = ${x2} is ${b * (x2 - h)}, not ${px}`);
      if (!close(y2, a * py + k, 1e-12, 1e-12)) errs.push(`${w}: y key ${y2}, should be ${a * py + k}`);
    }
    if (p.type === 'describe') {
      const { a, b, h, k } = v.p, x = 1.37;
      if (!close(b * x + v.c, b * (x - h), 1e-12, 1e-12)) errs.push(`${w}: the factored inside does not match`);
      const inR = v.picks.in[0], outR = v.picks.out[0];
      if (inR.b !== b || inR.h !== h || outR.a !== a || outR.k !== k) errs.push(`${w}: the keyed descriptions do not describe g`);
      const curve = q => [-2.2, -0.7, 0.4, 1.9, 3.3].map(t => G(v.fam, q)(t));
      const same = (q1, q2) => curve(q1).every((y, i) => { const z = curve(q2)[i]; return Number.isFinite(y) === Number.isFinite(z) && (!Number.isFinite(y) || close(y, z, 1e-9, 1e-9)); });
      for (const part of ['in', 'out']) v.picks[part].slice(1).forEach((q, i) => { if (q && same({ a: 1, b: 1, h: 0, k: 0, ...q }, { a: 1, b: 1, h: 0, k: 0, ...v.picks[part][0] })) errs.push(`${w}: ${part} option ${i + 2} describes the same graph as the key`); });
      const t = S(p, 'in').options[0].replace(/<[^>]+>/g, '');
      if (h !== 0 && !t.includes(`${Math.abs(h)} unit`) ) errs.push(`${w}: the keyed inside description does not name the shift ${Math.abs(h)}`);
      if (h !== 0 && !t.includes(h > 0 ? 'right' : 'left')) errs.push(`${w}: the keyed inside description shifts the wrong way`);
    }
    if (p.type === 'rational') {
      const g = G('reciprocal', v.p), { h, k } = v.p;
      if (ans(p, 'va') !== h || ans(p, 'ha') !== k) errs.push(`${w}: asymptote keys`);
      if (!(Math.abs(g(h + 1e-9)) > 1e6)) errs.push(`${w}: g is not unbounded beside x = ${h}`);
      const right = g(h + 1e-9) > 0 ? '\\infty' : '-\\infty', keyR = rhs(ann(S(p, 'right').options[0])[0] || '');
      if (keyR !== right) errs.push(`${w}: right-hand limit keyed ${keyR}, g says ${right}`);
      const keyE = rhs(ann(S(p, 'end').options[0])[0] || ''), far = g(1e9);
      if (!close(texNum(keyE), far, 1e-6, 1e-6)) errs.push(`${w}: end behavior keyed ${keyE}, g far out ${far}`);
    }
    if (p.type === 'exponential') {
      const g = G('exponential', v.p);
      if (!close(ans(p, 'ha'), g(-200), 1e-9, 1e-9)) errs.push(`${w}: asymptote key ${ans(p, 'ha')}, g far left ${g(-200)}`);
      const keyN = rhs(ann(S(p, 'neg').options[0])[0] || '');
      if (!close(texNum(keyN), g(-200), 1e-9, 1e-9)) errs.push(`${w}: left end keyed ${keyN}`);
      const Z = scanZeros(g, -30, 30);
      const zs = S(p, 'zero');
      if (zs.kind === 'num') { if (Z.length !== 1 || !close(zs.cell.answer, Z[0], 1e-6, 1e-6)) errs.push(`${w}: zero key ${zs.cell.answer}, scan ${Z}`); }
      else if (Z.length) errs.push(`${w}: keyed "no zero", the scan finds ${Z}`);
    }
  });
  return errs;
}
