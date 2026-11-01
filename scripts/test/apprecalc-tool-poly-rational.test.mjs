/* Polynomials and rationals: its model (precalculus/assets/tools/math/poly-rational.js) and its
   validator (scripts/lib/apprecalc-tool-checks/poly-rational.mjs). OWNED BY THIS
   TOOL ONLY (builder T2). The shipped data passes (300 problems per context,
   every key recomputed); the page entry is wired; hand-worked functions
   (zeros, holes, one-sided limits, end behavior, slant asymptote, sign
   chart); same seed same problem; the named slips; planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, presetProblems } from '../lib/apprecalc-tool-checks/poly-rational.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('poly-rational');
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'poly-rational.json'), 'utf8'));
const plain = s => String(s);

test('poly-rational: the page entry is wired and the shipped data passes its validator', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'poly-rational');
  assert.ok(entry && entry.studio === true && entry.topic === data().topic);
  assert.ok(!model.stub);
  assert.deepEqual(check(data(), loadMap()), []);
});

test('poly-rational: the frame and the lists are checked', () => {
  const map = loadMap(), d = { ...data(), contexts: [] };
  assert.ok(check({ ...d, slug: 'x' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...d, presets: [{ id: 'nope', topic: 'rational-holes' }] }, map).some(e => /unknown preset/.test(e)));
  assert.ok(check({ ...d, contexts: [{ id: 'q', topic: 'rational-holes', kind: 'nope' }] }, map).some(e => /unknown kind/.test(e)));
});

test('poly-rational: hand-worked functions', () => {
  assert.deepEqual(presetProblems(model), []);
  // (x + 2)(x - 3) / ((x + 2)(x - 1)): hole at (-2, 5/3), zero 3, asymptote x = 1, y = 1
  const R = model.analyze(model.PRESETS.hole.spec);
  assert.deepEqual([...R.zeros.map(z => z.x)], [3]);
  assert.equal(R.holes.length, 1); assert.equal(R.holes[0].x, -2); assert.ok(Math.abs(R.holes[0].y - 5 / 3) < 1e-12);
  assert.equal(model.frac(R.holes[0].y), '\\frac{5}{3}');
  assert.equal(R.vas[0].x, 1); assert.equal(R.vas[0].left, 1); assert.equal(R.vas[0].right, -1);
  assert.equal(R.end.kind, 'ha'); assert.equal(R.end.ha, 1);
  // 3(x + 2)/(x - 2)^2: both sides go to +infinity
  const D = model.analyze(model.PRESETS.double.spec);
  assert.equal(D.vas[0].left, 1); assert.equal(D.vas[0].right, 1); assert.equal(D.end.ha, 0);
  // 0.5(x + 3)(x - 3)/(x - 1): slant y = 0.5x + 0.5
  const S = model.analyze(model.PRESETS.slant.spec);
  assert.equal(S.end.kind, 'slant'); assert.equal(S.slant.m, 0.5); assert.equal(S.slant.b, 0.5);
  // -0.1(x + 4)(x + 1)^2(x - 3): even degree, a < 0: both ends down; touches at -1
  const Q = model.analyze(model.PRESETS.quartic.spec);
  assert.equal(Q.end.left, -Infinity); assert.equal(Q.end.right, -Infinity);
  assert.equal(Q.zeros.find(z => z.x === -1).cross, false);
  assert.deepEqual([...Q.signs.map(g => g.s)], [-1, 1, 1, -1]);
  // (x - 1)^2 over (x - 1): a hole on the x-axis, not a zero
  const H = model.analyze({ a: 1, factors: [{ r: 1, m: 2, where: 'num' }, { r: 1, m: 1, where: 'den' }] });
  assert.equal(H.zeros.length, 0); assert.equal(H.holes[0].y, 0);
  // the limit sentences use one-sided limit notation with signs
  assert.match(model.vaText(R.vas[0]), /\\lim_\{x \\to 1\^\{-\}\} f\(x\) = \\infty/);
  assert.match(model.vaText(R.vas[0]), /\\lim_\{x \\to 1\^\{\+\}\} f\(x\) = -\\infty/);
  assert.match(model.endText(Q), /\\lim_\{x \\to -\\infty\} f\(x\) = -\\infty/);
  assert.equal(model.tex(model.PRESETS.ha.spec), 'f(x) = 2\\frac{x + 1}{x - 2}');
});

test('poly-rational: same seed, same problem; the named slips', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(JSON.stringify(model.generate(M.rng(11), ctx)), JSON.stringify(model.generate(M.rng(11), ctx)), kind);
  }
  let flip = 0, words = 0;
  for (let i = 1; i < 80; i++) {
    const h = model.generate(M.rng(i), { id: 'hole', topic: 't', kind: 'hole' });
    const hy = h.steps.find(s => s.key === 'hy');
    if (h.values.y !== 0) assert.match(M.diagnose(hy.cell, 0).why || '', /not always on the \$x\$-axis/);
    const hx = h.steps.find(s => s.key === 'hx');
    assert.match(M.diagnose(hx.cell, h.values.p).why, /does not cancel/);
    const z = model.generate(M.rng(i), { id: 'rzeros', topic: 't', kind: 'rzeros' });
    assert.match(M.diagnose(z.steps[0].cell, z.values.h).why, /hole, not a zero/);
    const e = model.generate(M.rng(i), { id: 'end', topic: 't', kind: 'end' });
    if (/ - x\)/.test(e.text)) flip++;
    const r = e.steps.find(s => s.key === 'right');
    const wi = r.options.findIndex(o => /^As \$x\$/.test(o));
    assert.match(plain(r.why[wi]), /limit notation/); words++;
  }
  assert.ok(flip > 10, 'the (c - x) factor appears');
  assert.ok(words > 0);
});

test('poly-rational: a planted wrong key is caught', () => {
  const real = model.generate, map = loadMap(), d = data();
  try {
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'hole') { const s = p.steps.find(x => x.key === 'hy'); s.cell.answer = s.cell.answer + 1; s.cell.mistakes = []; } return p; };
    assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'hole') }, map).some(e => /height/.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'va') { const s = p.steps.find(x => x.key === 'left'); s.correct = (s.correct + 1) % s.options.length; } return p; };
    assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'va') }, map).some(e => /left limit/.test(e)));
  } finally { model.generate = real; }
});
