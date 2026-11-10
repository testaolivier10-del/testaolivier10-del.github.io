/* ApMicroGraph (microeconomics/assets/mic-graph.js) and ApMicroGrade.graph
   (mic-grade.js): every graph kind as a model (curves after their shifts,
   followers that move with their leader, exact straight-line equilibria, cost
   curves with MC through the minimums, named points, the price and wage line
   carried from the market to the firm), the areas a student shades (cells and
   named regions, graded by identity), the authored-spec checker, the grader
   that names each slip, and the SVG (role="img", its state in words, two
   panels, no label off the picture). The DOM half (drag, touch, keys) runs in
   a browser (check-console's flow once a unit is published, and the Phase 0
   screenshots); here its state machine is tested through the response shape. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['mic-graph.js', 'mic-matrix.js', 'mic-grade.js']) B.load(`microeconomics/assets/${f}`);
const M = B.window.ApMicroGraph, G = B.window.ApMicroGrade;
const plain = x => JSON.parse(JSON.stringify(x));
const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b}`);
const full = spec => G.graph(spec, M.keyResponse(spec));
const KINDS = ['ppc', 'sd', 'demand', 'sd-micro', 'costs', 'pc', 'monopoly', 'monocomp', 'labor', 'monopsony', 'externality', 'lorenz'];

test('every kind: its panels, axes and curves', () => {
  assert.deepEqual(Object.keys(M.KINDS), KINDS);
  const ids = spec => M.curves(spec, {}).map(c => c.id).join(' ');
  assert.equal(ids({ kind: 'costs' }), 'MC ATC AVC');
  assert.equal(ids({ kind: 'costs', afc: true }), 'MC ATC AVC AFC');
  assert.equal(ids({ kind: 'costs', set: 'long' }), 'LRATC');
  assert.equal(ids({ kind: 'pc' }), 'D S MC ATC AVC');
  assert.deepEqual(plain(M.panels({ kind: 'pc' }).map(p => [p.id, p.x, p.y])), [['market', 'quantity', 'price'], ['firm', 'quantity', 'priceCost']]);
  assert.equal(ids({ kind: 'monopoly' }), 'D MR MC ATC');
  assert.equal(ids({ kind: 'labor' }), 'DL SL MRP');
  assert.equal(ids({ kind: 'monopsony' }), 'SL MFC MRP');
  assert.equal(ids({ kind: 'externality', ext: { type: 'neg-prod' } }), 'D S MSC');
  assert.equal(ids({ kind: 'externality', ext: { type: 'pos-cons' } }), 'D S MSB');
  assert.equal(ids({ kind: 'lorenz' }), 'EQ LC');
  assert.equal(M.labelText('priceCost'), 'Price and cost');
  assert.equal(M.labelText('quantityLabor'), 'Quantity of labor');
  assert.equal(M.curveText({ kind: 'externality', ext: { type: 'neg-prod' } }, 'D')[0], 'D = MPB = MSB');
  assert.equal(M.curveText({ kind: 'externality', ext: { type: 'pos-cons' } }, 'S')[0], 'S = MPC = MSC');
  assert.deepEqual(plain(M.movable({ kind: 'monopoly' })), ['D', 'MC', 'ATC'], 'MR follows D');
  assert.deepEqual(plain(M.movable({ kind: 'externality', ext: { type: 'neg-prod' } })), ['D', 'S'], 'the social curve stays put');
});

test('cost curves: MC passes through the minimum of AVC and of ATC, and a lump-sum change moves ATC only', () => {
  for (const preset of [{ kind: 'costs' }, { kind: 'monopoly' }]) {
    const cs = M.curves(preset, {}), mc = M.find(cs, 'MC'), atc = M.find(cs, 'ATC');
    const a = M.lowest(atc, 0.3, 10);
    near(M.y(mc, a[0]), a[1], 0.01);
    const avc = M.find(cs, 'AVC');
    if (avc) { const v = M.lowest(avc, 0.3, 10); near(M.y(mc, v[0]), v[1], 0.01); }
  }
  assert.deepEqual(plain(M.named({ kind: 'costs' }, {}, 'min-atc')).map(v => +v.toFixed(3)), [5.6, 5], 'the firm preset: minimum ATC is 5');
  // A per-unit cost (MC and ATC up together) keeps MC through ATC's minimum; a fixed cost moves ATC alone, and MC through its new minimum.
  for (const off of [{ MC: 1, ATC: 1 }, { ATC: 1 }]) {
    const cs = M.curves({ kind: 'costs' }, off), a = M.lowest(M.find(cs, 'ATC'), 0.3, 10);
    near(M.y(M.find(cs, 'MC'), a[0]), a[1], 0.01);
  }
  const before = M.named({ kind: 'costs' }, {}, 'min-avc'), lump = M.named({ kind: 'costs' }, { ATC: 1 }, 'min-avc');
  assert.deepEqual(plain(lump), plain(before), 'a lump-sum tax leaves AVC (and MC) where they were');
  assert.ok(M.named({ kind: 'costs' }, { ATC: 1 }, 'min-atc')[0] > M.named({ kind: 'costs' }, {}, 'min-atc')[0], 'and moves the ATC minimum right');
});

test('followers: MR moves with D, MFC with labor supply, AVC with MC', () => {
  const m = M.curves({ kind: 'monopoly' }, { D: 1 });
  assert.equal(M.find(m, 'MR').at, M.find(m, 'D').at);
  near(M.y(M.find(m, 'MR'), 0), M.y(M.find(m, 'D'), 0), 1e-9);
  const s = M.curves({ kind: 'monopsony' }, { SL: -1 });
  near(M.y(M.find(s, 'MFC'), 0), M.y(M.find(s, 'SL'), 0), 1e-9);
  const c = M.curves({ kind: 'costs' }, { MC: 1 });
  assert.equal(M.find(c, 'AVC').at, 1);
});

test('named points: monopoly, natural monopoly, monopolistic competition, firm, monopsony, externality', () => {
  const r = (spec, name, off) => plain(M.named(spec, off || {}, name)).map(v => +v.toFixed(2));
  const mono = { kind: 'monopoly' };
  const pm = r(mono, 'profit-max'), mrmc = r(mono, 'mr=mc');
  assert.equal(pm[0], mrmc[0], 'the same quantity');
  assert.ok(pm[1] > mrmc[1], 'the price is read up on demand, above MR = MC');
  assert.ok(r(mono, 'allocative')[0] > pm[0], 'a monopoly produces less than the efficient quantity');
  assert.deepEqual(r(mono, 'revenue-max'), [5, 5], 'MR = 0 at the unit-elastic midpoint');
  const nat = { kind: 'monopoly', natural: true };
  assert.deepEqual(r(nat, 'profit-max'), [4, 6]);
  assert.deepEqual(r(nat, 'fair-return'), [6, 4], 'P = ATC');
  assert.deepEqual(r(nat, 'allocative'), [8, 2], 'P = MC (a loss without a subsidy)');
  const lr = { kind: 'monocomp', run: 'long' }, t = r(lr, 'profit-max');
  const A = M.y(M.find(M.curves(lr, {}), 'ATC'), t[0]);
  near(A, t[1], 0.02);
  assert.ok(t[0] < r(lr, 'min-atc')[0], 'excess capacity: the tangency lies left of minimum ATC');
  assert.deepEqual(r({ kind: 'pc' }, 'firm'), [5.6, 5], 'long run: the firm at minimum ATC');
  assert.ok(r({ kind: 'pc' }, 'firm', { D: 1 })[0] > 5.6, 'a higher price, a larger firm quantity');
  assert.deepEqual(r({ kind: 'monopsony' }, 'hire'), [3, 4], 'hire where MRP = MFC, the wage from labor supply');
  assert.deepEqual(r({ kind: 'monopsony' }, 'mrp=mfc'), [3, 7]);
  assert.deepEqual(r({ kind: 'monopsony' }, 'competitive'), [4.5, 5.5]);
  assert.deepEqual(r({ kind: 'monopsony', line: { id: 'MW', at: 5 } }, 'min-wage'), [4, 5], 'a minimum wage between the two raises hiring');
  assert.deepEqual(r({ kind: 'externality', ext: { type: 'neg-prod' } }, 'efficient'), [4, 6], 'overproduced: efficient below market');
  assert.deepEqual(r({ kind: 'externality', ext: { type: 'pos-cons' } }, 'efficient'), [6, 6], 'underproduced: efficient above market');
  assert.deepEqual(r({ kind: 'externality', ext: { type: 'neg-prod' } }, 'market'), [5, 5]);
});

test('the price line: the firm takes the market price as drawn; a task line is the student\'s', () => {
  assert.equal(M.lineAt({ kind: 'pc' }, {}), 5);
  assert.equal(M.lineAt({ kind: 'pc' }, { shifts: { D: 1 } }), 5.5);
  assert.equal(M.lineAt({ kind: 'pc', do: ['line'] }, { shifts: { D: 1 }, line: 4.75 }), 4.75);
  assert.equal(M.lineAt({ kind: 'labor' }, { shifts: { SL: -1 } }), 5.5, 'the firm takes the market wage');
  assert.equal(M.lineStart({ kind: 'pc', do: ['line'] }), 5, 'a line task starts at the old price');
  assert.equal(M.lineAt({ kind: 'monopsony', line: { id: 'MW', at: 5 } }, {}), 5);
});

test('areas: every policy, the firm, monopoly, monopsony, externality and Lorenz cells add up to the right regions', () => {
  const area = (spec, name) => M.regionCells(spec, name).reduce((s, id) => s + M.polyArea(M.areas(spec).cells.find(c => c.id === id).poly), 0);
  const tax = { kind: 'sd-micro', policy: { type: 'tax', amount: 2 } };
  near(area(tax, 'tax-revenue'), 8, 0.01); near(area(tax, 'dwl'), 1, 0.01); near(area(tax, 'cs'), 8, 0.01);
  const sub = { kind: 'sd-micro', policy: { type: 'subsidy', amount: 2 } };
  near(area(sub, 'subsidy-cost'), 12, 0.01, 'the whole rectangle: 2 x 6'); near(area(sub, 'dwl'), 1, 0.01);
  const ceil = { kind: 'sd-micro', policy: { type: 'ceiling', at: 3 } };
  near(area(ceil, 'dwl'), 4, 0.01); near(area(ceil, 'cs'), 16.5, 0.01); near(area(ceil, 'ps'), 4.5, 0.01);
  const floor = { kind: 'sd-micro', policy: { type: 'floor', at: 7 } };
  near(area(floor, 'dwl'), 4, 0.01); near(area(floor, 'cs'), 4.5, 0.01);
  const imp = { kind: 'sd-micro', policy: { type: 'world', at: 3 } };
  near(area(imp, 'cs'), 24.5, 0.01, 'consumer surplus at the world price'); near(area(imp, 'gain'), 4, 0.01);
  const exp = { kind: 'sd-micro', policy: { type: 'world', at: 7 } };
  near(area(exp, 'ps'), 24.5, 0.01);
  const tar = { kind: 'sd-micro', policy: { type: 'tariff', at: 2, amount: 1 } };
  near(area(tar, 'tariff-revenue'), 4, 0.01, '1 x imports of 4'); near(area(tar, 'dwl'), 1, 0.01);
  near(area({ kind: 'sd-micro' }, 'cs') + area({ kind: 'sd-micro' }, 'ps'), area({ kind: 'sd-micro' }, 'ts'), 1e-6);
  const pc = { kind: 'pc', start: { D: 1 } };
  assert.ok(M.areas(pc).regions.profit, 'a price above ATC: profit');
  assert.ok(M.areas({ kind: 'pc', start: { D: -1 } }).regions.loss, 'below ATC: a loss');
  assert.ok(!M.areas({ kind: 'pc' }).regions.profit && !M.areas({ kind: 'pc' }).regions.loss, 'the long run: zero economic profit');
  assert.ok(M.areas({ kind: 'monopoly' }).regions.profit && M.areas({ kind: 'monopoly' }).regions.dwl);
  assert.ok(!M.areas({ kind: 'monocomp', run: 'long' }).regions.profit, 'the long-run tangency leaves no profit box');
  near(area({ kind: 'monopsony' }, 'wage-bill'), 12, 0.01, '4 x 3');
  near(area({ kind: 'externality', ext: { type: 'neg-prod' } }, 'dwl'), 1, 0.01);
  near(area({ kind: 'externality', ext: { type: 'pos-cons' } }, 'dwl'), 1, 0.01);
  near(area({ kind: 'lorenz' }, 'gini') + area({ kind: 'lorenz' }, 'below'), 50, 0.05, 'the two Lorenz areas fill the triangle');
});

test('the checker: kinds, curves, policies, lines, points and regions an author may name', () => {
  assert.deepEqual(plain(M.check({ kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, do: ['shade'], key: { shade: 'dwl' } })), []);
  assert.match(M.check({ kind: 'is-lm', do: ['label'] })[0], /kind must be one of/);
  assert.match(M.check({ kind: 'sd-micro', policy: { type: 'ceiling', at: 7 }, do: ['label'] }).join(' '), /binding price ceiling sits below/);
  assert.match(M.check({ kind: 'sd-micro', policy: { type: 'floor', at: 3 }, do: ['label'] }).join(' '), /binding price floor sits above/);
  assert.match(M.check({ kind: 'sd-micro', policy: { type: 'tax', amount: 0.5 }, do: ['label'] }).join(' '), /whole steps, 1 to 3/);
  assert.match(M.check({ kind: 'pc', policy: { type: 'tax', amount: 1 }, do: ['label'] }).join(' '), /policy is for an sd-micro graph/);
  assert.match(M.check({ kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, do: ['shade'], key: { shade: 'subsidy-cost' } }).join(' '), /not a region of this graph/);
  assert.match(M.check({ kind: 'sd-micro', do: ['shade', 'shift'], key: { shade: 'cs', shifts: [{ curve: 'D', dir: 'right' }], because: 'more buyers' } }).join(' '), /"shade" goes with "label" only/);
  assert.match(M.check({ kind: 'monopoly', do: ['shift'], key: { shifts: [{ curve: 'MR', dir: 'right' }], because: 'a rise in demand' } }).join(' '), /moves with D/);
  assert.match(M.check({ kind: 'monopoly', do: ['point'], key: { point: { at: 'firm' } } }).join(' '), /not a named point of a monopoly graph/);
  assert.match(M.check({ kind: 'pc', do: ['shift', 'line'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'a rise in demand' } }).join(' '), /key\.line gives one of/);
  assert.match(M.check({ kind: 'externality', do: ['label'] }).join(' '), /names the externality/);
  assert.match(M.check({ kind: 'costs', do: ['equilibrium', 'shift'], key: { shifts: [{ curve: 'MC', dir: 'up' }], because: 'higher wages' } }).join(' '), /no market equilibrium/);
  assert.match(M.check({ kind: 'monocomp', run: 'medium', do: ['label'] }).join(' '), /run \(short or long\)/);
  assert.match(M.check({ kind: 'ppc', bow: 'in', linear: true, names: { x: 'A', y: 'B' }, do: ['label'] }).join(' '), /bow/);
  for (const k of KINDS) assert.deepEqual(plain(M.check({ kind: k, do: ['label'], names: { x: 'A', y: 'B' }, ...(k === 'externality' ? { ext: { type: 'neg-prod' } } : {}) })), [], k);
});

test('the key, drawn as a student would, scores full on every kind of task', () => {
  const specs = [
    { kind: 'sd-micro', do: ['shift', 'equilibrium'], key: { shifts: [{ curve: 'S', dir: 'left' }], because: 'a per-unit tax on sellers', outcome: { price: 'up', quantity: 'down' } } },
    { kind: 'sd-micro', policy: { type: 'subsidy', amount: 2 }, do: ['shade'], key: { shade: 'subsidy-cost' } },
    { kind: 'sd-micro', line: { id: 'Pc', at: 7 }, do: ['line'], key: { line: { side: 'below' } } },
    { kind: 'costs', do: ['label'], key: {} },
    { kind: 'costs', do: ['shift'], key: { shifts: [{ curve: 'ATC', dir: 'up' }], because: 'a lump-sum tax' } },
    { kind: 'costs', do: ['point'], key: { point: { at: 'min-avc' } } },
    { kind: 'pc', do: ['label', 'shift', 'line', 'point'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'a rise in demand', line: { to: 'eq' }, point: { at: 'firm' } } },
    { kind: 'pc', start: { D: -1 }, do: ['shade'], key: { shade: 'loss' } },
    { kind: 'monopoly', do: ['point'], key: { point: { at: 'profit-max' } } },
    { kind: 'monopoly', do: ['shade'], key: { shade: 'dwl' } },
    { kind: 'monopoly', natural: true, do: ['point'], key: { point: { at: 'fair-return' } } },
    { kind: 'monocomp', do: ['shift'], key: { shifts: [{ curve: 'D', dir: 'left' }], because: 'entry by new firms' } },
    { kind: 'labor', do: ['shift', 'equilibrium', 'line'], key: { shifts: [{ curve: 'DL', dir: 'right' }], because: 'a higher price of the product', outcome: { wage: 'up', 'quantity of labor': 'up' }, line: { to: 'eq' } } },
    { kind: 'monopsony', do: ['point'], key: { point: { at: 'hire' } } },
    { kind: 'externality', ext: { type: 'neg-prod' }, do: ['shift'], key: { shifts: [{ curve: 'S', dir: 'left', steps: 2 }], because: 'a per-unit tax equal to the external cost' } },
    { kind: 'externality', ext: { type: 'pos-cons' }, do: ['shade'], key: { shade: 'dwl' } },
    { kind: 'lorenz', do: ['shift'], key: { shifts: [{ curve: 'LC', dir: 'toward' }], because: 'a more progressive tax' } },
    { kind: 'ppc', bow: 'in', names: { x: 'Bread', y: 'Wool' }, do: ['point'], key: { point: { region: 'inside' } } },
  ];
  for (const s of specs) {
    assert.deepEqual(plain(M.check(s)), [], JSON.stringify(s));
    const g = full(s);
    assert.ok(g.correct, `${s.kind} ${s.do}: ${g.slip}`);
    assert.equal(g.score, 1);
  }
});

test('shading: graded by which cells, every near miss named', () => {
  const sub = { kind: 'sd-micro', policy: { type: 'subsidy', amount: 2 }, do: ['shade'], key: { shade: 'subsidy-cost' } };
  const R = M.areas(sub).regions;
  const g = r => G.graph(sub, { shade: r });
  assert.ok(g(['b', 'c', 'e', 'f', 'g']).correct);
  assert.ok(g(['g', 'f', 'e', 'c', 'b']).correct, 'order does not matter');
  assert.match(g(['b', 'e']).slip, /only part of the cost of the subsidy/, 'the 8% slip: part of the rectangle');
  assert.match(g(R.dwl).slip, /You shaded deadweight loss; the question asks for the cost of the subsidy/);
  assert.match(g(['a', 'b', 'c', 'e', 'f', 'g']).slip, /more than the cost of the subsidy/);
  assert.match(g([]).slip, /Shade the area/);
  const tax = { kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, do: ['shade'], key: { shade: 'tax-revenue' }, slips: { dwl: 'That triangle is the deadweight loss; the revenue is the rectangle between the two prices.' } };
  assert.match(G.graph(tax, { shade: ['c', 'e'] }).slip, /That triangle is the deadweight loss/, 'an authored slip for a named region');
  const mono = { kind: 'monopoly', do: ['shade'], key: { shade: 'cs' } };
  assert.match(G.graph(mono, { shade: M.areas(mono).regions.profit }).slip, /You shaded the economic profit/);
  const two = { kind: 'sd-micro', do: ['shade'], key: { shade: ['cs', 'ps'] } };
  assert.ok(G.graph(two, { shade: ['a', 'b'] }).correct, 'a key may join regions');
});

test('lines and points: the binding side, the firm\'s price taken from the market as drawn, named points', () => {
  const ceil = { kind: 'sd-micro', line: { id: 'Pc', at: 7 }, do: ['line'], key: { line: { side: 'below' } } };
  assert.ok(G.graph(ceil, { line: 3 }).correct);
  assert.match(G.graph(ceil, { line: 7 }).slip, /binding price ceiling sits below the equilibrium price/);
  const pc = { kind: 'pc', do: ['shift', 'line'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'a rise in demand', line: { to: 'eq' } } };
  assert.ok(G.graph(pc, { shifts: { D: 1 }, line: 5.5 }).correct);
  const stale = G.graph(pc, { shifts: { D: 1 }, line: 5 });
  assert.equal(stale.points.find(p => p.id === 'line').ok, false, 'the firm kept the old price');
  assert.match(stale.slip, /takes the market price/);
  const consistent = G.graph(pc, { shifts: { D: -1 }, line: 4.5 });
  assert.equal(consistent.points.find(p => p.id === 'line').ok, true, 'the line follows the student\'s own shift, as readers score it');
  assert.equal(consistent.points.find(p => p.id === 'shift').ok, false);
  const mono = { kind: 'monopoly', do: ['point'], key: { point: { at: 'profit-max' } } };
  const mrmc = M.named(mono, {}, 'mr=mc');
  assert.match(G.graph(mono, { point: mrmc }).slip, /go straight up to the demand curve/, 'the price read from MR');
  const ms = { kind: 'monopsony', do: ['point'], key: { point: { at: 'hire' } } };
  assert.match(G.graph(ms, { point: [3, 7] }).slip, /labor supply curve, not on MRP/, 'the monopsony wage read from MRP');
  const firm = { kind: 'pc', do: ['shift', 'line', 'point'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'a rise in demand', line: { to: 'eq' }, point: { at: 'firm' } } };
  const fp = M.named(firm, { D: 1 }, 'firm', 5.5);
  assert.ok(G.graph(firm, { shifts: { D: 1 }, line: 5.5, point: fp }).correct, 'the firm\'s quantity where its line meets MC');
});

test('shifts and labels: the slip named in the reader\'s terms', () => {
  const lump = { kind: 'costs', do: ['shift'], key: { shifts: [{ curve: 'ATC', dir: 'up' }], because: 'a lump-sum tax' }, slips: { MC: 'A lump-sum tax is a fixed cost: it does not change marginal cost, so MC stays put.' } };
  assert.match(G.graph(lump, { shifts: { MC: 1 } }).slip, /does not change marginal cost/);
  assert.match(G.graph(lump, { shifts: { ATC: -1 } }).slip, /Average total cost is the right curve, but it shifts up, not down/);
  const lab = { kind: 'pc', do: ['label'], key: {} };
  const right = M.keyResponse(lab).labels;
  assert.ok(G.graph(lab, { labels: right }).correct);
  assert.match(G.graph(lab, { labels: { ...right, P: 'Dd' } }).slip, /horizontal line at the market price, labeled d = MR = AR = P/, 'a downward firm demand');
  assert.match(G.graph(lab, { labels: { ...right, fy: 'quantity' } }).slip, /firm's vertical axis/);
  assert.deepEqual(plain(M.labelSlots(lab)), ['x', 'y', 'fx', 'fy', 'D', 'S', 'MC', 'ATC', 'AVC', 'P']);
});

test('SVG: role="img" with its state in words, two panels side by side, the price carried across, cells lettered', () => {
  const one = M.svg({ kind: 'monopoly', do: [] }, {});
  assert.match(one, /^<svg class="mic-graph-svg" data-panel="main" viewBox="0 0 360 300" role="img" aria-label="Monopoly graph: demand; marginal revenue; marginal cost; average total cost\./);
  const two = M.svg({ kind: 'pc', do: [] }, { shifts: { D: 1 } });
  assert.match(two, /^<div class="mic-gr-panels"><svg [^>]*data-panel="market"[\s\S]*<svg [^>]*data-panel="firm"/);
  assert.match(two, /aria-label="Firm graph: [^"]*the firm's demand curve \(d = MR = AR = P\) at 5\.5/i);
  assert.match(two, /mic-gr-guide is-carry/, 'the market price carried to the firm');
  assert.match(two, /d = MR =<tspan[^>]*>AR = P<\/tspan>/, 'the firm\'s line labeled in two lines');
  const shade = M.svg({ kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, do: [] }, { letters: true });
  assert.equal((shade.match(/class="mic-gr-cell"/g) || []).length, 6);
  assert.match(shade, /<text class="mic-gr-cletter"[^>]*>a<\/text>/);
  assert.match(shade, /P<tspan class="mic-gr-sub" dy="3">B<\/tspan>/, 'the price buyers pay on the axis');
  const on = M.svg({ kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, do: ['shade'], key: { shade: 'dwl' } }, { shade: ['c', 'e'], key: true });
  assert.equal((on.match(/mic-gr-cell is-on is-key/g) || []).length, 2, 'shaded and in the key');
  assert.match(on, /Shaded: areas c, e\./);
  // Every label inside the picture (360 wide), on every kind.
  for (const k of KINDS) {
    const s = M.svg({ kind: k, do: [], names: { x: 'A', y: 'B' }, ext: k === 'externality' ? { type: 'neg-prod' } : undefined }, { labelsShown: true });
    for (const m of s.matchAll(/<text class="mic-gr-clabel([^"]*)" x="([-\d.]+)"[^>]*text-anchor="(\w+)">([^<]*)/g)) {
      const small = / is-small/.test(m.input.slice(m.index, m.index + 60));
      const x = +m[2], w = m[4].length * (small ? 6.2 : 7.4);
      const left = m[3] === 'end' ? x - w : m[3] === 'middle' ? x - w / 2 : x, right = left + w;
      assert.ok(left >= -1 && right <= 361, `${k}: "${m[4]}" leaves the picture (${left.toFixed(0)} to ${right.toFixed(0)})`);
    }
  }
  assert.match(M.svg({ kind: 'lorenz', do: ['label'] }, {}), />\?</, 'labels hidden until chosen');
});

test('the describe line and the FRQ kit\'s auto points come from the same grader', () => {
  const spec = { kind: 'pc', do: ['label', 'shift', 'line', 'point'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'a rise in demand', line: { to: 'eq' }, point: { at: 'firm' } } };
  const g = full(spec);
  assert.deepEqual(plain(g.points.map(p => p.id)), ['labels', 'shift', 'point', 'line']);
  assert.match(M.describe(spec, { shifts: { D: 1 } }), /demand shifted right/);
});

/* ---------------- integration 2026-11-09 (docs/apmicro-reviews/integration.md) */
const svgOf = (spec, st) => M.svg(spec, st || { labelsShown: true });
const texts = svg => [...svg.matchAll(/<text class="([^"]*)" x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map(m => ({ cls: m[1], x: +m[2], y: +m[3], a: m[4], t: m[5].replace(/<[^>]+>/g, '') }));

