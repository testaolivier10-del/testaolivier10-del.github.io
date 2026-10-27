/* Memory lab: its model (psychology/assets/tools/math/memory-lab.js) and
   its validator (scripts/lib/appsych-tool-checks/memory-lab.mjs). OWNED BY
   THIS TOOL ONLY (builder T3). The frame; the shipped data passing (300
   problems per context and type, every key rechecked with ApPsychStats);
   same seed, same problem; planted mistakes caught; the slips named; the
   recall scorer; and the models keep the published shapes (primacy and
   recency, recency lost after a filled delay, a forgetting curve that falls
   fast then levels, spaced review beating massed review). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/appsych-tool-checks/memory-lab.mjs';
import { loadMap, ROOT } from '../lib/appsych-build.mjs';

const { M, Stats, model: ML } = runtime('memory-lab');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'memory-lab.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);
const E = (fn, ...args) => Stats.evaluate({ fn, args });

test('memory-lab: registers, the page script parses, it is registered, the frame is checked', () => {
  assert.ok(ML && typeof ML.generate === 'function' && !ML.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'memory-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'memory-lab');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'memory-intro');
  assert.equal(entry.premium, 'tools');
  const map = loadMap();
  const ok = { slug: 'memory-lab', kind: 'simulator', topic: 'memory-intro', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'forgetting', types: ['interference'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'forgetting', types: ['spacing'] }] }, map).some(e => /spacing context needs/.test(e)));
});

test('memory-lab: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('memory-lab: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = ML.generate(M.rng(4242), c, t), b = ML.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('memory-lab: planted mistakes are caught', () => {
  const plant = (id, t, seed, f, re) => {
    const p = ML.generate(M.rng(seed), ctx(id), t), e = [];
    f(p); recheck(p, ctx(id), 'planted', e);
    assert.ok(e.some(x => re.test(x)), `${id} ${t}: ${e.join('; ') || 'nothing caught'}`);
  };
  plant('word-list', 'serial', 3, p => { p.steps.find(s => s.key === 'lastmean').cell.answer = E('mean', p.given.del.slice(7)); }, /lastmean key/);
  plant('word-list', 'serial', 4, p => { p.given.del = p.given.imm.slice(); }, /recency/);
  plant('vocab-study', 'spacing', 5, p => { p.steps.find(s => s.key === 'massed').cell.answer = E('sum', p.given.massed); }, /group mean key/);
  plant('anatomy-study', 'spacing', 6, p => { p.given.spaced = p.given.massed.slice(); }, /does not clearly beat/);
  plant('two-memories', 'interference', 7, p => { p.steps.find(s => s.key === 'kind').correct = 1; }, /kind key/);
  plant('nonsense-syllables', 'forgetting', 8, p => { p.steps.find(s => s.key === 'drop1').cell.answer = p.given.pts[1][1]; }, /drop key/);
});

test('memory-lab: the drill feedback names the slips', () => {
  const p = ML.generate(M.rng(21), ctx('word-list'), 'serial');
  const lm = p.steps.find(s => s.key === 'lastmean');
  assert.match(M.diagnose(lm.cell, E('sum', p.given.imm.slice(7))).why, /sum/);
  assert.match(M.diagnose(lm.cell, E('mean', p.given.del.slice(7))).why, /delayed group/);
  const sp = ML.generate(M.rng(22), ctx('vocab-study'), 'spacing');
  const iv = sp.steps.find(s => s.key === 'iv');
  assert.ok(iv.why.some((w, i) => i !== iv.correct && /dependent variable/.test(w)), 'the DV offered as the IV is named');
  const concl = sp.steps.find(s => s.key === 'concl');
  assert.ok(concl.why.some((w, i) => i !== concl.correct && /Random assignment supports cause, not generalizing/.test(w)), 'generalizing from the design is named');
  // Both directions of interference appear, each keyed by the memory being retrieved.
  const kinds = new Set();
  for (let s = 1; s < 60; s++) { const q = ML.generate(M.rng(s), ctx('two-memories'), 'interference'); kinds.add(q.steps[1].options[q.steps[1].correct].split(':')[0]); }
  assert.deepEqual([...kinds].sort(), ['Proactive interference', 'Retroactive interference']);
});

test('memory-lab: the recall scorer forgives case, plurals and one typo, never double counts', () => {
  const w = ['apple', 'bridge', 'candle', 'dolphin', 'engine'];
  const s = ML.score(w, ['APPLE', 'bridges', 'candla', 'dolphin', 'dolphin', 'zebra', 'cat']);
  assert.deepEqual(s.hits, [1, 1, 1, 1, 0]);
  assert.equal(s.n, 4);
  assert.deepEqual(s.extra, ['dolphin', 'zebra', 'cat']);
  assert.deepEqual(ML.score(w, ['ape']).hits, [0, 0, 0, 0, 0], 'a short word needs an exact match');
});

test('memory-lab: the models keep the published shapes', () => {
  const n = 10, imm = i => ML.recallP(i, n, false), del = i => ML.recallP(i, n, true);
  const mid = Math.min(imm(4), imm(5), imm(6), imm(7));
  assert.ok(imm(1) > mid + 0.3 && imm(10) > mid + 0.4, 'U-shaped immediate curve');
  assert.ok(imm(10) - del(10) > 0.5 && Math.abs(imm(1) - del(1)) < 0.02, 'a filled delay removes recency, keeps primacy');
  // The simulated class: percents are ApPsychStats means of the hits.
  const sim = ML.simulate(9, 30, n, false);
  sim.pct.forEach((v, i) => assert.equal(v, E('mul', 100, E('mean', sim.hits.map(h => h[i])))));
  // Forgetting: falls, faster at first; a review resets to 100; spaced beats massed.
  const none = [1, 2, 7, 14, 30].map(d => ML.retention([], d));
  assert.ok(none.every((v, i) => !i || v < none[i - 1]));
  assert.ok(100 - none[0] > none[2] - none[3], 'the first day costs more than days 7 to 14');
  assert.ok(Math.abs(ML.retention([3], 3) - 100) < 1e-9);
  const P = k => ML.PRESETS.find(p => p.k === k).reviews;
  assert.ok(ML.retention(P('spaced'), 30) > ML.retention(P('massed'), 30) + 10);
  assert.ok(ML.retention(P('massed'), 30) >= ML.retention([], 30) - 1e-9);
  for (const t of [0, 5, 30]) for (const k of ['none', 'massed', 'spaced', 'wide']) { const v = ML.retention(P(k), t); assert.ok(v >= ML.FLOOR && v <= 100); }
});
