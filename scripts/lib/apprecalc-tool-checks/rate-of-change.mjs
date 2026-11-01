/* Validator for precalculus/data/tools/rate-of-change.json (Rate of change), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems.

   1. The frame, each context's kind, the functions list (each with a topic).
   2. The Explore contexts: each function's stated concavity against the sign
      of its second differences on a fine grid; the secants and the trend of
      their slopes against this file's own arithmetic.
   3. 300 seeded problems per context (_drills.mjs sweep), every key
      recomputed here from the problem's numbers (this file's own polynomial
      evaluation, secant line and concavity test). No calculus wording in
      any text the drill shows. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['aroc', 'estimate', 'concavity', 'quadratic'];
const poly = c => x => c.reduce((s, k, i) => s + k * x ** (c.length - 1 - i), 0);
const slope = (f, a, b) => (f(b) - f(a)) / (b - a);
const CALC = /increasing at a decreasing rate|decreasing at an increasing rate|derivative|instantaneous rate/i;
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function exploreProblems(model) {
  const errs = [];
  for (const id of model.ORDER) {
    const F = model.FUNCS[id], [a, b] = F.dom;
    for (let i = 1; i < 200; i++) {
      const x = a + (b - a) * i / 200, h = 1e-3;
      const d2 = (F.f(x + h) - 2 * F.f(x) + F.f(x - h)) / (h * h), want = Math.abs(d2) < 1e-6 ? 0 : Math.sign(d2);
      if (want !== F.conc(x) && Math.abs(d2) > 1e-3) { errs.push(`function ${id}: conc(${x}) is ${F.conc(x)}, its second differences say ${want}`); break; }
    }
    const S = model.secants(F.f, F.start, F.d, F.nn);
    S.forEach(s => { if (!close(s.m, slope(F.f, s.a, s.b), 1e-12, 1e-12)) errs.push(`function ${id}: a secant slope is wrong`); });
    if (F.start + F.d * F.nn > b + 1e-9) errs.push(`function ${id}: the starting secants run past the domain`);
    const own = S.map(s => slope(F.f, s.a, s.b)), up = own.every((m, i) => !i || m > own[i - 1] + 1e-12), down = own.every((m, i) => !i || m < own[i - 1] - 1e-12);
    const tr = model.trend(own), want = up && own.length > 1 ? 'up' : down && own.length > 1 ? 'down' : own.every(m => close(m, own[0], 1e-9, 1e-9)) ? 'same' : 'mixed';
    if (tr !== want) errs.push(`function ${id}: trend ${tr}, the slopes say ${want}`);
    const sent = model.trendSentence(F, tr, F.start, F.start + F.d * F.nn) + model.arocSentence(F, F.start, F.start + F.d);
    if (CALC.test(sent)) errs.push(`function ${id}: a sentence uses calculus wording`);
    if (!/secant line/.test(model.arocSentence(F, F.start, F.start + F.d))) errs.push(`function ${id}: the rate sentence does not name the secant line`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'rate-of-change', 'simulator', map, errs);
  const { model } = runtime('rate-of-change');
  if (!model) { errs.push('the model ApPrecalcMath.rateOfChange is not registered (precalculus/assets/tools/math/rate-of-change.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t1.md)'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
  if (!Array.isArray(data.functions) || !data.functions.length) errs.push('functions: list the Explore functions, each { id, topic }');
  for (const f of data.functions || []) {
    if (!model.FUNCS[f.id]) errs.push(`functions: unknown function "${f.id}"`);
    if (!topicOk(f.topic, map)) errs.push(`functions: ${f.id} has unknown topic "${f.topic}"`);
  }
  errs.push(...exploreProblems(model));

  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer, opt0 = (p, k) => strip(S(p, k).options[0]);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`${w}: step ${s.key} key is not the first option`);
    const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, ...(s.options || []), ...(s.why || [])])].map(strip).join(' ');
    if (CALC.test(all)) errs.push(`${w}: calculus wording in the problem`);
    if (p.type === 'aroc') {
      const f = poly(v.c);
      if (!close(ans(p, 'm'), slope(f, v.a, v.b), 1e-12, 1e-12)) errs.push(`${w}: rate key ${ans(p, 'm')}`);
      for (let x = 0; x <= v.b + 1; x++) if (f(x) < 0) { errs.push(`${w}: a negative value in a context that cannot be negative`); break; }
    }
    if (p.type === 'estimate') {
      const f = poly(v.c), m = slope(f, v.p, v.q), est = f(v.q) + m * (v.x0 - v.q);   // the line through the other end
      if (!close(ans(p, 'm'), m, 1e-12, 1e-12)) errs.push(`${w}: slope key`);
      if (!close(ans(p, 'est'), est, 1e-9, 1e-9)) errs.push(`${w}: estimate key ${ans(p, 'est')}, the secant line gives ${est}`);
      const d2 = f(v.x0 + 1) - 2 * f(v.x0) + f(v.x0 - 1), over = est > f(v.x0);
      if (Math.sign(d2) !== (over ? 1 : -1)) errs.push(`${w}: concavity and over/under disagree`);
      if (!opt0(p, 'ou').startsWith(over ? 'An overestimate' : 'An underestimate')) errs.push(`${w}: the keyed conclusion is wrong`);
      if (!/concave/.test(opt0(p, 'ou')) || !/secant line/.test(opt0(p, 'ou'))) errs.push(`${w}: the keyed reason must name concavity and the secant line`);
      const incOwn = f(v.q) > f(v.p);
      if (incOwn !== v.inc) errs.push(`${w}: the function's direction is misstated`);
    }
    if (p.type === 'concavity') {
      const rates = v.xs.slice(1).map((x, i) => (v.ys[i + 1] - v.ys[i]) / (x - v.xs[i]));
      if (!close(ans(p, 'r1'), rates[0], 1e-12, 1e-12) || !close(ans(p, 'r4'), rates[3], 1e-12, 1e-12)) errs.push(`${w}: rate keys`);
      const up = rates.every((m, i) => !i || m > rates[i - 1]), down = rates.every((m, i) => !i || m < rates[i - 1]);
      if (!up && !down) errs.push(`${w}: the table's rates do not change one way`);
      if (!opt0(p, 'conc').startsWith(up ? 'Concave up' : 'Concave down')) errs.push(`${w}: the keyed concavity is wrong`);
      const xs = v.xs, d = xs[1] - xs[0];
      if (xs.some((x, i) => i && !close(x - xs[i - 1], d, 1e-12, 1e-12))) errs.push(`${w}: the inputs are not equally spaced`);
    }
    if (p.type === 'quadratic') {
      const f = poly(v.c), r1 = slope(f, v.x0, v.x0 + v.w), r2 = slope(f, v.x0 + v.w, v.x0 + 2 * v.w);
      if (!close(ans(p, 'r1'), r1, 1e-12, 1e-12) || !close(ans(p, 'r2'), r2, 1e-12, 1e-12)) errs.push(`${w}: rate keys`);
      if (!close(ans(p, 'dd'), r2 - r1, 1e-12, 1e-12) || !close(r2 - r1, 2 * v.c[0] * v.w, 1e-12, 1e-12)) errs.push(`${w}: the change of the rates is not 2aw`);
    }
  });
  return errs;
}
