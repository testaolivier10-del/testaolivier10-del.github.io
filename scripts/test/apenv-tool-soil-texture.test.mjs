/* Soil texture: its model (environmental-science/assets/tools/math/soil-texture.js)
   and its validator (scripts/lib/apenv-tool-checks/soil-texture.mjs). OWNED BY
   THIS TOOL ONLY (builder T2). The triangle drawn exactly (the class polygons
   tile the triangle and agree with the rules); same seed same problem; keys
   recomputed with ApEnvCalc; planted mistakes caught; the shipped data
   passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, usda, TYPES } from '../lib/apenv-tool-checks/soil-texture.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model: S } = runtime('soil-texture');
const ctx = { id: 'c', topic: 'soil-properties' };

test('soil-texture: registers, the page script parses, the frame is checked', () => {
  assert.ok(S && typeof S.generate === 'function' && !S.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'soil-texture.js'), 'utf8')));
  const ok = { slug: 'soil-texture', kind: 'simulator', topic: 'soil-properties', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'soil-properties', types: ['missing'] }] };
  assert.deepEqual(check(ok, loadMap()), []);
  assert.ok(check({ ...ok, explore: { start: [40, 40, 30] } }, loadMap()).some(e => /summing to 100/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'soil-texture').topic, 'soil-properties');
});

test('soil-texture: the shipped data passes its validator (300 seeds per context and type)', () => {
  const data = join(ROOT, 'environmental-science', 'data', 'tools', 'soil-texture.json');
  assert.ok(existsSync(data));
  assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), loadMap()), []);
});

test('soil-texture: the triangle is drawn exactly (polygons tile it and match the rules)', () => {
  const area = p => { let A = 0; for (let i = 0; i < p.length; i++) { const [x1, , y1] = p[i], [x2, , y2] = p[(i + 1) % p.length]; A += x1 * y2 - x2 * y1; } return Math.abs(A) / 2; };
  let total = 0;
  for (const [id, poly] of Object.entries(S.POLYS)) {
    for (const q of poly) assert.equal(q[0] + q[1] + q[2], 100, `${id} corner ${q} sums to 100`);
    total += area(poly);
    assert.equal(S.classify(...S.centroid(id)), id, `${id}'s centre classifies as ${id}`);
  }
  assert.ok(Math.abs(total - 5000) < 1e-9, 'the twelve classes tile the whole triangle');
  // every whole-percent point: one class, the same as the restated USDA rules
  for (let c = 0; c <= 100; c++) for (let s = 0; s + c <= 100; s++) assert.equal(S.nameOf(S.classify(s, 100 - s - c, c)), usda(s, 100 - s - c, c));
  // textbook points
  assert.equal(S.classify(40, 40, 20), 'loam'); assert.equal(S.classify(92, 4, 4), 'sand'); assert.equal(S.classify(10, 30, 60), 'clay');
  assert.equal(S.classify(20, 70, 10), 'silt-loam'); assert.equal(S.classify(5, 90, 5), 'silt'); assert.equal(S.classify(60, 10, 30), 'sandy-clay-loam');
});

test('soil-texture: a seed gives the same problem; properties run the right way', () => {
  for (const t of TYPES) assert.equal(JSON.stringify(S.generate(M.rng(5), ctx, t)), JSON.stringify(S.generate(M.rng(5), ctx, t)), t);
  const sand = S.props(92, 4, 4), loam = S.props(40, 40, 20), clay = S.props(10, 30, 60);
  assert.ok(sand.permeability > loam.permeability && loam.permeability > clay.permeability, 'sand drains fastest');
  assert.ok(clay.holding > loam.holding && loam.holding > sand.holding, 'clay holds the most water');
  assert.ok(clay.porosity > sand.porosity, 'clay has more total pore space');
});

test('soil-texture: planted mistakes are named, and the validator catches a wrong key', () => {
  const p = S.generate(M.rng(12), ctx, 'missing'), g = p.givens;
  const known = ['sand', 'silt', 'clay'].filter(n => n !== g.which);
  const one = M.diagnoseSetup(p.steps[0].cell, '100 - ' + g[known[0]]);
  assert.ok(!one.ok && /both/.test(one.why));
  const perc = S.generate(M.rng(3), ctx, 'percolation');
  const perMin = M.diagnoseUnit(perc.steps[1].cell, { value: String(Calc.evaluate({ fn: 'div', args: [perc.givens.drop, perc.givens.mins] })), unit: 'cm/hr' });
  assert.ok(!perMin.ok && /per minute/.test(perMin.why));
  const bad = JSON.parse(JSON.stringify(p)); bad.steps[1].cell.numeric.answer += 1;
  const e1 = []; recheck(bad, ctx, 'planted', e1); assert.ok(e1.some(e => /ApEnvCalc gives/.test(e)));
  const c = S.generate(M.rng(4), ctx, 'classify'), cb = JSON.parse(JSON.stringify(c));
  cb.steps[0].correct = (cb.steps[0].correct + 1) % cb.steps[0].options.length;
  const e2 = []; recheck(cb, ctx, 'planted', e2); assert.ok(e2.some(e => /USDA gives/.test(e)));
});

test('soil-texture: no em dashes in user-facing text', () => {
  const texts = [];
  for (const t of TYPES) for (let s = 1; s < 40; s++) { const p = S.generate(M.rng(s), ctx, t); texts.push(p.text, ...p.solution, ...p.steps.flatMap(x => [x.label, x.hint || '', ...(x.options || []), ...(x.why || [])])); }
  texts.push(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'soil-texture.json'), 'utf8'));
  texts.push(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'soil-texture.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''));
  assert.ok(!texts.some(x => /—/.test(x)), 'an em dash in user-facing text');
});
