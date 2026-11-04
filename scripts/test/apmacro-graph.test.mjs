/* ApMacroGraph (macroeconomics/assets/mac-graph.js) and ApMacroGrade.graph
   (mac-grade.js): the nine graphs as a model (curves after their shifts,
   exact equilibria, the outcome against the start), the authored-spec
   checker the content check runs, the grader that names the slip, and the
   SVG (role="img", its state in words, labels, the old curve kept faded, the
   key drawn on request). The DOM half (drag, touch, keys) is exercised in a
   browser by check-console's macroeconomics flow once a unit is published;
   here its pure state machine is tested through the response shape. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['mac-graph.js', 'mac-grade.js']) B.load(`macroeconomics/assets/${f}`);
const M = B.window.ApMacroGraph, G = B.window.ApMacroGrade;
const plain = x => JSON.parse(JSON.stringify(x));

const cost = { kind: 'adas', do: ['shift', 'equilibrium'], key: { shifts: [{ curve: 'SRAS', dir: 'left' }], because: 'a rise in input costs', outcome: { 'price level': 'up', output: 'down' } } };

test('the nine graphs, each with its axes and curves', () => {
  assert.deepEqual(Object.keys(M.KINDS), ['ppc', 'sd', 'adas', 'money', 'reserves', 'lf', 'phillips', 'forex']);
  assert.equal(M.KINDS.adas.curves.map(c => c.id).join(' '), 'AD SRAS LRAS');
  assert.equal(M.labelText(M.KINDS.money.y), 'Nominal interest rate');
  assert.equal(M.labelText(M.KINDS.lf.y), 'Real interest rate');
  assert.equal(M.labelText('fxPrice', { currency: 'euro', other: 'dollar' }), 'Price of the euro (dollars per euro)', 'the other currency per unit of this one');
  assert.equal(M.labelText('fxPriceFlipped', { currency: 'euro', other: 'dollar' }), 'Price of the euro (euros per dollar)');
  assert.equal(M.labelText('goodX', { x: 'Wheat' }), 'Wheat');
});

test('geometry: equilibria are exact, shifts move them, the outcome compares new with old', () => {
  assert.deepEqual(plain(M.eq(cost, {})), [5, 5]);
  assert.deepEqual(plain(M.eq(cost, { SRAS: -1 })), [4.5, 5.5]);
  assert.deepEqual(plain(M.outcome(cost, { SRAS: -1 })), { output: 'down', 'price level': 'up' });
  assert.deepEqual(plain(M.outcome(cost, { AD: 1 })), { output: 'up', 'price level': 'up' });
  assert.deepEqual(plain(M.outcome(cost, { AD: 1, SRAS: 1 })), { output: 'up', 'price level': 'same' }, 'equal shifts: an indeterminate axis shows as same');
  // Money market: vertical MS. A rise in MS lowers the nominal rate.
  const money = { kind: 'money', do: [] };
  assert.deepEqual(plain(M.outcome(money, { MS: 1 })), { 'quantity of money': 'up', 'nominal interest rate': 'down' });
  // Reserve market (ample): demand flat where vertical supply crosses it; raising the administered rate shifts the flat part up.
  const res = { kind: 'reserves', do: [] };
  assert.deepEqual(plain(M.eq(res, {})), [7, 3]);
  assert.deepEqual(plain(M.outcome(res, { RD: 1 })), { 'quantity of reserves': 'same', 'policy rate': 'up' });
  assert.deepEqual(plain(M.outcome(res, { RS: 1 })), { 'quantity of reserves': 'up', 'policy rate': 'same' }, 'with ample reserves, more reserves leave the rate alone');
  // Phillips: SRPC crosses LRPC at the natural rate.
  assert.deepEqual(plain(M.outcome({ kind: 'phillips', do: [] }, { SRPC: 1 })), { 'unemployment rate': 'same', 'inflation rate': 'up' });
  assert.equal(M.eq({ kind: 'ppc', do: [] }, {}), null, 'a PPC has no equilibrium');
  assert.equal(M.region({ kind: 'ppc', do: [] }, {}, [2, 2]), 'inside');
  assert.equal(M.region({ kind: 'ppc', do: [] }, {}, [7 * 0.6, 7 * 0.8]), 'on');
  assert.equal(M.region({ kind: 'ppc', do: [] }, { PPC: 1 }, [7 * 0.6, 7 * 0.8]), 'inside', 'growth puts the old point inside');
});

test('the checker: known kinds and curves, a direction the curve can move, an outcome the key gives, a cause', () => {
  assert.deepEqual(plain(M.check(cost)), []);
  assert.match(M.check({ ...cost, kind: 'is-lm' })[0], /graph.kind must be one of/);
  assert.ok(M.check({ ...cost, key: { ...cost.key, shifts: [{ curve: 'MS', dir: 'left' }] } }).some(e => /unknown curve "MS"/.test(e)));
  assert.ok(M.check({ ...cost, key: { ...cost.key, shifts: [{ curve: 'SRAS', dir: 'up' }] } }).some(e => /right or left/.test(e)));
  assert.ok(M.check({ ...cost, key: { ...cost.key, outcome: { 'price level': 'down', output: 'down' } } }).some(e => /"down" but the key shifts give "up"/.test(e)), 'a stated outcome the shifts contradict');
  assert.ok(M.check({ ...cost, key: { ...cost.key, because: '' } }).some(e => /because/.test(e)));
  assert.ok(M.check({ ...cost, do: ['equilibrium'] }).some(e => /needs "shift"/.test(e)));
  assert.ok(M.check({ kind: 'forex', do: ['label'], key: {} }).some(e => /currencies/.test(e)));
  assert.ok(M.check({ kind: 'ppc', do: ['point'], names: { x: 'A', y: 'B' }, key: { point: { region: 'beside' } } }).some(e => /inside, on or outside/.test(e)));
  assert.ok(M.check({ ...cost, start: { SRAS: 3 } }).some(e => /from -2 to 2/.test(e)));
  assert.ok(M.check({ ...cost, movable: ['AD'] }).some(e => /leaves out SRAS/.test(e)));
});

test('grading: one point per task, the slip named in the reader\'s terms', () => {
  const right = G.graph(cost, { shifts: { SRAS: -1 }, eq: [4.5, 5.5] });
  assert.equal(right.correct, true); assert.deepEqual(plain(right.points.map(p => p.id)), ['shift', 'equilibrium', 'outcome']);
  const wrongCurve = G.graph(cost, { shifts: { AD: -1 }, eq: [4.5, 4.5] });
  assert.equal(wrongCurve.slip, 'You shifted aggregate demand; a rise in input costs shifts short-run aggregate supply.');
  assert.equal(wrongCurve.points.find(p => p.id === 'equilibrium').ok, true, 'E2 where the drawn curves cross: consistent, as readers score it');
  assert.equal(wrongCurve.points.find(p => p.id === 'outcome').ok, false);
  const backwards = G.graph(cost, { shifts: { SRAS: 1 }, eq: [5.5, 4.5] });
  assert.match(backwards.slip, /right curve, but it shifts left, not right/);
  const extra = G.graph(cost, { shifts: { SRAS: -1, AD: 1 }, eq: [5, 6] });
  assert.match(extra.slip, /aggregate demand stays put/);
  const offEq = G.graph(cost, { shifts: { SRAS: -1 }, eq: [5, 5] });
  assert.equal(offEq.slip, 'Put E2 where the curves you drew cross now.');
  assert.equal(G.graph(cost, { shifts: {}, eq: [5, 5] }).valid, false);
  // An authored slip wins over the generic line.
  const withSlip = { ...cost, slips: { AD: 'Input costs change what firms supply at each price level: SRAS, not AD.' } };
  assert.equal(G.graph(withSlip, { shifts: { AD: -1 }, eq: [4.5, 4.5] }).slip, withSlip.slips.AD);
  // Two curves in the key: both must move.
  const both = { kind: 'adas', do: ['shift'], key: { shifts: [{ curve: 'AD', dir: 'right' }, { curve: 'SRAS', dir: 'left' }], because: 'a war that raises spending and costs' } };
  assert.match(G.graph(both, { shifts: { AD: 1 } }).slip, /Short-run aggregate supply shifts too/);
  assert.equal(G.graph(both, { shifts: { AD: 1, SRAS: -1 } }).correct, true);
});

test('labels: every axis and curve, the flipped currency axis named', () => {
  const fx = { kind: 'forex', do: ['label'], names: { currency: 'euro', other: 'dollar' }, key: {} };
  const all = { x: 'fxQuantity', y: 'fxPrice', D: 'D', S: 'S' };
  assert.equal(G.graph(fx, { labels: all }).correct, true);
  assert.match(G.graph(fx, { labels: { ...all, y: 'fxPriceFlipped' } }).slip, /units of the other currency per unit of this one: Price of the euro \(dollars per euro\)/);
  const ad = { kind: 'adas', do: ['label'], key: {} };
  assert.match(G.graph(ad, { labels: { x: 'realGdp', y: 'price', AD: 'AD', SRAS: 'SRAS', LRAS: 'LRAS' } }).slip, /vertical axis .* is Price level, not Price/);
  assert.match(G.graph(ad, { labels: { x: 'realGdp', y: 'priceLevel', AD: 'SRAS', SRAS: 'AD', LRAS: 'LRAS' } }).slip, /wrong label/);
  assert.deepEqual(plain(M.labelOptions(ad, 'y')), ['priceLevel', 'price', 'inflation', 'nominalRate'], 'the confusions readers report are the choices');
});

test('points: inside, on or outside a PPC; on a curve; up or down from the equilibrium', () => {
  const ppc = { kind: 'ppc', do: ['point'], names: { x: 'Wheat', y: 'Cloth' }, key: { point: { region: 'inside' } } };
  assert.equal(G.graph(ppc, { point: [2, 2] }).correct, true);
  assert.match(G.graph(ppc, { point: [8, 8] }).slip, /inside the curve/);
  const along = { kind: 'adas', do: ['point'], key: { point: { on: 'AD', x: 'down', y: 'up' } } };
  assert.equal(G.graph(along, { point: [4, 6] }).correct, true);
  assert.match(G.graph(along, { point: [6, 4] }).slip, /to the left and higher/);
  assert.match(G.graph(along, { point: [4, 8] }).slip, /belongs on aggregate demand/);
});

test('SVG: a named picture of its own state, labels hidden until chosen, the old curve kept, the key on request', () => {
  const s0 = M.svg(cost, {});
  assert.match(s0, /^<svg class="mac-graph-svg" viewBox="0 0 320 300" role="img" aria-label="Aggregate demand and aggregate supply graph: /);
  assert.match(s0, />Real GDP</); assert.match(s0, />Price level</);
  const s1 = M.svg(cost, { shifts: { SRAS: -1 }, eq: [4.5, 5.5] });
  assert.match(s1, /short-run aggregate supply shifted left/);
  assert.match(s1, /At the new crossing the price level is higher and the output is lower/);
  assert.match(s1, /class="mac-gr-curve is-old"/, 'the starting curve stays, faded');
  const sub = n => `<tspan class="mac-gr-sub" dy="3">${n}</tspan>`;
  assert.ok(s1.includes(`>E${sub(2)}</text>`) && s1.includes(`>E${sub(1)}</text>`), 'E1 and E2 with subscripts');
  assert.ok(s1.includes(`>PL${sub(2)}</text>`) && s1.includes(`>Y${sub(1)}</text>`), 'value marks at both points');
  const key = M.svg(cost, { key: true });
  assert.match(key, /class="mac-gr-curve is-key"/);
  assert.ok(key.includes(`>SRAS${sub(2)}</text>`) && !/key<\/tspan>/.test(key), 'the key curve is SRAS2, not "SRASkey"');
  // A long-run story: E3, PL3 and Y3; the start's output mark is YF and, shared with E3, printed once.
  const lr = { kind: 'adas', do: [] }, s3 = M.svg(lr, { shifts: { AD: 1, SRAS: -1 }, eq: M.eq(lr, { AD: 1, SRAS: -1 }), n1: 3, marks0: { x: 'F' } });
  assert.ok(s3.includes(`>E${sub(3)}</text>`) && s3.includes(`>PL${sub(3)}</text>`));
  assert.equal(s3.split(`>Y${sub('F')}</text>`).length - 1, 1, 'YF once, for both points');
  assert.ok(!s3.includes(`>Y${sub(3)}</text>`), 'no Y3 on top of YF');
  // A shift smaller than a step (an animation frame): the old and new labels sit apart.
  const pos = svg => [...svg.matchAll(/<text class="mac-gr-clabel[^"]*" x="([\d.]+)" y="([\d.]+)"[^>]*>SRAS/g)].map(m => [+m[1], +m[2]]);
  const [a, b] = pos(M.svg({ kind: 'adas', do: [] }, { shifts: { SRAS: -0.3 } }));
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) > 30, `SRAS1 and SRAS2 apart (${JSON.stringify([a, b])})`);
  assert.equal(M.plural('yen'), 'yen'); assert.equal(M.plural('arl'), 'arls');
  assert.equal(M.labelText('fxPrice', { currency: 'dollar', other: 'yen' }), 'Price of the dollar (yen per dollar)');
  assert.equal(typeof M.px, 'function'); assert.equal(M.px(0), M.BOX.L); assert.equal(M.py(0), M.BOX.T + M.BOX.PH);
  const lab = M.svg({ kind: 'adas', do: ['label'], key: {} }, {});
  assert.equal((lab.match(/>\?</g) || []).length, 5, 'two axes and three curves ask to be labeled');
  for (const k of Object.keys(M.KINDS)) assert.doesNotThrow(() => M.svg({ kind: k, do: [], names: { x: 'A', y: 'B', currency: 'euro', other: 'dollar' } }, {}), k);
  assert.throws(() => M.svg({ kind: 'nope' }, {}), /unknown graph kind/);
});

test('the FRQ kit ticks auto rubric points from the same grader (a long question\'s graph part)', () => {
  const part = { kind: 'adas', do: ['label', 'shift', 'equilibrium'], key: { shifts: [{ curve: 'AD', dir: 'right' }], because: 'a rise in consumer confidence', outcome: { 'price level': 'up', output: 'up' } } };
  const r = G.graph(part, { shifts: { AD: 1 }, eq: [5.5, 5.5], labels: { x: 'realGdp', y: 'priceLevel', AD: 'AD', SRAS: 'SRAS', LRAS: 'LRAS' } });
  assert.deepEqual(plain(r.points.map(p => [p.id, p.ok])), [['labels', true], ['shift', true], ['equilibrium', true], ['outcome', true]]);
});

test('a straight-line PPC (linear, ends): constant cost, inside/on/outside, shifts out, intercepts drawn', () => {
  const sp = { kind: 'ppc', linear: true, ends: { x: 36, y: 12 }, names: { x: 'Corn', y: 'Fabric' }, do: ['label', 'point'], pointLabel: 'U', key: { point: { region: 'inside' } } };
  assert.deepEqual(plain(M.check(sp)), []);
  const c = M.curves(sp, {})[0];
  assert.equal(c.shape, 'ppcline');
  assert.ok(Math.abs(M.y(c, 0) - 7 / 3) < 1e-9 && Math.abs(M.y(c, 7)) < 1e-9, 'a 3:1 line from (0, 7/3) to (7, 0)');
  assert.ok(Math.abs((M.y(c, 1) - M.y(c, 2)) - (M.y(c, 5) - M.y(c, 6))) < 1e-9, 'the same cost everywhere');
  assert.equal(M.region(sp, {}, [1, 0.5]), 'inside');
  assert.equal(M.region(sp, {}, [3.5, 7 / 6]), 'on');
  assert.equal(M.region(sp, {}, [6, 2]), 'outside');
  assert.equal(G.graph(sp, M.keyResponse(sp)).correct, true);
  assert.equal(G.graph(sp, { ...M.keyResponse(sp), point: [6, 2] }).correct, false);
  const svg = M.svg(sp, { labelsShown: true });
  assert.match(svg, />36<\/text>/); assert.match(svg, />12<\/text>/);
  const grow = { kind: 'ppc', linear: true, names: { x: 'A', y: 'B' }, do: ['shift'], key: { shifts: [{ curve: 'PPC', dir: 'out' }], because: 'more workers arrive' } };
  assert.deepEqual(plain(M.check(grow)), []);
  assert.equal(G.graph(grow, { shifts: { PPC: 1 } }).correct, true);
  assert.match(G.graph(grow, { shifts: { PPC: -1 } }).slip, /shifts out, not in/);
  assert.ok(M.check({ ...grow, kind: 'sd', linear: true }).some(m => /linear/.test(m)), 'linear is for a PPC');
  assert.ok(M.check({ ...grow, ends: { x: 3, y: 1 }, linear: undefined }).some(m => /ends/.test(m)), 'ends needs linear');
  // A bowed PPC is unchanged.
  assert.equal(M.curves({ kind: 'ppc', names: { x: 'A', y: 'B' } }, {})[0].shape, 'ppc');
});

test('keyResponse: the key drawn as a student would grades full for every kind of task', () => {
  const specs = [cost,
    { kind: 'sd', do: ['label', 'shift', 'equilibrium'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'a rise in income', outcome: { price: 'up', quantity: 'up' } } },
    { kind: 'phillips', do: ['point'], pointLabel: 'B', key: { point: { on: 'SRPC', x: 'down', y: 'up' } } },
    { kind: 'ppc', names: { x: 'A', y: 'B' }, do: ['point'], key: { point: { region: 'outside' } } }];
  for (const s of specs) { assert.deepEqual(plain(M.check(s)), [], JSON.stringify(s)); assert.equal(G.graph(s, M.keyResponse(s)).correct, true, s.kind); }
});

test('two shifts: an axis that depends on the sizes is indeterminate, never keyed and never graded as same', async () => {
  const both = { kind: 'sd', do: ['shift', 'equilibrium'], key: { shifts: [{ curve: 'D', dir: 'right' }, { curve: 'S', dir: 'right' }], because: 'higher incomes and cheaper inputs', outcome: { quantity: 'up' } } };
  assert.deepEqual(plain(M.indeterminate(both, both.key.shifts)), ['price']);
  assert.deepEqual(plain(M.indeterminate(both, { D: 2, S: 1 })), ['price'], 'a response is read by its signs');
  assert.deepEqual(plain(M.indeterminate(cost, cost.key.shifts)), [], 'one shift is never indeterminate');
  assert.deepEqual(plain(M.check(both)), []);
  assert.ok(M.check({ ...both, key: { ...both.key, outcome: { quantity: 'up', price: 'same' } } }).some(m => /depends on their sizes/.test(m)), 'a key may not claim the indeterminate axis');
  // Unequal sizes keep every point: the price is not graded.
  const r = G.graph(both, { shifts: { D: 2, S: 1 }, eq: M.eq(both, { D: 2, S: 1 }) });
  assert.equal(r.correct, true, r.slip);
  // A long-run story pins output with key.hold: unequal sizes then miss it.
  const lr = { kind: 'adas', do: ['shift', 'equilibrium'], key: { shifts: [{ curve: 'AD', dir: 'right' }, { curve: 'SRAS', dir: 'left' }], because: 'an export boom, then rising wages', outcome: { 'price level': 'up', output: 'same' }, hold: ['output'] } };
  assert.deepEqual(plain(M.check(lr)), []);
  assert.ok(M.check({ ...lr, key: { ...lr.key, hold: undefined } }).some(m => /key\.hold/.test(m)), 'output "same" without hold is refused');
  assert.equal(G.graph(lr, M.keyResponse(lr)).correct, true);
  const off = { AD: 1, SRAS: -2 }, bad = G.graph(lr, { shifts: off, eq: M.eq(lr, off) });
  assert.equal(bad.points.find(p => p.id === 'outcome').ok, false, 'the long run ends at full employment');
  assert.ok(M.check({ ...lr, key: { ...lr.key, hold: ['price level'] } }).some(m => /key\.hold lists/.test(m)));
});

test('frq-forex-short A and every key.alt: an alt with two shifts of different sizes keeps the outcome point', async () => {
  const fs = await import('node:fs');
  const f = JSON.parse(fs.readFileSync(new URL('../../macroeconomics/data/frq/frq-forex-short.json', import.meta.url), 'utf8'));
  const g = f.parts.find(p => p.label === 'A').graph;
  for (const sh of [{ D: 1 }, { S: -1 }, { D: 1, S: -1 }, { D: 2, S: -1 }, { D: 1, S: -2 }]) {
    const r = G.graph(g, { shifts: sh, eq: M.eq(g, sh), labels: M.keyResponse(g).labels });
    assert.equal(r.correct, true, JSON.stringify(sh) + ': ' + r.slip);
  }
  // Every bank and FRQ graph with key.alt: each alt drawn at unequal sizes (where it has two curves) grades right.
  const path = await import('node:path');
  const root = new URL('../../macroeconomics/data/', import.meta.url).pathname, seen = [];
  const walk = d => fs.readdirSync(d).flatMap(n => { const p = path.join(d, n); return fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []; });
  const visit = (o, w) => { if (o && typeof o === 'object') { if (o.kind && o.key && o.key.alt) seen.push([w, o]); for (const k in o) visit(o[k], w); } };
  for (const p of walk(root)) visit(JSON.parse(fs.readFileSync(p, 'utf8')), path.basename(p));
  assert.ok(seen.length >= 10);
  for (const [w, s] of seen) for (const set of [s.key.shifts, ...s.key.alt]) {
    const sizes = set.length > 1 ? [1, 2] : [1];
    for (const big of sizes) {
      const sh = {}; set.forEach((x, i) => { sh[x.curve] = M.dirSign(M.find(M.curves(s, {}), x.curve).shape, x.dir) * (i === 0 ? big : 1); });
      const resp = { ...M.keyResponse(s), shifts: sh }; if ((s.do || []).includes('equilibrium')) resp.eq = M.eq(s, sh);
      const r = G.graph(s, resp);
      assert.equal(r.correct, true, `${w} ${JSON.stringify(sh)}: ${r.slip}`);
    }
  }
});
