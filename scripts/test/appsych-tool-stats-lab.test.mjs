/* Stats lab: its model (psychology/assets/tools/math/stats-lab.js) and
   its validator (scripts/lib/appsych-tool-checks/stats-lab.mjs). OWNED BY
   THIS TOOL ONLY (builder T3). The frame; the shipped data passing (300
   problems per context and type, every key recomputed with ApPsychStats);
   same seed, same problem; planted mistakes caught; the slips named; and the
   model's numbers equal their ApPsychStats recipes (the explore pane shows
   exactly these). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/appsych-tool-checks/stats-lab.mjs';
import { loadMap, ROOT } from '../lib/appsych-build.mjs';

const { M, Stats, model: SL } = runtime('stats-lab');
const data = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'tools', 'stats-lab.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);
const E = (fn, ...args) => Stats.evaluate({ fn, args });

test('stats-lab: registers, the page script parses, it is registered, the frame is checked', () => {
  assert.ok(SL && typeof SL.generate === 'function' && !SL.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'stats-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'stats-lab');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'stats-normal');
  assert.equal(entry.premium, 'tools');
  const map = loadMap();
  const ok = { slug: 'stats-lab', kind: 'simulator', topic: 'stats-normal', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'stats-normal', types: ['rule'], lead: 'A test.', scale: { mean: 100, sd: 15 } }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ ...ok.contexts[0], types: ['nope'] }] }, map).some(e => /unknown type/.test(e)));
});

test('stats-lab: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('stats-lab: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = SL.generate(M.rng(31337), c, t), b = SL.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('stats-lab: planted mistakes are caught', () => {
  const plant = (id, t, seed, f, re) => {
    const p = SL.generate(M.rng(seed), ctx(id), t), e = [];
    f(p); recheck(p, ctx(id), 'planted', e);
    assert.ok(e.some(x => re.test(x)), `${id} ${t}: ${e.join('; ') || 'nothing caught'}`);
  };
  plant('iq-test', 'rule', 3, p => { p.steps.find(s => s.key === 'below').cell.answer = 68; }, /below key/);
  plant('iq-test', 'rule', 4, p => { p.steps.find(s => s.key === 'z').cell.answer *= -1 || 1; p.steps.find(s => s.key === 'z').cell.answer += 0.5; }, /z key/);
  plant('entrance-test', 'between', 5, p => { p.steps.find(s => s.key === 'pct').cell.answer += 34; }, /pct key/);
  plant('two-tests', 'zcompare', 6, p => { const s = p.steps.find(x => x.key === 'better'); s.correct = 1; }, /better key/);
  plant('texts', 'center', 7, p => { const s = p.steps.find(x => x.key === 'median'); s.cell.answer = E('mean', p.given.data) + 0.5; }, /median key/);
  plant('sleep-onset', 'outlier', 8, p => { p.steps.find(x => x.key === 'newmean').cell.answer = E('mean', p.given.data); }, /newmean key/);
  plant('quiz-scores', 'outlier', 9, p => { const s = p.steps.find(x => x.key === 'skew'); s.correct = 1; }, /skew key/);
  plant('study-scores', 'scatter', 10, p => { p.given.points = p.given.points.map(q => [q[0], -q[1]]); }, /drawn r|far from/);
});

test('stats-lab: the drill feedback names the slips', () => {
  const p = SL.generate(M.rng(21), ctx('iq-test'), 'rule');
  const below = p.steps.find(s => s.key === 'below'), k = Math.round(p.given.x - 100) / 15;
  if (Math.abs(k) !== 0) assert.match(M.diagnose(below.cell, E('rulePct', -Math.abs(k), Math.abs(k))).why, /both sides/);
  assert.match(M.diagnose(below.cell, 100 - below.cell.answer).why, /above/);
  const z = p.steps.find(s => s.key === 'z');
  assert.match(M.diagnose(z.cell, -z.cell.answer).why, /sign/);
  assert.match(M.diagnose(z.cell, p.given.x - 100).why, /standard deviation/);
  const c = SL.generate(M.rng(22), ctx('texts'), 'center');
  const mean = c.steps.find(s => s.key === 'mean');
  assert.match(M.diagnose(mean.cell, E('sum', c.given.data)).why, /sum/);
  const o = SL.generate(M.rng(23), ctx('texts'), 'outlier');
  const nm = o.steps.find(s => s.key === 'newmean');
  assert.match(M.diagnose(nm.cell, E('div', E('sum', o.given.data.concat([o.given.out])), o.given.data.length)).why, /there are now/);
  const s = SL.generate(M.rng(24), ctx('screens-sleep'), 'scatter');
  const r = s.steps.find(x => x.key === 'r');
  assert.ok(r.why.some((w, i) => i !== r.correct && /sign/.test(w)), 'the opposite-sign r is offered and its slip named');
  const cause = s.steps.find(x => x.key === 'cause');
  assert.ok(cause.why.some((w, i) => i !== cause.correct && /Sample size is not the problem/.test(w)), 'generalizing from sample size is named');
});

test('stats-lab: the model\'s numbers are their ApPsychStats recipes', () => {
  for (const b of SL.SCALES) for (let k = -3; k <= 3; k++) {
    const x = b.mean + k * b.sd, n = SL.normalAt(x, b.mean, b.sd);
    assert.equal(n.z, E('z', x, b.mean, b.sd));
    assert.ok(n.whole);
    assert.equal(n.rule, E('percentileRule', k));
    assert.equal(n.pct, E('percentile', x, b.mean, b.sd));
  }
  // The rule's bands add up as the exam teaches them.
  assert.equal(E('rulePct', -1, 1), 68); assert.equal(E('rulePct', -2, 2), 95); assert.equal(E('rulePct', -3, 3), 99.7);
  assert.equal(SL.ruleSum(1), '50 + 34'); assert.equal(SL.ruleSum(-2), '0.15 + 2.35'); assert.equal(SL.bandList(-1, 2), '34 + 34 + 13.5');
  assert.equal(SL.normalAt(107, 100, 15).whole, false);
  for (const s of SL.SETS) {
    const c = SL.center(s.values);
    for (const k of ['mean', 'median', 'mode', 'range', 'sd']) assert.equal(c[k], E(k, s.values), `${s.k} ${k}`);
    // An outlier pulls the mean, not the median.
    const far = s.values.slice(); far[far.length - 1] = s.hi;
    const d = SL.center(far);
    assert.ok(d.mean - c.mean > Math.abs(d.median - c.median), `${s.k}: the mean moves more than the median`);
  }
  // corrPoints lands near the aim; the r shown is always recomputed.
  for (const t of [-0.9, -0.5, 0, 0.5, 0.9]) for (const pair of SL.PAIRS) {
    const pts = SL.corrPoints(t, 20, 7, pair), r = E('r', pts);
    assert.ok(Math.abs(r - t) < 0.25, `aim ${t} got ${r}`);
    assert.ok(pts.every(q => q[0] >= pair.xs[0] && q[0] <= pair.xs[1] && q[1] >= pair.ys[0] && q[1] <= pair.ys[1]));
  }
});
