/* Age structure: its model (environmental-science/assets/tools/math/age-structure.js) and
   its validator (scripts/lib/apenv-tool-checks/age-structure.mjs). OWNED BY THIS
   TOOL ONLY (builder T1). The frame; the shipped data passing (300 problems
   per context and type, every key recomputed with ApEnvCalc); the same seed
   giving the same problem; planted mistakes caught; and the model: every
   pyramid sums to 100%, its shape follows TFR against replacement, the young
   and old shares track rounded UN shares, the four stages' rates point to
   their own stage and grow fastest in stage 2, and the growth rate is
   ApEnvCalc.naturalIncrease. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/age-structure.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model: A } = runtime('age-structure');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'age-structure.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);
const stp = (p, k) => p.steps.find(s => s.key === k);

test('age-structure: the model registers, the page script parses, the validator checks the frame', () => {
  assert.ok(A && typeof A.generate === 'function' && !A.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'age-structure.js'), 'utf8')));
  const map = loadMap();
  assert.ok(check({ ...data, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: data.contexts.filter(c => !c.types.includes('stage')) }, map).some(e => /stage/.test(e)));
  // A shape context whose range spans two shapes is refused (its lead promises one).
  assert.ok(check({ ...data, contexts: [{ ...ctx('shape-young'), tfr: [1.4, 5] }] }, map).some(e => /more than one shape/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'age-structure');
  assert.equal(entry.topic, 'age-structure');
  assert.equal(entry.premium, 'tools');
});

test('age-structure: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('age-structure: the same seed gives the same problem; every type is drilled', () => {
  const seen = new Set();
  for (const c of data.contexts) for (const t of c.types) {
    seen.add(t);
    assert.equal(JSON.stringify(A.generate(M.rng(77), c, t)), JSON.stringify(A.generate(M.rng(77), c, t)), `${c.id} ${t}`);
  }
  assert.deepEqual([...seen].sort(), [...TYPES].sort());
});

test('age-structure: planted mistakes are caught', () => {
  const w = 'planted';
  let errs = [], p = A.generate(M.rng(1), ctx('rate-young'), 'rate');
  stp(p, 'answer').cell.numeric.answer = p.given.cbr - p.given.cdr;     // per 1,000, not percent
  recheck(p, ctx('rate-young'), w, errs);
  assert.ok(errs.some(e => /answer key/.test(e)), errs.join('; '));
  errs = []; p = A.generate(M.rng(2), ctx('shape-old'), 'shape');
  stp(p, 'shape').correct = 0;                                           // expansive for an old country
  recheck(p, ctx('shape-old'), w, errs);
  assert.ok(errs.some(e => /shape key/.test(e)), errs.join('; '));
  errs = []; p = A.generate(M.rng(3), ctx('stage-2'), 'stage');
  stp(p, 'stage').correct = 2;
  recheck(p, ctx('stage-2'), w, errs);
  assert.ok(errs.some(e => /stage key/.test(e)), errs.join('; '));
});

test('age-structure: every pyramid sums to 100% and its shape follows fertility', () => {
  for (const tfr of [1.1, 1.6, 2.1, 3, 5, 7]) for (const e0 of [35, 55, 70, 85]) {
    const p = A.pyramid(tfr, e0), tot = p.male.concat(p.female).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(tot - 100) < 0.3, `TFR ${tfr} e0 ${e0}: ${tot}`);
  }
  assert.equal(A.shape(A.pyramid(5.5, 58)), 'expansive');
  assert.equal(A.shape(A.pyramid(2.1, 76)), 'stable');
  assert.equal(A.shape(A.pyramid(1.3, 83)), 'constrictive');
  // Lower fertility, older population: the 65+ share rises as TFR falls.
  const old = [5, 3, 2.1, 1.5].map(t => A.broad(A.pyramid(t, 78)).old);
  for (let i = 1; i < old.length; i++) assert.ok(old[i] > old[i - 1]);
  // Women outlive men at older ages.
  const p = A.pyramid(1.6, 81);
  assert.ok(p.female[15] > p.male[15] && p.female[16] > p.male[16]);
});

test('age-structure: the stages point to themselves, growth is ApEnvCalc.naturalIncrease and peaks in stage 2', () => {
  const g = {};
  for (const s of [1, 2, 3, 4]) {
    const S0 = A.STAGES[s];
    assert.equal(A.stageOf(S0.cbr, S0.cdr), s);
    g[s] = A.growth(S0.cbr, S0.cdr);
    assert.equal(g[s], Calc.evaluate({ fn: 'naturalIncrease', args: [S0.cbr, S0.cdr] }));
  }
  assert.ok(g[2] > g[3] && g[3] > g[1] && g[2] > g[4], JSON.stringify(g));
  assert.ok(A.STAGES[1].tfr > A.STAGES[3].tfr && A.STAGES[4].tfr < 2.1);
});

test('age-structure: no em dashes in what a student reads', () => {
  for (const f of ['age-structure.js', 'math/age-structure.js']) assert.ok(!/—/.test(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', f), 'utf8')), f);
  assert.ok(!/—/.test(JSON.stringify(data)));
});
