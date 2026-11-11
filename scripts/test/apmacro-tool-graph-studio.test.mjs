/* Graph Studio: its model (macroeconomics/assets/tools/math/graph-studio.js) and its
   validator (scripts/lib/apmacro-tool-checks/graph-studio.mjs). OWNED BY THIS TOOL
   ONLY (builder T1). The shipped data passes (the 300-seed sweep included);
   a seed gives the same problem twice; the key earns every rubric point and
   the slips lose theirs; planted economics mistakes are caught by the
   validator's own tables; the linked views map AD-AS to the Phillips curves
   and one currency market to its mirror. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheck, SHIFTER } from '../lib/apmacro-tool-checks/graph-studio.mjs';
import { ROOT, loadMap } from '../lib/apmacro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'tools', 'graph-studio.json'), 'utf8'));
const copy = () => JSON.parse(JSON.stringify(DATA));
const { M, Graph: G, Grade, model: GS } = runtime('graph-studio');
let map; try { map = loadMap(); } catch { map = { topicById: () => ({}) }; }
const ctx = id => DATA.contexts.find(c => c.id === id);
// Objects made in the vm sandbox have its prototypes: compare them as JSON.
const J = x => JSON.parse(JSON.stringify(x));

test('graph-studio: registers (not the stub), the page script parses, it is registered on the Tool Studio', () => {
  assert.ok(GS && typeof GS.generate === 'function' && !GS.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'graph-studio.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'graph-studio');
  assert.ok(entry && entry.studio === true && !entry.premium);
  assert.equal(entry.topic, 'shifts-movements');
  const fx = JSON.parse(readFileSync(join(ROOT, 'scripts', 'test', 'fixtures', 'apmacro-data', 'pages.json'), 'utf8')).tools.find(t => t.slug === 'graph-studio');
  assert.deepEqual(fx, entry, 'the fixture copy of the pages.json entry matches');
});

test('graph-studio: the shipped data passes its validator, 300 seeds per context and kind', () => {
  assert.deepEqual(check(DATA, map), []);
});

test('graph-studio: a seed gives the same problem twice; every kind and graph is drilled', () => {
  for (const c of DATA.contexts) for (const t of c.types) {
    const a = GS.generate(M.rng(4242), c, t, DATA), b = GS.generate(M.rng(4242), c, t, DATA);
    assert.deepEqual(J(a), J(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
  assert.deepEqual([...new Set(DATA.contexts.map(c => c.graph))].sort(), J(GS.GRAPHS).sort());
});

test('graph-studio: the key earns every point, and each slip loses its own point with the reader\'s note', () => {
  // Supply and demand, an input cost: supply left.
  const sc = DATA.scenarios.find(s => s.id === 'sd-input'), w = GS.namesFor('sd', null, DATA);
  const spec = GS.specOf(sc, w, ['label', 'shift', 'equilibrium']);
  assert.deepEqual(J(spec.key.outcome), { price: 'up', quantity: 'down' });
  const key = GS.keyResponse(spec);
  assert.ok(Grade.graph(spec, key).correct);
  const pt = (r, id) => Grade.graph(spec, r).points.find(p => p.id === id);
  assert.equal(pt({ ...key, shifts: { D: -1 } }, 'shift').note, sc.slips.D, 'the wrong curve gets the authored slip');
  assert.match(pt({ ...key, shifts: { S: 1 } }, 'shift').note, /right curve, but it shifts left, not right/);
  assert.match(pt({ ...key, labels: { ...key.labels, y: 'priceLevel' } }, 'labels').note, /vertical axis.*Price, not Price level/);
  assert.equal(pt({ ...key, eq: G.eq(spec, {}) }, 'equilibrium').ok, false, 'E2 left on E1');
  // Ample reserves: buying securities moves supply on the flat part, the rate stays.
  const rs = GS.specOf(DATA.scenarios.find(s => s.id === 'res-buy'), {}, ['shift', 'equilibrium']);
  assert.deepEqual(J(rs.key.outcome), { 'quantity of reserves': 'up', 'policy rate': 'same' });
  // The deficit is accepted either way (DLF right or SLF left).
  const lf = DATA.scenarios.find(s => s.id === 'lf-deficit');
  const alt = GS.specOf(lf, {}, ['shift'], lf.alt[0]);
  assert.ok(Grade.graph(alt, { shifts: { SLF: -1 } }).correct);
  // Phillips: AD up is a point up and to the left on SRPC, not a shift.
  const ph = GS.specOf(DATA.scenarios.find(s => s.id === 'ph-ad-up'), {}, ['point']);
  const p = GS.keyPoint(ph);
  assert.ok(p[0] < 5 && p[1] > 5 && Grade.graph(ph, { point: p }).correct);
  assert.equal(Grade.graph(ph, { point: [6, 4] }).correct, false);
});

test('graph-studio: the result and shift-or-movement steps', () => {
  const p = GS.generate(M.rng(7), { ...ctx('adas'), only: ['adas-oil'] }, 'shift', DATA);
  const s = p.steps.find(x => x.key === 'outcome');
  assert.equal(s.options[s.correct], 'The price level rises and real output falls.');
  assert.equal(new Set(s.options).size, 4);
  const m = GS.generate(M.rng(7), { ...ctx('move'), only: ['sd-along-d'] }, 'move', DATA);
  assert.deepEqual(J(m.steps.map(x => x.key)), ['move']);
  assert.equal(m.steps[0].options[m.steps[0].correct], 'A movement along demand');
  const m2 = GS.generate(M.rng(7), { ...ctx('move'), only: ['sd-tech'] }, 'move', DATA);
  assert.deepEqual(J(m2.steps.map(x => x.key)), ['move', 'shift']);
  assert.equal(m2.steps[0].options[m2.steps[0].correct], 'A shift of supply');
  const fx = GS.generate(M.rng(7), { ...ctx('forex'), only: ['fx-imports'] }, 'shift', DATA), o = fx.steps.find(x => x.key === 'outcome');
  assert.match(o.options[o.correct], /^The (garv|omb|esto) depreciates and the quantity of \w+s traded rises\.$/);
});

test('graph-studio: planted economics mistakes are caught', () => {
  const sc = d => d.scenarios;
  let d = copy(); sc(d).find(s => s.id === 'adas-oil').shifts = [{ curve: 'AD', dir: 'left' }];
  assert.ok(check(d, map).some(e => /adas-oil: shifts .*AD.*input-price-up shifts .*SRAS/.test(e)), 'input costs shift SRAS, not AD');
  d = copy(); sc(d).find(s => s.id === 'res-lower').shifts = [{ curve: 'RS', dir: 'right' }];
  assert.ok(check(d, map).some(e => /res-lower/.test(e)), 'ample reserves: the rate moves with the administered rates');
  d = copy(); sc(d).find(s => s.id === 'fx-imports').shifts = [{ curve: 'D', dir: 'right' }];
  assert.ok(check(d, map).some(e => /fx-imports/.test(e)), 'imports supply the home currency');
  d = copy(); sc(d).find(s => s.id === 'sd-tech').shifter = 'made-up';
  assert.ok(check(d, map).some(e => /not in the validator's table/.test(e)));
  d = copy(); sc(d).find(s => s.id === 'ppc-full').point = { region: 'inside' };
  assert.ok(check(d, map).some(e => /ppc-full: point/.test(e)));
  d = copy(); sc(d).find(s => s.id === 'sd-sub').cause = 'The price of {substitute} rises.';
  assert.ok(check(d, map).some(e => /\{substitute\}/.test(e)), 'a placeholder no name set fills');
  d = copy(); d.contexts.find(c => c.id === 'ppc').types = ['move'];
  assert.ok(check(d, map).some(e => /context ppc: no scenario fits the kind "move"/.test(e)), 'a PPC has no shift-or-movement drill');
  d = copy(); d.graphs = d.graphs.filter(g => g.id !== 'forex');
  assert.ok(check(d, map).some(e => /forex is missing/.test(e)));
  d = copy(); sc(d).find(s => s.id === 'lf-deficit').alt = [];
  assert.ok(check(d, map).some(e => /lf-deficit: accepted second keys/.test(e)));
});

test('graph-studio: recheck catches a generated problem whose result key is wrong', () => {
  const c = ctx('sd'), p = GS.generate(M.rng(11), { ...c, only: ['sd-income'] }, 'shift', DATA);
  const s = p.steps.find(x => x.key === 'outcome');
  s.correct = (s.correct + 1) % s.options.length;
  assert.ok(recheck(p, c, 'planted', DATA).some(e => /result key/.test(e)));
  assert.ok(Object.keys(SHIFTER).length > 50);
});

test('graph-studio: linked views', () => {
  const up = GS.linked('adas', { AD: 1 });
  assert.ok(up.state.point[0] < 5 && up.state.point[1] > 5, 'AD right: along SRPC to lower unemployment, higher inflation');
  assert.deepEqual(J(up.state.shifts), {});
  const shock = GS.linked('adas', { SRAS: -1 });
  assert.deepEqual(J(shock.state.shifts), { SRPC: 1 }, 'SRAS left: SRPC right');
  assert.ok(shock.state.point[0] > 5 && shock.state.point[1] > 5, 'stagflation: both higher');
  assert.deepEqual(J(GS.linked('adas', { LRAS: 1 }).state.shifts), { LRPC: -1 });
  const fx = GS.linked('forex', { D: 1 }, { currency: 'garv', other: 'nell' });
  assert.deepEqual(J(fx.spec.names), { currency: 'nell', other: 'garv' });
  assert.deepEqual(J(fx.state.shifts), { S: 1 }, 'demand for garvs is supply of nells');
  assert.ok(fx.state.eq && fx.state.eq[1] < 5, 'the mirror market gets its own E2: more nells supplied, the nell depreciates');
  assert.ok(!GS.linked('forex', {}, { currency: 'garv', other: 'nell' }).state.eq, 'no shift, no second equilibrium');
  assert.equal(GS.linked('sd', { D: 1 }), null);
});
