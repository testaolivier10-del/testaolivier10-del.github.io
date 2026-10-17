/* ApStatExpr (statistics/assets/stat-expr.js): the friendly-input parser, the
   evaluator (no eval), TeX for the preview, and grading by evaluation at
   many points: equivalent forms right, wrong forms wrong, + C for
   antiderivatives, discontinuities skipped, several variables. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Expr as E } from '../lib/apstat-mathlib.mjs';

const at = (s, x, vars) => E.compile(E.parse(s, { vars: vars || ['x'] }))(typeof x === 'object' ? x : { x });
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

test('friendly input: the forms students type all read the same', () => {
  const x = 0.7;
  for (const [s, v] of [
    ['3x^2', 3 * x * x], ['3*x^2', 3 * x * x], ['3·x²', 3 * x * x], ['3 x ^ 2', 3 * x * x], ['3x**2', 3 * x * x],
    ['sin(x)', Math.sin(x)], ['sin x', Math.sin(x)], ['sin 2x', Math.sin(2 * x)], ['x sin x', x * Math.sin(x)],
    ['sin^2(x)', Math.sin(x) ** 2], ['sin^-1(x)', Math.asin(x)], ['arcsin(x)', Math.asin(x)], ['asin(x)', Math.asin(x)],
    ['e^x', Math.exp(x)], ['e^(2x)', Math.exp(2 * x)], ['exp(x)', Math.exp(x)], ['xe^x', x * Math.exp(x)],
    ['ln(x)', Math.log(x)], ['ln x', Math.log(x)], ['log(x)', Math.log10(x)], ['log_2(x)', Math.log2(x)],
    ['sqrt(x+1)', Math.sqrt(x + 1)], ['√x', Math.sqrt(x)], ['cbrt(x)', Math.cbrt(x)], ['|x - 1|', 0.3], ['abs(x-1)', 0.3],
    ['pi x', Math.PI * x], ['πx', Math.PI * x], ['2(x+1)(x-1)', 2 * (x * x - 1)], ['[x+1]', x + 1],
    ['x^-2', x ** -2], ['-x^2', -(x * x)], ['2^x', 2 ** x], ['x^(1/2)', Math.sqrt(x)], ['1/2x', x / 2],
    ['sec x tan x', Math.tan(x) / Math.cos(x)], ['cot(x)', 1 / Math.tan(x)], ['csc(x)', 1 / Math.sin(x)],
    ['x − 1', x - 1], ['2×x', 2 * x], ['1.5e2x', 150 * x],
  ]) assert.ok(near(at(s, x), v), `${s}: ${at(s, x)} vs ${v}`);
  assert.equal(at('x^(1/3)', -8), -2, 'odd roots of negatives are real');
  assert.ok(Number.isNaN(at('sqrt(x)', -1)) && Number.isNaN(at('ln(x)', -1)), 'outside the domain is not a number');
  assert.ok(near(at('x*y^2', { x: 2, y: 3 }, ['x', 'y']), 18));
  assert.ok(near(at('2t', 1.5, ['t']) || E.compile(E.parse('2t', { vars: ['t'] }))({ t: 1.5 }), 3));
});

test('clear errors, and no eval anywhere', () => {
  const err = s => E.read(s, { vars: ['x'] }).error;
  assert.match(err('3y'), /"y" is not a variable/);
  assert.match(err('(x+1'), /not closed/);
  assert.match(err('x+1)'), /extra closing bracket/);
  assert.match(err('2x+'), /ends too soon/);
  assert.match(err('sin'), /needs something to act on/);
  assert.match(err('y = 2x'), /without "y ="|not a variable/);
  assert.match(err('|x'), /bar/);
  assert.match(err(''), /Type an expression/);
  assert.ok(E.read('alert(1)', { vars: ['x'] }).error, 'unknown names are refused');
  const src = readFileSync('statistics/assets/stat-expr.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(src, /\beval\(|new Function|Function\(/);
  assert.ok(Number.isNaN(E.number('x')), 'number() takes constants only');
  assert.ok(near(E.number('sqrt(2)/2 + pi'), Math.SQRT1_2 + Math.PI));
});

test('TeX for the preview and the key', () => {
  const tex = s => E.toTex(E.parse(s, { vars: ['x'] }));
  assert.equal(tex('3x^2'), '3x^{2}');
  assert.equal(tex('1/(x+1)'), '\\frac{1}{x + 1}');
  assert.equal(tex('sin^2(x)'), '\\sin^{2}(x)');
  assert.equal(tex('e^(2x)'), 'e^{2x}');
  assert.equal(tex('sqrt(x)'), '\\sqrt{x}');
  assert.equal(tex('|x|'), '\\left|x\\right|');
  assert.equal(tex('2x cos(x^2)'), '2x\\,\\cos(x^{2})');
  assert.equal(tex('pi x'), '\\pi\\,x');
  assert.equal(tex('x - (x+1)'), 'x - (x + 1)');
});

test('compare: equivalent forms are right, wrong forms are wrong', () => {
  const eq = (a, b, o = {}) => E.compare(a, b, { domain: [-3, 3], ...o }).equal;
  assert.ok(eq('2x*cos(x^2)', 'cos(x^2)*2x'));
  assert.ok(eq('2x cos(x^2)', 'cos(x^2)*2x'));
  assert.ok(eq('(x+1)^2', 'x^2 + 2x + 1'));
  assert.ok(eq('sin(2x)', '2sin(x)cos(x)'));
  assert.ok(eq('1/(1+x^2)', '(1+x^2)^-1'));
  assert.ok(eq('e^(ln(x))', 'x', { domain: [0.1, 3] }));
  assert.ok(eq('(x^2-1)/(x-1)', 'x+1'), 'a removable hole is skipped');
  assert.ok(eq('tan(x)', 'sin(x)/cos(x)', { domain: [-6, 6] }), 'asymptotes are skipped');
  assert.ok(!eq('cos(x^2)', '2x*cos(x^2)'), 'forgot the chain rule');
  assert.ok(!eq('2x cos(x)', '2x*cos(x^2)'));
  assert.ok(!eq('x^2 + 2x', 'x^2 + 2x + 1'));
  assert.ok(!eq('sqrt(x^2)', 'x'), 'differs for negative x');
  assert.ok(!eq('ln(x)', 'ln|x|', { domain: [-3, 3] }), 'undefined where the key is defined is a difference');
  assert.ok(eq('ln(x)', 'ln|x|', { domain: [0.1, 3] }));
  // Several variables (implicit differentiation answers).
  assert.ok(E.compare('-x/y', '-(x*y^-1)', { vars: ['x', 'y'], domain: { x: [1, 2], y: [1, 3] } }).equal);
  assert.ok(!E.compare('-y/x', '-x/y', { vars: ['x', 'y'], domain: { x: [1, 2], y: [1, 3] } }).equal);
  // What a wrong answer is related by.
  const r = E.compare('-sin(x)', 'sin(x)', { domain: [-3, 3] });
  assert.ok(r.sign && !r.equal);
  assert.equal(E.compare('6x^2', '3x^2', { domain: [-3, 3] }).factor, 2);
  assert.ok(E.compare('x^2 + 5', 'x^2', { domain: [-3, 3] }).constant);
  assert.ok(E.compare('1/x', '1/x', { domain: [0, 0] }).tooFew, 'a key with too few defined points is reported');
});

test('grade: + C for antiderivatives, authored mistakes, targeted notes', () => {
  const item = { expr: { answer: 'x^3/3', mode: 'constant', domain: [-2, 2], mistakes: [{ expr: 'x^3', why: 'Divide by the new power.' }] } };
  assert.equal(E.grade(item, 'x^3/3 + C').correct, true);
  assert.equal(E.grade(item, '(x^3 + 6)/3 + C').correct, true, 'any constant');
  assert.equal(E.grade(item, 'C + x^3/3').correct, true);
  const noC = E.grade(item, 'x^3/3');
  assert.equal(noC.correct, false);
  assert.match(noC.notes[0], /Add \+ C/);
  assert.equal(E.grade(item, 'x^3 + C').notes[0], 'Divide by the new power.');
  assert.equal(E.grade({ expr: { ...item.expr, needC: false } }, 'x^3/3').correct, true, 'needC false: a particular antiderivative');
  const d = { expr: { answer: '-sin(x)' } };
  assert.match(E.grade(d, 'sin(x)').notes[0], /sign/);
  assert.match(E.grade({ expr: { answer: '6x' } }, '3x').notes[0], /1\/2 times/);
  assert.match(E.grade({ expr: { answer: '2x + 1' } }, '2x').notes[0], /by a constant/);
  assert.equal(E.grade(d, '').valid, false);
  assert.equal(E.grade(d, 'sin(').valid, false);
  // C is not a variable outside constant mode.
  assert.equal(E.grade({ expr: { answer: '2x' } }, '2x + C').valid, false);
});

test('statistics input: Bluebook spellings, +/- intervals, combinations, factorials and bound names', () => {
  const b = { 'p-hat': 0.47, p_0: 0.5, n: 400, 'x-bar': 5.4, mu_0: 5, s: 1.2, 'p-hat_1': 0.3, 'p-hat_2': 0.2 };
  const v = t => E.evaluate(t, b).value;
  assert.ok(Math.abs(v('(p-hat - p_0)/sqrt(p_0*(1-p_0)/n)') + 1.2) < 1e-12);
  assert.ok(Math.abs(v('(phat - p0)/sqrt(p0(1-p0)/n)') + 1.2) < 1e-12, 'without hyphens or underscores');
  assert.ok(Math.abs(v('(x-bar - mu_0)/(s/sqrt(16))') - 4 / 3) < 1e-12);
  assert.ok(Math.abs(v('p-hat_1 - p-hat_2') - 0.1) < 1e-12);
  assert.equal(v('10C3'), 120); assert.equal(v('C(10, 3)'), 120); assert.equal(v('nCr(10,3)'), 120); assert.equal(v('5!'), 120);
  const iv = E.evaluate('0.42 +/- 1.96*sqrt(0.42*0.58/200)', {});
  assert.ok(Math.abs(iv.interval[0] - (0.42 - 1.96 * Math.sqrt(0.42 * 0.58 / 200))) < 1e-12 && iv.interval[1] > iv.interval[0]);
  assert.match(E.evaluate('p-hat_1 - p-hat_2', b).tex, /\\hat\{p\}_\{1\} - \\hat\{p\}_\{2\}/);
  assert.match(E.evaluate('10C3', {}).tex, /\\binom\{10\}\{3\}/);
  const u = E.used(E.read('(0.47 - 0.5)/sqrt(0.5*0.5/400)', { vars: [] }).tree);
  assert.ok([...u.inSqrt.numbers].includes(0.5) && ![...u.inSqrt.numbers].includes(0.47));
  assert.equal(E.evaluate('x', {}).ok, false, 'an unbound name is an error');
});
