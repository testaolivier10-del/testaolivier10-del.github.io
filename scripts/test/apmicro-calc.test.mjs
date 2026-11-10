/* ApMicroCalc (microeconomics/assets/mic-calc.js): the calculations the exam
   asks for (docs/apmicro-research/framework.md section 9), as recipes that
   nest and refuse a non-number: elasticities (price, midpoint, income,
   cross), total revenue, marginal and average product, every cost measure
   from a table, profit, MR, MRP, MRC, the hiring and least-cost rules, MU per
   dollar and the utility-maximizing bundle, consumer and producer surplus,
   tax revenue, subsidy cost, tariff revenue, deadweight loss, tax incidence
   and Lorenz shares. Then ApMicroGrade on those numbers (the slips readers
   report: MC not divided by the change in output, the missing one half). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['mic-calc.js', 'mic-graph.js', 'mic-grade.js']) B.load(`microeconomics/assets/${f}`);
const C = B.window.ApMicroCalc, G = B.window.ApMicroGrade;
const ev = (fn, ...args) => C.evaluate({ fn, args });
const pick = (fn, path, ...args) => C.evaluate({ fn, args, pick: path });

test('elasticities: percent changes, price (absolute), midpoint, income and cross (signed), total revenue', () => {
  assert.equal(ev('pctChange', 10, 12), 20);
  assert.equal(ev('midpointPct', 10, 12), 18.1818181818);
  assert.equal(ev('elasticity', -20, 10), -2);
  assert.equal(ev('priceElasticity', 100, 80, 10, 11), 2, 'demand read in absolute value');
  assert.equal(ev('priceElasticity', 100, 105, 10, 11), 0.5, 'inelastic below 1');
  assert.equal(ev('midpointElasticity', 100, 80, 10, 12), 1.22222222222);
  assert.equal(ev('midpointElasticity', 80, 100, 12, 10), ev('midpointElasticity', 100, 80, 10, 12), 'the same either way');
  assert.equal(ev('incomeElasticity', 50, 55, 1000, 1100), 1, 'positive: a normal good');
  assert.ok(ev('incomeElasticity', 50, 45, 1000, 1100) < 0, 'negative: an inferior good');
  assert.equal(ev('crossElasticity', 40, 30, 5, 6), -1.25, 'negative: complements');
  assert.ok(ev('crossElasticity', 40, 50, 5, 6) > 0, 'positive: substitutes');
  assert.equal(ev('totalRevenue', 8, 50), 400);
  assert.throws(() => ev('pctChange', 0, 5), /must not be 0/);
});

test('production: marginal and average product, and a product table', () => {
  assert.equal(ev('marginalProduct', 15, 25, 2, 3), 10);
  assert.equal(ev('averageProduct', 45, 3), 15);
  assert.equal(pick('productTable', 'mp.3', [0, 1, 2, 3, 4], [0, 10, 25, 33, 38]), 8);
  assert.equal(pick('productTable', 'ap.2', [0, 1, 2, 3, 4], [0, 10, 25, 33, 38]), 12.5);
  assert.throws(() => pick('productTable', 'mp.0', [0, 1], [0, 10]), /does not give a number/, 'row 0 has no marginal product');
});

test('costs from a table: TC, TFC, TVC, MC (divided by the change in output), AFC, AVC, ATC', () => {
  const q = [0, 10, 20, 30], tc = [100, 160, 200, 270];
  assert.equal(pick('costTable', 'tfc', q, tc), 100, 'TFC is the total cost at zero output');
  assert.equal(pick('costTable', 'tvc.2', q, tc), 100);
  assert.equal(pick('costTable', 'mc.1', q, tc), 6, '(160 - 100) / (10 - 0), not 60');
  assert.equal(pick('costTable', 'mc.3', q, tc), 7);
  assert.equal(pick('costTable', 'afc.2', q, tc), 5);
  assert.equal(pick('costTable', 'avc.2', q, tc), 5);
  assert.equal(pick('costTable', 'atc.3', q, tc), 9);
  assert.equal(pick('costTable', 'tfc', [10, 20], [160, 200], 100), 100, 'a table that starts above zero needs tfc');
  assert.throws(() => pick('costTable', 'tfc', [10, 20], [160, 200]), /start the table at Q = 0/);
  assert.equal(ev('totalCost', 100, 150), 250);
  assert.equal(ev('variableCost', 250, 100), 150);
  assert.equal(ev('marginalCost', 240, 300, 20, 30), 6);
  assert.equal(ev('afc', 200, 50), 4);
  assert.equal(ev('avc', 400, 50), 8);
  assert.equal(ev('atc', 600, 50), 12);
});

test('revenue and profit: MR, accounting and economic profit, (P - ATC) x Q, the MR = MC rule from a table', () => {
  assert.equal(ev('marginalRevenue', 170, 180, 5, 6), 10);
  assert.equal(ev('profit', 1200, 900), 300);
  assert.equal(ev('unitProfit', 12, 9, 100), 300);
  assert.equal(ev('accountingProfit', 90000, 60000), 30000);
  assert.equal(ev('economicProfit', 90000, 60000, 40000), -10000, 'implicit costs make it a loss');
  // A competitive firm at P = 7: produce while MR (the price) is at least MC.
  assert.equal(ev('profitMaxQ', [0, 1, 2, 3, 4], 7, [null, 4, 5, 7, 9]), 3, 'the last unit whose MR is at least its MC');
  assert.equal(ev('profitMaxQ', [0, 1, 2, 3], [10, 8, 6, 4], [null, 3, 5, 7]), 2, 'a falling MR column');
});

test('factor markets: MRP = MP x MR, MRC, the hiring rule, the wage bill, the least-cost rule', () => {
  assert.equal(ev('mrp', 8, 5), 40);
  assert.equal(ev('mrc', 400, 480, 5, 6), 80);
  assert.equal(ev('wageBill', 12, 30), 360);
  assert.equal(ev('hireCount', [100, 80, 60, 40, 20], 50), 3, 'hire while MRP is at least the wage');
  assert.equal(ev('hireCount', [100, 80, 60, 40], [30, 50, 70, 90]), 2, 'a monopsonist compares MRP with a rising MRC');
  assert.equal(ev('perDollar', 20, 10), 2);
  assert.equal(pick('leastCost', 'gap', 20, 10, 30, 15), 0, 'equal MP per dollar: the least-cost mix');
  assert.ok(pick('leastCost', 'gap', 30, 10, 30, 15) > 0, 'labor gives more per dollar: hire more labor');
});

test('consumer choice: MU per dollar and the bundle that maximizes total utility with the budget', () => {
  assert.equal(ev('muPerDollar', 30, 2), 15);
  const mx = [30, 24, 18, 12], my = [20, 16, 10, 8];
  assert.equal(pick('utilityMax', 'x', mx, 2, my, 1, 8), 3);
  assert.equal(pick('utilityMax', 'y', mx, 2, my, 1, 8), 2);
  assert.equal(pick('utilityMax', 'tu', mx, 2, my, 1, 8), 108);
});

test('areas and policy: surplus triangles, tax revenue and subsidy cost on the new quantity, DWL, incidence, trade', () => {
  assert.equal(ev('consumerSurplus', 40, 10, 6), 80);
  assert.equal(ev('producerSurplus', 40, 6, 2), 80);
  assert.equal(ev('triangle', 10, 4), 20);
  assert.equal(ev('rectangle', 10, 4), 40);
  assert.equal(ev('trapezoid', 4, 6, 10), 50);
  assert.equal(ev('taxRevenue', 2, 40), 80);
  assert.equal(ev('subsidyCost', 3, 60), 180);
  assert.equal(ev('tariffRevenue', 1, 20), 20);
  assert.equal(ev('dwl', 10, 4), 20, 'one half times the change in quantity times the wedge');
  assert.equal(ev('dwl', -10, 4), 20, 'the size, whichever way the quantity moved');
  assert.equal(pick('incidence', 'buyers', 5, 6, 4), 1);
  assert.equal(pick('incidence', 'sellers', 5, 6, 4), 1);
  assert.equal(pick('incidence', 'buyerShare', 5, 6.5, 4.5), 75, 'buyers bear 1.5 of a 2 tax');
  assert.throws(() => pick('incidence', 'buyers', 5, 4, 6), /buyers must pay more/);
  assert.equal(ev('shortage', 70, 40), 30);
  assert.equal(ev('surplusQty', 70, 40), 30);
  assert.equal(ev('imports', 70, 30), 40);
  assert.equal(ev('exports', 70, 30), 40);
  assert.equal(pick('linearMarket', 'p', 100, 2, 10, 4), 15);
  assert.equal(pick('linearMarket', 'q', 100, 2, 10, 4), 70);
});

test('inequality: Lorenz shares from incomes, one group\'s share, and the Gini coefficient', () => {
  assert.deepEqual(plain(C.lorenz([35, 5, 20, 15, 25])), [5, 20, 40, 65, 100], 'sorted poorest first, cumulative');
  assert.equal(pick('lorenz', '1', [5, 15, 20, 25, 35]), 20);
  assert.equal(ev('share', [35, 5, 20, 15, 25], 0), 5);
  assert.equal(ev('gini', [20, 40, 60, 80, 100]), 0, 'equal shares: no inequality');
  assert.equal(ev('gini', [5, 20, 40, 65, 100]), 0.28);
});

test('recipes: nest, pick, refuse unknown names and non-numbers, clean floating-point noise', () => {
  assert.equal(C.evaluate({ fn: 'mul', args: [{ fn: 'mrp', args: [8, 5] }, 2] }), 80);
  assert.equal(C.evaluate({ fn: 'add', args: [0.1, 0.2] }), 0.3, 'not 0.30000000000000004');
  assert.throws(() => C.evaluate({ fn: 'gdp', args: [1, 2, 3] }), /unknown recipe "gdp"/, 'no macroeconomics recipes');
  assert.throws(() => C.evaluate({ fn: 'add', args: [1, 'x'] }), /finite number/);
  assert.throws(() => C.evaluate({ fn: 'costTable', args: [[0, 1], [5, 9]] }), /use pick/);
  assert.throws(() => C.evaluate({ fn: 'costTable', args: [[0, 1], [5, 9]], pick: 'nope' }), /pick "nope"/);
  assert.throws(() => C.evaluate({ args: [] }), /a recipe is/);
  for (const f of ['priceElasticity', 'midpointElasticity', 'incomeElasticity', 'crossElasticity', 'totalRevenue', 'marginalProduct', 'averageProduct', 'costTable', 'marginalCost',
    'afc', 'avc', 'atc', 'unitProfit', 'marginalRevenue', 'mrp', 'mrc', 'hireCount', 'leastCost', 'muPerDollar', 'consumerSurplus', 'producerSurplus', 'taxRevenue', 'subsidyCost', 'dwl', 'incidence', 'lorenz', 'gini'])
    assert.ok(C.FNS.includes(f), f);
  assert.ok(C.isRecipe({ fn: 'add' }) && !C.isRecipe([1]));
});

test('ApMicroGrade on micro numbers: the slips readers report are named', () => {
  // Marginal cost from a table: the change in TC is not divided by the change in output (9% earned it).
  const MC = { answer: ev('marginalCost', 240, 300, 20, 30), mistakes: [{ value: 60, why: 'That is the change in total cost; divide it by the change in output, 10.' }] };
  assert.equal(G.numeric(MC, '6').correct, true);
  assert.equal(G.numeric(MC, '60').mistake.why, 'That is the change in total cost; divide it by the change in output, 10.');
  // Deadweight loss without the one half.
  const D = { answer: ev('dwl', 10, 4), mistakes: [{ from: undefined, value: 40, why: 'That is the rectangle; a triangle is one half of it.' }] };
  assert.match(G.numeric(D, '40').mistake.why, /one half/);
  // A cross-price elasticity with its sign dropped.
  assert.match(G.numeric({ answer: ev('crossElasticity', 40, 30, 5, 6) }, '1.25').notes.join(' '), /sign/);
  assert.equal(G.numeric({ answer: 400, unit: 'dollars' }, '400 dollars').correct, true);
});

function plain(x) { return JSON.parse(JSON.stringify(x)); }
