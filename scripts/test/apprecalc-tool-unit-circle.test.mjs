/* Unit circle: its model (precalculus/assets/tools/math/unit-circle.js) and its
   validator (scripts/lib/apprecalc-tool-checks/unit-circle.mjs). OWNED BY THIS
   TOOL ONLY (builder T3). Same seed, same problem; every exact value against
   a hand table; the validator clean on the shipped data; planted mistakes
   caught; the page entry wired (free, on the Tool Studio). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, recheck, texValue, optText } from '../lib/apprecalc-tool-checks/unit-circle.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('unit-circle');
const S3 = Math.sqrt(3), S2 = Math.SQRT2, PI = Math.PI;
const near = (a, b) => Math.abs(a - b) < 1e-12;
const DATA = join(ROOT, 'precalculus', 'data', 'tools', 'unit-circle.json');

test('unit-circle: the page entry is wired, free and on the Tool Studio', () => {
  assert.ok(model && !model.stub, 'ApPrecalcMath.unitCircle is built');
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'unit-circle');
  assert.ok(entry && entry.studio === true && !entry.premium);
  assert.equal(entry.topic, 'sine-cosine-tangent');
  assert.ok(loadMap().topicById(entry.topic));
  assert.ok(existsSync(DATA));
});

test('unit-circle: exact values by hand', () => {
  const hand = { // m (twelfths of pi): [cos, sin, tan (NaN: not defined), reference angle]
    0: [1, 0, 0, 0], 2: [S3 / 2, 0.5, S3 / 3, PI / 6], 3: [S2 / 2, S2 / 2, 1, PI / 4], 4: [0.5, S3 / 2, S3, PI / 3], 6: [0, 1, NaN, PI / 2],
    8: [-0.5, S3 / 2, -S3, PI / 3], 10: [-S3 / 2, 0.5, -S3 / 3, PI / 6], 12: [-1, 0, 0, 0], 15: [-S2 / 2, -S2 / 2, 1, PI / 4],
    16: [-0.5, -S3 / 2, S3, PI / 3], 18: [0, -1, NaN, PI / 2], 21: [S2 / 2, -S2 / 2, -1, PI / 4], 22: [S3 / 2, -0.5, -S3 / 3, PI / 6]
  };
  for (const [m, [c, s, t, r]] of Object.entries(hand)) {
    const a = model.angle(+m);
    assert.ok(near(a.cos.v, c) && near(a.sin.v, s), `cos and sin at ${a.text}`);
    if (Number.isNaN(t)) assert.ok(a.tan.undef, `tan at ${a.text} is not defined`); else assert.ok(near(a.tan.v, t), `tan at ${a.text}`);
    assert.ok(near(texValue(a.cos.tex), c) && near(texValue(a.sin.tex), s), `the TeX of ${a.text} reads back`);
    assert.ok(near(model.refOf(a).theta, r), `reference angle of ${a.text}`);
  }
  assert.equal(model.angle(10).tex, '\\frac{5\\pi}{6}');
  assert.equal(model.angle(10).quadrant, 2);
  assert.equal(model.angle(6).quadrant, 0);
  assert.ok(near(model.nextSpecial(PI / 6, 1), PI / 4) && near(model.nextSpecial(PI / 6, -1), 0));
  assert.ok(near(model.snap(PI / 3 + 0.03, 0.05), PI / 3) && model.snap(1.2, 0.05) === 1.2);
  assert.equal(model.at(2).quadrant, 2);
});

test('unit-circle: the same seed gives the same problem', () => {
  for (const kind of model.KINDS) {
    const a = model.generate(M.rng(4242), { id: kind, topic: 't' }, kind), b = model.generate(M.rng(4242), { id: kind, topic: 't' }, kind);
    assert.equal(JSON.stringify(a.steps), JSON.stringify(b.steps), kind);
    assert.equal(a.text, b.text);
  }
});

test('unit-circle: the validator is clean on the shipped data', () => {
  assert.deepEqual(check(JSON.parse(readFileSync(DATA, 'utf8')), loadMap()), []);
});

test('unit-circle: planted mistakes are caught', () => {
  const gen = kind => model.generate(M.rng(777), { id: kind, topic: 't' }, kind);
  const run = p => { const errs = []; recheck(model, p, null, 'w', errs); return errs; };
  for (const kind of model.KINDS) assert.deepEqual(run(gen(kind)), [], kind);
  // a key off by a little
  let p = gen('ray'); p.steps.find(s => s.key === 'sin').cell.answer += 0.01; assert.ok(run(p).length);
  // the right option moved to a wrong one
  p = gen('coords'); const t = p.steps.find(s => s.key === 'tan'); t.correct = (t.correct + 1) % t.options.length; assert.ok(run(p).length);
  p = gen('graphs'); const r = p.steps.find(s => s.key === 'rate'); r.correct = (r.correct + 1) % r.options.length; assert.ok(run(p).length);
  p = gen('values'); const g = p.steps.find(s => s.key === 'signs'); g.correct = (g.correct + 1) % g.options.length; assert.ok(run(p).length);
  // a given that no longer matches the keys
  p = gen('radian'); p.given.r += 1; assert.ok(run(p).length);
  // calculus wording is refused
  p = gen('graphs'); p.solution.push('The derivative is negative.'); assert.ok(run(p).some(e => /calculus/.test(e)));
  assert.equal(optText('<span class="cd-opt-t"><span class="sr-only">(π/2, π)</span><span aria-hidden="true">x</span></span>'), '(π/2, π)');
});
