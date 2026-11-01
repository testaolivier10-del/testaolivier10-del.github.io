/* Function lab: its model (precalculus/assets/tools/math/function-lab.js) and its
   validator (scripts/lib/apprecalc-tool-checks/function-lab.mjs). OWNED BY THIS
   TOOL ONLY (builder T1). The shipped data passes (300 problems per context,
   every key recomputed); the explore model against hand values (images of key
   points, zeros, asymptotes in limit notation, domain and range, the words in
   CED order); same seed same problem; the named slips (h's sign, b not
   factored out, a as 1/a, an end behavior without limit notation); planted
   mistakes caught by the validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, exploreProblems } from '../lib/apprecalc-tool-checks/function-lab.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('function-lab');
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'function-lab.json'), 'utf8'));
const plain = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<span class="sr-only">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '');
const ann = s => (String(s).match(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/) || [])[1];

test('function-lab: the page entry is wired and the shipped data passes its validator', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'function-lab');
  assert.ok(entry && entry.studio === true && !entry.premium, 'free, on the Tool Studio');
  assert.equal(data().topic, entry.topic);
  assert.ok(!model.stub);
  assert.deepEqual(check(data(), loadMap()), []);
});

test('function-lab: the frame, the families and the kinds are checked', () => {
  const map = loadMap(), d = { ...data(), contexts: [] };
  assert.ok(check({ ...d, slug: 'x' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...d, families: [{ id: 'hyperbola', topic: 'transformations' }] }, map).some(e => /unknown family/.test(e)));
  assert.ok(check({ ...d, families: [{ id: 'sine', topic: 'nope' }] }, map).some(e => /unknown topic/.test(e)));
  assert.ok(check({ ...data(), contexts: [{ id: 'x', topic: 'transformations', kind: 'derivative' }] }, map).some(e => /kind must be/.test(e)));
});

test('function-lab: explore values against hand computation', () => {
  assert.deepEqual(exploreProblems(model), []);
  const p = { a: -2, b: 2, h: 3, k: 1 };
  // (x, y) -> (x/b + h, a y + k)
  assert.deepEqual([...model.image(p, [4, 2])], [5, -3]);
  assert.equal(model.g('quadratic', p, 4), -2 * 4 + 1);                 // -2(2(4-3))^2 + 1
  // zeros of -2(2(x-3))^2 + 1: (2(x-3))^2 = 1/2
  const z = model.zeros('quadratic', p, [-10, 10]);
  assert.equal(z.length, 2);
  assert.ok(Math.abs(z[0] - (3 - Math.SQRT1_2 / 2)) < 1e-12 && Math.abs(z[1] - (3 + Math.SQRT1_2 / 2)) < 1e-12);
  // the reciprocal a/(b(x - h)) + k: a·b < 0 so the right side goes to -∞
  const v = model.vas('reciprocal', p)[0];
  assert.equal(v.x, 3); assert.equal(v.right, '-inf'); assert.equal(v.left, 'inf');
  assert.deepEqual({ ...model.ends('reciprocal', p) }, { pos: 1, neg: 1 });
  assert.equal(model.limTex(3, '-inf', '+'), '\\lim_{x \\to 3^+} g(x) = -\\infty');
  // exponential with b < 0: the asymptote is on the right
  assert.deepEqual({ ...model.ends('exponential', { a: 1, b: -1, h: 0, k: 2 }) }, { pos: 2, neg: 'inf' });
  // log with b < 0: defined left of h only, and it falls to -∞ there (a > 0)
  const lg = model.vas('logarithmic', { a: 1, b: -1, h: 2, k: 0 })[0];
  assert.equal(lg.left, '-inf'); assert.equal(lg.right, null);
  assert.equal(model.domain('logarithmic', { a: 1, b: -1, h: 2, k: 0 }), '(-\\infty, 2)');
  assert.equal(model.domain('sqrt', { a: 1, b: 2, h: -1, k: 0 }), '[-1, \\infty)');
  assert.equal(model.range('sqrt', { a: -3, b: 1, h: 0, k: 4 }), '(-\\infty, 4]');
  assert.equal(model.range('sine', { a: -2, b: 1, h: 0, k: 1 }), '[-1, 3]');
  // the words, in the order they act: b, then h, then a, then k
  assert.deepEqual([...model.steps({ a: -2, b: 2, h: -3, k: 4 }).map(s => s.key)], ['b', 'h', 'a', 'a', 'k']);
  assert.match(model.sentence({ a: 1, b: 0.5, h: 0, k: 0 }), /horizontal dilation by a factor of 2/);
  assert.match(model.sentence({ a: 1, b: 1, h: -3, k: 0 }), /3 units left/);
  // student syntax reads back as the same function
  for (const id of ['quadratic', 'sqrt', 'reciprocal', 'exponential', 'logarithmic', 'absolute', 'sine', 'cubic', 'linear']) {
    const q = { a: -1.5, b: 2, h: 1, k: -2 }, f = M.fn(model.str(id, q), ['x']);
    for (const x of [1.3, 2.7]) assert.ok(Math.abs(f(x) - model.g(id, q, x)) < 1e-9, id + ' ' + model.str(id, q));
  }
});

test('function-lab: same seed, same problem; the slips are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(5), ctx).text, model.generate(M.rng(5), ctx).text, kind);
  }
  let factored = false, notation = false;
  for (let i = 1; i < 80; i++) {
    const d = model.generate(M.rng(i), { id: 'd', topic: 't', kind: 'describe' });
    const ins = d.steps[0];
    if (ins.why.some(w => /Factor \$?b\$? out first|Factor <math/.test(w) || /out first/.test(plain(w)))) factored = true;
    const r = model.generate(M.rng(i), { id: 'r', topic: 't', kind: 'rational' });
    if (r.steps.find(s => s.key === 'end').why.some(w => /limit notation/.test(plain(w)))) notation = true;
    // the h slip is caught on the identify step
    const id = model.generate(M.rng(i), { id: 'i', topic: 't', kind: 'identify' }), h = id.steps[0];
    assert.equal(M.diagnose(h.cell, -h.cell.answer).ok, false);
    assert.ok(M.diagnose(h.cell, -h.cell.answer).why, 'the sign of h is named');
  }
  assert.ok(factored, 'some describe problem names "factor b out first"');
  assert.ok(notation, 'end behavior in words is refused for limit notation');
  // where a point goes: x/b + h, and the b·x slip is named
  const pm = model.generate(M.rng(42), { id: 'p', topic: 't', kind: 'pointMap' }), v = pm.values;
  assert.equal(pm.steps[0].cell.answer, v.from[0] / v.p.b + v.p.h);
  assert.equal(pm.steps[1].cell.answer, v.p.a * v.from[1] + v.p.k);
  // the keyed limit is the right one
  const r = model.generate(M.rng(9), { id: 'r', topic: 't', kind: 'rational' });
  assert.match(ann(r.steps[2].options[0]), /^\\lim_\{x \\to -?\d+\^\+\} g\(x\) = -?\\infty$/);
});

test('function-lab: the validator catches planted mistakes', () => {
  const g0 = model.generate;
  try {
    model.generate = (r, c, t) => { const p = g0(r, c, t); if (p.type === 'pointMap') p.steps[0].cell.answer += 1; return p; };
    assert.ok(check(data(), loadMap()).some(e => /inside of g/.test(e)));
    model.generate = (r, c, t) => { const p = g0(r, c, t); if (p.type === 'exponential' && p.steps[2].kind === 'num') p.steps[2].cell.answer += 0.5; return p; };
    assert.ok(check(data(), loadMap()).some(e => /zero key/.test(e)));
  } finally { model.generate = g0; }
  const z0 = model.zeros;
  try {
    model.zeros = (id, p, w) => z0(id, p, w).slice(1);
    assert.ok(exploreProblems(model).some(e => /not a listed zero/.test(e)));
  } finally { model.zeros = z0; }
});
