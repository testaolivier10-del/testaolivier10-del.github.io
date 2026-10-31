/* Regression lab: its model (precalculus/assets/tools/math/regression-lab.js) and its
   validator (scripts/lib/apprecalc-tool-checks/regression-lab.mjs). OWNED BY THIS
   TOOL ONLY (builder T1). PHASE 0: the scaffold is wired (the model
   registers, the validator refuses data while the model is a stub, and
   the page entry points at the right topic). Phase 2 replaces these tests
   with the model's own: same seed same problem, every key against hand
   values, the validator on the shipped data, planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check } from '../lib/apprecalc-tool-checks/regression-lab.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

test('regression-lab: scaffold registered, page entry wired, validator guards the stub', () => {
  const { model } = runtime('regression-lab');
  assert.ok(model, 'ApPrecalcMath.regressionLab is registered');
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'regression-lab');
  assert.ok(entry && entry.studio === true);
  const map = loadMap();
  assert.ok(map.topicById(entry.topic), 'its context topic is in the map');
  const data = join(ROOT, 'precalculus', 'data', 'tools', 'regression-lab.json');
  if (model.stub) {
    assert.equal(existsSync(data), false, 'no data file while the model is a stub');
    const errs = check({ slug: 'regression-lab', kind: 'simulator', topic: entry.topic, intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: entry.topic }] }, map);
    assert.ok(errs.some(e => /Phase 0 stub/.test(e)));
  } else {
    assert.ok(existsSync(data), 'a built model ships its data file');
    assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), map), []);
  }
});
