/* Area and volume: its model (calculus/assets/tools/math/area-volume.js) and its
   validator (scripts/lib/apcalc-tool-checks/area-volume.mjs). OWNED BY THIS
   TOOL ONLY. Gallery areas and volumes against values worked by hand, the
   crossings found numerically, the 3D mesh and slice agreeing with the radii,
   same seed same problem, planted mistakes caught, and the shipped data
   passing the validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/area-volume.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const { M, model: A } = runtime('area-volume');
const data = JSON.parse(readFileSync(join(ROOT, 'calculus', 'data', 'tools', 'area-volume.json'), 'utf8'));
const near = (a, b, tol = 1e-8) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const PI = Math.PI, H = at => ({ dir: 'h', at }), V = at => ({ dir: 'v', at });

test('area-volume: the model registers, and the validator checks the frame', () => {
  assert.ok(M && A && typeof A.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'area-volume', kind: 'simulator', topic: 'area-between-curves-x', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', kind: 'areaX', topic: 'area-between-curves-x' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', kind: 'shells', topic: 'area-between-curves-x' }] }, map).some(e => /kind/.test(e)));
});

test('area-volume: gallery crossings and areas match hand work', () => {
  const sq = A.region('sqrt-sq');
  assert.ok(near(sq.a, 0, 1e-9) && near(sq.b, 1, 1e-9));
  assert.ok(near(A.area(sq).total, 1 / 3));
  assert.ok(near(A.area(A.region('para-line')).total, 9 / 2));
  const cu = A.region('cubic');
  assert.deepEqual([cu.a, ...cu.cuts, cu.b].map(x => Math.round(x * 1e9) / 1e9), [-2, 0, 2]);
  assert.ok(near(A.area(cu).total, 8) && near(A.area(cu).net, 0, 1e-9));
  assert.ok(near(A.area(A.region('in-y')).total, 9 / 2));
  assert.ok(near(A.area(A.region('sqrt-sq', true)).total, 1 / 3), 'the same region in y');
  const cp = A.region('cos-para'); // 2cos x = x^2 - 1, solved numerically
  assert.ok(Math.abs(2 * Math.cos(cp.b) - (cp.b ** 2 - 1)) < 1e-9 && near(cp.a, -cp.b, 1e-9));
});

test('area-volume: volumes match hand work (discs, washers, other lines, cross sections)', () => {
  const sq = A.region('sqrt-sq'), sqy = A.region('sqrt-sq', true), us = A.region('under-sqrt'), usy = A.region('under-sqrt', true);
  const rev = axis => ({ kind: 'rev', axis });
  assert.ok(near(A.volume(sq, rev(H(0))), 3 * PI / 10));
  assert.ok(near(A.volume(sqy, rev(V(0))), 3 * PI / 10));
  assert.ok(near(A.volume(sq, rev(H(-1))), 29 * PI / 30));
  assert.ok(near(A.volume(us, rev(H(0))), 8 * PI));
  assert.ok(near(A.volume(us, rev(H(2))), 40 * PI / 3));
  assert.ok(near(A.volume(usy, rev(V(0))), PI * (32 - 32 / 5)), 'washer about the y-axis');
  assert.ok(near(A.volume(sq, { kind: 'cross', shape: 'square' }), 9 / 70));
  assert.ok(near(A.volume(sq, { kind: 'cross', shape: 'tri' }), Math.sqrt(3) / 4 * 9 / 70));
  assert.ok(near(A.volume(sq, { kind: 'cross', shape: 'semi' }), PI / 8 * 9 / 70));
  assert.ok(A.axisOk(sq, H(0)) && A.axisOk(sq, H(1)) && !A.axisOk(sq, H(0.5)) && !A.axisOk(sq, V(0)), 'axes that slice a region in x');
  assert.ok(A.axisOk(sqy, V(-1)) && !A.axisOk(sqy, H(0)));
});

test('area-volume: the 3D mesh and the slice come from the same radii', () => {
  const sq = A.region('sqrt-sq'), setup = { kind: 'rev', axis: H(-1) };
  const sl = A.slice(sq, setup, 0.25, 36), q = A.radii(sq, setup.axis, 0.25);
  assert.ok(near(sl.R, Math.sqrt(0.25) + 1) && near(sl.r, 0.0625 + 1) && near(q.R, sl.R));
  for (const p of sl.loops[0]) assert.ok(near(Math.hypot(p[1] + 1, p[2]), sl.R, 1e-12) && p[0] === 0.25);
  const m = A.mesh(sq, setup, 20, 24);
  assert.equal(m.quads.length, 20 * 24 * 2 + 2 * 24);
  const cs = A.slice(sq, { kind: 'cross', shape: 'tri' }, 0.25, 24);
  assert.ok(near(cs.s, 0.5 - 0.0625));
  const apex = cs.loops[0][2];
  assert.ok(near(apex[2], cs.s * Math.sqrt(3) / 2), 'equilateral height');
});

test('area-volume: same seed, same problem; every kind generates', () => {
  for (const c of data.contexts) {
    const a = A.generate(M.rng(4242), c), b = A.generate(M.rng(4242), c);
    assert.equal(JSON.stringify(a), JSON.stringify(b), c.id);
    assert.equal(a.type, c.kind);
  }
});

test('area-volume: the named misses are there and graded wrong', () => {
  const c = data.contexts.find(x => x.kind === 'washerOther');
  for (let i = 1; i < 40; i++) {
    const p = A.generate(M.rng(i * 31 + 7), c), ig = p.steps.find(s => s.key === 'ig');
    const whys = ig.cell.expr.mistakes.map(m => m.why).join(' ');
    assert.match(whys, /Missing π/); assert.match(whys, /\(R − r\)²/); assert.match(whys, /measured from the/);
    for (const m of ig.cell.expr.mistakes) assert.equal(M.diagnoseExpr(ig.cell, m.expr).ok, false);
    assert.equal(M.diagnoseExpr(ig.cell, ig.cell.expr.answer).ok, true);
  }
});

test('area-volume: the validator catches planted mistakes', () => {
  const map = loadMap();
  const one = kind => ({ ...data, contexts: data.contexts.filter(c => c.kind === kind).slice(0, 1) });
  const orig = A.generate;
  const plant = (kind, fn, re) => {
    A.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === kind) fn(p); return p; };
    try { const e = check(one(kind), map); assert.ok(e.some(x => re.test(x)), `${kind}: ${e[0] || 'no error'}`); } finally { A.generate = orig; }
  };
  plant('areaX', p => { const s = p.steps.find(x => x.key === 'A'); s.cell.answer *= 1.01; }, /area keyed/);
  plant('washerOther', p => { const s = p.steps.find(x => x.key === 'V'); s.cell.answer /= PI; }, /volume keyed/);
  plant('discOther', p => { const s = p.steps.find(x => x.key === 'R'); s.cell.expr.answer = p.reg.bot === 'x^2' || p.reg.bot === 'y^2' ? p.reg.bot : p.reg.top; }, /outer radius/);
  plant('crossTri', p => { p.fig.shape = p.fig.shape === 'tri' ? 'semi' : 'tri'; }, /cross section|cross-section area/);
  plant('areaY', p => { p.steps[0].cell.answer += 0.5; }, /lo limit|step lo/);
});

test('area-volume: the shipped data passes its validator', () => {
  assert.deepEqual(check(data, loadMap()), []);
});
