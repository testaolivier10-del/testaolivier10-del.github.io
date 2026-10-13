/* Lab design: its model (physics/assets/tools/math/lab-design.js) and its
   validator (scripts/lib/apphys-tool-checks/lab-design.mjs). OWNED BY THIS
   TOOL ONLY. Least squares exact on a known line; seeded noise of the right
   size per instrument; the best linearization straight for every bench and
   the slope giving back the hidden value; the pendulum's period independent
   of mass and slightly longer at large angles; the slips named; planted
   mistakes caught; the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/lab-design.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const { M, model: LD } = runtime('lab-design');
const map = loadMap();
const data = JSON.parse(readFileSync(join(ROOT, 'physics', 'data', 'tools', 'lab-design.json'), 'utf8'));
const near = (a, b, rel = 1e-9, abs = 1e-12) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b) + abs, `${a} vs ${b}`);

test('lab-design: the shipped data pass the validator (300 seeds per experiment)', () => {
  assert.deepEqual(check(data, map), []);
});

test('lab-design: the first experiment unlocks with motion-representations; each later one with its own topic', () => {
  assert.equal(data.topic, 'motion-representations');
  assert.equal(data.contexts[0].topic, 'motion-representations');
  for (const c of data.contexts) assert.equal(c.topic, LD.EXPS[c.exp].topic);
});

test('lab-design: least squares recovers an exact line', () => {
  const f = LD.fit([[0, 1], [1, 3], [2, 5], [3, 7]]);
  near(f.m, 2); near(f.b, 1); near(f.r2, 1);
  const h = LD.fit([[1, 2], [2, 3.9], [3, 6.2], [4, 7.9]]);
  near(h.m, 2, 1e-12); near(h.b, 0, 0, 1e-12); assert.ok(h.r2 < 1 && h.r2 > 0.99);
});

test('lab-design: every bench linearizes; on noise-free data the slope gives the hidden value exactly', () => {
  for (const exp of Object.values(LD.EXPS)) {
    const P = exp.params(M.rng(3)), xs = LD.settings(exp, 8), rows = xs.map(x => [x, exp.truth(P, x)]);
    const f = LD.fit(LD.linearize(exp, exp.best, rows));
    assert.ok(f.r2 > 0.9999 || exp.id === 'pendulum', `${exp.id} is straight (r² ${f.r2})`);
    // the pendulum keeps its 10° release (a 0.2% longer period), so g is 0.4% low; every other bench is exact
    near(LD.derive(exp, P, f.m, f.b), exp.target.true(P), exp.id === 'pendulum' ? 0.005 : 1e-6);
  }
});

test('lab-design: the seeded noise is the size of each instrument\'s scatter', () => {
  const r = M.rng(11), sd = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
  const spring = LD.EXPS.spring, P = spring.params(M.rng(1));
  const s = Array.from({ length: 2000 }, () => LD.measure(spring, P, 0.2, r) - spring.truth(P, 0.2));
  near(sd(s), 0.002, 0.08);                                     // meterstick: 2 mm
  const pend = LD.EXPS.pendulum, Pp = pend.params(M.rng(1));
  const t = Array.from({ length: 2000 }, () => LD.measure(pend, Pp, 0.8, r) - pend.truth(Pp, 0.8));
  near(sd(t), 0.1 * Math.SQRT2 / 10, 0.1);                       // two reaction times over 10 swings
  // same seed, same data
  assert.equal(JSON.stringify(LD.dataset(M.rng(5), spring, 6)), JSON.stringify(LD.dataset(M.rng(5), spring, 6)));
});

test('lab-design: a pendulum\'s period does not depend on the bob\'s mass; large angles lengthen it a little', () => {
  const pend = LD.EXPS.pendulum, P = pend.params(M.rng(1));
  near(pend.truth(P, 0.05, 'mass'), pend.truth(P, 0.5, 'mass'));
  const T0 = 2 * Math.PI * Math.sqrt(P.Lfix / 9.8);
  near(pend.truth(P, 5, 'angle'), T0, 0.001);
  assert.ok(pend.truth(P, 60, 'angle') / T0 > 1.06 && pend.truth(P, 60, 'angle') / T0 < 1.08);
});

test('lab-design: the drill steps and the slips named', () => {
  const c = data.contexts.find(x => x.exp === 'pendulum'), p = LD.generate(M.rng(21), c);
  assert.equal(p.steps.map(s => s.key).join(), 'iv,inst,plot,slope,target,error');
  const tg = p.steps.find(s => s.key === 'target').cell, m = p.values.fit.m;
  assert.match(M.diagnose(tg, 2 * Math.PI / m).why, /4π²/);              // forgot to square 2π
  assert.match(M.diagnose(tg, m / (4 * Math.PI ** 2)).why, /Upside down/);
  const sl = p.steps.find(s => s.key === 'slope').cell;
  assert.ok(M.diagnose(sl, m * 1.04).ok, 'a slope read off a hand-drawn line within 4% counts');
  assert.match(M.diagnose(sl, 1 / m).why, /run \/ rise/);
});

test('lab-design: the validator catches planted mistakes', () => {
  const bad = structuredClone(data); bad.contexts[1].topic = 'motion-representations';
  assert.ok(check(bad, map).some(e => /taught in/.test(e)));
  const bad2 = structuredClone(data); bad2.contexts[0].exp = 'catapult';
  assert.ok(check(bad2, map).some(e => /unknown experiment/.test(e)));
  const e = LD.EXPS.spring.errors[0], keep = e.effect;
  try { e.effect = 0; assert.ok(check(data, map).some(x => /error "mark"/.test(x))); } finally { e.effect = keep; }
  const orig = LD.generate;
  try {
    LD.generate = (r, c) => { const p = orig(r, c); p.steps.find(s => s.key === 'target').cell.answer *= 1.2; return p; };
    assert.ok(check(data, map).some(x => /target/.test(x)));
  } finally { LD.generate = orig; }
});