test('a per-unit cost (MC up) lifts AVC and ATC by the same amount and leaves AFC; ATC is drawn as shifted', () => {
  const up = M.curves({ kind: 'costs', afc: true }, { MC: 1 }), base = M.curves({ kind: 'costs', afc: true }, {});
  const at = (cs, id, q) => M.y(M.find(cs, id), q);
  for (const q of [1, 2, 5.6, 8]) { near(at(up, 'ATC', q) - at(base, 'ATC', q), 1); near(at(up, 'AVC', q) - at(base, 'AVC', q), 1); near(at(up, 'AFC', q), at(base, 'AFC', q)); }
  near(M.named({ kind: 'costs' }, { MC: 1 }, 'min-atc')[0], M.named({ kind: 'costs' }, {}, 'min-atc')[0], 0.01);
  assert.equal(M.find(up, 'ATC').steps, 1);
  assert.match(svgOf({ kind: 'costs', do: ['label'] }, { labelsShown: true, shifts: { MC: 1 } }), /is-old[^>]*>ATC/);
  const lump = M.curves({ kind: 'costs' }, { ATC: 1 });   // a lump-sum cost: ATC only
  near(at(lump, 'AVC', 3), at(base, 'AVC', 3)); assert.ok(at(lump, 'ATC', 3) > at(base, 'ATC', 3) + 0.5);
});
test('the checker accepts slips.point, showLabel and pointMarks, and refuses them misused', () => {
  const pt = { kind: 'monopoly', do: ['point'], key: { point: { at: 'profit-max' } }, slips: { point: 'Read the price off demand above MR = MC, not off MC.' } };
  assert.deepEqual(plain(M.check(pt)), []);
  assert.deepEqual(plain(M.check({ ...pt, pointMarks: { x: 'Q_M', y: 'P_M' } })), []);
  assert.ok(M.check({ ...pt, pointMarks: { z: 'Q' } }).length);
  const ext = { kind: 'externality', ext: { type: 'neg-prod', gap: 2 }, do: ['label'], show: { S: -1 }, showLabel: { S: 'S + tax' } };
  assert.deepEqual(plain(M.check(ext)), []);
  assert.ok(M.check({ ...ext, showLabel: { D: 'D + x' } }).length, 'a label for a curve not shown shifted');
  assert.ok(M.check({ kind: 'monopoly', do: ['label'], start: { D: 3 } }).length === 0, 'a starting shift of 3 steps is allowed');
});
test('a tax or subsidy shift item does not draw the after-tax guides before the student shifts S', () => {
  const spec = { kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, do: ['shift'], key: { shifts: [{ curve: 'S', dir: 'left', steps: 2 }], because: 'a per-unit tax on sellers' } };
  assert.doesNotMatch(svgOf(spec, {}), />Q<tspan[^>]*>T</);
  assert.match(svgOf(spec, { key: true }), />Q<tspan[^>]*>T</);
  assert.match(svgOf({ kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, do: ['label'] }), />Q<tspan[^>]*>T</);
});
test('grab strokes take no taps when nothing can be dragged', () => {
  assert.match(svgOf({ kind: 'sd', do: ['shade'], key: { shade: 'cs' } }), /class="mic-gr-grab"[^>]*pointer-events="none"/);
  assert.doesNotMatch(svgOf({ kind: 'sd', do: ['shift'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'higher income' } }, {}), /mic-gr-grab"[^>]*data-curve[^>]*pointer-events/);
  assert.doesNotMatch(svgOf({ kind: 'sd', do: ['shift'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'higher income' } }, {}).match(/<g class="mic-gr-c" data-curve="D">[\s\S]*?<\/g>/)[0], /pointer-events/);
});
test('old curve numbers (curveN0), a follower\'s old label left out, showLabel on a shown shift', () => {
  const lr = svgOf({ kind: 'sd', do: ['label'] }, { labelsShown: true, shifts: { S: 1 }, n0: 2, n1: 3, curveN0: 1, curveN: 2 });
  assert.match(lr, /is-old[^>]*>S<tspan[^>]*>1</); assert.match(lr, /class="mic-gr-clabel "[^>]*>S<tspan[^>]*>2</);
  const mc = { kind: 'monocomp', do: ['label'] };
  assert.match(svgOf(mc, { labelsShown: true, shifts: { D: -1 } }), /is-old[^>]*>MR/);
  assert.doesNotMatch(svgOf(mc, { labelsShown: true, shifts: { D: -1 }, followerOld: false }), /is-old[^>]*>MR/);
  const tax = svgOf({ kind: 'externality', ext: { type: 'neg-prod', gap: 2 }, do: ['label'], show: { S: -1 }, showLabel: { S: 'S + tax' } });
  assert.match(tax, />S \+ tax</); assert.match(tax, /is-old[^>]*>S = MPC</); assert.doesNotMatch(tax, /S = MPC<tspan[^>]*>[12]/);
});
test('areas follow a shown shift; the externality social curve keeps its gap from a started private curve', () => {
  const sd = { kind: 'sd', do: ['shade'], key: { shade: 'cs' }, show: { D: 2 } };
  near(M.areas(sd).cells.filter(c => M.regionCells(sd, 'cs').includes(c.id)).reduce((a, c) => a + M.polyArea(c.poly), 0), 0.5 * 6 * 6 - 2, 0.05);   // D moved 2 right: P = 6, the triangle above 10 is off the graph
  const st = { kind: 'externality', ext: { type: 'neg-prod', gap: 2 }, do: ['label'], start: { S: 1 } };
  near(M.find(M.curves(st, {}), 'MSC').at, 4);
  // A partial corrective tax (1 of a 2-step external cost): the market makes 4.5, efficient 4, dwl = 1/2 x 0.5 x 1.
  const part = { kind: 'externality', ext: { type: 'neg-prod', gap: 2 }, do: ['shade'], key: { shade: 'dwl' }, show: { S: -1 } };
  const dwl = M.areas(part).cells.filter(c => M.regionCells(part, 'dwl').includes(c.id)), xs = dwl.flatMap(c => c.poly.map(p => p[0]));
  near(dwl.reduce((a, c) => a + M.polyArea(c.poly), 0), 0.25, 0.01); near(Math.min(...xs), 4); near(Math.max(...xs), 4.5);
  // No shift: the regions are the ones authors keyed before.
  for (const t of ['neg-prod', 'pos-prod', 'pos-cons', 'neg-cons']) { const s = { kind: 'externality', ext: { type: t, gap: 2 }, do: ['shade'], key: { shade: 'dwl' } }, R = M.areas(s).regions; assert.deepEqual(plain(R.dwl), ['a']); assert.deepEqual(plain(R[t.startsWith('neg') ? 'ext-cost' : 'ext-benefit']).sort(), ['a', 'b', 'c']); }
});
test('a monopoly under a regulated price has its own consumer surplus, profit or loss and deadweight loss', () => {
  const base = { kind: 'monopoly', do: ['shade'], key: { shade: 'dwl' } }, pm = M.named(base, {}, 'profit-max'), al = M.named(base, {}, 'allocative');
  const reg = { ...base, line: { id: 'Pr', at: al[1] } };
  assert.deepEqual(plain(M.check({ ...reg, key: { shade: 'cs' } })), []);
  assert.ok(M.check(reg).some(m => /"dwl" is not a region/.test(m)), 'a price at P = MC leaves no deadweight loss to shade');
  const mid = { ...base, line: { id: 'Pr', at: (pm[1] + al[1]) / 2 } }, R = M.areas(mid).regions;
  assert.ok(R.cs && R.dwl && (R.profit || R.loss));
  const qr = M.xAt(M.find(M.curves(mid, {}), 'D'), mid.line.at), dx = M.areas(mid).cells.find(c => c.id === R.dwl[0]).poly.map(p => p[0]);
  near(Math.min(...dx), qr, 0.01); near(Math.max(...dx), al[0], 0.01);
});
test('a placed point: its label avoids the curves, and pointMarks draws guides and axis marks', () => {
  const spec = { kind: 'monopsony', do: ['point'], key: { point: { at: 'hire' } }, pointLabel: 'Hire', pointMarks: { x: 'L_M', y: 'W_M' } };
  const p = M.keyResponse(spec).point, s = svgOf(spec, { point: p, labelsShown: true });
  assert.match(s, />L<tspan[^>]*>M</); assert.match(s, />W<tspan[^>]*>M</);
  const lab = texts(s).find(t => t.cls === 'mic-gr-plabel'), w = 4 * 7.4, x0 = lab.a === 'end' ? lab.x - w : lab.x;
  const box = [x0, lab.y - 11, x0 + w, lab.y + 4];
  for (const c of M.curves(spec, {})) for (let x = 0; x <= 10; x += 0.05) { const h = M.y(c, x); if (h == null) continue; const X = M.px(x), Y = M.py(h); assert.ok(!(X > box[0] && X < box[2] && Y > box[1] && Y < box[3]), `"Hire" sits on ${c.id}`); }
});
test('axis marks close in value are spread apart', () => {
  const s = svgOf({ kind: 'sd-micro', policy: { type: 'tax', amount: 1 }, do: ['label'] });
  const ys = texts(s).filter(t => t.cls.startsWith('mic-gr-mark') && t.x === M.BOX.L - 4).map(t => t.y).sort((a, b) => a - b);
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] - ys[i - 1] >= 13 - 1e-6, `marks ${ys[i - 1]} and ${ys[i]} touch`);
  const xs = texts(svgOf({ kind: 'sd-micro', policy: { type: 'tariff', at: 2, amount: 1 }, do: ['label'] })).filter(t => t.cls.startsWith('mic-gr-mark') && t.y === M.BOX.T + M.BOX.PH + 13).map(t => t.x).sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 14, `x marks ${xs[i - 1]} and ${xs[i]} touch`);
});
test('labels never overlap: every kind, shifts of one and two steps, price lines, policies', () => {
  const box = t => { const sub = /<tspan class="mic-gr-sub"[^>]*>([^<]*)/.exec(t.raw) || ['', ''], main = t.raw.replace(/<tspan[^>]*>[^<]*<\/tspan>/g, '').replace(/<[^>]+>/g, ''), w = main.length * 7.2 + sub[1].length * 5.2, x0 = t.a === 'end' ? t.x - w : t.a === 'middle' ? t.x - w / 2 : t.x; return [x0, t.y - 10, x0 + w, t.y + 2]; };
  const all = svg => [...svg.matchAll(/<text class="(mic-gr-clabel[^"]*|mic-gr-plabel[^"]*)" x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].filter(m => !/<tspan x=/.test(m[5])).map(m => ({ x: +m[2], y: +m[3], a: m[4], raw: m[5] }));
  const cases = [];
  for (const d of [-2, -1, 1, 2]) for (const [kind, c] of [['sd', 'D'], ['sd', 'S'], ['costs', 'MC'], ['costs', 'ATC'], ['pc', 'S'], ['monopoly', 'D'], ['labor', 'DL'], ['monopsony', 'MRP']]) cases.push([{ kind, do: ['label'] }, { [c]: d }]);
  for (const L of [3, 4.5, 6, 7.5]) cases.push([{ kind: 'costs', line: { id: 'P', at: L }, do: ['label'] }, {}]);
  for (const ty of ['tax', 'subsidy']) for (const a of [1, 2, 3]) cases.push([{ kind: 'sd-micro', policy: { type: ty, amount: a }, do: ['label'] }, {}]);
  let n = 0;
  for (const [spec, shifts] of cases) for (const panel of svgOf(spec, { labelsShown: true, shifts }).split('<svg').slice(1)) {
    const b = all(panel).map(box);
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) if (b[i][0] < b[j][2] - 1 && b[j][0] < b[i][2] - 1 && b[i][1] < b[j][3] - 1 && b[j][1] < b[i][3] - 1) n++;
  }
  assert.equal(n, 0);
});
test('a costs graph with a price line reads "Price and cost", marks P, and its line is a label slot; no AVC label on the line label', () => {
  const spec = { kind: 'costs', line: { id: 'P', at: 6.5 }, do: ['label'] };
  assert.equal(M.panels(spec)[0].y, 'priceCost'); assert.ok(M.labelOptions(spec, 'y').includes('cost'));
  assert.ok(M.labelSlots(spec).includes('P'));
  const s = svgOf(spec);
  assert.ok(texts(s).some(t => t.cls.startsWith('mic-gr-mark') && t.t === 'P'), 'the axis mark is P'); assert.doesNotMatch(s, /class="mic-gr-mark[^"]*"[^>]*>d = MR/);
  assert.deepEqual(plain(full({ ...spec, key: {} })).score, 1, 'every slot, the line included, has a right answer');
});
test('below the minimum of AVC the firm shuts down: q = 0, no profit or loss box at a positive quantity', () => {
  const minAvc = M.named({ kind: 'pc' }, {}, 'min-avc');
  const low = { kind: 'pc', do: ['label'], start: { D: -2, S: 2 } }, L = M.lineAt(low, { shifts: {} });
  assert.ok(L < minAvc[1]);
  assert.deepEqual(plain(M.named(low, {}, 'firm')), [0, L]);
  assert.equal(M.areas({ ...low, do: ['shade'], key: { shade: 'tr' } }).cells.length, 0);
  assert.match(svgOf(low), /q = 0/); assert.doesNotMatch(svgOf(low), />q<tspan[^>]*>F</);
});
test('a straight PPC: the "on" band is narrower on a flat line, and never too thin to land on', () => {
  const flat = { kind: 'ppc', names: { x: 'A', y: 'B' }, linear: true, ends: { x: 9, y: 3 }, do: ['point'], key: { point: { region: 'on' } } };
  const c = M.find(M.curves(flat, {}), 'PPC'), X = c.at * c.kx, Y = c.at * c.ky, n = Math.hypot(X, Y);
  const off = d => [X / 2 + d * Y / n, Y / 2 + d * X / n];   // d graph units out from the middle, perpendicular
  assert.equal(M.region(flat, {}, off(0.3)), 'outside', 'was on with the fixed 0.4 band'); assert.equal(M.region(flat, {}, off(0.15)), 'on'); assert.equal(M.region(flat, {}, off(-0.3)), 'inside');
  const square = { ...flat, ends: { x: 8, y: 8 } }, cs = M.find(M.curves(square, {}), 'PPC'), Xs = cs.at * cs.kx;
  assert.equal(M.region(square, {}, [Xs / 2 + 0.25, Xs / 2 + 0.25]), 'on', '0.35 out on a 45-degree line is still on (band 0.4)');
});
test('the demand kind: total revenue and consumer surplus at a price, the unit-elastic midpoint', () => {
  const spec = { kind: 'demand', line: { id: 'P', at: 6 }, do: ['shade'], key: { shade: 'tr' } };
  assert.deepEqual(plain(M.check(spec)), []);
  near(M.areas(spec).cells.find(c => c.id === M.regionCells(spec, 'tr')[0]) ? M.areas(spec).cells.filter(c => M.regionCells(spec, 'tr').includes(c.id)).reduce((a, c) => a + M.polyArea(c.poly), 0) : 0, 24, 0.05);
  assert.deepEqual(plain(M.named({ kind: 'demand' }, {}, 'unit-elastic')), [5, 5]);
  const s = svgOf({ kind: 'demand', line: { id: 'P', at: 6 }, do: ['label'] });
  assert.doesNotMatch(s, /data-curve="S"/); assert.doesNotMatch(s, /mic-gr-eq/); assert.match(s, />Q</);
  assert.deepEqual(plain(full({ kind: 'demand', do: ['point'], key: { point: { at: 'unit-elastic' } } })).score, 1);
});
test('slopes on sd-micro: a steep demand and flat supply put most of a tax on buyers, on the graph', () => {
  const spec = { kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, slopes: { D: 2, S: 0.5 }, do: ['shade'], key: { shade: 'buyer-burden' } };
  assert.deepEqual(plain(M.check(spec)), []);
  const A = M.areas(spec), size = r => A.cells.filter(c => M.regionCells(spec, r).includes(c.id)).reduce((a, c) => a + M.polyArea(c.poly), 0);
  assert.ok(size('buyer-burden') > 3 * size('seller-burden'), 'the steeper side bears more');
  const e = M.eq({ kind: 'sd', slopes: { D: 2, S: 0.5 } }, { D: 1 }); near(5 - 2 * (e[0] - 6), e[1]); near(5 + 0.5 * (e[0] - 5), e[1]);
  assert.ok(M.check({ kind: 'monopoly', slopes: { D: 2 }, do: ['label'] }).length, 'slopes are for sd and sd-micro');
  assert.deepEqual(plain(M.check({ kind: 'sd', do: ['label'] })), []);
});
test('a cell letter keeps clear of a shift arrow', () => {
  const s = svgOf({ kind: 'sd-micro', policy: { type: 'tax', amount: 1 }, do: ['label'] }, { labelsShown: true, letters: true });
  const arrow = /<path class="mic-gr-arrow" d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/.exec(s);
  if (arrow) for (const t of texts(s).filter(t => t.cls === 'mic-gr-cletter')) { const [x0, y0, x1, y1] = arrow.slice(1).map(Number); const tt = Math.max(0, Math.min(1, ((t.x - x0) * (x1 - x0) + (t.y - 4 - y0) * (y1 - y0)) / ((x1 - x0) ** 2 + (y1 - y0) ** 2 || 1))); assert.ok(Math.hypot(t.x - (x0 + tt * (x1 - x0)), t.y - 4 - (y0 + tt * (y1 - y0))) > 6, `letter ${t.t} on the arrow`); }
});
test('labor before MFC is taught (mfc: false): the firm wage line reads S = W, never MFC', () => {
  const s = svgOf({ kind: 'labor', mfc: false, do: ['shift'] }), t = svgOf({ kind: 'labor', do: ['shift'] });
  assert.ok(!/MFC/.test(s), 'no MFC anywhere'); assert.match(s, /(S = W)/);
  assert.match(t, /S = MFC =/);
});
test('old curve labels can be left off (oldLabels: false), the live ones unnumbered (curveN: "")', () => {
  const s = svgOf({ kind: 'costs', do: ['label'] }, { labelsShown: true, shifts: { MC: 1 }, oldLabels: false, curveN: '' });
  assert.ok(!/mic-gr-clabel is-old/.test(s)); assert.ok(!/MC<tspan class="mic-gr-sub"[^>]*>2/.test(s));
});
