/* Energy flow: its model (environmental-science/assets/tools/math/energy-flow.js) and
   its validator (scripts/lib/apenv-tool-checks/energy-flow.mjs). OWNED BY THIS
   TOOL ONLY (builder T2). Same seed same problem; every key recomputed with
   ApEnvCalc; planted mistakes caught; model tests (pyramids agree with the
   recipes, the textbook inversions, food web responses); the shipped data
   passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/energy-flow.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model: E } = runtime('energy-flow');
const ctx = (eco, types) => ({ id: 'c-' + eco, topic: 'energy-flow', eco, types });

test('energy-flow: registers, the page script parses, the frame is checked', () => {
  assert.ok(E && typeof E.generate === 'function' && !E.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'energy-flow.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'energy-flow', kind: 'simulator', topic: 'energy-flow', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'energy-flow', eco: 'pond', types: ['tenpct'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'energy-flow', eco: 'grassland', types: ['pyramid'] }] }, map).some(e => /pond or the forest/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'energy-flow').topic, 'energy-flow');
});

test('energy-flow: the shipped data passes its validator (300 seeds per context and type)', () => {
  const data = join(ROOT, 'environmental-science', 'data', 'tools', 'energy-flow.json');
  assert.ok(existsSync(data));
  assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), loadMap()), []);
});

test('energy-flow: a seed gives the same problem twice, for every type', () => {
  for (const t of TYPES) {
    const c = ctx(t === 'pyramid' ? 'forest' : 'grassland');
    assert.deepEqual(JSON.stringify(E.generate(M.rng(77), c, t)), JSON.stringify(E.generate(M.rng(77), c, t)), t);
  }
});

test('energy-flow: the pyramid is the recipes (NPP, the 10% rule) at every level', () => {
  for (const eco of E.ECO_IDS) for (const [gpp, r, eff] of [[20000, 50, 0.1], [7000, 35, 0.15], [40000, 70, 0.05]]) {
    const P = E.pyramid(eco, gpp, r, eff);
    const npp = Calc.evaluate({ fn: 'npp', args: [gpp, Calc.evaluate({ fn: 'percentOf', args: [r, gpp] })] });
    assert.equal(P.npp, npp);
    P.levels.forEach((l, k) => {
      assert.equal(l.energy, Calc.evaluate({ fn: 'tenPercent', args: [npp, k, eff] }), `${eco} level ${k}`);
      if (k) assert.ok(l.energy < P.levels[k - 1].energy, 'energy always drops');
    });
    assert.equal(E.inverted(P, 'energy'), 0, 'the energy pyramid is never inverted');
  }
  // the textbook inversions, and upright pyramids elsewhere
  const pond = E.pyramid('pond', 20000), forest = E.pyramid('forest', 20000), grass = E.pyramid('grassland', 20000);
  assert.ok(E.inverted(pond, 'biomass') && !E.inverted(pond, 'number'));
  assert.ok(E.inverted(forest, 'number') && !E.inverted(forest, 'biomass'));
  assert.ok(!E.inverted(grass, 'biomass') && !E.inverted(grass, 'number'));
});

test('energy-flow: food web responses follow the rules', () => {
  const r = E.respond('grassland', 'grasshopper');
  assert.equal(r.frog.effect, 'gone', 'frogs eat only grasshoppers');
  assert.equal(r.grass.effect, 'up');
  assert.equal(r.mouse.effect, 'down');
  assert.equal(r.snake.effect, 'down', 'snakes lose the frogs that died out');
  const all = E.respond('grassland', 'grass');
  assert.ok(E.webOf('grassland').filter(s => s.id !== 'grass').every(s => all[s.id].effect === 'gone'), 'remove the only producer: every consumer dies out');
  const w = E.respond('forest', 'wolf');
  assert.equal(w.deer.effect, 'up'); assert.equal(w.oak.effect, 'down'); assert.equal(w.oak.direct, false, 'a cascade is indirect');
});

test('energy-flow: planted mistakes are named, and the validator catches a wrong key', () => {
  const p = E.generate(M.rng(5), ctx('pond'), 'tenpct');
  const n = p.givens.to - p.givens.from;
  const setup = p.steps.find(s => s.key === 'setup'), ans = p.steps.find(s => s.key === 'ans');
  const once = M.diagnoseSetup(setup.cell, p.givens.e0 + ' * 0.1'.repeat(n + 1));
  assert.ok(!once.ok && /once too often/.test(once.why));
  const u = M.diagnoseUnit(ans.cell, { value: String(Calc.evaluate({ fn: 'tenPercent', args: [p.givens.e0, n + 1] })), unit: 'kcal/m^2/yr' });
  assert.ok(!u.ok && /too often/.test(u.why));
  assert.ok(!M.diagnoseUnit(ans.cell, { value: String(ans.cell.numeric.answer), unit: 'kcal' }).ok, 'the unit is graded');
  const eff = E.generate(M.rng(9), ctx('grassland'), 'efficiency');
  const flip = M.diagnoseSetup(eff.steps[0].cell, eff.givens.ea + ' / ' + eff.givens.eb + ' * 100');
  assert.ok(!flip.ok && /Upside down/.test(flip.why));
  const npp = E.generate(M.rng(3), ctx('forest'), 'npp');
  const bad = JSON.parse(JSON.stringify(npp)); bad.steps.find(s => s.key === 'ans').cell.numeric.answer += 1;
  const errs = []; recheck(bad, ctx('forest'), 'planted', errs);
  assert.ok(errs.some(e => /ApEnvCalc gives/.test(e)));
  const web = E.generate(M.rng(11), ctx('pond'), 'web');
  const wb = JSON.parse(JSON.stringify(web)); const st = wb.steps[0]; st.correct = (st.correct + 1) % 4;
  const e2 = []; recheck(wb, ctx('pond'), 'planted', e2);
  assert.ok(e2.some(e => /expected/.test(e)));
});

test('energy-flow: no em dashes in user-facing text', () => {
  const texts = [];
  for (const t of TYPES) for (const eco of ['pond', 'forest', 'grassland']) for (let s = 1; s < 40; s++) {
    if (t === 'pyramid' && eco === 'grassland') continue;
    const p = E.generate(M.rng(s), ctx(eco), t);
    texts.push(p.text, ...p.solution, ...p.steps.flatMap(x => [x.label, x.hint || '', ...(x.options || []), ...(x.why || [])]),
      ...p.steps.flatMap(x => x.cell && x.cell.setup ? (x.cell.setup.mistakes || []).map(m => m.why) : x.cell && x.cell.numeric ? (x.cell.numeric.mistakes || []).map(m => m.why) : []));
  }
  texts.push(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'energy-flow.json'), 'utf8'));
  const page = readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'energy-flow.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  texts.push(page);
  assert.ok(!texts.some(x => /—/.test(x)), 'an em dash in user-facing text');
});
