/* Brain map: its model (psychology/assets/tools/math/brain-map.js) and its
   validator (scripts/lib/appsych-tool-checks/brain-map.mjs). OWNED BY THIS
   TOOL ONLY (builder T2). The frame and registration; the shipped data
   passing (300 problems per context and type, every key recomputed); same
   seed same problem; planted mistakes caught; and the science: every CED 1.4
   structure is there, contralateral control, and the split-brain logic for
   both fields with the corpus callosum cut and intact. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/appsych-tool-checks/brain-map.mjs';
import { ROOT, loadMap } from '../lib/appsych-build.mjs';

const { M, model: B } = runtime('brain-map');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'brain-map.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('brain-map: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  assert.ok(B && typeof B.generate === 'function' && !B.stub, 'ApPsychMath.brainMap is the real model');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'brain-map.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'brain-map');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'brain');
  assert.equal(entry.premium, undefined, 'free');
  const map = { topicById: id => id === 'brain' ? { id } : null };
  const ok = { slug: 'brain-map', kind: 'simulator', topic: 'brain', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'brain', types: ['contra'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, intro: '<p>Some are right-brained people.</p>' }, map).some(e => /right-brained/.test(e)));
  assert.deepEqual(check({ ...ok, intro: '<p><span class="psy-myth">There are no right-brained people.</span></p>' }, map), []);
});

test('brain-map: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('brain-map: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = B.generate(M.rng(4242), c, t), b = B.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('brain-map: the split-brain logic', () => {
  for (const field of ['left', 'right']) for (const cut of [true, false]) {
    const s = B.splitBrain(field, cut);
    assert.equal(s.first, field === 'left' ? 'right' : 'left', 'each visual field goes to the opposite hemisphere');
    if (!cut) assert.ok(s.left && s.right && s.says && s.leftHand && s.rightHand, 'intact: both hemispheres share it');
    else {
      assert.equal(s.says, field === 'right', 'cut: only the left hemisphere (speech) can say it');
      assert.equal(s.leftHand, field === 'left', 'cut: the left hand (right hemisphere) finds a left-field word');
      assert.equal(s.rightHand, field === 'right');
    }
  }
  assert.equal(B.contra('left'), 'right');
});

test('brain-map: every structure has a function, damage and a place', () => {
  for (const [k, r] of Object.entries(B.REGIONS)) {
    assert.ok(r.name && r.does && r.damage && B.WHERE[k], k);
    assert.ok(['outside', 'inside', 'both'].includes(r.view), k);
    assert.ok(B.NEAR[k] && B.NEAR[k].length >= 3 && B.NEAR[k].every(x => B.REGIONS[x] && x !== k), `${k}: three confusable neighbors`);
    assert.ok(!/—/.test(r.does + r.damage), `${k}: no em dash`);
  }
});

test('brain-map: planted mistakes are caught', () => {
  const p = B.generate(M.rng(5), ctx('neurology-ward'), 'lesion'), e1 = [];
  p.given.region = p.given.region === 'medulla' ? 'pons' : 'medulla';
  recheck(p, ctx('neurology-ward'), 'planted', e1);
  assert.ok(e1.some(e => /case/.test(e)));
  const q = B.generate(M.rng(6), ctx('split-brain'), 'split'), e2 = [];
  const h = q.steps.find(s => s.key === 'hemi'); h.correct = (h.correct + 1) % h.options.length;
  recheck(q, ctx('split-brain'), 'planted', e2);
  assert.ok(e2.some(e => /hemisphere key/.test(e)));
  const r = B.generate(M.rng(7), ctx('stroke-unit'), 'contra'), e3 = [];
  r.given.side = r.given.side === 'left' ? 'right' : 'left';
  recheck(r, ctx('stroke-unit'), 'planted', e3);
  assert.ok(e3.some(e => /side key/.test(e)));
  const u = B.generate(M.rng(8), ctx('brain-lab'), 'imaging'), e4 = [];
  const m = u.steps.find(s => s.key === 'method'); m.correct = (m.correct + 1) % m.options.length;
  recheck(u, ctx('brain-lab'), 'planted', e4);
  assert.ok(e4.some(e => /method key/.test(e)));
});
