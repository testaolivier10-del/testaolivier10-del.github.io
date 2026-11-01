/* Parametric motion: its model (calculus-bc/assets/tools/math/parametric-motion.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/parametric-motion.mjs). OWNED BY THIS TOOL ONLY (builder T2).
   The shipped data passes (300 problems per context, keys recomputed from the givens); the frame and
   path list are checked; the paths' derivatives, tangents and stops; an arc length against its closed
   form (one arch of the cycloid is 8); position from velocity against a midpoint sum; same seed same
   problem; the named BC slips (speed as |dy/dx|, the start subtracted, d²y/dx² not divided by dx/dt);
   a planted wrong key caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
process.env.APCALC_COURSE = 'bc';
const { loadMap, ROOT } = await import('../lib/apcalc-build.mjs');
const { runtime } = await import('../lib/apcalcbc-tool-checks/_shared.mjs');
const { check, pathProblems } = await import('../lib/apcalcbc-tool-checks/parametric-motion.mjs');

const { M, Expr, model } = runtime('parametric-motion');
const data = () => JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'tools', 'parametric-motion.json'), 'utf8'));
const close = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));
const S = (p, k) => p.steps.find(s => s.key === k);

test('parametric-motion: the shipped data passes its validator (300 problems per context, keys recomputed)', () => {
  assert.deepEqual(check(data(), loadMap()), []);
});

test('parametric-motion: the page script parses, pages.json names the topic, the frame and path list are checked', () => {
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'parametric-motion.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'parametric-motion').topic, 'parametric-derivatives');
  const map = loadMap(), d = { ...data(), contexts: [] };
  assert.ok(check({ ...d, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...d, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...d, paths: [{ id: 'nope', topic: 'parametric-derivatives' }] }, map).some(e => /unknown path/.test(e)));
  assert.ok(check({ ...d, paths: [{ id: 'drift', topic: 'parametric-derivatives' }] }, map).some(e => /vector-integrals/.test(e)));
  assert.ok(check({ ...d, contexts: [{ id: 'x', topic: 'parametric-derivatives', kind: 'plane' }] }, map).some(e => /belongs to topic/.test(e)));
});

test('parametric-motion: the paths (derivatives, tangents, stops, arc length, position from velocity)', () => {
  assert.deepEqual(pathProblems(model, Expr), []);
  const W = model.PATHS.wheel;
  assert.ok(close(model.distTo(W, 2 * Math.PI), 8, 1e-9));                 // one arch of the cycloid: 8
  assert.ok(close(model.distTo(W, 4 * Math.PI), 16, 1e-9));
  assert.ok(model.special(W).stop.some(z => close(z, 2 * Math.PI, 1e-6)));  // the cusp: speed 0
  const L = model.PATHS.loop, sp = model.special(L);
  assert.deepEqual([...sp.vert].map(z => +z.toFixed(6) + 0), [0]);                   // x' = 2t
  assert.deepEqual([...sp.horiz].map(z => +z.toFixed(6)), [-1, 1]);              // y' = 3t^2 - 3
  const a = model.at(L, 2);                                                 // dy/dx = 9/4, d2y/dx2 = (12*4 - 9*2)/64
  assert.ok(close(a.slope, 9 / 4) && close(a.d2, 30 / 64) && close(a.speed, Math.hypot(4, 9)));
  const E = model.PATHS.ellipse;                                            // 3cos t, 2sin t: x^2/9 + y^2/4 = 1
  for (const t of [0.3, 1.7, 4]) { const s = model.at(E, t); assert.ok(close(s.x * s.x / 9 + s.y * s.y / 4, 1)); }
  const D = model.PATHS.drift, F = s => Expr.fn(s, ['t']);
  let mx = 0, my = 0; const n = 40000, h = 3 / n;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) * h; mx += F(D.dx)(t) * h; my += F(D.dy)(t) * h; }
  const q = model.posAt(D, 3);
  assert.ok(close(q[0], D.x0 + mx, 1e-7) && close(q[1], D.y0 + my, 1e-7));
});

test('parametric-motion: same seed, same problem; the BC slips are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(7), ctx).text, model.generate(M.rng(7), ctx).text, kind);
  }
  for (let i = 1; i < 60; i++) {
    const pl = model.generate(M.rng(i), { id: 'p', topic: 't', kind: 'plane' }), v = pl.values;
    assert.match(M.diagnose(S(pl, 'spd').cell, Math.abs(v.vy / v.vx)).why || '', /dy|steep/);        // speed as |dy/dx|
    assert.ok(M.diagnose(S(pl, 'spd').cell, +M.fixed(v.speed, 3)).ok);                               // three decimals
    const po = model.generate(M.rng(i), { id: 'q', topic: 't', kind: 'position' }), w = po.values;
    const sub = w.x1 - (w.xT - w.x1);
    assert.match(M.diagnose(S(po, 'xT').cell, sub).why || '', /added|subtract/);                     // the start subtracted
    const se = model.generate(M.rng(i), { id: 's', topic: 't', kind: 'second' });
    assert.match(M.diagnose(S(se, 'd2').cell, se.values.dd).why || '', /Divide/);                    // not divided by dx/dt
    const sl = model.generate(M.rng(i), { id: 'l', topic: 't', kind: 'slope' });
    assert.match(M.diagnose(S(sl, 'dydx').cell, sl.values.vx / sl.values.vy).why || '', /upside down/);
  }
});

test('parametric-motion: a planted wrong key is caught', () => {
  const real = model.generate;
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'plane') { const s = S(p, 'dist'); s.cell.answer = s.cell.mistakes[0].value; s.cell.mistakes = []; } return p; };
  try { const d = data(); assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'plane') }, loadMap()).some(e => /distance key/.test(e))); }
  finally { model.generate = real; }
});
