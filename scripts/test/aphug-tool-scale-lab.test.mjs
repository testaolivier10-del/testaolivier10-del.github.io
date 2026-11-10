/* Scale lab: its model (human-geography/assets/tools/math/scale-lab.js) and its
   validator (scripts/lib/aphug-tool-checks/scale-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T2). The shipped data pass (300 seeds per context and type,
   every key recomputed); drills are reproducible by seed; the scale is named
   from the data, never from the map's extent; map-scale arithmetic matches
   ApHugCalc; and planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check, bases } from '../lib/aphug-tool-checks/scale-lab.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'tools', 'scale-lab.json'), 'utf8'));
const map = { topicById: id => ['scales-of-analysis', 'skills-scale'].includes(id) ? { id } : null };
const { M, Calc, Map, model } = runtime('scale-lab');
const ctx = id => data.contexts.find(c => c.id === id);
const step = (p, k) => p.steps.find(s => s.key === k);

test('scale-lab: registered, the page script parses, pre-registered free, the shipped data pass', () => {
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'scale-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'scale-lab');
  assert.equal(entry.topic, 'scales-of-analysis');
  assert.ok(!entry.premium, 'scale-lab is free (spec section 6)');
  assert.deepEqual(check(data, map), []);
});

test('scale-lab: a seed gives the same drill every time', () => {
  for (const t of model.TYPES) {
    const c = data.contexts.find(x => x.types.includes(t));
    const a = model.generate(M.rng(4242), c, t, bases()), b = model.generate(M.rng(4242), c, t, bases());
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), t);
  }
});

test('scale-lab: the scale is the data\'s, not the map\'s (the 38% point)', () => {
  let seenA = false, seenWorld = false;
  for (let i = 1; i < 400 && !(seenA && seenWorld); i++) {
    const p = model.generate(M.rng(i), ctx('identify-maps'), 'identify', bases());
    if (p.case === 'a-province') {
      seenA = true;
      assert.equal(step(p, 'scale').options[step(p, 'scale').correct], 'Local (subnational)');
      const nat = step(p, 'scale').options.indexOf('National');
      assert.match(step(p, 'scale').why[nat], /not the size of the map/);
    }
    if (p.case === 'world-country') {
      seenWorld = true;
      assert.equal(step(p, 'scale').options[step(p, 'scale').correct], 'National');
      assert.match(step(p, 'scale').why[0], /not the size of the map/);
    }
    assert.equal(Map.check(p.map, bases()[p.map.base]).length, 0);
  }
  assert.ok(seenA && seenWorld);
});

test('scale-lab: map-scale arithmetic and its named slips', () => {
  const p = model.generate(M.rng(77), ctx('map-scale'), 'mapscale');
  const g = step(p, 'ground'), km = Calc.evaluate({ fn: 'mapToGround', args: [p.cm, p.denom] });
  assert.equal(g.cell.answer, km);
  assert.ok(M.diagnose(g.cell, km).ok);
  assert.match(M.diagnose(g.cell, p.cm * p.denom).why, /centimeters/);
  assert.match(M.diagnose(g.cell, p.cm * p.denom / 100).why, /meters/);
  assert.equal(step(p, 'larger').correct, p.m1 < p.m2 ? 0 : 1);
  assert.equal(model.km(2.5), '2.5');
  assert.equal(model.km(10000), '10,000');
});

test('scale-lab: the national figure weights provinces by people', () => {
  const ds = model.dataset(M.rng(9));
  let w = 0, n = 0; for (const p of ds.provinces) { w += p.value * p.pop; n += p.pop; }
  assert.ok(Math.abs(ds.national - w / n) < 1e-9);
  const vs = model.views(ds);
  assert.equal(vs.map(v => v.scale).join(), 'global,regional,national,local');
  assert.ok(vs[3].range > 0 && vs[2].range === 0);
});

test('scale-lab: planted mistakes are caught', () => {
  const bad = JSON.parse(JSON.stringify(data));
  const ch = bad.contexts.find(c => c.id === 'chain-palm-oil');
  ch.chain.effect.scale = 'global';
  ch.chain.setup = ch.chain.setup.replace(/since the 1990s/, 'lately');
  bad.contexts.find(c => c.id === 'limits').questions.push({ text: 'No question mark', scale: 'local', unit: 'x', cover: 0 });
  bad.intro += ' — ';
  const errs = check(bad, map);
  assert.ok(errs.some(e => /different scales/.test(e)), 'cause and effect at one scale');
  assert.ok(errs.some(e => /dates the case/.test(e)), 'an undated case');
  assert.ok(errs.some(e => /ending in \?/.test(e)), 'a question without a question mark');
  assert.ok(errs.some(e => /em dash/.test(e)), 'an em dash');
  assert.ok(check({ ...data, slug: 'nope' }, map).some(e => /slug/.test(e)));
  // A wrong key in a generated drill is caught by the sweep's recheck.
  const orig = model.generate;
  model.generate = (r, c, t, b) => { const p = orig(r, c, t, b); if (p.type === 'mapscale') step(p, 'larger').correct = 1 - step(p, 'larger').correct; return p; };
  try { assert.ok(check(data, map).some(e => /larger key/.test(e))); } finally { model.generate = orig; }
});
