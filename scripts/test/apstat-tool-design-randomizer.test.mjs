/* Design randomizer: its model (statistics/assets/tools/math/design-randomizer.js) and its
   validator (scripts/lib/apstat-tool-checks/design-randomizer.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem and same assignment, the shipped data
   passing, planted mistakes caught, and statistical model tests: under
   complete randomization every unit gets treatment A half the time (within
   1 point over 40,000 assignments) and the estimate is unbiased; blocking
   and pairing balance the other variable exactly and cut the spread; a
   person choosing, or an unblinded placebo effect, biases the estimate. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check } from '../lib/apstat-tool-checks/design-randomizer.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'design-randomizer.json'), 'utf8'));
const scene = id => DATA.explore.scenes.find(s => s.id === id);
const meanOf = a => a.reduce((x, y) => x + y, 0) / a.length;
const sdOf = a => { const m = meanOf(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); };

test('design-randomizer: the model registers ApStatMath.designRandomizer, and the validator checks the frame', () => {
  const { M, model } = runtime('design-randomizer');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'design-randomizer', kind: 'simulator', topic: 'experimental-design', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'experimental-design' }] };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('design-randomizer: the shipped data passes its validator', () => {
  assert.deepEqual(check(DATA, loadMap()), []);
});

test('design-randomizer: a seed gives the same problem and the same assignment twice', () => {
  const { M, model } = runtime('design-randomizer');
  for (const c of DATA.contexts) for (const t of c.types) assert.equal(JSON.stringify(model.generate(M.rng(31337), c, t)), JSON.stringify(model.generate(M.rng(31337), c, t)));
  const sc = scene('plants'), U = model.units(sc);
  for (const d of model.DESIGNS) assert.deepEqual(model.assign(M.rng(8), U, d, sc), model.assign(M.rng(8), U, d, sc));
});

test('design-randomizer: planted mistakes are caught', () => {
  const { model } = runtime('design-randomizer');
  const map = loadMap();
  const bad = JSON.parse(JSON.stringify(DATA)); bad.contexts[0].N = 41;
  assert.ok(check(bad, map).some(e => /even/.test(e)));
  const bad2 = JSON.parse(JSON.stringify(DATA)); bad2.contexts[1].blind.kind = 'triple';
  assert.ok(check(bad2, map).some(e => /blind/.test(e)));
  const bad3 = JSON.parse(JSON.stringify(DATA)); bad3.explore.scenes[0].cols = 7;
  assert.ok(check(bad3, map).some(e => /pairs|odd/.test(e)));
  const real = model.generate;
  try {
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'design') { const s = p.steps[0]; s.correct = (s.correct + 1) % s.options.length; } return p; };
    assert.ok(check(DATA, map).some(e => /reads as/.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); const s = p.steps.find(x => x.key === 'cause'); if (s) s.correct = (s.correct + 1) % 2; return p; };
    assert.ok(check(DATA, map).some(e => /cause and effect key/.test(e)));
  } finally { model.generate = real; }
});

test('design-randomizer: complete randomization gives each unit treatment A half the time (within 1 point), and an unbiased estimate', () => {
  const { M, model } = runtime('design-randomizer');
  for (const id of ['plants', 'memory']) {
    const sc = scene(id), U = model.units(sc), r = M.rng(4), hits = new Array(U.length).fill(0), K = 40000;
    for (let j = 0; j < K; j++) model.assign(r, U, 'cr', sc).forEach((t, i) => { if (t === 'A') hits[i]++; });
    for (const h of hits) assert.ok(Math.abs(h / K - 0.5) < 0.01, `${id}: ${h / K}`);
    const m = model.many(M.rng(5), U, 'cr', sc, 5000, {});
    assert.ok(Math.abs(meanOf(m.diffs) - sc.effect) < 4 * sdOf(m.diffs) / Math.sqrt(5000), `${id}: mean estimate ${meanOf(m.diffs)}`);
    assert.ok(Math.abs(meanOf(m.bals)) < 4 * sdOf(m.bals) / Math.sqrt(5000));
  }
});

test('design-randomizer: blocks and pairs balance exactly, stay unbiased and vary less than complete randomization', () => {
  const { M, model } = runtime('design-randomizer');
  for (const id of ['plants', 'memory']) {
    const sc = scene(id), U = model.units(sc);
    const cr = model.many(M.rng(6), U, 'cr', sc, 3000, {});
    for (const d of ['block', 'pairs']) {
      const m = model.many(M.rng(7), U, d, sc, 3000, {});
      assert.ok(m.bals.every(b => b === 0), `${id} ${d}: not balanced`);
      assert.ok(sdOf(m.diffs) < 0.85 * sdOf(cr.diffs), `${id} ${d}: SD ${sdOf(m.diffs)} vs ${sdOf(cr.diffs)}`);
      assert.ok(Math.abs(meanOf(m.diffs) - sc.effect) < 4 * sdOf(m.diffs) / Math.sqrt(3000));
    }
  }
});

test('design-randomizer: a person choosing confounds the estimate, and an unblinded placebo effect inflates it', () => {
  const { M, model } = runtime('design-randomizer');
  for (const id of ['plants', 'memory']) {
    const sc = scene(id), U = model.units(sc), m = model.many(M.rng(8), U, 'none', sc, 2000, {});
    assert.ok(meanOf(m.diffs) - sc.effect > 1, `${id}: no confounding seen (${meanOf(m.diffs)})`);
  }
  const sc = scene('memory'), U = model.units(sc);
  const blind = model.many(M.rng(9), U, 'cr', sc, 4000, {}), open = model.many(M.rng(9), U, 'cr', sc, 4000, { unblind: true });
  assert.ok(Math.abs(meanOf(open.diffs) - meanOf(blind.diffs) - sc.placebo) < 0.15, 'the unblinded shift is the placebo effect');
});
