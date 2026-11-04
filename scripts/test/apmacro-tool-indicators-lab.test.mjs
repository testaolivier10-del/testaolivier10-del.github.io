/* Economic indicators lab: its model (macroeconomics/assets/tools/math/indicators-lab.js)
   and its validator (scripts/lib/apmacro-tool-checks/indicators-lab.mjs). OWNED BY
   THIS TOOL ONLY (builder T3). The shipped data passes; a seed gives the same
   problem twice; every model value matches its ApMacroCalc recipe; planted
   mistakes (a mistagged transaction, a CPI times the wrong base, a
   discouraged worker counted, a mislabeled kind of unemployment) are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheckProblem, exploreProblems, TYPES, TOPIC } from '../lib/apmacro-tool-checks/indicators-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const dep = read('docs/apmacro-dependency-map.json');
const map = { topicById: id => dep.topics.find(t => t.id === id) || null };
const data = read('macroeconomics/data/tools/indicators-lab.json');
const { M, Calc, model } = runtime('indicators-lab');
const ctxOf = t => data.contexts.find(c => c.types.includes(t));
const gen = (t, s) => model.generate(M.rng(s), ctxOf(t), t);
const clone = x => JSON.parse(JSON.stringify(x));

test('indicators-lab: registered, page parses, pages.json entry (free), shipped data passes', () => {
  assert.ok(model && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'indicators-lab.js'), 'utf8')));
  const entry = read('macroeconomics/data/pages.json').tools.find(t => t.slug === 'indicators-lab');
  assert.ok(entry && entry.studio === true && !entry.premium);
  assert.equal(entry.topic, 'price-indices-inflation');
  assert.deepEqual(check(data, map), []);
  for (const t of TYPES) assert.equal(ctxOf(t).topic, TOPIC[t]);
});

test('indicators-lab: a seed gives the same problem twice, every type', () => {
  for (const t of TYPES) for (const s of [2, 31, 777]) assert.deepEqual(gen(t, s), gen(t, s));
  assert.deepEqual(model.economy(M.rng(9)), model.economy(M.rng(9)));
});

test('indicators-lab: model values match their ApMacroCalc recipes', () => {
  const P = model.prices(0);
  assert.equal(P.cpi[3], Calc.evaluate({ fn: 'cpi', args: [P.cost[3], P.cost[0]] }));
  assert.equal(P.infl[2], Calc.evaluate({ fn: 'inflation', args: [P.cpi[1], P.cpi[2]] }));
  const R = model.realGdp();
  assert.equal(R.real[3], Calc.evaluate({ fn: 'realValue', args: [R.nominal[3], R.deflator[3]] }));
  const r = model.rates(model.JOBS0);
  assert.equal(r.u, Calc.evaluate({ fn: 'unemploymentRate', args: [3, { fn: 'laborForce', args: [62, 3] }] }));
  const items = model.economy(M.rng(4)), s = model.totals(items);
  assert.equal(s.gdp, Calc.evaluate({ fn: 'gdp', args: [s.C, s.I, s.G, s.X, s.M] }));
  // inflation does not depend on the base year
  assert.ok(Math.abs(model.prices(0).infl[4] - model.prices(3).infl[4]) < 1e-9);
});

test('indicators-lab: planted mistakes are caught', () => {
  const house = model.TX.find(t => t.id === 'house'), was = house.cat;
  house.cat = 'C';
  assert.ok(exploreProblems(model, M).some(e => /house/.test(e)));
  house.cat = was;
  let p = clone(gen('cpi', 12)); p.steps.find(s => s.key === 'cpi2').cell.answer += 3;
  assert.ok(recheckProblem(p, ctxOf('cpi'), model).some(e => /CPI/.test(e)));
  p = clone(gen('unemp', 12)); p.steps.find(s => s.key === 'lf').cell.answer += p.values.D;
  assert.ok(recheckProblem(p, ctxOf('unemp'), model).some(e => /labor force/.test(e)));
  p = clone(gen('utype', 12)); const st = p.steps[0]; [st.options[0], st.options[1]] = [st.options[1], st.options[0]];
  assert.ok(recheckProblem(p, ctxOf('utype'), model).some(e => /answer sheet/.test(e)));
  p = clone(gen('gdp-calc', 12)); p.steps.find(s => s.key === 'gdp').cell.answer += p.values.M * 2;
  assert.ok(recheckProblem(p, ctxOf('gdp-calc'), model).some(e => /GDP/.test(e)));
  p = clone(gen('real', 12)); p.text += ' Compute the PPI.';
  assert.ok(recheckProblem(p, ctxOf('real'), model).some(e => /PPI/.test(e)));
});
