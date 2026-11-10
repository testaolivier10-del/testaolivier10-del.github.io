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
const KINDS = ['ppc', 'sd', 'sd-micro', 'costs', 'pc', 'monopoly', 'monocomp', 'labor', 'monopsony', 'externality', 'lorenz'];

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
