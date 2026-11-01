/* Rate of change: its model (precalculus/assets/tools/math/rate-of-change.js)
   and its validator (scripts/lib/apprecalc-tool-checks/rate-of-change.mjs).
   OWNED BY THIS TOOL ONLY (builder T1). The shipped data passes (300 problems
   per context, keys recomputed); secants, trends and concavity against hand
   values; the Q2 slips named (the secant through (0, 0), a line not through
   its point, over/under from the function's direction); quadratics' rates
   change by 2aw; no calculus wording; planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, exploreProblems } from '../lib/apprecalc-tool-checks/rate-of-change.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('rate-of-change');
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'rate-of-change.json'), 'utf8'));
const plain = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<span class="sr-only">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '');

test('rate-of-change: the page entry is wired and the shipped data passes its validator', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'rate-of-change');
  assert.ok(entry && entry.studio === true && !entry.premium, 'free, on the Tool Studio');
  assert.equal(data().topic, entry.topic);
  assert.deepEqual(check(data(), loadMap()), []);
  const map = loadMap();
  assert.ok(check({ ...data(), functions: [{ id: 'rocket', topic: 'rates-of-change' }] }, map).some(e => /unknown function/.test(e)));
  assert.ok(check({ ...data(), contexts: [{ id: 'x', topic: 'rates-of-change', kind: 'tangent' }] }, map).some(e => /kind must be/.test(e)));
});

test('rate-of-change: secants, trends and estimates against hand values', () => {
  assert.deepEqual(exploreProblems(model), []);
  const ball = model.FUNCS.ball;
  const S = model.secants(ball.f, 0, 1, 4).map(s => +s.m.toFixed(9));
  assert.deepEqual([...S], [14.7, 4.9, -4.9, -14.7]);                 // 19.6 - 4.9(2t + 1)
  assert.equal(model.trend(S), 'down');
  assert.equal(model.trend([1, 1, 1]), 'same');
  assert.equal(model.trend([1, 3, 2]), 'mixed');
  assert.equal(model.concOn(model.FUNCS.cubic, 0, 1.5), -1);
  assert.equal(model.concOn(model.FUNCS.cubic, 2.5, 4), 1);
  assert.ok(Number.isNaN(model.concOn(model.FUNCS.cubic, 1, 3)), 'the inflection at 2 is inside');
  const E = model.estimate(x => x * x, 0, 2, 1);
  assert.equal(E.m, 2); assert.equal(E.est, 2); assert.equal(E.true, 1); assert.ok(E.over);
  assert.match(model.arocSentence(ball, 1, 2), /slope of the secant line/);
  assert.doesNotMatch(model.trendSentence(ball, 'down', 0, 4), /at a decreasing rate|derivative|instantaneous/);
});

test('rate-of-change: same seed, same problem; the slips are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(3), ctx).text, model.generate(M.rng(3), ctx).text, kind);
  }
  for (let i = 1; i < 60; i++) {
    const a = model.generate(M.rng(i), { id: 'a', topic: 't', kind: 'aroc' }), v = a.values, f = x => model.peval(v.c, x);
    const d = M.diagnose(a.steps[0].cell, f(v.b) / v.b);
    if (Math.abs(f(v.b) / v.b - v.m) > 1e-3) assert.match(plain(d.why || ''), /\(0, ?0\)/, 'the secant through the origin is named');
    const e = model.generate(M.rng(i), { id: 'e', topic: 't', kind: 'estimate' }), w = e.values;
    const slip = M.diagnose(e.steps[1].cell, model.peval(w.c, w.p) + w.E.m * w.x0);
    assert.equal(slip.ok, false); assert.match(plain(slip.why), /passes through/);
    const dir = plain(e.steps[2].why[2]);
    assert.match(dir, /does not decide/, 'over or under from the direction is refused');
    const q = model.generate(M.rng(i), { id: 'q', topic: 't', kind: 'quadratic' }).values;
    assert.equal(q.dd, 2 * q.c[0] * q.w);
  }
});

test('rate-of-change: the validator catches planted mistakes', () => {
  const g0 = model.generate;
  try {
    model.generate = (r, c, t) => { const p = g0(r, c, t); if (p.type === 'estimate') { const o = p.steps[2]; [o.options[0], o.options[1]] = [o.options[1], o.options[0]]; } return p; };
    assert.ok(check(data(), loadMap()).some(e => /keyed conclusion/.test(e)));
    model.generate = (r, c, t) => { const p = g0(r, c, t); if (p.type === 'quadratic') p.steps[2].cell.answer *= p.values.w; return p; };
    assert.ok(check(data(), loadMap()).some(e => /2aw/.test(e)));
  } finally { model.generate = g0; }
  const f0 = model.FUNCS.ball.conc;
  try { model.FUNCS.ball.conc = () => 1; assert.ok(exploreProblems(model).some(e => /ball/.test(e))); } finally { model.FUNCS.ball.conc = f0; }
});
