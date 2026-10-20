/* Dose and response: its model (environmental-science/assets/tools/math/dose-response.js) and
   its validator (scripts/lib/apenv-tool-checks/dose-response.mjs). OWNED BY THIS
   TOOL ONLY (builder T4). The frame; the shipped data passing (300 problems
   per context and type, every key recomputed with ApEnvCalc); same seed
   same problem; planted mistakes caught; the named slips; and the science:
   curves rise through exactly 50% at their LD50, the threshold is below
   LD50, lower LD50 is more toxic, biomagnification multiplies per level and
   bioaccumulation rises with age in one organism. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apenv-tool-checks/dose-response.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model: D } = runtime('dose-response');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'dose-response.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('dose-response: the model registers, the page script parses, and the validator checks the frame', () => {
  assert.ok(D && typeof D.generate === 'function' && !D.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'dose-response.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'dose-response', kind: 'simulator', topic: 'dose-response-curve', intro: '<p>x</p>', howItWorks: '<p>x</p>', explore: data.explore, contexts: [{ id: 'c1', topic: 'lethal-dose-50', types: ['compare'], lead: 'A.', chems: ['P', 'Q'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, explore: {} }, map).some(e => /explore/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'dose-response').topic, 'dose-response-curve');
});

test('dose-response: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('dose-response: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = D.generate(M.rng(4242), c, t), b = D.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('dose-response: planted mistakes are caught', () => {
  const p = D.generate(M.rng(3), ctx('mice-insecticide'), 'read'), e1 = [];
  p.steps.find(s => s.key === 'ld50').cell.answer += 10;
  recheck(p, ctx('mice-insecticide'), 'planted', e1);
  assert.ok(e1.some(e => /LD50 key/.test(e)));
  const q = D.generate(M.rng(4), ctx('dog-bait'), 'dose'), e2 = [];
  q.steps.find(s => s.key === 'answer').cell.numeric.answer = q.given.ld50 / q.given.kg;   // divided
  recheck(q, ctx('dog-bait'), 'planted', e2);
  assert.ok(e2.some(e => /dose key/.test(e)));
  const r = D.generate(M.rng(5), ctx('ddt-lake'), 'magnify'), e3 = [];
  r.steps.find(s => s.key === 'top').cell.numeric.answer = r.given.c0 * r.given.f * r.given.lv; // f × steps, not f^steps
  recheck(r, ctx('ddt-lake'), 'planted', e3);
  assert.ok(e3.some(e => /top key/.test(e)));
  const s = D.generate(M.rng(6), ctx('ddt-lake'), 'magnify'), e4 = [];
  const w = s.steps.find(x => x.key === 'word'); w.correct = w.options.findIndex(o => /^Bioaccumulation/.test(o));
  recheck(s, ctx('ddt-lake'), 'planted', e4);
  assert.ok(e4.some(e => /word key/.test(e)));
  const t = D.generate(M.rng(7), ctx('two-pesticides'), 'compare'), e5 = [];
  const wh = t.steps.find(x => x.key === 'which'); wh.correct = 1;   // the higher LD50
  recheck(t, ctx('two-pesticides'), 'planted', e5);
  assert.ok(e5.some(e => /more-toxic key/.test(e)));
});

test('dose-response: the drill feedback names the slips', () => {
  const p = D.generate(M.rng(8), ctx('ddt-lake'), 'magnify'), g = p.given, st = p.steps.find(s => s.key === 'topset');
  assert.match(M.diagnoseSetup(st.cell, `${D.dec(g.c0)} ppm * ${g.f} * ${g.lv}`).why, /\^/);
  const top = p.steps.find(s => s.key === 'top');
  assert.match(M.diagnoseUnit(top.cell, { value: String(top.cell.numeric.answer), unit: 'ppb' }).why, /unit|ppm/i);
  const d = D.generate(M.rng(9), ctx('dog-bait'), 'dose'), ds = d.steps.find(s => s.key === 'setup');
  assert.equal(M.diagnoseSetup(ds.cell, `${d.given.ld50} mg/kg * ${d.given.kg} kg`).ok, true);
  assert.equal(M.diagnoseSetup(ds.cell, `${d.given.ld50} * ${d.given.kg}`).ok, false, 'units are required in the setup');
  const r = D.generate(M.rng(10), ctx('mice-insecticide'), 'read'), ld = r.steps.find(s => s.key === 'ld50');
  assert.match(M.diagnose(ld.cell, 50).why, /y-axis/);
});

test('dose-response: curves, LD50, threshold and toxicity behave', () => {
  for (const [L, h, s] of [[40, 4, 10], [100, 5, 20], [125, 3, 25], [300, 6, 50]]) {
    const pts = D.curve(L, h, s, 12);
    assert.equal(D.ld50(pts), L, `LD50 of the ${L} curve`);
    assert.equal(Calc.ld50(pts), L);
    for (let i = 1; i < pts.length; i++) assert.ok(pts[i][1] >= pts[i - 1][1]);
    assert.ok(D.threshold(pts) < L);
    assert.equal(D.responseAt(pts, L), 50);
  }
  const L = D.CHEMICALS.map(c => D.ld50(c.points));
  assert.ok(L[0] < L[1] && L[1] < L[2]);
  // At one dose, the lower-LD50 chemical kills at least as many.
  for (let d = 0; d <= 160; d += 5) assert.ok(D.responseAt(D.CHEMICALS[0].points, d) >= D.responseAt(D.CHEMICALS[2].points, d));
});

test('dose-response: biomagnification multiplies per level; bioaccumulation rises in one organism', () => {
  const lv = D.chainLevels(0.00002, 10);
  assert.equal(lv.length, 5);
  for (let i = 1; i < 5; i++) assert.ok(Math.abs(lv[i] / lv[i - 1] - 10) < 1e-9);
  assert.ok(Math.abs(lv[4] - 0.2) < 1e-12);
  let prev = -1;
  for (let a = 0; a <= 12; a++) { const c = D.accumulate(1.2, a); assert.ok(c > prev && c < 1.2); prev = c; }
  assert.equal(D.accumulate(1.2, 0), 0);
});
