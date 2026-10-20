/* Water pollution: its model (environmental-science/assets/tools/math/water-pollution.js) and
   its validator (scripts/lib/apenv-tool-checks/water-pollution.mjs). OWNED BY THIS
   TOOL ONLY (builder T4). The frame; the shipped data passing (300 problems
   per context and type, every key recomputed with ApEnvCalc); same seed
   same problem; planted mistakes caught; and the science of the model: the
   chain happens in order (bloom, then the oxygen low), more runoff means a
   lower low, warm water holds less oxygen (USGS), no runoff means no dead
   zone, and sewage stages only ever remove. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apenv-tool-checks/water-pollution.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, model: W } = runtime('water-pollution');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'water-pollution.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('water-pollution: the model registers, the page script parses, and the validator checks the frame', () => {
  assert.ok(W && typeof W.generate === 'function' && !W.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'water-pollution.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'water-pollution', kind: 'simulator', topic: 'eutrophication', intro: '<p>x</p>', howItWorks: '<p>x</p>', explore: { temps: [10, 20] }, contexts: [{ id: 'c1', topic: 'eutrophication', types: ['dochange'], lead: 'A lake.' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, explore: { temps: [12] } }, map).some(e => /explore/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'water-pollution').topic, 'eutrophication');
});

test('water-pollution: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('water-pollution: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = W.generate(M.rng(31337), c, t), b = W.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('water-pollution: planted mistakes are caught', () => {
  const p = W.generate(M.rng(5), ctx('bay-summer'), 'dochange'), e1 = [];
  p.steps.find(s => s.key === 'answer').cell.numeric.answer *= -1;          // sign flipped
  recheck(p, ctx('bay-summer'), 'planted', e1);
  assert.ok(e1.some(e => /answer key/.test(e)));
  const q = W.generate(M.rng(6), ctx('power-plant'), 'thermal'), e2 = [];
  q.steps.find(s => s.key === 'read').cell.answer += 1.3;                   // wrong table value
  recheck(q, ctx('power-plant'), 'planted', e2);
  assert.ok(e2.some(e => /read key/.test(e)));
  const r = W.generate(M.rng(7), ctx('town-plant'), 'sewage'), e3 = [];
  r.steps.find(s => s.key === 'after2a').cell.numeric.answer = r.given.bod * (1 - r.given.p1 / 100 - r.given.p2 / 100); // removals added
  recheck(r, ctx('town-plant'), 'planted', e3);
  assert.ok(e3.some(e => /after2 key/.test(e)));
  const s = W.generate(M.rng(8), ctx('river-nitrate'), 'load'), e4 = [];
  s.steps.find(x => x.key === 'load').cell.numeric.answer *= 1000;          // mg/kg slip
  recheck(s, ctx('river-nitrate'), 'planted', e4);
  assert.ok(e4.some(e => /load key/.test(e)));
  const t = W.generate(M.rng(9), ctx('farm-lake'), 'chain'), e5 = [];
  const d = t.steps.find(x => x.key === 'dead'), yes = /^Yes/.test(d.options[d.correct]);
  d.correct = d.options.findIndex(o => /^Yes/.test(o) !== yes);             // the opposite verdict
  recheck(t, ctx('farm-lake'), 'planted', e5);
  assert.ok(e5.some(e => /dead-zone key/.test(e)));
});

test('water-pollution: the drill feedback names the slips', () => {
  const p = W.generate(M.rng(11), ctx('bay-summer'), 'dochange');
  const st = p.steps.find(s => s.key === 'setup'), g = p.given;
  assert.match(M.diagnoseSetup(st.cell, `${g.after} - ${g.before} / ${g.before} * 100`).why, /brackets/);
  assert.match(M.diagnoseSetup(st.cell, `(${g.after} - ${g.before}) / ${g.before}`).why, /100/);
  assert.match(M.diagnoseSetup(st.cell, `(${g.after} - ${g.before}) / ${g.after} * 100`).why, /old value/);
  const ans = p.steps.find(s => s.key === 'answer');
  assert.match(M.diagnoseUnit(ans.cell, { value: String(-ans.cell.numeric.answer), unit: '%' }).why, /negative/);
  assert.match(M.diagnoseUnit(ans.cell, { value: String(ans.cell.numeric.answer), unit: '' }).why, /unit/i);
  const th = W.generate(M.rng(12), ctx('power-plant'), 'thermal');
  const why = th.steps.find(s => s.key === 'why');
  assert.ok(why.options.some((o, i) => /chemicals/.test(o) && /heat/.test(why.why[i])), 'thermal pollution named as heat, not chemicals');
});

test('water-pollution: the lake model runs the chain in order and responds to runoff and heat', () => {
  // USGS saturation, and warmer water holds less.
  assert.equal(W.osat(20), 9.1); assert.equal(W.osat(10), 11.3); assert.ok(Math.abs(W.osat(12) - (11.3 + 0.4 * (10.1 - 11.3))) < 1e-9);
  for (let t = 0; t < 35; t++) assert.ok(W.osat(t + 1) < W.osat(t));
  // No runoff: no bloom, no dead zone, oxygen near saturation.
  const none = W.lake(0, 20);
  assert.equal(none.hypoxicDays, 0); assert.ok(none.min > 0.85 * none.osat); assert.ok(none.stages.every(s => s === null));
  // More runoff, a lower low, never above saturation, never below 0.
  let prev = Infinity;
  for (let L = 0; L <= 5; L++) {
    const r = W.lake(L, 20);
    assert.ok(r.min <= prev + 1e-9, `level ${L}`); prev = r.min;
    assert.ok(r.O.every(o => o >= 0 && o <= r.osat + 1e-9));
    if (L >= 1) assert.ok(r.minDay > r.peakDay, 'the oxygen low comes after the algae peak');
  }
  assert.ok(W.lake(4, 20).hypoxicDays > 0, 'heavy runoff makes a dead zone');
  // The chain's links are reached in order.
  const h = W.lake(4, 20).stages;
  for (let i = 1; i < h.length; i++) assert.ok(h[i] >= h[i - 1], `link ${i}`);
  // The same runoff in warmer water: a lower low.
  assert.ok(W.lake(2, 28).min < W.lake(2, 15).min);
  assert.equal(W.CHAIN.map(c => c.k).join(','), 'nutrients,bloom,dieoff,decomp,dofall,dead');
});

test('water-pollution: each sewage stage only removes, and only tertiary takes most nutrients', () => {
  const S = W.SEWAGE.stages;
  for (let i = 1; i < S.length; i++) for (const p of W.SEWAGE.parts) assert.ok(S[i].left[p.k] <= S[i - 1].left[p.k], `${S[i].k} ${p.k}`);
  assert.ok(S[2].left.nutrients > 50 && S[3].left.nutrients < 50, 'nitrogen and phosphorus come out in tertiary treatment');
  assert.ok(S[4].left.pathogens < S[3].left.pathogens / 10, 'disinfection kills pathogens');
});
