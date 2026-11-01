/* Sinusoid builder: its model (precalculus/assets/tools/math/sinusoid-builder.js)
   and its validator (scripts/lib/apprecalc-tool-checks/sinusoid-builder.mjs).
   OWNED BY THIS TOOL ONLY (builder T3). Hand values for the situations and the
   Explore scenes; same seed, same problem; the validator clean on the shipped
   data; planted mistakes caught; the page entry wired (Premium, Tool Studio). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, recheck, situation } from '../lib/apprecalc-tool-checks/sinusoid-builder.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, Expr, model } = runtime('sinusoid-builder');
const PI = Math.PI;
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const DATA = join(ROOT, 'precalculus', 'data', 'tools', 'sinusoid-builder.json');

test('sinusoid-builder: the page entry is wired, Premium and on the Tool Studio', () => {
  assert.ok(model && !model.stub);
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'sinusoid-builder');
  assert.ok(entry && entry.studio === true && entry.premium === 'tools');
  assert.equal(entry.topic, 'sinusoidal-transformations');
  assert.ok(loadMap().topicById(entry.topic));
  assert.ok(existsSync(DATA));
});

test('sinusoid-builder: situations by hand', () => {
  // Ferris wheel: 40 m across, lowest seat 5 m, 10 min a turn, boarding at the bottom at t = 0
  const fw = model.truth({ max: 45, min: 5, T: 10, start: 'min', t0: 0 });
  assert.ok(near(fw.A, 20) && near(fw.D, 25) && near(fw.b, PI / 5));
  assert.ok(near(fw.f(0), 5) && near(fw.f(2.5), 25) && near(fw.f(5), 45) && near(fw.f(7.5), 25));
  assert.ok(near(fw.sinC, -2.5) && near(fw.cosC, 5));   // 20 sin(π/5 (t − 2.5)) + 25 = 20 cos(π/5 (t + 5)) + 25
  assert.equal(JSON.stringify(fw.keys.map(k => [k.t, k.y])), JSON.stringify([[0, 5], [2.5, 25], [5, 45], [7.5, 25], [10, 5]]));
  // high tide 9 ft at t = 2, low 1 ft, period 12
  const td = model.truth({ max: 9, min: 1, T: 12, start: 'max', t0: 2 });
  assert.ok(near(td.f(2), 9) && near(td.f(8), 1) && near(td.sinC, 1));
  const p = { a: 4, d: 5, T: 12, c: 1, form: 'sin' };
  assert.ok(model.fit(p, model.dataPoints({ max: 9, min: 1, T: 12, start: 'max', t0: 2 }, 24), 1e-9).every(Boolean));
  assert.ok(!model.fit({ ...p, c: -1 }, model.dataPoints({ max: 9, min: 1, T: 12, start: 'max', t0: 2 }, 24), 1e-9).every(Boolean));
  assert.equal(model.piTex(PI / 5), '\\frac{\\pi}{5}');
  assert.equal(model.piTex(2 * PI / 3), '\\frac{2\\pi}{3}');
  assert.equal(model.piText(PI / 6), 'π/6');
  assert.ok(near(model.norm(7, 10), -3) && near(model.norm(-5, 10), 5));
  for (const id of model.SORDER) { const s = model.SCENES[id].s, g = situation(s), t = model.truth(s); for (let x = 0; x < 2 * s.T; x += s.T / 7) assert.ok(near(g.f(x), t.f(x)), id); }
});

test('sinusoid-builder: the same seed gives the same problem', () => {
  for (const kind of model.KINDS) {
    const a = model.generate(M.rng(4242), { id: kind, topic: 't' }, kind), b = model.generate(M.rng(4242), { id: kind, topic: 't' }, kind);
    assert.equal(JSON.stringify(a.steps), JSON.stringify(b.steps), kind);
  }
});

test('sinusoid-builder: the validator is clean on the shipped data', () => {
  assert.deepEqual(check(JSON.parse(readFileSync(DATA, 'utf8')), loadMap()), []);
});

test('sinusoid-builder: planted mistakes are caught', () => {
  const gen = (kind, seed = 777) => model.generate(M.rng(seed), { id: kind, topic: 't' }, kind);
  const run = p => { const errs = []; recheck(model, p, null, 'w', errs, Expr); return errs; };
  for (const kind of model.KINDS) assert.deepEqual(run(gen(kind)), [], kind);
  let p = gen('context'); p.steps.find(s => s.key === 'model').cell.expr.answer = p.given.s.max + ' - 1cos(t)'; assert.ok(run(p).length, 'a wrong model key');
  p = gen('context'); p.steps.find(s => s.key === 'b').cell.answer = p.given.s.T; assert.ok(run(p).length, 'b as the period');
  p = gen('transform'); const sh = p.steps.find(s => s.key === 'shift'); sh.correct = (sh.correct + 1) % sh.options.length; assert.ok(run(p).length, 'the shift option');
  p = gen('transform'); p.steps.find(s => s.key === 'per').cell.answer *= 2; assert.ok(run(p).length, 'the period');
  p = gen('rate'); const r = p.steps.find(s => s.key === 'rate'); r.correct = (r.correct + 1) % r.options.length; assert.ok(run(p).length, 'the rate option');
  p = gen('points'); p.steps[0].cell.answer += p.given.s.T / 4; assert.ok(run(p).length, 'a point a quarter period off');
  p = gen('table'); p.given.rows[0][1] += 1; assert.ok(run(p).length, 'a table value');
  p = gen('rate'); p.text += ' Use the derivative.'; assert.ok(run(p).some(e => /calculus/.test(e)));
  // equivalent forms of the model are graded right, the slips wrong
  p = gen('context', 3);
  const s = p.given.s, A = (s.max - s.min) / 2, D = (s.max + s.min) / 2, step = p.steps.find(x => x.key === 'model');
  const tPk = s.t0 + { max: 0, min: s.T / 2, up: s.T / 4, down: -s.T / 4 }[s.start];
  assert.ok(M.diagnoseExpr(step.cell, `${A}sin(2pi/${s.T}(t - ${tPk} + ${s.T / 4})) + ${D}`).ok, 'a sine form');
  assert.ok(!M.diagnoseExpr(step.cell, `${A}sin(${s.T}(t - ${tPk} + ${s.T / 4})) + ${D}`).ok, 'b as the period');
});
