/* Cycles: its model (environmental-science/assets/tools/math/cycles.js) and
   its validator (scripts/lib/apenv-tool-checks/cycles.mjs). OWNED BY THIS
   TOOL ONLY (builder T2). Same seed same problem; every key recomputed with
   ApEnvCalc; planted mistakes caught; model tests (balanced cycles stay put,
   each human change moves the reservoirs the right way, the nitrogen order);
   the shipped data passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/cycles.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model: Y } = runtime('cycles');
const ctx = (cycle, topic) => ({ id: 'c-' + cycle, topic: topic || cycle + '-cycle', cycle });

test('cycles: registers, the page script parses, the frame is checked', () => {
  assert.ok(Y && typeof Y.generate === 'function' && !Y.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'cycles.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'cycles', kind: 'simulator', topic: 'carbon-cycle', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'carbon-cycle', cycle: 'carbon', types: ['budget'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'water-cycle', cycle: 'water', types: ['budget'] }] }, map).some(e => /carbon problem/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'cycles').topic, 'carbon-cycle');
});

test('cycles: the shipped data passes its validator (300 seeds per context and type)', () => {
  const data = join(ROOT, 'environmental-science', 'data', 'tools', 'cycles.json');
  assert.ok(existsSync(data));
  assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), loadMap()), []);
});

test('cycles: a seed gives the same problem twice', () => {
  for (const t of TYPES) {
    const c = t === 'nitrogen' ? ctx('nitrogen') : ctx(t === 'residence' ? 'water' : 'carbon');
    assert.equal(JSON.stringify(Y.generate(M.rng(41), c, t)), JSON.stringify(Y.generate(M.rng(41), c, t)), t);
  }
});

test('cycles: with no change every cycle stays put; each change moves the right reservoirs', () => {
  for (const cy of Y.CYCLE_IDS) {
    const s = Y.simulate(cy, [], 100), a = s.pools[0], b = s.pools[100];
    for (const k of Object.keys(a)) assert.ok(close(a[k], b[k]), `${cy} ${k} drifts with no change`);
  }
  const up = (cy, ch, id) => { const s = Y.simulate(cy, [ch], 50); return s.pools[50][id] - s.pools[0][id]; };
  assert.ok(up('carbon', 'fuel', 'atm') > 0 && up('carbon', 'fuel', 'fossil') < 0 && up('carbon', 'fuel', 'ocean') > 0);
  assert.ok(up('carbon', 'forest', 'plants') < 0 && up('carbon', 'forest', 'atm') > 0);
  assert.ok(up('carbon', 'trees', 'atm') < 0 && up('carbon', 'trees', 'plants') > 0);
  assert.ok(up('nitrogen', 'fert', 'water') > 0 && up('nitrogen', 'fert', 'no3') > 0);
  assert.ok(up('nitrogen', 'flood', 'no3') < 0, 'waterlogging speeds denitrification');
  assert.ok(up('phosphorus', 'mine', 'soil') > 0 && up('phosphorus', 'sewage', 'ocean') > 0 && up('phosphorus', 'erode', 'ocean') > 0);
  assert.ok(up('water', 'pave', 'ground') < 0 && up('water', 'pave', 'lakes') > 0);
  assert.ok(up('water', 'pump', 'ground') < 0);
  assert.ok(up('water', 'warm', 'ice') < 0 && up('water', 'warm', 'ocean') > 0);
  // the carbon split is the recent budget's: 45% air, 25% ocean, 30% land
  const s = Y.simulate('carbon', ['fuel'], 1), E = 9.5;
  assert.ok(close(s.pools[1].atm - s.pools[0].atm, Calc.evaluate({ fn: 'percentOf', args: [45, E] })));
  assert.ok(close(s.pools[1].ocean - s.pools[0].ocean, Calc.evaluate({ fn: 'percentOf', args: [25, E] })));
});
const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

test('cycles: the nitrogen processes are numbered 1 to 5 in the exam order', () => {
  assert.deepEqual([...Y.NORDER].map(id => Y.proc('nitrogen', id).name), ['Nitrogen fixation', 'Nitrification', 'Assimilation', 'Ammonification', 'Denitrification']);
  assert.deepEqual([...Y.NORDER].map(id => Y.proc('nitrogen', id).n), [1, 2, 3, 4, 5]);
  assert.equal(Y.proc('nitrogen', 'fix').from, 'n2'); assert.equal(Y.proc('nitrogen', 'denit').to, 'n2');
  assert.ok(!Y.CYCLES.phosphorus.reservoirs.some(r => /atmos/i.test(r.name)), 'phosphorus has no atmospheric reservoir');
});

test('cycles: planted mistakes are named, and the validator catches a wrong key', () => {
  const p = Y.generate(M.rng(8), ctx('carbon'), 'budget'), g = p.givens;
  const all = M.diagnoseSetup(stepOf(p, 'setup').cell, `${g.ff} + ${g.luc} + ${g.oc} + ${g.ld}`);
  assert.ok(!all.ok && /subtract them/.test(all.why));
  const times = M.diagnoseUnit(stepOf(p, 'ppm').cell, { value: String((g.ff + g.luc - g.oc - g.ld) * 2.12), unit: 'ppm' });
  assert.ok(!times.ok && /Divide by 2.12/.test(times.why));
  const r = Y.generate(M.rng(4), ctx('water'), 'residence');
  const flip = M.diagnoseSetup(stepOf(r, 'setup').cell, `${r.givens.F} / ${r.givens.S}` + (r.givens.out === 'days' ? ' * 365' : ''));
  assert.ok(!flip.ok && /Upside down/.test(flip.why));
  const bad = JSON.parse(JSON.stringify(p)); stepOf(bad, 'gain').cell.numeric.answer += 0.5;
  const e1 = []; recheck(bad, ctx('carbon'), 'planted', e1); assert.ok(e1.some(e => /ApEnvCalc gives/.test(e)));
  const n = Y.generate(M.rng(2), ctx('nitrogen'), 'nitrogen');
  const nb = JSON.parse(JSON.stringify(n)); nb.steps[0].correct = (nb.steps[0].correct + 1) % nb.steps[0].options.length;
  const e2 = []; recheck(nb, ctx('nitrogen'), 'planted', e2); assert.ok(e2.some(e => /the order gives/.test(e)));
});
const stepOf = (p, k) => p.steps.find(s => s.key === k);

test('cycles: no em dashes in user-facing text', () => {
  const texts = [];
  for (const t of TYPES) for (const cy of Y.CYCLE_IDS) for (let s = 1; s < 30; s++) {
    if ((t === 'budget' && cy !== 'carbon') || (t === 'nitrogen' && cy !== 'nitrogen') || (t === 'residence' && !['carbon', 'water'].includes(cy))) continue;
    const p = Y.generate(M.rng(s), ctx(cy), t);
    texts.push(p.text, ...p.solution, ...p.steps.flatMap(x => [x.label, x.hint || '', ...(x.options || []), ...(x.why || [])]));
  }
  for (const cy of Y.CYCLE_IDS) for (const p of Y.CYCLES[cy].processes) texts.push(p.name, p.agent, p.what);
  texts.push(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'cycles.json'), 'utf8'));
  texts.push(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'cycles.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''));
  assert.ok(!texts.some(x => /—/.test(x)), 'an em dash in user-facing text');
});
