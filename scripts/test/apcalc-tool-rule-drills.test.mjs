/* Rule drills: its model (calculus/assets/tools/math/rule-drills.js) and its
   validator (scripts/lib/apcalc-tool-checks/rule-drills.mjs). OWNED BY THIS
   TOOL ONLY. The symbolic differentiator agrees with a difference quotient
   on a long list of functions (and its simplifier never changes a value),
   the rule picker names the right rule first, the named slips are graded
   wrong with their own note, same seed same problem, planted wrong keys are
   caught, and the shipped data passes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/rule-drills.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'calculus', 'data', 'tools', 'rule-drills.json'), 'utf8'));
const map = loadMap();
const d1 = (f, x) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;

test('rule-drills: the model registers ApCalcMath.ruleDrills, and the validator checks the frame', () => {
  const { model } = runtime('rule-drills');
  assert.ok(model && typeof model.generate === 'function' && typeof model.analyze === 'function');
  const ok = { slug: 'rule-drills', kind: 'drill', topic: 'power-rule', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'power', topic: 'power-rule', types: ['power'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'power', topic: 'chain-rule', types: ['power'] }] }, map).some(e => /topic/.test(e)));
});

test('rule-drills: the shipped data passes (300 seeds per kind, every key recomputed)', () => {
  assert.deepEqual(check(data, map), []);
  assert.equal(data.contexts.length, 13);
});

const FNS = ['x^2 sin(3x)', 'e^(2x)/(x^2 + 1)', 'sqrt(1 + x^3)', 'ln(cos(x))', 'arctan(x^2)', '(3x - 1)^5', 'x e^x sin(x)', 'tan(x)/x', '1/x',
  '3/x^2', 'x^x', '2^x', 'sec(x)^2', 'cbrt(x)', 'sin(x)^3', 'arcsin(2x)', 'arccos(x/2)', 'x/(x+1)^2', 'e^(sin x) cos(x)', '(x^2+1)^3 e^x',
  'cos(x^2 e^x)', 'sqrt(x)/(3x+1)^2', 'log_2(x)', 'x^(1/2) - 4x^(-3)', '-cos(x)', '(1 - x)/(1 + x)', 'ln(x^2+1)*x^3', 'csc(2x) + cot(x)',
  'e^x + e^x + x e^x', '5x^4 - 3x^2 + 7', 'x^3/x^5', 'sin(x)cos(x)', 'abs(x - 3)', 'arctan(1/x)', '(x^2 - 1)/(x - 1)', 'x^(2/3)', '7'];

test('rule-drills: the derivative and the simplifier agree with the numbers', () => {
  const { model, Expr } = runtime('rule-drills');
  for (const s of FNS) {
    const a = model.analyze(s);
    assert.ok(a.ok, `${s}: ${a.error}`);
    const f = Expr.compile(a.tree), g = Expr.compile(a.d), typed = Expr.fn(a.dstr), t2 = Expr.fn(model.typed(a.d));
    const simp = Expr.compile(model.simplify(Expr.parse(s)));
    for (let i = 0; i < 30; i++) {
      const x = 0.2 + i * 0.037;
      const want = d1(v => f({ x: v }), x);
      if (!Number.isFinite(want)) continue;
      assert.ok(Math.abs(g({ x }) - want) <= 1e-5 * Math.max(1, Math.abs(want)), `${s}: f'(${x}) = ${g({ x })}, numerically ${want}`);
      assert.ok(Math.abs(typed(x) - want) <= 1e-5 * Math.max(1, Math.abs(want)), `${s}: the typed derivative is off`);
      assert.ok(Math.abs(t2(x) - want) <= 1e-5 * Math.max(1, Math.abs(want)), `${s}: the student-style derivative ${model.typed(a.d)} is off`);
      assert.ok(Math.abs(simp({ x }) - f({ x })) <= 1e-9 * Math.max(1, Math.abs(f({ x }))), `${s}: simplify changed the value`);
    }
  }
  // like terms and powers are collected
  assert.equal(model.typed(model.simplify(Expr.parse('e^x + e^x + x e^x'))), '2 * e^x + x * e^x');
  assert.equal(model.analyze('x^3/x^5').dtex, '-\\frac{2}{x^{3}}');
});

test('rule-drills: the rule picker names the outermost rule first', () => {
  const { model } = runtime('rule-drills');
  const first = s => model.analyze(s).steps[0].name;
  assert.match(first('x^2 sin(3x)'), /^Product rule/);
  assert.match(first('e^(2x)/(x^2 + 1)'), /^Quotient rule/);
  assert.match(first('sqrt(1 + x^3)'), /^Chain rule/);
  assert.match(first('cos(x^2 e^x)'), /^Chain rule/);
  assert.match(first('3/x^2'), /negative power/);
  assert.match(first('x^5'), /^Power rule/);
  const tree = model.analyze('sin(3x + 1)').node;
  assert.equal(tree.kids.map(k => k.role).join(','), 'outer,inner');
  assert.equal(model.analyze('x^2 sin(3x)').node.kids[1].node.rule, 'chain');
});

test('rule-drills: named slips are graded wrong with their note', () => {
  const { M, model } = runtime('rule-drills');
  // Find a product, a quotient and a chain problem and type the classic slips.
  const gen = (id, seed) => model.generate(M.rng(seed), data.contexts.find(c => c.id === id), id);
  const p = gen('product', 11), dp = p.steps.find(s => s.key === 'd');
  const slip = dp.cell.expr.mistakes.find(m => /product of the derivatives/.test(m.why));
  assert.ok(slip);
  const g1 = M.diagnoseExpr(dp.cell, slip.expr);
  assert.equal(g1.ok, false); assert.match(g1.why, /product of the derivatives/);
  const q = gen('quotient', 12), dq = q.steps.find(s => s.key === 'd');
  const sign = dq.cell.expr.mistakes.find(m => /opposite sign/.test(m.why));
  assert.match(M.diagnoseExpr(dq.cell, sign.expr).why, /opposite sign/);
  const c = gen('chain', 13), dc = c.steps.find(s => s.key === 'd');
  const forgot = dc.cell.expr.mistakes.find(m => /inner derivative/.test(m.why));
  assert.match(M.diagnoseExpr(dc.cell, forgot.expr).why, /inner derivative/);
  // the key itself, typed with + spaces and in another form, is right
  assert.equal(M.diagnoseExpr(dp.cell, dp.cell.expr.answer).ok, true);
  const im = gen('implicit', 14), y = im.steps.find(s => s.key === 'y');
  assert.match(y.why[y.options.findIndex(o => !/dy/.test(o) && /y/.test(o))], /forgot dy\/dx/);
});

test('rule-drills: same seed, same problem; planted wrong keys are caught', () => {
  const { M, model } = runtime('rule-drills');
  for (const c of data.contexts) {
    const a = model.generate(M.rng(99), c, c.types[0]), b = model.generate(M.rng(99), c, c.types[0]);
    assert.equal(a.text, b.text);
    assert.equal(a.type, c.types[0]);
  }
  const orig = model.generate;
  const plant = (id, fn) => { model.generate = (r, c, t) => { const p = orig(r, c, t); fn(p); return p; }; try { return check({ ...data, contexts: data.contexts.filter(c => c.id === id) }, map); } finally { model.generate = orig; } };
  // A product-rule key missing its second term.
  assert.ok(plant('product', p => { const s = p.steps.find(x => x.key === 'd'); s.cell.expr.answer = s.cell.expr.mistakes[1] ? s.cell.expr.mistakes[1].expr : '0'; s.cell.expr.mistakes = []; }).some(e => /step d: key/.test(e)));
  // An inverse-function answer that forgot the reciprocal.
  assert.ok(plant('inverse', p => { const s = p.steps.find(x => x.key === 'gp'); s.cell.answer = 1 / s.cell.answer; s.cell.mistakes = []; }).some(e => /g'\(a\) keyed/.test(e)));
  // The first rule keyed wrong.
  assert.ok(plant('quotient', p => { const s = p.steps.find(x => x.key === 'rule'); s.correct = 0; }).some(e => /first rule is keyed/.test(e)));
  // An implicit slope off.
  assert.ok(plant('implicit', p => { const s = p.steps.find(x => x.key === 'slope'); s.cell.answer += 1; s.cell.mistakes = []; }).some(e => /slope keyed/.test(e)));
});
