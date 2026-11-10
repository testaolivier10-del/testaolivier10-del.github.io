/* Model Studio: its model (human-geography/assets/tools/math/model-studio.js) and its
   validator (scripts/lib/aphug-tool-checks/model-studio.mjs). OWNED BY THIS TOOL
   ONLY (builder T1). The shipped data passes the validator (300 seeds per
   model, every key recomputed); planted mistakes are caught; the figures'
   numbers and labels never touch at 330 or 600 px; problems are
   reproducible from their seed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/aphug-tool-checks/model-studio.mjs';
import { ROOT, loadMap } from '../lib/aphug-build.mjs';

const { M, Model, model: MS } = runtime('model-studio');
const data = () => JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'tools', 'model-studio.json'), 'utf8'));
const map = loadMap();
const ctxOf = (d, id) => d.contexts.find(c => c.id === id);

test('model-studio: registers, the page script parses, it is registered free on the Tool Studio', () => {
  assert.ok(MS && !MS.stub && typeof MS.generate === 'function');
  assert.equal(MS.TYPES.length, 21);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'model-studio.js'), 'utf8')));
  for (const f of [join(ROOT, 'human-geography', 'data', 'pages.json'), join(ROOT, 'scripts', 'test', 'fixtures', 'aphug-data', 'pages.json')]) {
    const e = JSON.parse(readFileSync(f, 'utf8')).tools.find(t => t.slug === 'model-studio');
    assert.ok(e && e.studio === true && e.topic === 'transition-model' && !e.premium, f);
  }
});

test('model-studio: the shipped data passes (every model, 300 seeds, keys recomputed)', () => {
  const d = data();
  assert.deepEqual(check(d, map), []);
  assert.deepEqual(d.contexts.map(c => c.types[0]).sort(), [...MS.TYPES].sort(), 'one context per model');
  assert.deepEqual(d.contexts.filter(c => c.free).map(c => c.id), ['dtm']);
});

test('model-studio: a problem is the same for the same seed, and has build, apply and limits', () => {
  const d = data();
  for (const c of d.contexts) {
    const a = MS.generate(M.rng(4242), c), b = MS.generate(M.rng(4242), c);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), c.id);
    assert.equal(a.steps[0].kind, 'model');
    assert.equal(a.steps[a.steps.length - 1].key, 'limits');
    assert.ok(a.steps.length >= 3 && a.steps.length <= 4, c.id);
  }
});

test('model-studio: the slip is named, piece by piece', () => {
  const c = ctxOf(data(), 'von-thunen');
  const m = MS.buildModel(M.rng(1), c);
  const placed = { ...m.key, s2: m.key.s3, s3: m.key.s2 };
  const g = Model.grade(m, placed);
  assert.equal(g.right, 2);
  assert.match(g.slip, /forests in ring 2/);
  // A decoy's own reason is its slip on any place.
  const d = c.decoys[0], m2 = MS.buildModel(M.rng(3), { ...c, decoys: [d] });
  assert.equal(Model.grade(m2, { ...m2.key, s1: d.id }).slip, d.why);
});

test('model-studio: planted mistakes are caught', () => {
  const d = data();
  const bad = (mut) => { const x = JSON.parse(JSON.stringify(d)); mut(x); return check(x, map); };
  assert.ok(bad(x => { ctxOf(x, 'hoyt').free = true; }).some(e => /only the demographic transition/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'burgess').model.key.s1 = 'p4'; }).some(e => /model|key/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'burgess').decoys.push({ id: 'p1', text: 'dup' }); }).some(e => /collides/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'burgess').explain = {}; }).some(e => /no explanation/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'burgess').limits.right = [ctxOf(x, 'burgess').limits.right[0]]; }).some(e => /two limits/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'boundaries').apply.pool[0].map.marks[0].text = 'The boundary along the 49th parallel'; }).some(e => /map/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'boundaries').apply.pool[0].wrong.pop(); ctxOf(x, 'boundaries').apply.pool[0].wrong.pop(); }).some(e => /three wrong/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'dtm').claim = 'Rates fall — in order.'; }).some(e => /dash/.test(e)));
  assert.ok(bad(x => { ctxOf(x, 'malthus').figure = 'nope'; }).some(e => /figure/.test(e)));
  // recheck: a wrong key in a generated problem is found.
  const c = ctxOf(d, 'dtm'), p = MS.generate(M.rng(77), c);
  const apply = p.steps.find(s => s.key === 'apply');
  apply.correct = (apply.correct + 1) % 5;
  assert.ok(recheck(p, c, 'planted').some(e => /stage should be/.test(e)));
  const p2 = MS.generate(M.rng(78), c);
  p2.steps.find(s => s.key === 'rate').cell.answer *= 10;
  assert.ok(recheck(p2, c, 'planted').some(e => /RNI/.test(e)));
  const p3 = MS.generate(M.rng(79), c), lim = p3.steps.find(s => s.key === 'limits');
  lim.correct = (lim.correct + 1) % lim.options.length;
  assert.ok(recheck(p3, c, 'planted').some(e => /not a limit/.test(e)));
  const g = ctxOf(d, 'gravity'), p4 = MS.generate(M.rng(80), g), mm = p4.steps[0].model;
  [mm.key.t0, mm.key.t2] = [mm.key.t2, mm.key.t0];
  assert.ok(recheck(p4, g, 'planted').some(e => /gravity rank/.test(e)));
  const b = ctxOf(d, 'bid-rent'), p5 = MS.generate(M.rng(81), b), st = p5.steps.find(s => s.key === 'apply');
  st.correct = (st.correct + 1) % 4;
  assert.ok(recheck(p5, b, 'planted').some(e => /winner/.test(e)));
});

test('model-studio: figure labels never touch, and the check bites', () => {
  for (const id of MS.figureIds) for (const px of [330, 360, 600, 900]) assert.deepEqual([...MS.overlaps(MS.figure(id), px)], [], `${id} at ${px}`);
  assert.ok(MS.overlaps({ spots: [[[50, 50]], [[51, 51]]], labels: [] }, 330).length);
  assert.ok(MS.overlaps({ spots: [], labels: [{ x: 1, y: 50, text: 'A long label' }] }, 330).some(e => /leaves/.test(e)));
});
