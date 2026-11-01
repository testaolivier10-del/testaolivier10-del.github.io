/* ApPrecalcExpr (precalculus/assets/pcalc-expr.js): the friendly-input parser, the
   evaluator (no eval), TeX for the preview, and grading by evaluation at
   many points: equivalent forms right, wrong forms wrong, discontinuities
   skipped, several variables, and domain-aware comparison for logs and
   inverse trig (precalculus). The + C tests cover the shared engine's
   'constant' mode, which precalculus content does not use (no antiderivatives;
   the content check refuses it). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Expr as E } from '../lib/apprecalc-mathlib.mjs';

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
  const src = readFileSync('precalculus/assets/pcalc-expr.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
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
  // 0 is not "0 times the right one" (tool audit 2026-10, X4): no factor note at 0.
  assert.equal(E.compare('0', '3x^2', { domain: [-3, 3] }).factor, undefined);
  assert.ok(!/times the right one/.test((E.grade({ expr: { answer: '2x', domain: [-3, 3] } }, '0').notes || []).join(' ')));
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

/* Domain-aware grading (docs/apprecalc-spec.md section 7): logarithms, roots
   and inverse trig are undefined outside their domains. Points where the key
   is undefined are skipped; an answer undefined where the key is defined is
   wrong there, with a note that names the log or root rule. */
test('domain-aware: logs and inverse trig compared on the key\'s domain', () => {
  // ln(x^2) and 2 ln(x) agree only for x > 0.
  assert.equal(E.compare('2ln(x)', 'ln(x^2)', { domain: [-3, 3] }).equal, false);
  assert.equal(E.compare('2ln(x)', 'ln(x^2)', { domain: [0.1, 3] }).equal, true);
  assert.equal(E.compare('2ln|x|', 'ln(x^2)', { domain: [-3, 3] }).equal, true);
  const g = E.grade({ expr: { answer: 'ln(x^2)', domain: [-3, 3] } }, '2ln(x)');
  assert.equal(g.correct, false);
  assert.match(g.notes[0], /ln\(x\^2\) is 2 ln\|x\|/);
  // A single logarithm: log_2(8x) = 3 + log_2(x) for x > 0; the product rule, not a sum inside.
  assert.equal(E.compare('3 + log_2(x)', 'log_2(8x)', { domain: [0.1, 5] }).equal, true);
  assert.equal(E.compare('log_2(8 + x)', 'log_2(8x)', { domain: [0.1, 5] }).equal, false);
  // Inverse trig on [-1, 1]: outside it the key is undefined and those points are skipped.
  assert.equal(E.compare('pi/2 - arccos(x)', 'arcsin(x)', { domain: [-1, 1] }).equal, true);
  assert.equal(E.compare('sin^-1(x)', 'arcsin(x)', { domain: [-1, 1] }).equal, true);
  assert.equal(E.compare('1/sin(x)', 'arcsin(x)', { domain: [-1, 1] }).equal, false, 'sin^-1 is not a reciprocal');
  // arctan has every real input; principal ranges hold.
  assert.ok(Math.abs(at('arctan(x)', 1e9) - Math.PI / 2) < 1e-8);
  assert.ok(near(at('arccos(x)', -1), Math.PI));
  // A key undefined almost everywhere on its domain is refused (tooFew).
  assert.equal(E.compare('ln(x)', 'ln(x)', { domain: [-3, -1] }).tooFew, true);
  // Q4 forms: one tangent, quadratic in e^x, a single base power.
  assert.equal(E.compare('tan(x)', 'sin(x)/cos(x)', { domain: [-1.2, 1.2] }).equal, true);
  assert.equal(E.compare('(e^x - 3)(e^x + 1)', 'e^(2x) - 2e^x - 3', { domain: [-2, 2] }).equal, true);
  assert.equal(E.compare('7^(2x + 1)', '7 * 49^x', { domain: [-2, 2] }).equal, true);
});

