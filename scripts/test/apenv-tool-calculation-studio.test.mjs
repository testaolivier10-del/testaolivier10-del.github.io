/* Calculation studio: its model (environmental-science/assets/tools/math/calculation-studio.js) and
   its validator (scripts/lib/apenv-tool-checks/calculation-studio.mjs). OWNED BY THIS
   TOOL ONLY (builder T1). The frame; the shipped data passing (300 problems
   per context and type, every key recomputed with ApEnvCalc); the same seed
   giving the same problem; planted mistakes caught; every spec section 7
   calculation type covered; the reader-report slips named by the graders
   (no brackets, × 100 missing, divided by the new value, the 10% rule once
   too often, the doubling time given as the year, a unit that does not
   cancel, kW for W); and the unit chain (units cancel in pairs, a factor
   upside down is flagged, a decoy is flagged, the key reaches the goal). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/calculation-studio.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model: S } = runtime('calculation-studio');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'calculation-studio.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);
const gen = (id, seed = 4242) => { const c = ctx(id); return S.generate(M.rng(seed), c, c.types[0]); };
const stp = (p, k) => p.steps.find(s => s.key === k);

test('calculation-studio: the model registers, the page script parses, the validator checks the frame', () => {
  assert.ok(S && typeof S.generate === 'function' && !S.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'calculation-studio.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'calculation-studio', kind: 'simulator', topic: 'math-percents', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: data.contexts };
  assert.deepEqual(check({ ...ok, contexts: [] }, map).filter(e => !/no context drills|no contexts/.test(e)), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: data.contexts.filter(c => !c.types.includes('half-life')) }, map).some(e => /half-life/.test(e)), 'a missing calculation type is refused');
  assert.ok(check({ ...ok, explore: { chains: ['nowhere'] } }, map).some(e => /not in the model/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'calculation-studio');
  assert.equal(entry.topic, 'math-percents');
  assert.ok(!entry.premium, 'the flagship is free');
});

test('calculation-studio: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('calculation-studio: every calculation type of spec section 7 is drilled, each a setup then an answer with its unit', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(S.TYPES.map(t => t.value))), TYPES);
  for (const t of TYPES) {
    const c = data.contexts.find(x => x.types.includes(t));
    assert.ok(c, t);
    const p = S.generate(M.rng(11), c, t);
    assert.equal(stp(p, 'setup').kind, 'setup', t);
    assert.equal(stp(p, 'answer').kind, 'unit', t);
  }
});

test('calculation-studio: the same seed gives the same problem, for every context', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = S.generate(M.rng(9001), c, t), b = S.generate(M.rng(9001), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
  }
});

test('calculation-studio: planted mistakes are caught by the validator', () => {
  const w = 'planted';
  const p = gen('deer-count'); let errs = [];
  stp(p, 'answer').cell.numeric.answer *= -1;
  recheck(p, ctx('deer-count'), w, errs);
  assert.ok(errs.some(e => /answer key/.test(e)), errs.join('; '));
  const q = gen('grassland'); errs = [];
  stp(q, 'setup').cell.setup.answer += ' * 0.1';                   // the 10% rule once too often in the key
  recheck(q, ctx('grassland'), w, errs);
  assert.ok(errs.some(e => /setup key/.test(e)), errs.join('; '));
  const r = gen('city-double'); errs = [];
  stp(r, 'year').cell.answer = stp(r, 'answer').cell.numeric.answer;  // the doubling time as the year
  recheck(r, ctx('city-double'), w, errs);
  assert.ok(errs.some(e => /year key/.test(e)), errs.join('; '));
  const t = gen('tfr-low'); errs = [];
  const cmp = stp(t, 'compare'); cmp.options = cmp.options.slice(1).concat(cmp.options[0]);   // a wrong verdict in the key's place
  recheck(t, ctx('tfr-low'), w, errs);
  assert.ok(errs.some(e => /TFR/.test(e)), errs.join('; '));
});

test('calculation-studio: the graders name the reader-report slips', () => {
  const p = gen('deer-count'), cell = stp(p, 'setup').cell, { old, nw } = p.given;
  assert.ok(M.diagnoseSetup(cell, `(${nw} - ${old}) / ${old} * 100`).ok);
  assert.match(M.diagnoseSetup(cell, `${nw} - ${old} / ${old} * 100`).why, /brackets/);
  assert.match(M.diagnoseSetup(cell, `(${nw} - ${old}) / ${old}`).why, /100/);
  assert.match(M.diagnoseSetup(cell, `(${nw} - ${old}) / ${nw} * 100`).why, /old value/);
  const a = stp(p, 'answer').cell, key = a.numeric.answer;
  assert.ok(M.diagnoseUnit(a, { value: String(key), unit: '%' }).ok);
  assert.ok(M.diagnoseUnit(a, { value: String(key), unit: 'percent' }).ok);
  assert.match(M.diagnoseUnit(a, { value: String(key), unit: '' }).why, /unit/);
  assert.match(M.diagnoseUnit(a, { value: String(key / 100), unit: '%' }).why, /100/);
  // The 10% rule once too often, and a factor that does not cancel.
  const q = gen('grassland'), E = q.given.E, n = q.given.n;
  const tooMany = E * Math.pow(0.1, n + 1);
  assert.match(M.diagnoseUnit(stp(q, 'answer').cell, { value: String(tooMany), unit: 'kcal/m2/yr' }).why, /once too often|step/);
  const coal = gen('coal-plant'), cc = stp(coal, 'setup').cell, v = coal.given.v;
  assert.ok(M.diagnoseSetup(cc, `${v} kWh * 0.9 kg CO2/kWh * 1 tonne/1000 kg`).ok, 'units cancel to metric tons');
  assert.ok(M.diagnoseSetup(cc, `${v} kWh * 0.9 kg/kWh * 1 tonne/1000 kg`).ok, 'with or without the CO2 label');
  assert.match(M.diagnoseSetup(cc, `${v} * 0.9 / 1000`).why, /units/i);
  assert.ok(!M.diagnoseSetup(cc, `${v} kWh * 0.9 kg CO2/kWh * 1000 kg/1 tonne`).ok, 'a factor upside down is wrong');
  // "In what year": the doubling time is named, not accepted.
  const d = gen('city-double');
  assert.match(M.diagnose(stp(d, 'year').cell, stp(d, 'answer').cell.numeric.answer).why, /year/);
  // Scale words: "2.5 million" is read as 2,500,000.
  const sc = gen('energy-per-person'), sa = stp(sc, 'answer').cell;
  assert.ok(M.diagnoseUnit(sa, { value: String(sa.numeric.answer), unit: 'kWh per person' }).ok);
});

test('calculation-studio: every key equals its ApEnvCalc recipe', () => {
  const ev = (fn, args) => Calc.evaluate({ fn, args });
  const p = gen('coal-plant', 31);
  assert.equal(stp(p, 'answer').cell.numeric.answer, Calc.chain(p.given.v, 'kWh', p.given.factors).value);
  const h = gen('sr90', 32);
  assert.equal(stp(h, 'answer').cell.numeric.answer, ev('halfLifeLeft', [h.given.a, h.given.hl, h.given.t]));
  const t = gen('tfr-high', 33);
  assert.equal(stp(t, 'answer').cell.numeric.answer, ev('tfr', [t.given.asfr, 5]));
  const g = gen('town-migration', 34), G = g.given;
  assert.equal(stp(g, 'answer').cell.numeric.answer, ev('growthRate', [G.b, G.d, G.im, G.em, G.N]));
});

test('calculation-studio: the unit chain cancels units in pairs and flags a factor upside down or not needed', () => {
  const scn = S.CHAINS.plant, key = S.keyOrder(scn);
  const done = S.chainState(scn, 5000000, key);
  assert.ok(done.done);
  assert.equal(done.value, 4500);
  assert.equal(done.leftText, 'metric ton CO₂');
  const pairs = done.rows.flatMap(r => r.top.concat(r.bot)).filter(c => c.pair).map(c => c.pair);
  assert.deepEqual([...new Set(pairs)].length * 2, pairs.length, 'every cancelled unit has exactly one partner');
  // The tray shows the emission factor upside down; placed as shown it does not cancel kWh.
  const wrong = S.chainState(scn, 5000000, [{ id: 'ef', flipped: true }]);
  assert.ok(!wrong.done && wrong.wrongWay.includes('ef'));
  const decoy = S.chainState(scn, 5000000, [{ id: 'btu', flipped: false }]);
  assert.deepEqual(JSON.parse(JSON.stringify(decoy.decoys)), ['btu']);
  // Every chain's key is ApEnvCalc arithmetic and reaches its goal unit.
  for (const id of Object.keys(S.CHAINS)) {
    const c = S.CHAINS[id], st = S.chainState(c, c.start.value, S.keyOrder(c));
    assert.ok(st.done, `${id} reaches ${st.targetText}`);
    assert.ok(Math.abs(st.value - S.chainKey(c, c.start.value)) < 1e-9 * st.value, id);
  }
  // Bulbs: 20 bulbs × 60 W × 5 h/day × 365 day/yr ÷ 1,000 W/kW = 2,190 kWh/yr.
  assert.equal(S.chainKey(S.CHAINS.bulbs, 20), 2190);
});

test('calculation-studio: one number three ways', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(S.words(2500000))), { comma: '2,500,000', words: '2.5 million', sci: '2.5 × 10⁶' });
  assert.equal(S.words(4500).words, '4.5 thousand');
  assert.equal(S.sci(0.00042), '4.2 × 10⁻⁴');
});

test('calculation-studio: no em dashes in what a student reads', () => {
  for (const f of ['calculation-studio.js', 'math/calculation-studio.js']) assert.ok(!/—/.test(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', f), 'utf8')), f);
  assert.ok(!/—/.test(JSON.stringify(data)));
  for (const c of data.contexts) for (const t of c.types) { const p = S.generate(M.rng(5), c, t); assert.ok(!/—/.test(JSON.stringify(p)), c.id); }
});
