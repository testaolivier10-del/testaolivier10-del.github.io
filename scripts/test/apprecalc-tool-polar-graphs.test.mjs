/* Polar graphs: its model (precalculus/assets/tools/math/polar-graphs.js) and its
   validator (scripts/lib/apprecalc-tool-checks/polar-graphs.mjs). OWNED BY THIS
   TOOL ONLY (builder T4). The page entry; same seed, same problem; the
   curves' shapes, pieces and conversions against hand values; every drill
   key against an independent computation; the named slips (negative r,
   tan⁻¹ in the wrong quadrant, degrees, the rate of |r| for the rate of r)
   and no calculus wording; the shipped data passing; planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, curveProblems, rOf } from '../lib/apprecalc-tool-checks/polar-graphs.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('polar-graphs');
const PI = Math.PI;
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'polar-graphs.json'), 'utf8'));
const plain = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '');
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

test('polar-graphs: page entry wired to its topic; the model is built', () => {
  assert.ok(model && !model.stub, 'ApPrecalcMath.polarGraphs is the built model');
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'polar-graphs');
  assert.ok(entry && entry.studio === true && entry.topic === data().topic);
  assert.ok(loadMap().topicById(entry.topic));
});

test('polar-graphs: the shipped data passes its validator (300 problems per context, keys recomputed)', () => {
  assert.deepEqual(check(data(), loadMap()), []);
});

test('polar-graphs: curves, pieces and conversions match hand values', () => {
  assert.deepEqual(curveProblems(model), []);
  const rose = model.curve({ fam: 'rose', a: 3, n: 2, trig: 'cos' });
  assert.equal(rose.shape, '4-petal rose');
  assert.equal(model.curve({ fam: 'rose', a: 3, n: 3, trig: 'sin' }).shape, '3-petal rose');
  assert.equal(model.curve({ fam: 'limacon', a: 1, b: 2, trig: 'cos' }).shape, 'limaçon with an inner loop');
  assert.equal(model.curve({ fam: 'limacon', a: 2, b: -2, trig: 'sin' }).shape, 'cardioid');
  assert.equal(model.curve({ fam: 'limacon', a: 3, b: 1, trig: 'cos' }).maxR, 4);
  // r = 1 + 2cos θ: r < 0 on (2π/3, 4π/3); |r| grows on (2π/3, π) (r < 0 and falling)
  const lim = model.curve({ fam: 'limacon', a: 1, b: 2, trig: 'cos' }), ps = model.pieces(lim);
  assert.deepEqual([...ps.map(p => p.dist)], ['toward', 'away', 'toward', 'away']);
  assert.ok(near(ps[1].a, 2 * PI / 3) && near(ps[1].b, PI) && ps[1].rs === -1 && ps[1].ds === -1);
  // the point (−1, √3) is (2, 2π/3); (r, θ) = (−2, π/6) is (−√3, −1)
  const [r, t] = model.polar(-1, Math.sqrt(3));
  assert.ok(near(r, 2) && near(t, 2 * PI / 3));
  const [x, y] = model.rect(-2, PI / 6);
  assert.ok(near(x, -Math.sqrt(3)) && near(y, -1));
  assert.equal(model.piText(10), '5π/6'); assert.equal(model.piTex(3), '\\frac{\\pi}{4}'); assert.equal(model.piText(24), '2π');
  assert.equal(model.eTyped(model.rExact({ fam: 'limacon', a: 2, b: -2, trig: 'cos' }, 2)), '2 - sqrt(3)');
  assert.ok(near(model.eVal(model.rExact({ fam: 'rose', a: 4, n: 3, trig: 'sin' }, 1)), 4 * Math.sin(PI / 4)));
});

test('polar-graphs: same seed, same problem; keys against independent values; the slips are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(11), ctx).text, model.generate(M.rng(11), ctx).text, kind);
  }
  let neg = 0, trap = 0, quad = 0;
  for (let i = 1; i <= 200; i++) {
    const c = model.generate(M.rng(i), { id: 'convert', topic: 't', kind: 'convert' }), v = c.values, th = v.k * PI / 12;
    if (c.variant === 'toRect') {
      const xs = c.steps.find(s => s.key === 'x');
      assert.ok(near(xs.cell.answer, v.r * Math.cos(th)));
      if (v.r < 0) { neg++; assert.ok(M.diagnose(xs.cell, -xs.cell.answer).why.includes('opposite')); }
    } else {
      const ts = c.steps.find(s => s.key === 't'), raw = Math.atan(v.y / v.x);
      assert.ok(near(ts.cell.answer, Math.atan2(v.y, v.x) < 0 ? Math.atan2(v.y, v.x) + 2 * PI : Math.atan2(v.y, v.x)));
      if (v.q === 2 || v.q === 3) { quad++; assert.match(plain(M.diagnose(ts.cell, raw).why), /add π/); }
      assert.match(plain(M.diagnose(ts.cell, v.k * 15).why), /degrees/);
    }
    const r = model.generate(M.rng(i), { id: 'rates', topic: 't', kind: 'rates' }), rv = r.values, f = rOf(rv.spec);
    const t1 = rv.k1 * PI / 12, t2 = rv.k2 * PI / 12, avg = r.steps.find(s => s.key === 'avg');
    assert.ok(near(avg.cell.answer, (f(t2) - f(t1)) / (t2 - t1)));
    assert.match(plain(M.diagnose(avg.cell, f(t2) - f(t1)).why), /Divide by the change in/);
    if (!rv.pos) { trap++; assert.match(plain(M.diagnose(avg.cell, (Math.abs(f(t2)) - Math.abs(f(t1))) / (t2 - t1)).why), /distance/); }
    for (const p of [c, r]) for (const s of p.steps) for (const m of (s.cell && s.cell.mistakes) || []) assert.doesNotMatch(plain(m.why), /derivative|antiderivative|instantaneous/i);
  }
  assert.ok(neg > 5 && trap > 5 && quad > 5, `negative r ${neg}, negative-r rates ${trap}, quadrant II/III ${quad}`);
  // the shared sign message (which names a derivative) never shows: a sign slip has this tool's words
  const g = model.generate(M.rng(5), { id: 'graph', topic: 't', kind: 'graph' }), rs = g.steps.find(s => s.key === 'r');
  assert.doesNotMatch(plain(M.diagnose(rs.cell, -rs.cell.answer).why), /derivative/);
});

test('polar-graphs: a planted wrong key is caught', () => {
  const real = model.generate;
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'rates') { const s = p.steps.find(x => x.key === 'avg'); s.cell.answer = p.values.r2 - p.values.r1; s.cell.mistakes = []; } return p; };
  try { const d = data(); assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'rates') }, loadMap()).some(e => /average rate keyed/.test(e))); }
  finally { model.generate = real; }
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'graph') { const s = p.steps.find(x => x.key === 'shape'); [s.options[0], s.options[1]] = [s.options[1], s.options[0]]; } return p; };
  try { const d = data(); assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'graph') }, loadMap()).some(e => /shape key/.test(e))); }
  finally { model.generate = real; }
  assert.ok(check({ ...data(), curves: ['spiral'] }, loadMap()).some(e => /unknown curve/.test(e)));
});