test('form rules: an answer equal in value but not in the asked form is wrong, with a note', () => {
  const g = (answer, form, typed, vars = ['x'], domain = [0.2, 6]) => E.grade({ expr: { answer, form, vars, domain } }, typed);
  const ok = (a, f, t, v, d) => assert.ok(g(a, f, t, v, d).correct, `${t} should have ${f.type}`);
  const no = (a, f, t, v, d) => { const r = g(a, f, t, v, d); assert.ok(!r.correct && r.formMiss && /form the question asks for/.test(r.notes[0]), `${t} should miss ${f.type}`); };
  const L = { type: 'log' };
  ok('log_2(x^3/5)', L, 'log_2(x^3/5)'); no('log_2(x^3/5)', L, '3log_2(x) - log_2(5)'); no('log_2(x^3/5)', L, 'ln(x^3/5)/ln(2)');
  const L2 = { type: 'log', base: 2, scaled: true, arg: 'var' };
  ok('log_2(x)/2', L2, '0.5log_2(x)'); ok('log_2(x)/2', L2, '(1/2)log_2 x'); no('log_2(x)/2', L2, 'log_4(x)'); no('log_2(x)/2', L2, 'log_2(sqrt(x))');
  const P = { type: 'power', base: 2, scaled: true, exponent: 'var' };
  ok('8(2)^x', P, '8*2^x'); ok('8(2)^x', P, '2^x*8'); no('8(2)^x', P, '2^(x+3)'); no('8(2)^x', P, '4*2^(x+1)');
  ok('5(2)^(2x)', { type: 'power', base: 2, scaled: true, exponent: 'kx' }, '5*2^(2x)'); no('5(2)^(2x)', { type: 'power', base: 2, scaled: true, exponent: 'kx' }, '5*4^x');
  no('8^x', { type: 'power', exponent: 'var' }, '2^(3x)'); no('x^(3/2)', { type: 'power', base: 'x' }, 'sqrt(x^3)');
  ok('cot(x)', { type: 'trig' }, 'cot x'); no('cot(x)', { type: 'trig' }, 'cos(x)/sin(x)'); no('cot(x)', { type: 'trig' }, '1/tan(x)');
  ok('(3x - 1)/(x^2 - 1)', { type: 'fraction' }, '(3x-1)/((x-1)(x+1))'); no('(3x - 1)/(x^2 - 1)', { type: 'fraction' }, '1/(x-1)+2/(x+1)');
  const X = { type: 'expanded' };
  ok('x^3 + x^2 - 7x + 2', X, '2 - 7x + x^2 + x^3'); no('x^3 + x^2 - 7x + 2', X, '(x-2)(x^2+3x-1)'); no('x^3 + x^2 - 7x + 2', X, 'x^3+2x^2-x^2-7x+2');
  no('2 + h', X, '((1+h)^2+1-2)/h', ['h'], [0.1, 3]);
  ok('3(x + 1)^2 + 2', { type: 'vertex' }, '2 + 3(x+1)^2'); no('3(x + 1)^2 + 2', { type: 'vertex' }, '3x^2+6x+5');
  no('2x + 3/x', { type: 'terms', count: 2 }, '(2x^2+3)/x');
  ok('2cos(x)^2 - 1', { type: 'only', fns: ['cos'] }, '2cos^2(x)-1'); no('2cos(x)^2 - 1', { type: 'only', fns: ['cos'] }, '1-2sin^2(x)'); no('2cos(x)^2 - 1', { type: 'only', fns: ['cos'] }, 'cos(2x)');
  // A value-wrong answer is graded on value as before (no form note).
  const w = g('log_2(x^3/5)', L, 'log_2(3x/5)');
  assert.ok(!w.correct && !w.formMiss);
});

test('content check: a form must be known and the key must have it; a form stem needs a form', async () => {
  const { exprProblems, FORM_STEM_RE } = await import('../check-apprecalc-content.mjs');
  assert.deepEqual(exprProblems({ answer: 'log_2(x^3/5)', domain: [0.2, 6], form: { type: 'log' } }), []);
  assert.ok(exprProblems({ answer: '3log_2(x) - log_2(5)', domain: [0.2, 6], form: { type: 'log' } }).some(p => /is not itself a single logarithm/.test(p)));
  assert.ok(exprProblems({ answer: 'x', form: { type: 'tidy' } }).some(p => /form.type must be/.test(p)));
  assert.ok(exprProblems({ answer: 'x + 1/x', form: { type: 'terms' } }).some(p => /needs count/.test(p)));
  assert.ok(FORM_STEM_RE.test('Write $3\\log_2 x - \\log_2 5$ as a single logarithm.'));
  assert.ok(FORM_STEM_RE.test('Rewrite $h(x)$ in the form $a(2)^x$.') && !FORM_STEM_RE.test('Write the inverse of $f(x) = 5^x$.'));
});
