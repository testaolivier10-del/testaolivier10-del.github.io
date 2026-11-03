/* ApMacroCalc (macroeconomics/assets/mac-calc.js): the calculations the exam
   asks for (docs/apmacro-research/framework.md section 9), as recipes that
   nest and refuse a non-number: GDP by expenditure, CPI, inflation, the
   deflator and real values, unemployment and participation rates, the
   natural and cyclical rates, real interest rates, the spending, tax,
   balanced-budget and money multipliers, reserves, closing a gap, velocity,
   the budget balance, opportunity cost and exchange rates. Then ApMacroGrade
   on those numbers (a percent, the sign slip). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['mac-calc.js', 'mac-graph.js', 'mac-grade.js']) B.load(`macroeconomics/assets/${f}`);
const C = B.window.ApMacroCalc, G = B.window.ApMacroGrade;
const ev = (fn, ...args) => C.evaluate({ fn, args });

test('output and prices: GDP, CPI, inflation, the deflator, real and nominal values, growth', () => {
  assert.equal(ev('gdp', 500, 150, 200, 60, 80), 830, 'C + I + G + (X - M)');
  assert.equal(ev('gdp', 500, 150, 200), 830 + 20, 'a closed economy: X and M default to 0');
  assert.equal(ev('netExports', 60, 80), -20);
  assert.equal(ev('cpi', 330, 300), 110);
  assert.equal(ev('inflation', 100, 110), 10);
  assert.equal(ev('inflation', 110, 99), -10, 'deflation is negative');
  assert.equal(ev('deflator', 1200, 1000), 120);
  assert.equal(ev('realValue', 1200, 120), 1000, 'real = nominal / index x 100');
  assert.equal(ev('nominalValue', 1000, 120), 1200);
  assert.equal(ev('growth', 1000, 1030), 3);
  assert.equal(ev('perCapita', 2000, 50), 40);
  assert.throws(() => ev('cpi', 300, 0), /must be positive/);
});

test('labor market: the labor force, unemployment and participation rates, natural and cyclical', () => {
  assert.equal(ev('laborForce', 190, 10), 200);
  assert.equal(ev('unemploymentRate', 10, 200), 5);
  assert.equal(ev('participationRate', 200, 320), 62.5);
  assert.equal(ev('naturalRate', 2, 3), 5);
  assert.equal(ev('cyclicalRate', 7, 5), 2);
  assert.throws(() => ev('unemploymentRate', 300, 200), /more unemployed/);
  assert.throws(() => ev('participationRate', 400, 320), /larger than the adult population/);
});

test('interest rates: real = nominal - expected inflation', () => {
  assert.equal(ev('realRate', 6, 2), 4);
  assert.equal(ev('realRate', 3, 5), -2, 'a negative real rate');
  assert.equal(ev('nominalRate', 4, 2), 6);
});

test('multipliers: spending, tax, balanced budget and money; MPC as a decimal', () => {
  assert.equal(ev('mps', 0.8), 0.2);
  assert.equal(ev('spendingMultiplier', 0.8), 5);
  assert.equal(ev('spendingMultiplier', 0.75), 4);
  assert.equal(ev('spendingMultiplier', 0.9), 10);
  assert.equal(ev('taxMultiplier', 0.8), -4, 'negative and one smaller in size');
  assert.equal(ev('taxMultiplier', 0.75), -3);
  assert.equal(ev('balancedBudgetMultiplier', 0.8), 1);
  assert.equal(ev('balancedBudgetMultiplier', 0.6), 1);
  assert.equal(ev('moneyMultiplier', 0.1), 10);
  assert.equal(ev('moneyMultiplier', 0.2), 5);
  assert.throws(() => ev('spendingMultiplier', 80), /0.8, not 80/);
  assert.throws(() => ev('moneyMultiplier', 0), /between 0 and 1/);
});

test('reserves and money creation: required, excess, the most one bank lends and the system creates', () => {
  assert.equal(ev('requiredReserves', 1000, 0.1), 100);
  assert.equal(ev('excessReserves', 200, 1000, 0.1), 100);
  assert.equal(ev('maxLoans', 100), 100);
  assert.equal(ev('maxMoneyChange', 100, 0.1), 1000);
  assert.equal(ev('maxMoneyChange', 50, 0.2), 250);
});

test('closing a gap: divide the gap by the multiplier, sign kept; the effect of a change multiplies', () => {
  // A recessionary gap of 100 with MPC 0.75: spending up by 25, or taxes down by 33.33.
  assert.equal(C.evaluate({ fn: 'gapChange', args: [100, { fn: 'spendingMultiplier', args: [0.75] }] }), 25);
  assert.equal(C.evaluate({ fn: 'round', args: [{ fn: 'gapChange', args: [100, { fn: 'taxMultiplier', args: [0.75] }] }, 2] }), -33.33, 'a tax cut (negative change)');
  assert.equal(C.evaluate({ fn: 'gapChange', args: [-80, { fn: 'spendingMultiplier', args: [0.8] }] }), -16, 'an inflationary gap: cut spending');
  assert.equal(C.evaluate({ fn: 'totalChange', args: [20, { fn: 'spendingMultiplier', args: [0.8] }] }), 100);
  assert.throws(() => ev('gapChange', 100, 0), /multiplier is 0/);
});

test('money, the budget, trade and exchange rates', () => {
  assert.equal(ev('velocity', 2, 500, 250), 4, 'V = P x Y / M');
  assert.equal(ev('budgetBalance', 900, 1000), -100, 'a deficit is negative');
  assert.equal(ev('opportunityCost', 30, 10), 3, '3 units given up per unit gained');
  assert.equal(ev('inverseRate', 0.8), 1.25);
  assert.equal(ev('convert', 100, 1.25), 125);
  assert.equal(ev('pct', 15, 60), 25);
});

test('recipes: nest, pick, refuse unknown names and non-numbers, clean floating-point noise', () => {
  assert.equal(C.evaluate({ fn: 'mul', args: [{ fn: 'spendingMultiplier', args: [0.8] }, 20] }), 100);
  assert.equal(C.evaluate({ fn: 'spendingMultiplier', args: [0.8] }), 5, 'not 5.000000000000001');
  assert.throws(() => C.evaluate({ fn: 'mean', args: [[1, 2]] }), /unknown recipe "mean"/, 'no statistics recipes');
  assert.throws(() => C.evaluate({ fn: 'add', args: [1, 'x'] }), /finite number/);
  assert.throws(() => C.evaluate({ args: [] }), /a recipe is/);
  assert.ok(C.FNS.includes('gdp') && C.FNS.includes('moneyMultiplier'));
  assert.ok(C.isRecipe({ fn: 'add' }) && !C.isRecipe([1]));
});

test('ApMacroGrade on macro numbers: a percent, a dollar amount, the sign slip and authored slips', () => {
  const N = { answer: ev('unemploymentRate', 10, 200), unit: '%' };
  assert.equal(G.numeric(N, '5%').correct, true);
  assert.equal(G.numeric(N, { value: '0.05', unit: '%' }).correct, false);
  assert.match(G.numeric(N, { value: '0.05', unit: '%' }).notes.join(' '), /100/, 'the x 100 slip is named');
  const T = { answer: ev('taxMultiplier', 0.8) };
  assert.match(G.numeric(T, '4').notes.join(' '), /sign/, 'the sign slip on a tax multiplier');
  const gap = { answer: 25, mistakes: [{ value: 400, why: 'You multiplied the gap by the multiplier; divide it.' }] };
  assert.equal(G.numeric(gap, '400').mistake.why, 'You multiplied the gap by the multiplier; divide it.');
  assert.equal(G.numeric({ answer: 2.5e9 }, '2.5 billion').correct, true);
});
