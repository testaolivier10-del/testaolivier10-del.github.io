/* Graph Studio: its model (microeconomics/assets/tools/math/graph-studio.js) and its
   validator (scripts/lib/apmicro-tool-checks/graph-studio.mjs). OWNED BY THIS TOOL
   ONLY (builder T1). The shipped data passes (the 300-seed sweep included);
   a seed gives the same problem twice; the key earns every rubric point and
   each reader-report slip loses its own point with the slip named; planted
   economics mistakes in the data are caught by the validator's own tables;
   the validator's hand arithmetic agrees with the engine. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, ownOutcome, ownPoint, ownArea, SHIFTER } from '../lib/apmicro-tool-checks/graph-studio.mjs';
import { ROOT, loadMap } from '../lib/apmicro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'graph-studio.json'), 'utf8'));
const copy = () => JSON.parse(JSON.stringify(DATA));
const { M, Graph: G, Grade, model: GS } = runtime('graph-studio');
let map; try { map = loadMap(); } catch { map = null; }
if (!map) map = { topicById: () => ({}) };
const J = x => JSON.parse(JSON.stringify(x));
const scen = id => DATA.scenarios.find(s => s.id === id);
const words = g => GS.namesFor(g, null, DATA);
const pt = (spec, r, id) => Grade.graph(spec, r).points.find(p => p.id === id);
// check() without the slow sweep: the data checks stop before it on any error.
const quick = d => check(d, map);

test('graph-studio: registers (not the stub), the page script parses, it is registered free on the Tool Studio', () => {
  assert.ok(GS && typeof GS.generate === 'function' && !GS.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'graph-studio.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'graph-studio');
  assert.ok(entry && entry.studio === true && !entry.premium);
  assert.equal(entry.topic, 'shifts-movements');
  const fx = JSON.parse(readFileSync(join(ROOT, 'scripts', 'test', 'fixtures', 'apmicro-data', 'pages.json'), 'utf8')).tools.find(t => t.slug === 'graph-studio');
  assert.deepEqual(fx, entry, 'the fixture copy of the pages.json entry matches');
});

test('graph-studio: the shipped data passes its validator, 300 seeds per context and kind', () => {
  assert.deepEqual(check(DATA, map), []);
});

test('graph-studio: a seed gives the same problem twice; every graph and kind is drilled', () => {
  for (const c of DATA.contexts) for (const t of c.types) {
    const a = GS.generate(M.rng(4242), c, t, DATA), b = GS.generate(M.rng(4242), c, t, DATA);
    assert.deepEqual(J(a), J(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
  assert.deepEqual([...new Set(DATA.contexts.map(c => c.graph))].sort(), J(GS.GRAPHS).sort());
  for (const t of GS.TYPES) assert.ok(DATA.contexts.some(c => c.types.includes(t)), `some context drills ${t}`);
});

test('graph-studio: the key earns every point; a shift slip loses it with the reader\'s note', () => {
  const sc = scen('sd-input'), spec = GS.mainSpec(sc, words('sd'), ['labels', 'shift', 'equilibrium']);
  assert.deepEqual(J(spec.key.outcome), { price: 'up', quantity: 'down' });
  const key = GS.keyResponse(spec);
  assert.ok(Grade.graph(spec, key).correct);
  assert.equal(pt(spec, { ...key, shifts: { D: -1 } }, 'shift').note, sc.slips.D, 'the wrong curve gets the authored slip');
  assert.match(pt(spec, { ...key, shifts: { S: 1 } }, 'shift').note, /right curve, but it shifts left, not right/);
  assert.equal(pt(spec, { ...key, eq: G.eq(spec, {}) }, 'equilibrium').ok, false, 'E2 left on E1');
  // A per-unit cost moves MC; a lump-sum fee moves ATC alone (the content trap).
  const cu = GS.mainSpec(scen('costs-unit'), words('costs'), ['shift']), cf = GS.mainSpec(scen('costs-fixed'), words('costs'), ['shift']);
  assert.equal(pt(cu, { shifts: { ATC: 1 } }, 'shift').note, scen('costs-unit').slips.ATC);
  assert.equal(pt(cf, { shifts: { MC: 1 } }, 'shift').note, scen('costs-fixed').slips.MC);
  // Product price up: both labor demand and the firm's MRP; supply of labor is the slip.
  const lp = GS.mainSpec(scen('labor-product'), words('labor'), ['shift']);
  assert.ok(pt(lp, { shifts: { DL: 1, MRP: 1 } }, 'shift').ok);
  assert.equal(pt(lp, { shifts: { DL: 1 } }, 'shift').ok, false, 'MRP must move too');
});

test('graph-studio: point slips are named (price from MR, market vs efficient, wage from MFC, shutdown at ATC)', () => {
  const cases = [['mono-profit', 'monopoly', 'mr=mc', /price is read straight up on the demand curve/], ['mono-profit', 'monopoly', 'allocative', /allocatively efficient/],
    ['ext-neg', 'externality', 'market', /market quantity/], ['msy-hire', 'monopsony', 'mrp=mfc', /read down on the labor supply curve/],
    ['costs-shutdown', 'costs', 'min-atc', /bottom of AVC/]];
  for (const [id, g, other, re] of cases) {
    const spec = GS.mainSpec(scen(id), words(g), ['point']), key = GS.keyResponse(spec);
    assert.ok(pt(spec, key, 'point').ok, `${id}: the key is right`);
    const r = { ...key, point: G.named(spec, {}, other) }, p = pt(spec, r, 'point');
    assert.equal(p.ok, false, `${id}: ${other} is wrong`);
    assert.match(GS.refine(spec, 'point', r, p.note), re, `${id}: ${other} is named`);
  }
  // The right quantity at the wrong height: price from demand.
  const mp = GS.mainSpec(scen('mono-profit'), words('monopoly'), ['point']), k = GS.keyResponse(mp).point;
  assert.match(GS.refine(mp, 'point', { point: [k[0], k[1] - 1.5] }, 'x'), /Right quantity, wrong height/);
});

test('graph-studio: shading slips: the subsidy rectangle to the old quantity, total revenue for profit, a cell named in Explore', () => {
  const ss = GS.shadeSpec(scen('subsidy-shift'), words('policy'), false), want = G.regionCells(ss, 'subsidy-cost');
  assert.ok(Grade.graph(ss, { shade: want }).correct);
  const p = pt(ss, { shade: ['b', 'e'] }, 'shade');
  assert.equal(p.ok, false);
  assert.match(GS.refine(ss, 'shade', { shade: ['b', 'e'] }, p.note), /stops at the old quantity/);
  const sd = GS.shadeSpec(scen('subsidy-dwl'), words('policy'), false), q = pt(sd, { shade: ['b'] }, 'shade');
  assert.match(GS.refine(sd, 'shade', { shade: ['b'] }, q.note), /only the triangle beyond the efficient quantity/);
  const pc = GS.shadeSpec(scen('pc-profit'), words('pc'), false), tr = G.regionCells(pc, 'tr');
  assert.match(pt(pc, { shade: tr }, 'shade').note, /You shaded total revenue/);
  const tax = GS.shadeSpec(scen('tax-dwl'), words('policy'), false);
  assert.deepEqual(J(GS.cellRegions(tax, 'b')).sort(), ['buyer-burden', 'cs-before', 'tax-revenue']);
});

test('graph-studio: planted economics mistakes in the data are caught', () => {
  const plant = (id, f) => { const d = copy(); f(d.scenarios.find(s => s.id === id)); return quick(d).join('\n'); };
  assert.match(plant('sd-input', s => { s.shifts[0].dir = 'right'; }), /input-price-up moves/);
  assert.match(plant('sd-comp', s => { s.shifts[0].dir = 'right'; }), /comp-price-up moves/);
  assert.match(plant('costs-fixed', s => { s.shifts[0].curve = 'MC'; }), /fixed-cost-up moves/);
  assert.match(plant('labor-product', s => { s.shifts.pop(); }), /product-price-up moves/);
  assert.match(plant('ceiling-line', s => { s.line.key.side = 'above'; }), /binding ceiling/);
  assert.match(plant('ceiling-line', s => { s.shadeWith.policy.at = 7; }), /wrong side/);
  assert.match(plant('ext-tax', s => { s.shifts[0].steps = 1; }), /closes the whole gap/);
  assert.match(plant('tax-shift', s => { s.shifts[0].steps = 1; }), /policy\.amount/);
  assert.match(plant('mono-profit', s => { s.point.key.at = 'mr=mc'; }), /named point profit-max/);
  assert.match(plant('sd-along-d', s => { s.along = 'S'; }), /movement along D/);
  assert.match(plant('sd-income', s => { s.cause = 'Incomes rise — a lot.'; }), /em or en dash/);
  assert.match(plant('sd-income', s => { s.cause = 'The price of {fruit} rises.'; }), /\{fruit\} has no word/);
  assert.match(plant('pc-loss', s => { s.check[0].why.pop(); }), /one reason per option/);
  const d = copy(); d.scenarios.find(s => s.id === 'sd-tech').shifter = 'magic';
  assert.match(quick(d).join('\n'), /not in the validator's SHIFTER table/);
  assert.ok(Object.keys(SHIFTER).length > 50);
});

test('graph-studio: the validator\'s own arithmetic agrees with the engine', () => {
  assert.deepEqual(ownOutcome({ kind: 'sd' }, { D: 1 }), { price: 'up', quantity: 'up' });
  assert.deepEqual(ownOutcome({ kind: 'sd' }, { S: -1 }), { price: 'up', quantity: 'down' });
  assert.deepEqual(ownOutcome({ kind: 'labor' }, { SL: 1 }), { wage: 'down', 'quantity of labor': 'up' });
  for (const [kind, name, extra] of [['monopoly', 'profit-max'], ['monopoly', 'allocative'], ['monopoly', 'revenue-max'], ['monopoly', 'fair-return', { natural: true }],
    ['costs', 'min-atc'], ['costs', 'min-avc'], ['pc', 'firm', { start: { D: 1 } }], ['monopsony', 'hire'], ['monopsony', 'competitive'], ['externality', 'efficient', { ext: { type: 'neg-prod', gap: 2 } }]]) {
    const spec = { kind, do: [], ...(extra || {}) }, a = ownPoint(G, spec, {}, name), b = G.named(spec, {}, name);
    assert.ok(a && b && Math.abs(a[0] - b[0]) < 0.02 && Math.abs(a[1] - b[1]) < 0.02, `${kind} ${name}: ${a} vs ${b}`);
  }
  // MC through the minimum of AVC and ATC, by hand.
  const p = G.COST.firm, mc = q => p.a - 2 * p.b * q + 3 * p.c * q * q, avc = q => p.a - p.b * q + p.c * q * q, qv = p.b / (2 * p.c);
  assert.ok(Math.abs(mc(qv) - avc(qv)) < 1e-9, 'MC = AVC at the bottom of AVC');
  const m = ownPoint(G, { kind: 'costs', do: [] }, {}, 'min-atc');
  assert.ok(Math.abs(mc(m[0]) - m[1]) < 1e-4, 'MC = ATC at the bottom of ATC');
  // A tax of 3: revenue 3 x 3.5, deadweight loss 0.5 x 1.5 x 3.
  const tax = { kind: 'sd-micro', do: ['shade'], policy: { type: 'tax', amount: 3 } };
  assert.equal(ownArea(G, tax, 'tax-revenue'), 10.5);
  assert.equal(ownArea(G, tax, 'dwl'), 2.25);
  const cells = G.regionCells(tax, 'tax-revenue'), A = G.areas(tax).cells.filter(c => cells.includes(c.id)).reduce((n, c) => n + G.polyArea(c.poly), 0);
  assert.ok(Math.abs(A - 10.5) < 1e-6);
});

test('graph-studio: Explore readouts and free specs', () => {
  const pc = { kind: 'pc', do: ['shift'] };
  assert.equal(GS.readout('pc', pc, { shifts: { D: 1 } })[0].text, 'Economic profit');
  assert.equal(GS.readout('pc', pc, { shifts: { D: -1 } })[0].text, 'Economic loss');
  assert.equal(GS.readout('pc', pc, { shifts: { D: -2, S: 2 } })[0].text, 'Below min AVC: shut down');
  for (const g of GS.GRAPHS) assert.doesNotThrow(() => G.svg(GS.freeSpec(g, DATA), {}), g);
  const ppc = GS.mainSpec(scen('ppc-efficient'), words('ppc'), ['point']);
  assert.equal(G.region(ppc, {}, GS.keyResponse(ppc).point), 'on', 'the shown point is on the curve, clear of its label');
});
