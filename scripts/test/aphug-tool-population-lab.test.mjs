/* Population lab: its model (human-geography/assets/tools/math/population-lab.js) and its
   validator (scripts/lib/aphug-tool-checks/population-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The shipped data passes (300 seeds per context and
   type, every key recomputed), problems are reproducible from their code,
   the numbers are the ApHugCalc ones, and planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/aphug-tool-checks/population-lab.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

const mapJ = JSON.parse(readFileSync(join(ROOT, 'docs', 'aphug-dependency-map.json'), 'utf8'));
const map = { topicById: id => mapJ.topics.find(t => t.id === id) || null };
const data = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'tools', 'population-lab.json'), 'utf8'));

test('population-lab: registers, the page script parses, it is registered on the Tool Studio', () => {
  const { model } = runtime('population-lab');
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'population-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'population-lab');
  assert.ok(entry && entry.studio === true && entry.premium === 'tools');
  assert.equal(entry.topic, 'population-composition');
  assert.ok(check({ ...data, slug: 'nope' }, map).some(e => /slug/.test(e)));
});

test('population-lab: the shipped data passes the full sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('population-lab: a problem code gives the same problem', () => {
  const { M, model } = runtime('population-lab');
  for (const c of data.contexts) {
    const a = model.generate(M.rng(4242), c, c.types[0]), b = model.generate(M.rng(4242), c, c.types[0]);
    assert.equal(JSON.stringify(a), JSON.stringify(b), c.id);
  }
});

test('population-lab: the model uses the course formulas and five stages', () => {
  const { model, Calc } = runtime('population-lab');
  assert.equal(model.rni(30, 10), 2);
  assert.equal(model.doubling(2), 35);
  assert.equal(model.doubling(-0.3), null);
  for (const s of [1, 2, 3, 4, 5]) assert.equal(model.stageOf(model.STAGES[s].cbr, model.STAGES[s].cdr), s);
  assert.equal(model.shape(model.pyramid(5.5, 58)), 'expansive');
  assert.equal(model.shape(model.pyramid(1.3, 83)), 'constrictive');
  const d = model.dependency({ young: 30, old: 10, work: 60 });
  assert.ok(Math.abs(d.total - Calc.evaluate({ fn: 'dependency', args: [30, 10, 60] })) < 1e-9);
});

test('population-lab: planted mistakes are caught', () => {
  const { M, model } = runtime('population-lab');
  const ctx = id => data.contexts.find(c => c.id === id);
  const errsOf = (p, c) => { const e = []; recheck(p, c, 'x', e); return e; };
  // RNI without the divide by 10.
  let p = model.generate(M.rng(7), ctx('rates-counts'), 'rates');
  p.steps.find(s => s.key === 'rni').cell.answer *= 10;
  assert.ok(errsOf(p, ctx('rates-counts')).some(e => /rni key/.test(e)));
  // A stage key moved one stage over.
  p = model.generate(M.rng(9), ctx('stage-each'), 'stage');
  const st = p.steps.find(s => s.key === 'stage'); st.correct = (st.correct + 1) % 5;
  assert.ok(errsOf(p, ctx('stage-each')).some(e => /stage key/.test(e)));
  // "is in stage" wording.
  p = model.generate(M.rng(11), ctx('stage-each'), 'stage');
  p.solution.push('The country is in stage 2.');
  assert.ok(errsOf(p, ctx('stage-each')).some(e => /consistent with/.test(e)));
  // A pyramid whose bars no longer match the shape keyed.
  p = model.generate(M.rng(13), ctx('shape-expansive'), 'shape');
  p.figure.spec.left = p.figure.spec.left.slice().reverse(); p.figure.spec.right = p.figure.spec.right.slice().reverse();
  assert.ok(errsOf(p, ctx('shape-expansive')).some(e => /bars read/.test(e)));
  // A birth-year key off by ten years.
  p = model.generate(M.rng(15), ctx('cohort-boom'), 'cohort');
  const born = p.steps.find(s => s.key === 'born'); born.correct = 1;
  assert.ok(errsOf(p, ctx('cohort-boom')).some(e => /born key/.test(e)));
});
